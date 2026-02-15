<?php
namespace App\Services;

use App\Models\ActivityLog;

class ActivityService
{
    private ActivityLog $logModel;

    public function __construct()
    {
        $this->logModel = new ActivityLog();
    }

    public function log(
        string $actorType,
        ?int $actorId,
        ?int $childId,
        string $action,
        string $entityType,
        ?int $entityId = null,
        ?array $details = null
    ): int {
        return $this->logModel->log($actorType, $actorId, $childId, $action, $entityType, $entityId, $details);
    }

    public function logChildAction(int $childId, string $action, string $entityType, ?int $entityId = null, ?array $details = null): int
    {
        return $this->log('child', $childId, $childId, $action, $entityType, $entityId, $details);
    }

    public function logAdminAction(?int $childId, string $action, string $entityType, ?int $entityId = null, ?array $details = null): int
    {
        $adminId = $_SESSION['user_id'] ?? null;
        return $this->log('admin', $adminId, $childId, $action, $entityType, $entityId, $details);
    }

    public function getActionLabel(string $action, string $locale = 'en'): string
    {
        $labels = [
            'en' => [
                'goal_created' => 'Created goal',
                'goal_updated' => 'Updated goal',
                'goal_deleted' => 'Deleted goal',
                'goal_completed' => 'Completed goal',
                'goal_favorite_set' => 'Set favorite goal',
                'goal_favorite_unset' => 'Removed favorite goal',
                'reward_requested' => 'Requested reward',
                'reward_cancelled' => 'Cancelled reward request',
                'reward_fulfilled' => 'Reward fulfilled',
                'wishlist_added' => 'Added to wishlist',
                'wishlist_removed' => 'Removed from wishlist',
                'child_login' => 'Logged in',
                'child_logout' => 'Logged out',
                'points_earned' => 'Earned points',
                'points_deducted' => 'Points deducted',
                'points_adjusted' => 'Points adjusted',
            ],
            'ka' => [
                'goal_created' => 'შეიქმნა მიზანი',
                'goal_updated' => 'განახლდა მიზანი',
                'goal_deleted' => 'წაიშალა მიზანი',
                'goal_completed' => 'მიზანი მიღწეულია',
                'goal_favorite_set' => 'მთავარი მიზანი დაყენდა',
                'goal_favorite_unset' => 'მთავარი მიზანი მოიხსნა',
                'reward_requested' => 'მოთხოვნილია ჯილდო',
                'reward_cancelled' => 'გაუქმდა ჯილდოს მოთხოვნა',
                'reward_fulfilled' => 'ჯილდო შესრულდა',
                'wishlist_added' => 'დაემატა სურვილების სიაში',
                'wishlist_removed' => 'წაიშალა სურვილების სიიდან',
                'child_login' => 'შემოვიდა სისტემაში',
                'child_logout' => 'გავიდა სისტემიდან',
                'points_earned' => 'მიიღო ქულები',
                'points_deducted' => 'ჩამოიჭრა ქულები',
                'points_adjusted' => 'ქულები შეიცვალა',
            ]
        ];

        $lang = isset($labels[$locale]) ? $locale : 'en';
        return $labels[$lang][$action] ?? $action;
    }

    public function formatDetails(string $action, ?string $detailsJson, string $locale = 'en'): string
    {
        if (!$detailsJson) return '';

        $details = json_decode($detailsJson, true);
        if (!$details) return '';

        switch ($action) {
            case 'goal_created':
            case 'goal_completed':
                return ($details['name'] ?? '') . ' (' . ($details['target_points'] ?? 0) . ' pts)';
            case 'goal_updated':
                return $details['name'] ?? '';
            case 'goal_deleted':
                return $details['name'] ?? '';
            case 'reward_requested':
            case 'reward_cancelled':
            case 'reward_fulfilled':
                return ($details['reward_name'] ?? '') . ' (' . ($details['points'] ?? 0) . ' pts)';
            case 'wishlist_added':
            case 'wishlist_removed':
                return $details['reward_name'] ?? '';
            case 'points_earned':
            case 'points_deducted':
                $pts = $details['points'] ?? 0;
                return ($details['category'] ?? '') . ' (' . ($pts >= 0 ? '+' : '') . $pts . ')';
            case 'points_adjusted':
                $pts = $details['points'] ?? 0;
                return ($pts >= 0 ? '+' : '') . $pts . ' pts';
            default:
                return '';
        }
    }
}
