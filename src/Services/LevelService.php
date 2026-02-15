<?php
namespace App\Services;

use App\Core\Database;
use App\Models\Child;

class LevelService
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Get total earned points for a child (only positive transactions, excluding refunds)
     * Refunds restore spent points but don't count as earned points for level progression
     */
    public function getTotalEarnedPoints(int $childId): int
    {
        $result = $this->db->query(
            "SELECT COALESCE(SUM(points), 0) as total
             FROM point_transactions
             WHERE child_id = ? AND points > 0 AND type != 'refund'",
            [$childId]
        )->fetch();
        return (int)$result['total'];
    }

    /**
     * Get all active levels ordered by points required
     */
    public function getAllLevels(): array
    {
        return $this->db->query(
            "SELECT * FROM levels WHERE is_active = 1 ORDER BY points_required ASC"
        )->fetchAll();
    }

    /**
     * Get level for given total points
     */
    public function getLevelForPoints(int $totalPoints): ?array
    {
        $result = $this->db->query(
            "SELECT * FROM levels
             WHERE is_active = 1 AND points_required <= ?
             ORDER BY points_required DESC
             LIMIT 1",
            [$totalPoints]
        )->fetch();
        return $result ?: null;
    }

    /**
     * Get next level after the given level (or null if at max)
     */
    public function getNextLevel(int $currentLevelId): ?array
    {
        $current = $this->db->query(
            "SELECT level_number FROM levels WHERE id = ?",
            [$currentLevelId]
        )->fetch();

        if (!$current) return null;

        $result = $this->db->query(
            "SELECT * FROM levels
             WHERE is_active = 1 AND level_number > ?
             ORDER BY level_number ASC
             LIMIT 1",
            [$current['level_number']]
        )->fetch();
        return $result ?: null;
    }

    /**
     * Get level progress info for a child
     */
    public function getLevelProgress(int $childId): array
    {
        $totalEarned = $this->getTotalEarnedPoints($childId);
        $currentLevel = $this->getLevelForPoints($totalEarned);
        $nextLevel = $currentLevel ? $this->getNextLevel($currentLevel['id']) : null;

        $progress = [
            'total_earned' => $totalEarned,
            'current_level' => $currentLevel,
            'next_level' => $nextLevel,
            'points_in_current_level' => 0,
            'points_to_next_level' => 0,
            'progress_percentage' => 100,
        ];

        if ($currentLevel && $nextLevel) {
            $levelRange = $nextLevel['points_required'] - $currentLevel['points_required'];
            $pointsInLevel = $totalEarned - $currentLevel['points_required'];
            $progress['points_in_current_level'] = $pointsInLevel;
            $progress['points_to_next_level'] = $nextLevel['points_required'] - $totalEarned;
            $progress['progress_percentage'] = $levelRange > 0
                ? min(100, round(($pointsInLevel / $levelRange) * 100))
                : 100;
        }

        return $progress;
    }

    /**
     * Check and update child's level, return new level if leveled up
     */
    public function checkAndUpdateLevel(int $childId): ?array
    {
        $totalEarned = $this->getTotalEarnedPoints($childId);
        $newLevel = $this->getLevelForPoints($totalEarned);

        if (!$newLevel) return null;

        // Check if this level was already earned
        $alreadyEarned = $this->db->query(
            "SELECT id FROM child_level_history
             WHERE child_id = ? AND level_id = ?",
            [$childId, $newLevel['id']]
        )->fetch();

        if (!$alreadyEarned) {
            // This is a new level - award bonus and record history
            $bonusPoints = $this->awardLevelUpBonus($childId, $newLevel);

            $this->db->query(
                "INSERT INTO child_level_history
                 (child_id, level_id, total_points_at_level, bonus_points_awarded)
                 VALUES (?, ?, ?, ?)",
                [$childId, $newLevel['id'], $totalEarned, $bonusPoints]
            );

            // Update child's current level, total earned, and set pending level-up for child portal
            $this->db->query(
                "UPDATE children SET current_level_id = ?, total_points_earned = ?, pending_level_up_id = ? WHERE id = ?",
                [$newLevel['id'], $totalEarned, $newLevel['id'], $childId]
            );

            // Add bonus to the return data for celebration display
            $newLevel['bonus_points'] = $bonusPoints;
            return $newLevel;
        }

        // Just update cached values (no level-up)
        $this->db->query(
            "UPDATE children SET current_level_id = ?, total_points_earned = ? WHERE id = ?",
            [$newLevel['id'], $totalEarned, $childId]
        );

        return null;
    }

    /**
     * Award bonus points for level-up if enabled
     */
    private function awardLevelUpBonus(int $childId, array $level): int
    {
        $enabledSetting = $this->db->query(
            "SELECT setting_value FROM settings WHERE setting_key = 'level_up_bonus_enabled'"
        )->fetch();

        if (!$enabledSetting || $enabledSetting['setting_value'] !== '1') {
            return 0;
        }

        $bonusSetting = $this->db->query(
            "SELECT setting_value FROM settings WHERE setting_key = 'level_up_bonus_points'"
        )->fetch();

        $baseBonus = (int)($bonusSetting['setting_value'] ?? 10);
        $scaledBonus = $baseBonus * $level['level_number'];

        // Record bonus as transaction
        $this->db->query(
            "INSERT INTO point_transactions
             (child_id, points, note, type, transaction_date)
             VALUES (?, ?, ?, 'earn', NOW())",
            [$childId, $scaledBonus, $level['name']]
        );

        // Update balance
        (new Child())->updateBalance($childId);

        return $scaledBonus;
    }

    /**
     * Get level history for a child
     */
    public function getLevelHistory(int $childId): array
    {
        return $this->db->query(
            "SELECT clh.*, l.name, l.name_ka, l.icon, l.theme_color, l.stars
             FROM child_level_history clh
             JOIN levels l ON clh.level_id = l.id
             WHERE clh.child_id = ?
             ORDER BY clh.reached_at DESC",
            [$childId]
        )->fetchAll();
    }

    /**
     * Get a single level by ID
     */
    public function getLevel(int $levelId): ?array
    {
        $result = $this->db->query(
            "SELECT * FROM levels WHERE id = ?",
            [$levelId]
        )->fetch();
        return $result ?: null;
    }

    /**
     * Get and clear pending level-up for a child (for child portal celebration)
     */
    public function getPendingLevelUp(int $childId): ?array
    {
        // Get the pending level-up ID
        $child = $this->db->query(
            "SELECT pending_level_up_id FROM children WHERE id = ?",
            [$childId]
        )->fetch();

        if (!$child || !$child['pending_level_up_id']) {
            return null;
        }

        $levelId = $child['pending_level_up_id'];

        // Clear the pending level-up
        $this->db->query(
            "UPDATE children SET pending_level_up_id = NULL WHERE id = ?",
            [$childId]
        );

        // Get level data with bonus points from history
        $levelData = $this->db->query(
            "SELECT l.*, clh.bonus_points_awarded as bonus_points
             FROM levels l
             LEFT JOIN child_level_history clh ON l.id = clh.level_id AND clh.child_id = ?
             WHERE l.id = ?",
            [$childId, $levelId]
        )->fetch();

        return $levelData ?: null;
    }
}
