<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Core\Lang;
use App\Models\Child;
use App\Models\ChildGoal;
use App\Models\ChildWishlist;
use App\Models\PointTransaction;
use App\Models\Achievement;
use App\Models\Reward;
use App\Models\RewardRedemption;
use App\Models\Setting;
use App\Services\ActivityService;
use App\Services\ChestService;
use App\Services\GoalService;
use App\Services\LevelService;
use App\Services\PointService;
use App\Services\PositivityService;
use App\Services\StreakService;
use App\Services\SummaryService;

class ChildPortalController extends Controller
{
    private function requireChildAuth(): ?array
    {
        if (empty($_SESSION['child_id'])) {
            $this->redirect('/child-login');
            return null;
        }

        $childId = (int)$_SESSION['child_id'];
        $child = (new Child())->find($childId);

        if (!$child) {
            unset($_SESSION['child_id']);
            $this->redirect('/child-login');
            return null;
        }

        return $child;
    }

    public function index(): void
    {
        $child = $this->requireChildAuth();
        if (!$child) return;

        $childId = $child['id'];
        $lang = Lang::getInstance();
        $locale = $lang->getLocale();

        $settings = (new Setting())->getAll();
        $pointsPerLari = (int)($settings['points_per_lari'] ?? 10);

        $goalService = new GoalService();
        $primaryGoal = $goalService->getPrimaryGoal($childId);

        $goalProgress = null;
        $milestoneMessage = null;
        $projectedCompletion = null;

        if ($primaryGoal) {
            $goalProgress = $goalService->getGoalProgress($primaryGoal, $child['points_balance']);
            $milestoneMessage = $goalService->getMilestoneMessage($goalProgress['percentage'], $locale);
            $projectedCompletion = $goalService->calculateProjectedCompletion($childId, $primaryGoal['target_points']);
        }

        $completedGoals = $goalService->checkAndMarkCompleted($childId);
        if (!empty($completedGoals)) {
            $child = (new Child())->find($childId);
        }

        $summaryService = new SummaryService();
        $weeklySummary = $summaryService->getWeeklySummary($childId);

        $transactions = (new PointTransaction())->getForChild($childId, [], 10);
        $streaks = (new StreakService())->getStreaks($childId);
        $achievements = (new Achievement())->getEarned($childId);
        $rewards = (new Reward())->getActive();
        $redemptions = (new RewardRedemption())->getForChild($childId);

        $activeGoals = (new ChildGoal())->getActiveForChild($childId);

        // Level progress
        $levelService = new LevelService();
        $levelProgress = $levelService->getLevelProgress($childId);

        // Check for level-up celebration (from database - works across different sessions)
        $levelUp = $levelService->getPendingLevelUp($childId);

        // Also check session (for same-session level-ups, e.g. child earning points directly)
        if (!$levelUp && isset($_SESSION['level_up'])) {
            $levelUp = $_SESSION['level_up'];
            unset($_SESSION['level_up']);
        }

        // Check for available chests (daily/sunday + pending bonus chests)
        $chestService = new ChestService();
        $availableChest = $chestService->getAvailableChest($childId);
        $pendingChests = $chestService->getPendingChests($childId);
        $activeMultiplier = $chestService->getActiveMultiplier($childId);

        // Get positivity rating
        $positivityService = new PositivityService();
        $positivity = $positivityService->getPositivityStats($childId);

        $this->render('child-portal/index', [
            'layout' => 'child',
            'child' => $child,
            'primaryGoal' => $primaryGoal,
            'goalProgress' => $goalProgress,
            'milestoneMessage' => $milestoneMessage,
            'projectedCompletion' => $projectedCompletion,
            'completedGoals' => $completedGoals,
            'activeGoals' => $activeGoals,
            'weeklySummary' => $weeklySummary,
            'transactions' => $transactions,
            'streaks' => $streaks,
            'achievements' => $achievements,
            'rewards' => $rewards,
            'redemptions' => $redemptions,
            'settings' => $settings,
            'pointsPerLari' => $pointsPerLari,
            'currencySymbol' => $settings['currency_symbol'] ?? '₾',
            'levelProgress' => $levelProgress,
            'levelUp' => $levelUp,
            'availableChest' => $availableChest,
            'pendingChests' => $pendingChests,
            'activeMultiplier' => $activeMultiplier,
            'positivity' => $positivity,
            'csrfToken' => $this->csrfToken(),
        ]);
    }

