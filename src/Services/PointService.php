<?php
namespace App\Services;

use App\Core\Database;
use App\Models\Child;
use App\Models\BehaviorCategory;

class PointService
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function awardPoints(int $childId, int $categoryId, ?string $note = null, ?string $image = null): int
    {
        $category = (new BehaviorCategory())->find($categoryId);
        if (!$category) return 0;

        $basePoints = abs($category['default_points']);
        $type = $category['type'] === 'positive' ? 'earn' : 'deduct';
        if ($type === 'deduct') $basePoints = -$basePoints;

        // Check for active multiplier (only for positive points)
        $multiplierValue = null;
        $bonusPoints = null;
        $finalPoints = $basePoints;

        if ($type === 'earn' && $basePoints > 0) {
            $chestService = new ChestService();
            $multiplier = $chestService->getActiveMultiplier($childId);

            if ($multiplier && $multiplier['multiplier'] > 1) {
                $multiplierValue = $multiplier['multiplier'];
                $finalPoints = (int)round($basePoints * $multiplierValue);
                $bonusPoints = $finalPoints - $basePoints;

                // Store multiplier info in session for celebration display
                $_SESSION['points_multiplied'] = [
                    'base_points' => $basePoints,
                    'multiplier' => $multiplierValue,
                    'bonus_points' => $bonusPoints,
                    'final_points' => $finalPoints
                ];
            }
        }

        $this->db->beginTransaction();
        try {
            $this->db->query(
                "INSERT INTO point_transactions (child_id, category_id, points, note, image, type, transaction_date, multiplier_value, bonus_points)
                 VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)",
                [$childId, $categoryId, $finalPoints, $note, $image, $type, $multiplierValue, $bonusPoints]
            );
            $txId = (int)$this->db->lastInsertId();

            (new Child())->updateBalance($childId);

            $this->db->commit();

            if ($type === 'earn') {
                (new StreakService())->updateStreak($childId, $categoryId);
            }
            (new AchievementService())->checkAndAward($childId);

            // Check for level-up
            $leveledUp = (new LevelService())->checkAndUpdateLevel($childId);
            if ($leveledUp) {
                $_SESSION['level_up'] = $leveledUp;
            }

            // Log activity
            $action = $type === 'earn' ? 'points_earned' : 'points_deducted';
            $activityDetails = [
                'category' => $category['name'],
                'points' => $finalPoints
            ];
            if ($multiplierValue) {
                $activityDetails['multiplier'] = $multiplierValue;
                $activityDetails['bonus_points'] = $bonusPoints;
            }
            (new ActivityService())->logAdminAction($childId, $action, 'transaction', $txId, $activityDetails);

            return $txId;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function adjustPoints(int $childId, int $points, string $note, ?string $image = null): int
    {
        // Check for active multiplier (only for positive adjustments)
        $multiplierValue = null;
        $bonusPoints = null;
        $finalPoints = $points;

        if ($points > 0) {
            $chestService = new ChestService();
            $multiplier = $chestService->getActiveMultiplier($childId);

            if ($multiplier && $multiplier['multiplier'] > 1) {
                $multiplierValue = $multiplier['multiplier'];
                $finalPoints = (int)round($points * $multiplierValue);
                $bonusPoints = $finalPoints - $points;

                // Store multiplier info in session for celebration display
                $_SESSION['points_multiplied'] = [
                    'base_points' => $points,
                    'multiplier' => $multiplierValue,
                    'bonus_points' => $bonusPoints,
                    'final_points' => $finalPoints
                ];
            }
        }

        $this->db->beginTransaction();
        try {
            $this->db->query(
                "INSERT INTO point_transactions (child_id, points, note, image, type, transaction_date, multiplier_value, bonus_points)
                 VALUES (?, ?, ?, ?, 'adjust', NOW(), ?, ?)",
                [$childId, $finalPoints, $note, $image, $multiplierValue, $bonusPoints]
            );
            $txId = (int)$this->db->lastInsertId();
            (new Child())->updateBalance($childId);
            $this->db->commit();

            (new AchievementService())->checkAndAward($childId);

            // Check for level-up (only if positive adjustment)
            if ($points > 0) {
                $leveledUp = (new LevelService())->checkAndUpdateLevel($childId);
                if ($leveledUp) {
                    $_SESSION['level_up'] = $leveledUp;
                }
            }

            return $txId;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function redeemReward(int $childId, int $rewardId, string $requestedBy = 'admin'): int
    {
        $child = (new Child())->find($childId);
        $reward = (new \App\Models\Reward())->find($rewardId);

        if (!$child || !$reward || $child['points_balance'] < $reward['point_cost']) {
            return 0;
        }

        $this->db->beginTransaction();
        try {
            $points = -$reward['point_cost'];
            $this->db->query(
                "INSERT INTO point_transactions (child_id, points, note, type, transaction_date) VALUES (?, ?, ?, 'redeem', NOW())",
                [$childId, $points, $reward['name']]
            );
            $txId = (int)$this->db->lastInsertId();

            $this->db->query(
                "INSERT INTO reward_redemptions (child_id, reward_id, points_spent, transaction_id, status, requested_by) VALUES (?, ?, ?, ?, 'pending', ?)",
                [$childId, $rewardId, $reward['point_cost'], $txId, $requestedBy]
            );

            (new Child())->updateBalance($childId);
            $this->db->commit();

            (new AchievementService())->checkAndAward($childId);

            // Log activity
            $actorType = $requestedBy === 'child' ? 'child' : 'admin';
            $actorId = $requestedBy === 'child' ? $childId : ($_SESSION['user_id'] ?? null);
            (new ActivityService())->log($actorType, $actorId, $childId, 'reward_requested', 'redemption', $txId, [
                'reward_name' => $reward['name'],
                'points' => $reward['point_cost']
            ]);

            return $txId;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function refundRedemption(int $childId, int $redemptionId): int
    {
        $redemption = $this->db->query(
            "SELECT rr.*, r.name as reward_name FROM reward_redemptions rr
             JOIN rewards r ON rr.reward_id = r.id
             WHERE rr.id = ? AND rr.child_id = ?",
            [$redemptionId, $childId]
        )->fetch();

        if (!$redemption || $redemption['status'] !== 'pending') {
            return 0;
        }

        $this->db->beginTransaction();
        try {
            // Use 'refund' type so it doesn't count as earned in summaries
            $this->db->query(
                "INSERT INTO point_transactions (child_id, points, note, type, transaction_date) VALUES (?, ?, ?, 'refund', NOW())",
                [$childId, $redemption['points_spent'], $redemption['reward_name']]
            );
            $txId = (int)$this->db->lastInsertId();

            $this->db->query(
                "UPDATE reward_redemptions SET status = 'cancelled', cancelled_at = NOW() WHERE id = ?",
                [$redemptionId]
            );

            (new Child())->updateBalance($childId);
            $this->db->commit();

            // Log activity
            $actorType = !empty($_SESSION['child_id']) ? 'child' : 'admin';
            $actorId = $_SESSION['child_id'] ?? $_SESSION['user_id'] ?? null;
            (new ActivityService())->log($actorType, $actorId, $childId, 'reward_cancelled', 'redemption', $redemptionId, [
                'reward_name' => $redemption['reward_name'],
                'points_refunded' => $redemption['points_spent']
            ]);

            return $txId;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function deleteTransaction(int $txId): bool
    {
        $tx = $this->db->query(
            "SELECT * FROM point_transactions WHERE id = ?",
            [$txId]
        )->fetch();

        if (!$tx) return false;

        $childId = (int)$tx['child_id'];
        $categoryId = $tx['category_id'] ? (int)$tx['category_id'] : null;
        $type = $tx['type'];
        $txDate = $tx['transaction_date'];

        $this->db->beginTransaction();
        try {
            // If this is a redeem transaction, cancel the linked redemption
            if ($type === 'redeem') {
                $this->db->query(
                    "UPDATE reward_redemptions SET status = 'cancelled', cancelled_at = NOW() WHERE transaction_id = ?",
                    [$txId]
                );
            }

            // Delete the transaction itself
            $this->db->query("DELETE FROM point_transactions WHERE id = ?", [$txId]);

            // Find and delete level-up bonus transactions triggered by this one
            // (type='earn', no category, created within 2 seconds of the original)
            $this->db->query(
                "DELETE FROM point_transactions
                 WHERE child_id = ? AND type = 'earn' AND category_id IS NULL
                 AND ABS(TIMESTAMPDIFF(SECOND, transaction_date, ?)) <= 2
                 AND id != ?
                 AND note IN (SELECT name FROM levels)",
                [$childId, $txDate, $txId]
            );

            // Recalculate balance
            (new Child())->updateBalance($childId);

            // Recalculate level (can go down)
            (new LevelService())->recalculateLevel($childId);

            // Recalculate streak if it was an earn type with a category
            if ($type === 'earn' && $categoryId) {
                (new StreakService())->recalculateStreak($childId, $categoryId);
            }

            // Recalculate achievements (remove undeserved)
            (new AchievementService())->recalculateAchievements($childId);

            // Log activity
            (new ActivityService())->logAdminAction(
                $childId, 'transaction_deleted', 'transaction', $txId,
                ['type' => $type, 'points' => $tx['points']]
            );

            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
