<?php
namespace App\Services;

use App\Core\Database;
use App\Models\Child;
use App\Models\Setting;

class ChestService
{
    private Database $db;
    private array $settings;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->settings = (new Setting())->getAll();
    }

    /**
     * Check if child has an available chest to open
     * @param int $childId
     * @return array|null Chest data if available, null otherwise
     */
    public function getAvailableChest(int $childId): ?array
    {
        // Check if daily chest is enabled
        if (($this->settings['daily_chest_enabled'] ?? '1') !== '1') {
            return null;
        }

        // Check if already opened a chest today
        if ($this->hasOpenedChestToday($childId)) {
            return null;
        }

        // Determine chest type based on day
        $isSunday = (int)date('w') === 0;
        $sundayEnabled = ($this->settings['sunday_chest_enabled'] ?? '1') === '1';

        if ($isSunday && $sundayEnabled) {
            return [
                'type' => 'sunday',
                'reward_type' => 'fixed_xp',
                'reward_value' => (int)($this->settings['sunday_chest_reward'] ?? 25),
                'multiplier' => (float)($this->settings['sunday_chest_multiplier'] ?? 2),
                'has_multiplier' => true,
                'visual' => 'golden',
                'title_key' => 'sunday_golden_chest',
                'description_key' => 'sunday_chest_description'
            ];
        }

        return [
            'type' => 'daily',
            'reward_type' => 'fixed_xp',
            'reward_value' => (int)($this->settings['daily_chest_reward'] ?? 10),
            'multiplier' => 0,
            'has_multiplier' => false,
            'visual' => 'regular',
            'title_key' => 'daily_chest',
            'description_key' => 'daily_chest_description'
        ];
    }

    /**
     * Check if child has opened a chest today
     * @param int $childId
     * @return bool
     */
    public function hasOpenedChestToday(int $childId): bool
    {
        $result = $this->db->query(
            "SELECT id FROM chest_rewards
             WHERE child_id = ?
             AND DATE(opened_at) = CURDATE()
             AND chest_type IN ('daily', 'sunday')
             LIMIT 1",
            [$childId]
        )->fetch();

        return (bool)$result;
    }

    /**
     * Open a chest and grant the reward
     * @param int $childId
     * @param string $chestType
     * @return array Result with reward details
     */
    public function openChest(int $childId, string $chestType): array
    {
        $chest = $this->getAvailableChest($childId);

        if (!$chest || $chest['type'] !== $chestType) {
            return ['success' => false, 'error' => 'no_chest_available'];
        }

        $this->db->beginTransaction();
        try {
            $rewardValue = $chest['reward_value'];
            $rewardType = $chest['reward_type'];

            // Record chest opening
            $this->db->query(
                "INSERT INTO chest_rewards (child_id, chest_type, reward_type, reward_value, opened_at)
                 VALUES (?, ?, ?, ?, NOW())",
                [$childId, $chestType, $rewardType, $rewardValue]
            );
            $chestId = (int)$this->db->lastInsertId();

            // Grant XP reward
            if ($rewardType === 'fixed_xp' && $rewardValue > 0) {
                $note = $chestType === 'sunday' ? 'Sunday Golden Chest' : 'Daily Chest';
                $this->db->query(
                    "INSERT INTO point_transactions (child_id, points, note, type, transaction_date)
                     VALUES (?, ?, ?, 'earn', NOW())",
                    [$childId, $rewardValue, $note]
                );
                (new Child())->updateBalance($childId);
            }

            // Apply multiplier for Sunday chest
            $multiplierApplied = false;
            if ($chest['has_multiplier'] && $chest['multiplier'] > 1) {
                $this->applyMultiplier($childId, $chest['multiplier'], 'sunday_chest');
                $multiplierApplied = true;
            }

            $this->db->commit();

            // Log activity
            (new ActivityService())->logChildAction($childId, 'chest_opened', 'chest', $chestId, [
                'chest_type' => $chestType,
                'reward' => $rewardValue,
                'multiplier' => $multiplierApplied ? $chest['multiplier'] : null
            ]);

            return [
                'success' => true,
                'chest_id' => $chestId,
                'chest_type' => $chestType,
                'reward_type' => $rewardType,
                'reward_value' => $rewardValue,
                'multiplier_applied' => $multiplierApplied,
                'multiplier_value' => $multiplierApplied ? $chest['multiplier'] : null
            ];

        } catch (\Exception $e) {
            $this->db->rollBack();
            return ['success' => false, 'error' => 'database_error'];
        }
    }

    /**
     * Apply a multiplier to a child
     * @param int $childId
     * @param float $multiplier
     * @param string $source
     * @param int $durationHours Duration in hours (default 24)
     * @return int Multiplier ID
     */
    public function applyMultiplier(int $childId, float $multiplier, string $source, int $durationHours = 24): int
    {
        // Remove any existing multiplier from same source
        $this->db->query(
            "DELETE FROM daily_multipliers WHERE child_id = ? AND source = ?",
            [$childId, $source]
        );

        $this->db->query(
            "INSERT INTO daily_multipliers (child_id, multiplier, started_at, expires_at, source)
             VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? HOUR), ?)",
            [$childId, $multiplier, $durationHours, $source]
        );

        return (int)$this->db->lastInsertId();
    }

    /**
     * Get active multiplier for a child
     * @param int $childId
     * @return array|null Active multiplier data or null
     */
    public function getActiveMultiplier(int $childId): ?array
    {
        $result = $this->db->query(
            "SELECT * FROM daily_multipliers
             WHERE child_id = ?
             AND expires_at > NOW()
             ORDER BY multiplier DESC
             LIMIT 1",
            [$childId]
        )->fetch();

        if (!$result) {
            return null;
        }

        return [
            'id' => (int)$result['id'],
            'multiplier' => (float)$result['multiplier'],
            'source' => $result['source'],
            'started_at' => $result['started_at'],
            'expires_at' => $result['expires_at'],
            'hours_remaining' => max(0, (strtotime($result['expires_at']) - time()) / 3600)
        ];
    }

    /**
     * Clean up expired multipliers
     */
    public function cleanupExpiredMultipliers(): int
    {
        $result = $this->db->query(
            "DELETE FROM daily_multipliers WHERE expires_at < NOW()"
        );
        return $result->rowCount();
    }

    /**
     * Remove a specific multiplier
     * @param int $multiplierId
     * @param int $childId For security verification
     * @return bool Success status
     */
    public function removeMultiplier(int $multiplierId, int $childId): bool
    {
        $result = $this->db->query(
            "DELETE FROM daily_multipliers WHERE id = ? AND child_id = ?",
            [$multiplierId, $childId]
        );
        return $result->rowCount() > 0;
    }

    /**
     * Remove all active multipliers for a child
     * @param int $childId
     * @return int Number of multipliers removed
     */
    public function removeAllMultipliers(int $childId): int
    {
        $result = $this->db->query(
            "DELETE FROM daily_multipliers WHERE child_id = ?",
            [$childId]
        );
        return $result->rowCount();
    }

    /**
     * Award a manual bonus chest to a child (pending - child must open it)
     * @param int $childId
     * @param int $reward XP reward amount
     * @param float $multiplier Optional multiplier (0 for none)
     * @return array Result
     */
    public function awardBonusChest(int $childId, int $reward, float $multiplier = 0): array
    {
        try {
            $rewardType = $multiplier > 1 ? 'multiplier' : 'fixed_xp';

            // Create pending chest (opened_at is NULL)
            $this->db->query(
                "INSERT INTO chest_rewards (child_id, chest_type, reward_type, reward_value, opened_at)
                 VALUES (?, 'active_bonus', ?, ?, NULL)",
                [$childId, $rewardType, $multiplier > 1 ? (int)($multiplier * 10) : $reward]
            );
            $chestId = (int)$this->db->lastInsertId();

            (new ActivityService())->logAdminAction($childId, 'bonus_chest_awarded', 'chest', $chestId, [
                'reward' => $reward,
                'multiplier' => $multiplier > 1 ? $multiplier : null
            ]);

            return [
                'success' => true,
                'chest_id' => $chestId,
                'reward' => $reward,
                'multiplier' => $multiplier,
                'pending' => true
            ];

        } catch (\Exception $e) {
            return ['success' => false, 'error' => 'database_error'];
        }
    }

    /**
     * Get pending (unopened) chests for a child
     * @param int $childId
     * @return array List of pending chests
     */
    public function getPendingChests(int $childId): array
    {
        return $this->db->query(
            "SELECT * FROM chest_rewards
             WHERE child_id = ?
             AND opened_at IS NULL
             ORDER BY created_at ASC",
            [$childId]
        )->fetchAll();
    }

    /**
     * Open a pending chest and grant reward
     * @param int $chestId
     * @param int $childId
     * @return array Result
     */
    public function openPendingChest(int $chestId, int $childId): array
    {
        $chest = $this->db->query(
            "SELECT * FROM chest_rewards WHERE id = ? AND child_id = ? AND opened_at IS NULL",
            [$chestId, $childId]
        )->fetch();

        if (!$chest) {
            return ['success' => false, 'error' => 'chest_not_found'];
        }

        $this->db->beginTransaction();
        try {
            // Mark as opened
            $this->db->query(
                "UPDATE chest_rewards SET opened_at = NOW() WHERE id = ?",
                [$chestId]
            );

            $rewardValue = (int)$chest['reward_value'];
            $rewardType = $chest['reward_type'];
            $multiplierValue = 0;

            // Grant XP or multiplier based on type
            if ($rewardType === 'fixed_xp' && $rewardValue > 0) {
                $this->db->query(
                    "INSERT INTO point_transactions (child_id, points, note, type, transaction_date)
                     VALUES (?, ?, ?, 'earn', NOW())",
                    [$childId, $rewardValue, 'Bonus Chest Reward']
                );
                (new Child())->updateBalance($childId);
            } elseif ($rewardType === 'multiplier') {
                $multiplierValue = $rewardValue / 10; // e.g., 20 = 2x
                if ($multiplierValue >= 1.5) {
                    $this->applyMultiplier($childId, $multiplierValue, 'bonus_chest');
                }
            }

            $this->db->commit();

            // Get new balance
            $child = (new Child())->find($childId);

            return [
                'success' => true,
                'chest_id' => $chestId,
                'chest_type' => $chest['chest_type'],
                'reward_type' => $rewardType,
                'reward_value' => $rewardType === 'fixed_xp' ? $rewardValue : 0,
                'multiplier_applied' => $multiplierValue >= 1.5,
                'multiplier_value' => $multiplierValue >= 1.5 ? $multiplierValue : null,
                'new_balance' => $child['points_balance'] ?? 0
            ];

        } catch (\Exception $e) {
            $this->db->rollBack();
            return ['success' => false, 'error' => 'database_error'];
        }
    }

    /**
     * Cancel a pending chest (delete it)
     * @param int $chestId
     * @param int $childId
     * @return bool Success
     */
    public function cancelPendingChest(int $chestId, int $childId): bool
    {
        $result = $this->db->query(
            "DELETE FROM chest_rewards WHERE id = ? AND child_id = ? AND opened_at IS NULL",
            [$chestId, $childId]
        );
        return $result->rowCount() > 0;
    }

    /**
     * Get chest history for a child
     * @param int $childId
     * @param int $limit
     * @return array
     */
    public function getChestHistory(int $childId, int $limit = 10): array
    {
        return $this->db->query(
            "SELECT * FROM chest_rewards
             WHERE child_id = ?
             ORDER BY opened_at DESC
             LIMIT ?",
            [$childId, $limit]
        )->fetchAll();
    }

    /**
     * Calculate points with active multiplier
     * @param int $childId
     * @param int $basePoints
     * @return array [final_points, multiplier_used, multiplier_value]
     */
    public function calculateMultipliedPoints(int $childId, int $basePoints): array
    {
        $multiplier = $this->getActiveMultiplier($childId);

        if (!$multiplier || $basePoints <= 0) {
            return [
                'final_points' => $basePoints,
                'multiplier_used' => false,
                'multiplier_value' => 1
            ];
        }

        $finalPoints = (int)round($basePoints * $multiplier['multiplier']);

        return [
            'final_points' => $finalPoints,
            'multiplier_used' => true,
            'multiplier_value' => $multiplier['multiplier'],
            'bonus_points' => $finalPoints - $basePoints
        ];
    }
}