    public function goals(): void
    {
        $child = $this->requireChildAuth();
        if (!$child) return;

        $childId = $child['id'];
        $goalModel = new ChildGoal();
        $goalService = new GoalService();

        $activeGoals = $goalModel->getActiveForChild($childId);
        $completedGoals = $goalModel->getCompletedForChild($childId);

        $goalsWithProgress = [];
        foreach ($activeGoals as $goal) {
            $progress = $goalService->getGoalProgress($goal, $child['points_balance']);
            $projected = $goalService->calculateProjectedCompletion($childId, $goal['target_points']);
            $goalsWithProgress[] = array_merge($goal, [
                'progress' => $progress,
                'projected_completion' => $projected
            ]);
        }

        $settings = (new Setting())->getAll();

        $this->render('child-portal/goals', [
            'layout' => 'child',
            'child' => $child,
            'activeGoals' => $goalsWithProgress,
            'completedGoals' => $completedGoals,
            'settings' => $settings,
            'pointsPerLari' => (int)($settings['points_per_lari'] ?? 10),
            'currencySymbol' => $settings['currency_symbol'] ?? '₾',
            'csrfToken' => $this->csrfToken(),
        ]);
    }

    public function storeGoal(): void
    {
        $child = $this->requireChildAuth();
        if (!$child) return;

        if (!$this->isPost()) {
            $this->redirect('/my/goals');
            return;
        }

        $this->validateCsrf();
        $lang = Lang::getInstance();

        $name = trim($this->input('name'));
        $targetPoints = (int)$this->input('target_points');
        $deadline = $this->input('deadline');

        if (empty($name) || $targetPoints < 1) {
            $this->flash('error', $lang->t('invalid_input'));
            $this->redirect('/my/goals');
            return;
        }

        $goalModel = new ChildGoal();
        if ($goalModel->countActiveForChild($child['id']) >= 10) {
            $this->flash('error', $lang->t('max_goals_reached'));
            $this->redirect('/my/goals');
            return;
        }

        $goalService = new GoalService();
        $goalService->createGoal($child['id'], [
            'name' => $name,
            'name_ka' => $this->input('name_ka'),
            'target_points' => $targetPoints,
            'deadline' => $deadline
        ]);

        $this->flash('success', $lang->t('goal_created'));
        $this->redirect('/my/goals');
    }

    public function updateGoal(string $id): void
    {
        $child = $this->requireChildAuth();
        if (!$child) return;

        if (!$this->isPost()) {
            $this->redirect('/my/goals');
            return;
        }

        $this->validateCsrf();
        $lang = Lang::getInstance();

        $goalService = new GoalService();
        $success = $goalService->updateGoal((int)$id, $child['id'], [
            'name' => trim($this->input('name')),
            'name_ka' => $this->input('name_ka'),
            'target_points' => (int)$this->input('target_points'),
            'deadline' => $this->input('deadline')
        ]);

        if ($success) {
            $this->flash('success', $lang->t('goal_updated'));
        } else {
            $this->flash('error', $lang->t('cannot_edit_goal'));
        }

        $this->redirect('/my/goals');
    }

    public function deleteGoal(string $id): void
    {
        $child = $this->requireChildAuth();
        if (!$child) return;

        if (!$this->isPost()) {
            $this->redirect('/my/goals');
            return;
        }

        $this->validateCsrf();
        $lang = Lang::getInstance();

        $goalService = new GoalService();
        $success = $goalService->deleteGoal((int)$id, $child['id']);

        if ($success) {
            $this->flash('success', $lang->t('goal_deleted'));
        } else {
            $this->flash('error', $lang->t('cannot_delete_default_goal'));
        }

        $this->redirect('/my/goals');
    }

