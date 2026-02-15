<?php
namespace App\Services;

use App\Core\Database;
use App\Models\Child;
use App\Models\ChildGoal;
use App\Models\Setting;
use App\Services\ActivityService;
use App\Services\ChestService;

class GoalService
{
    private Database $db;
    private ChildGoal $goalModel;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->goalModel = new ChildGoal();
    }

    public function createGoal(int $childId, array $data): int
    {
        // Check if this is the child's first goal
        $existingCount = $this->goalModel->countActiveForChild($childId);
        $isFirstGoal = ($existingCount === 0);

        $goalData = [
            'child_id' => $childId,
            'name' => $data['name'],
            'name_ka' => $data['name_ka'] ?? null,
            'target_points' => (int)$data['target_points'],
            'deadline' => !empty($data['deadline']) ? $data['deadline'] : null,
            'is_default' => 0,
            'is_favorite' => $isFirstGoal ? 1 : 0,
            'chest_type' => $data['chest_type'] ?? null,
            'chest_reward_mode' => $data['chest_reward_mode'] ?? null,
            'chest_reward_value' => isset($data['chest_reward_value']) ? (int)$data['chest_reward_value'] : null
        ];

        $goalId = $this->goalModel->create($goalData);

        // Log activity
        $actorType = !empty($_SESSION['child_id']) ? 'child' : 'admin';
        (new ActivityService())->log($actorType, $_SESSION['child_id'] ?? $_SESSION['user_id'] ?? null, $childId, 'goal_created', 'goal', $goalId, [
            'name' => $data['name'],
            'target_points' => (int)$data['target_points']
        ]);

        return $goalId;
    }

    public function updateGoal(int $goalId, int $childId, array $data): bool
    {
        $goal = $this->goalModel->find($goalId);
        if (!$goal || $goal['child_id'] !== $childId) {
            return false;
        }

        if ($goal['is_completed']) {
            return false;
        }

        $updateData = [];
        if (isset($data['name'])) {
            $updateData['name'] = $data['name'];
        }
        if (array_key_exists('name_ka', $data)) {
            $updateData['name_ka'] = $data['name_ka'];
        }
        if (isset($data['target_points'])) {
            $updateData['target_points'] = (int)$data['target_points'];
        }
        if (array_key_exists('deadline', $data)) {
            $updateData['deadline'] = !empty($data['deadline']) ? $data['deadline'] : null;
        }
        if (array_key_exists('chest_type', $data)) {
            $updateData['chest_type'] = $data['chest_type'] ?: null;
        }
        if (array_key_exists('chest_reward_mode', $data)) {
            $updateData['chest_reward_mode'] = $data['chest_reward_mode'] ?: null;
        }
        if (array_key_exists('chest_reward_value', $data)) {
            $updateData['chest_reward_value'] = !empty($data['chest_reward_value']) ? (int)$data['chest_reward_value'] : null;
        }

        if (empty($updateData)) {
            return true;
        }

        $result = $this->goalModel->update($goalId, $updateData);

        if ($result) {
            $actorType = !empty($_SESSION['child_id']) ? 'child' : 'admin';
            (new ActivityService())->log($actorType, $_SESSION['child_id'] ?? $_SESSION['user_id'] ?? null, $childId, 'goal_updated', 'goal', $goalId, [
                'name' => $updateData['name'] ?? $goal['name']
            ]);
        }

        return $result;
    }

    public function deleteGoal(int $goalId, int $childId): bool
    {
        $goal = $this->goalModel->find($goalId);
        if (!$goal || $goal['child_id'] !== $childId) {
            return false;
        }

        $wasFavorite = (bool)$goal['is_favorite'];
        $goalName = $goal['name'];

        // Soft delete - mark as deleted instead of removing
        $this->db->query(
            "UPDATE child_goals SET deleted_at = NOW(), is_favorite = 0 WHERE id = ?",
            [$goalId]
        );

        // If deleted goal was favorite, assign favorite to another active goal
        if ($wasFavorite) {
            $activeGoals = $this->goalModel->getActiveForChild($childId);
            if (!empty($activeGoals)) {
                $this->goalModel->setFavorite($activeGoals[0]['id'], $childId);
            }
        }

        // Log activity
        $actorType = !empty($_SESSION['child_id']) ? 'child' : 'admin';
        (new ActivityService())->log($actorType, $_SESSION['child_id'] ?? $_SESSION['user_id'] ?? null, $childId, 'goal_deleted', 'goal', $goalId, [
            'name' => $goalName
        ]);

        return true;
    }

    public function checkAndMarkCompleted(int $childId): array
    {
        $child = (new Child())->find($childId);
        if (!$child) {
            return [];
        }

        $currentPoints = $child['points_balance'];
        $activeGoals = $this->goalModel->getActiveForChild($childId);
        $completedGoals = [];
        $favoriteLost = false;

        $activityService = new ActivityService();
        $chestService = new ChestService();

        foreach ($activeGoals as $goal) {
            if ($currentPoints >= $goal['target_points']) {
                $this->goalModel->markCompleted($goal['id']);

                // Calculate and award chest reward if configured
                $chestReward = $this->awardGoalChest($childId, $goal, $chestService);

                $completedGoals[] = array_merge($goal, [
                    'chest_reward' => $chestReward
                ]);

                if ($goal['is_favorite']) {
                    $favoriteLost = true;
                }

                // Log goal completion
                $activityService->logChildAction($childId, 'goal_completed', 'goal', $goal['id'], [
                    'name' => $goal['name'],
                    'target_points' => $goal['target_points'],
                    'chest_type' => $goal['chest_type'],
                    'chest_reward' => $chestReward
                ]);
            }
        }

        // If favorite goal was completed, assign favorite to another active goal
        if ($favoriteLost) {
            $remainingGoals = $this->goalModel->getActiveForChild($childId);
            if (!empty($remainingGoals)) {
                $this->goalModel->setFavorite($remainingGoals[0]['id'], $childId);
            }
        }

        return $completedGoals;
    }

    /**
     * Award chest reward for completing a goal
     */
    private function awardGoalChest(int $childId, array $goal, ChestService $chestService): ?array
    {
        // No chest if type is not set or is 'none'
        if (empty($goal['chest_type']) || $goal['chest_type'] === 'none') {
            return null;
        }

        $chestType = $goal['chest_type'];
        $rewardMode = $goal['chest_reward_mode'] ?? 'fixed_xp';
        $rewardValue = (int)($goal['chest_reward_value'] ?? 0);

        // Calculate actual reward based on mode
        $xpReward = 0;
        $multiplierReward = 0;

        switch ($rewardMode) {
            case 'percentage':
                // Percentage of target points
                $xpReward = (int)round($goal['target_points'] * ($rewardValue / 100));
                break;
            case 'multiplier':
                // Grant a multiplier
                $multiplierReward = $rewardValue > 0 ? ($rewardValue / 10) : 0; // e.g., 20 = 2x, 15 = 1.5x
                if ($multiplierReward < 1.5) $multiplierReward = 0;
                break;
            case 'fixed_xp':
            default:
                $xpReward = $rewardValue;
                break;
        }

        // Apply default rewards based on chest type if no specific reward set
        if ($xpReward === 0 && $multiplierReward === 0) {
            switch ($chestType) {
                case 'small':
                    $xpReward = 5;
                    break;
                case 'medium':
                    $xpReward = 15;
                    break;
                case 'large':
                    $xpReward = 30;
                    break;
                case 'epic':
                    $xpReward = 50;
                    $multiplierReward = 1.5;
                    break;
            }
        }

        // Record chest reward in database
        $chestTypeDb = 'goal_' . $chestType;
        $this->db->query(
            "INSERT INTO chest_rewards (child_id, chest_type, reward_type, reward_value, goal_id, opened_at)
             VALUES (?, ?, ?, ?, ?, NOW())",
            [$childId, $chestTypeDb, $rewardMode, $xpReward ?: $multiplierReward, $goal['id']]
        );
        $chestId = (int)$this->db->lastInsertId();

        // Award XP
        if ($xpReward > 0) {
            $this->db->query(
                "INSERT INTO point_transactions (child_id, points, note, type, transaction_date)
                 VALUES (?, ?, ?, 'earn', NOW())",
                [$childId, $xpReward, 'Goal Completion: ' . $goal['name']]
            );
            (new Child())->updateBalance($childId);
        }

        // Apply multiplier
        if ($multiplierReward >= 1.5) {
            $chestService->applyMultiplier($childId, $multiplierReward, 'goal_chest_' . $goal['id']);
        }

        return [
            'chest_id' => $chestId,
            'chest_type' => $chestType,
            'xp_reward' => $xpReward,
            'multiplier_reward' => $multiplierReward,
            'goal_id' => $goal['id'],
            'goal_name' => $goal['name']
        ];
    }

    public function getGoalProgress(array $goal, int $currentPoints): array
    {
        $targetPoints = (int)$goal['target_points'];
        $percentage = min(100, ($currentPoints / max(1, $targetPoints)) * 100);
        $pointsRemaining = max(0, $targetPoints - $currentPoints);

        $daysUntilDeadline = null;
        $isOverdue = false;

        if (!empty($goal['deadline'])) {
            $deadline = new \DateTime($goal['deadline']);
            $today = new \DateTime('today');
            $diff = $today->diff($deadline);

            if ($deadline < $today) {
                $isOverdue = true;
                $daysUntilDeadline = -$diff->days;
            } else {
                $daysUntilDeadline = $diff->days;
            }
        }

        return [
            'percentage' => round($percentage, 1),
            'points_current' => $currentPoints,
            'points_target' => $targetPoints,
            'points_remaining' => $pointsRemaining,
            'is_achievable' => $currentPoints >= $targetPoints,
            'days_until_deadline' => $daysUntilDeadline,
            'is_overdue' => $isOverdue
        ];
    }

    public function getMilestoneMessage(float $percentage, string $locale = 'en'): ?string
    {
        $messages = [
            'en' => [
                25 => "You're making progress! 25% complete.",
                50 => "Halfway there! Keep going!",
                75 => "Almost there! Just a little more!",
                100 => "Congratulations! Goal achieved!"
            ],
            'ka' => [
                25 => "პროგრესი მიდის! 25% დასრულებულია.",
                50 => "შუა გზაზე ხარ! გააგრძელე!",
                75 => "თითქმის მიაღწიე! კიდევ ცოტა!",
                100 => "გილოცავ! მიზანი მიღწეულია!"
            ]
        ];

        $lang = isset($messages[$locale]) ? $locale : 'en';
        $milestones = [25, 50, 75, 100];

        foreach ($milestones as $milestone) {
            if ($percentage >= $milestone && $percentage < $milestone + 10) {
                return $messages[$lang][$milestone];
            }
        }

        return null;
    }

    public function calculateProjectedCompletion(int $childId, int $targetPoints): ?string
    {
        $child = (new Child())->find($childId);
        if (!$child) {
            return null;
        }

        $currentPoints = $child['points_balance'];
        if ($currentPoints >= $targetPoints) {
            return null;
        }

        // Exclude refunds - only count actual earnings for projection calculation
        $thirtyDaysAgo = date('Y-m-d', strtotime('-30 days'));
        $result = $this->db->query(
            "SELECT SUM(CASE WHEN points > 0 AND type != 'refund' THEN points ELSE 0 END) as earned
             FROM point_transactions
             WHERE child_id = ? AND transaction_date >= ?",
            [$childId, $thirtyDaysAgo]
        )->fetch();

        $earnedLast30Days = (int)($result['earned'] ?? 0);
        if ($earnedLast30Days <= 0) {
            return null;
        }

        $dailyRate = $earnedLast30Days / 30;
        $pointsNeeded = $targetPoints - $currentPoints;
        $daysNeeded = ceil($pointsNeeded / $dailyRate);

        $projectedDate = new \DateTime();
        $projectedDate->modify("+{$daysNeeded} days");

        return $projectedDate->format('Y-m-d');
    }


    public function getPrimaryGoal(int $childId): ?array
    {
        // First check for favorite goal
        $favorite = $this->goalModel->getFavoriteForChild($childId);
        if ($favorite) {
            return $favorite;
        }

        // Fallback to first active goal
        $activeGoals = $this->goalModel->getActiveForChild($childId);
        return !empty($activeGoals) ? $activeGoals[0] : null;
    }

    public function toggleFavorite(int $goalId, int $childId): bool
    {
        $goal = $this->goalModel->find($goalId);
        if (!$goal || $goal['child_id'] !== $childId || !empty($goal['deleted_at'])) {
            return false;
        }

        if ($goal['is_favorite']) {
            // Don't allow unchecking if it's the only active goal
            $activeCount = $this->goalModel->countActiveForChild($childId);
            if ($activeCount <= 1) {
                return false;
            }
            $this->goalModel->unsetFavorite($goalId, $childId);
            $action = 'goal_favorite_unset';
        } else {
            $this->goalModel->setFavorite($goalId, $childId);
            $action = 'goal_favorite_set';
        }

        // Log activity
        $actorType = !empty($_SESSION['child_id']) ? 'child' : 'admin';
        (new ActivityService())->log($actorType, $_SESSION['child_id'] ?? $_SESSION['user_id'] ?? null, $childId, $action, 'goal', $goalId, [
            'name' => $goal['name']
        ]);

        return true;
    }
}