    public function toggleFavorite(string $id): void
    {
        $child = $this->requireChildAuth();
        if (!$child) return;

        if (!$this->isPost()) {
            $this->redirect('/my/goals');
            return;
        }

        $this->validateCsrf();

        $goalService = new GoalService();
        $goalService->toggleFavorite((int)$id, $child['id']);

        $this->redirect('/my/goals');
    }

    public function rewards(): void
    {
        $child = $this->requireChildAuth();
        if (!$child) return;

        $childId = $child['id'];

        $rewards = (new Reward())->getActive();
        $pendingRedemptions = (new RewardRedemption())->getPendingForChild($childId);
        $wishlistIds = (new ChildWishlist())->getWishlistRewardIds($childId);

        $rewardsWithStatus = [];
        foreach ($rewards as $reward) {
            $rewardsWithStatus[] = array_merge($reward, [
                'can_afford' => $child['points_balance'] >= $reward['point_cost'],
                'in_wishlist' => in_array($reward['id'], $wishlistIds)
            ]);
        }

        $settings = (new Setting())->getAll();

        $this->render('child-portal/rewards', [
            'layout' => 'child',
            'child' => $child,
            'rewards' => $rewardsWithStatus,
            'pendingRedemptions' => $pendingRedemptions,
            'settings' => $settings,
            'pointsPerLari' => (int)($settings['points_per_lari'] ?? 10),
            'currencySymbol' => $settings['currency_symbol'] ?? '₾',
            'csrfToken' => $this->csrfToken(),
        ]);
    }

    public function requestReward(): void
    {
        $child = $this->requireChildAuth();
        if (!$child) return;

        if (!$this->isPost()) {
            $this->redirect('/my/rewards');
            return;
        }

        $this->validateCsrf();
        $lang = Lang::getInstance();

        $rewardId = (int)$this->input('reward_id');

        $pointService = new PointService();
        $txId = $pointService->redeemReward($child['id'], $rewardId, 'child');

        if ($txId > 0) {
            $goalService = new GoalService();
            $goalService->checkAndMarkCompleted($child['id']);

            $this->flash('success', $lang->t('reward_requested'));
        } else {
            $this->flash('error', $lang->t('not_enough_points'));
        }

        $this->redirect('/my/rewards');
    }

    public function cancelRewardRequest(string $id): void
    {
        $child = $this->requireChildAuth();
        if (!$child) return;

        if (!$this->isPost()) {
            $this->redirect('/my/rewards');
            return;
        }

        $this->validateCsrf();
        $lang = Lang::getInstance();

        $redemptionModel = new RewardRedemption();
        if (!$redemptionModel->canCancel((int)$id, $child['id'])) {
            $this->flash('error', $lang->t('cannot_cancel_fulfilled'));
            $this->redirect('/my/rewards');
            return;
        }

        $pointService = new PointService();
        $txId = $pointService->refundRedemption($child['id'], (int)$id);

        if ($txId > 0) {
            $this->flash('success', $lang->t('request_cancelled'));
        } else {
            $this->flash('error', $lang->t('error_occurred'));
        }

        $this->redirect('/my/rewards');
    }

    public function addToWishlist(): void
    {
        $child = $this->requireChildAuth();
        if (!$child) return;

        if (!$this->isPost()) {
            $this->redirect('/my/rewards');
            return;
        }

        $this->validateCsrf();

        $rewardId = (int)$this->input('reward_id');
        (new ChildWishlist())->add($child['id'], $rewardId);

        // Log activity
        $reward = (new Reward())->find($rewardId);
        if ($reward) {
            (new ActivityService())->logChildAction($child['id'], 'wishlist_added', 'wishlist', $rewardId, [
                'reward_name' => $reward['name']
            ]);
        }

        $this->redirect('/my/rewards');
    }

    public function removeFromWishlist(): void
    {
        $child = $this->requireChildAuth();
        if (!$child) return;

        if (!$this->isPost()) {
            $this->redirect('/my/rewards');
            return;
        }

        $this->validateCsrf();

        $rewardId = (int)$this->input('reward_id');

        // Log activity before removing
        $reward = (new Reward())->find($rewardId);
        if ($reward) {
            (new ActivityService())->logChildAction($child['id'], 'wishlist_removed', 'wishlist', $rewardId, [
                'reward_name' => $reward['name']
            ]);
        }

        (new ChildWishlist())->remove($child['id'], $rewardId);

        $this->redirect('/my/rewards');
    }

    public function pointsHistory(): void
    {
        $child = $this->requireChildAuth();
        if (!$child) return;

        $childId = $child['id'];

        $page = max(1, (int)$this->input('page', 1));
        $perPage = 20;
        $offset = ($page - 1) * $perPage;

        $filters = [];
        $type = $this->input('type');
        if ($type && in_array($type, ['earn', 'deduct', 'redeem', 'refund', 'adjust'])) {
            $filters['type'] = $type;
        }

        $dateFrom = $this->input('date_from');
        $dateTo = $this->input('date_to');
        if ($dateFrom) {
            $filters['date_from'] = $dateFrom;
        }
        if ($dateTo) {
            $filters['date_to'] = $dateTo;
        }

        $transactionModel = new PointTransaction();
        $transactions = $transactionModel->getForChild($childId, $filters, $perPage, $offset);
        $totalCount = $transactionModel->countFiltered(array_merge($filters, ['child_id' => $childId]));
        $totalPages = ceil($totalCount / $perPage);

        $settings = (new Setting())->getAll();

        $this->render('child-portal/points-history', [
            'layout' => 'child',
            'child' => $child,
            'transactions' => $transactions,
            'filters' => $filters,
            'currentPage' => $page,
            'totalPages' => $totalPages,
            'totalCount' => $totalCount,
            'settings' => $settings,
            'pointsPerLari' => (int)($settings['points_per_lari'] ?? 10),
            'currencySymbol' => $settings['currency_symbol'] ?? '₾',
        ]);
    }

    public function redemptionHistory(): void
    {
        $child = $this->requireChildAuth();
        if (!$child) return;

        $childId = $child['id'];

        $redemptions = (new RewardRedemption())->getForChildWithDetails($childId);

        $settings = (new Setting())->getAll();

        $this->render('child-portal/redemption-history', [
            'layout' => 'child',
            'child' => $child,
            'redemptions' => $redemptions,
            'settings' => $settings,
            'pointsPerLari' => (int)($settings['points_per_lari'] ?? 10),
            'currencySymbol' => $settings['currency_symbol'] ?? '₾',
        ]);
    }

    public function openChest(): void
    {
        $child = $this->requireChildAuth();
        if (!$child) {
            $this->jsonResponse(['success' => false, 'error' => 'not_authenticated']);
            return;
        }

        if (!$this->isPost()) {
            $this->jsonResponse(['success' => false, 'error' => 'invalid_method']);
            return;
        }

        $this->validateCsrf();

        $chestType = $this->input('chest_type');
        if (!$chestType || !in_array($chestType, ['daily', 'sunday'])) {
            $this->jsonResponse(['success' => false, 'error' => 'invalid_chest_type']);
            return;
        }

        $chestService = new ChestService();
        $result = $chestService->openChest($child['id'], $chestType);

        if ($result['success']) {
            // Get updated balance
            $updatedChild = (new Child())->find($child['id']);
            $result['new_balance'] = $updatedChild['points_balance'] ?? 0;
        }

        $this->jsonResponse($result);
    }

    /**
     * Open a pending bonus chest
     */
    public function openPendingChest(): void
    {
        $child = $this->requireChildAuth();
        if (!$child) {
            $this->jsonResponse(['success' => false, 'error' => 'unauthorized']);
            return;
        }

        $this->validateCsrf();

        $chestId = (int)$this->input('chest_id');
        if (!$chestId) {
            $this->jsonResponse(['success' => false, 'error' => 'invalid_chest_id']);
            return;
        }

        $chestService = new ChestService();
        $result = $chestService->openPendingChest($chestId, $child['id']);

        $this->jsonResponse($result);
    }

    private function jsonResponse(array $data): void
    {
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}
