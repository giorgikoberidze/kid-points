<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Core\Auth;
use App\Core\Lang;
use App\Models\Child;
use App\Models\ActivityLog;
use App\Models\ChildGoal;
use App\Models\ChildWishlist;
use App\Models\PointTransaction;
use App\Models\BehaviorCategory;
use App\Models\Setting;
use App\Models\Achievement;
use App\Models\Reward;
use App\Models\RewardRedemption;
use App\Services\ActivityService;
use App\Services\ChestService;
use App\Services\GoalService;
use App\Services\LevelService;
use App\Services\PositivityService;
use App\Services\StreakService;

class ChildController extends Controller
{
    public function index(): void
    {
        Auth::requireAuth();
        $children = (new Child())->findAll('COALESCE(nickname, name) ASC');

        // Get positivity stats for all children
        $childIds = array_column($children, 'id');
        $positivityService = new PositivityService();
        $positivityStats = $positivityService->getPositivityStatsForChildren($childIds);

        $this->render('children/index', [
            'children' => $children,
            'positivityStats' => $positivityStats,
            'csrfToken' => $this->csrfToken(),
        ]);
    }

    public function create(): void
    {
        Auth::requireAuth();
        $this->render('children/create', [
            'csrfToken' => $this->csrfToken(),
        ]);
    }

    public function store(): void
    {
        Auth::requireAuth();
        if (!$this->validateCsrf()) {
            $this->redirect('/children');
            return;
        }

        $nickname = $this->input('nickname');
        $data = [
            'name' => $nickname,
            'nickname' => $nickname,
            'first_name' => $this->input('first_name') ?: null,
            'last_name' => $this->input('last_name') ?: null,
            'pin' => $this->input('pin') ?: null,
            'date_of_birth' => $this->input('date_of_birth') ?: null,
        ];

        if (!empty($_FILES['photo']['tmp_name'])) {
            $data['photo_path'] = $this->handlePhotoUpload($_FILES['photo']);
        }

        (new Child())->create($data);
        $this->flash('success', \App\Core\Lang::getInstance()->t('child_created'));
        $this->redirect('/children');
    }

    public function show(string $id): void
    {
        Auth::requireAuth();
        $child = (new Child())->find((int)$id);
        if (!$child) {
            $this->redirect('/children');
            return;
        }

        $childId = (int)$id;
        $settings = (new Setting())->getAll();
        $transactions = (new PointTransaction())->getForChild($childId, [], 50);
        $categories = (new BehaviorCategory())->getActive();
        $streaks = (new StreakService())->getStreaks($childId);
        $achievements = (new Achievement())->getAllWithStatus($childId);
        $rewards = (new Reward())->getActive();
        $redemptions = (new RewardRedemption())->getForChild($childId);

        // Goals with progress
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

        // Wishlist
        $wishlistItems = (new ChildWishlist())->getForChild($childId);

        // Recent activity
        $recentActivity = (new ActivityLog())->getForChild($childId, 10);
        $activityService = new ActivityService();

        // Level progress
        $levelService = new LevelService();
        $levelProgress = $levelService->getLevelProgress($childId);

        // Check for level-up celebration
        $levelUp = null;
        if (isset($_SESSION['level_up'])) {
            $levelUp = $_SESSION['level_up'];
            unset($_SESSION['level_up']);
        }

        // Get active multiplier and pending chests
        $chestService = new ChestService();
        $activeMultiplier = $chestService->getActiveMultiplier($childId);
        $pendingChests = $chestService->getPendingChests($childId);

        // Get positivity rating
        $positivityService = new PositivityService();
        $positivity = $positivityService->getPositivityStats($childId);

        $this->render('children/show', [
            'child' => $child,
            'transactions' => $transactions,
            'categories' => $categories,
            'streaks' => $streaks,
            'achievements' => $achievements,
            'rewards' => $rewards,
            'redemptions' => $redemptions,
            'activeGoals' => $goalsWithProgress,
            'completedGoals' => $completedGoals,
            'wishlistItems' => $wishlistItems,
            'recentActivity' => $recentActivity,
            'activityService' => $activityService,
            'settings' => $settings,
            'pointsPerLari' => (int)($settings['points_per_lari'] ?? 10),
            'currencySymbol' => $settings['currency_symbol'] ?? '₾',
            'levelProgress' => $levelProgress,
            'levelUp' => $levelUp,
            'activeMultiplier' => $activeMultiplier,
            'pendingChests' => $pendingChests,
            'positivity' => $positivity,
            'csrfToken' => $this->csrfToken(),
        ]);
    }

    public function edit(string $id): void
    {
        Auth::requireAuth();
        $child = (new Child())->find((int)$id);
        if (!$child) {
            $this->redirect('/children');
            return;
        }
        $this->render('children/edit', [
            'child' => $child,
            'csrfToken' => $this->csrfToken(),
        ]);
    }

    public function update(string $id): void
    {
        Auth::requireAuth();
        if (!$this->validateCsrf()) {
            $this->redirect('/children');
            return;
        }

        $nickname = $this->input('nickname');
        $data = [
            'name' => $nickname,
            'nickname' => $nickname,
            'first_name' => $this->input('first_name') ?: null,
            'last_name' => $this->input('last_name') ?: null,
            'pin' => $this->input('pin') ?: null,
            'date_of_birth' => $this->input('date_of_birth') ?: null,
            'celebration_style' => $this->input('celebration_style') ?: 'simple',
            'pet_creature' => $this->input('pet_creature') ?: 'dragon',
            'pet_skin' => $this->input('pet_skin') ?: 'default',
            'pet_enabled' => $this->input('pet_enabled') ? 1 : 0,
            'sound_enabled' => $this->input('sound_enabled') ? 1 : 0,
        ];

        if (!empty($_FILES['photo']['tmp_name'])) {
            $data['photo_path'] = $this->handlePhotoUpload($_FILES['photo']);
        }

        (new Child())->update((int)$id, $data);
        $this->flash('success', \App\Core\Lang::getInstance()->t('child_updated'));
        $this->redirect('/children/' . $id);
    }

    public function destroy(string $id): void
    {
        Auth::requireAuth();
        if (!$this->validateCsrf()) {
            $this->redirect('/children');
            return;
        }
        (new Child())->delete((int)$id);
        $this->flash('success', Lang::getInstance()->t('child_deleted'));
        $this->redirect('/children');
    }

    public function storeGoal(string $childId): void
    {
        Auth::requireAuth();
        if (!$this->validateCsrf()) {
            $this->redirect('/children/' . $childId);
            return;
        }

        $lang = Lang::getInstance();
        $name = trim($this->input('name'));
        $targetPoints = (int)$this->input('target_points');

        if (empty($name) || $targetPoints < 1) {
            $this->flash('error', $lang->t('invalid_input'));
            $this->redirect('/children/' . $childId);
            return;
        }

        $goalService = new GoalService();
        $goalService->createGoal((int)$childId, [
            'name' => $name,
            'name_ka' => $this->input('name_ka') ?: null,
            'target_points' => $targetPoints,
            'deadline' => $this->input('deadline') ?: null,
            'chest_type' => $this->input('chest_type') ?: null,
            'chest_reward_mode' => $this->input('chest_reward_mode') ?: null,
            'chest_reward_value' => $this->input('chest_reward_value') ?: null
        ]);

        $this->flash('success', $lang->t('goal_created'));
        $this->redirect('/children/' . $childId);
    }

    public function updateGoal(string $childId, string $goalId): void
    {
        Auth::requireAuth();
        if (!$this->validateCsrf()) {
            $this->redirect('/children/' . $childId);
            return;
        }

        $lang = Lang::getInstance();
        $goalService = new GoalService();
        $success = $goalService->updateGoal((int)$goalId, (int)$childId, [
            'name' => trim($this->input('name')),
            'name_ka' => $this->input('name_ka') ?: null,
            'target_points' => (int)$this->input('target_points'),
            'deadline' => $this->input('deadline') ?: null,
            'chest_type' => $this->input('chest_type') ?: null,
            'chest_reward_mode' => $this->input('chest_reward_mode') ?: null,
            'chest_reward_value' => $this->input('chest_reward_value') ?: null
        ]);

        if ($success) {
            $this->flash('success', $lang->t('goal_updated'));
        } else {
            $this->flash('error', $lang->t('cannot_edit_goal'));
        }

        $this->redirect('/children/' . $childId);
    }

    public function deleteGoal(string $childId, string $goalId): void
    {
        Auth::requireAuth();
        if (!$this->validateCsrf()) {
            $this->redirect('/children/' . $childId);
            return;
        }

        $lang = Lang::getInstance();
        $goalService = new GoalService();
        $success = $goalService->deleteGoal((int)$goalId, (int)$childId);

        if ($success) {
            $this->flash('success', $lang->t('goal_deleted'));
        } else {
            $this->flash('error', $lang->t('error_occurred'));
        }

        $this->redirect('/children/' . $childId);
    }

    public function publicView(string $id): void
    {
        $child = (new Child())->find((int)$id);
        if (!$child) {
            http_response_code(404);
            echo '<h1>Not Found</h1>';
            return;
        }

        $childId = (int)$id;
        $settings = (new Setting())->getAll();
        $streaks = (new StreakService())->getStreaks($childId);
        $achievements = (new Achievement())->getEarned($childId);
        $rewards = (new Reward())->getActive();
        $redemptions = (new RewardRedemption())->getForChild($childId);

        // Level progress
        $levelService = new LevelService();
        $levelProgress = $levelService->getLevelProgress($childId);

        $this->render('children/public', [
            'layout' => 'auth',
            'child' => $child,
            'streaks' => $streaks,
            'achievements' => $achievements,
            'rewards' => $rewards,
            'redemptions' => $redemptions,
            'settings' => $settings,
            'pointsPerLari' => (int)($settings['points_per_lari'] ?? 10),
            'currencySymbol' => $settings['currency_symbol'] ?? '₾',
            'levelProgress' => $levelProgress,
        ]);
    }

    public function cleanupForm(string $id): void
    {
        Auth::requireAuth();
        $child = (new Child())->find((int)$id);
        if (!$child) {
            $this->redirect('/children');
            return;
        }

        // Get counts for each data type
        $db = \App\Core\Database::getInstance();

        $counts = [
            'goals' => $db->query("SELECT COUNT(*) as cnt FROM child_goals WHERE child_id = ?", [$id])->fetch()['cnt'],
            'transactions' => $db->query("SELECT COUNT(*) as cnt FROM point_transactions WHERE child_id = ?", [$id])->fetch()['cnt'],
            'redemptions' => $db->query("SELECT COUNT(*) as cnt FROM reward_redemptions WHERE child_id = ?", [$id])->fetch()['cnt'],
            'streaks' => $db->query("SELECT COUNT(*) as cnt FROM streaks WHERE child_id = ?", [$id])->fetch()['cnt'],
            'achievements' => $db->query("SELECT COUNT(*) as cnt FROM child_achievements WHERE child_id = ?", [$id])->fetch()['cnt'],
            'wishlist' => $db->query("SELECT COUNT(*) as cnt FROM child_wishlists WHERE child_id = ?", [$id])->fetch()['cnt'],
            'activity' => $db->query("SELECT COUNT(*) as cnt FROM activity_log WHERE child_id = ?", [$id])->fetch()['cnt'],
            'levels' => $db->query("SELECT COUNT(*) as cnt FROM child_level_history WHERE child_id = ?", [$id])->fetch()['cnt'],
        ];

        $this->render('children/cleanup', [
            'child' => $child,
            'counts' => $counts,
            'csrfToken' => $this->csrfToken(),
        ]);
    }

    public function cleanup(string $id): void
    {
        Auth::requireAuth();
        if (!$this->validateCsrf()) {
            $this->redirect('/children/' . $id);
            return;
        }

        $child = (new Child())->find((int)$id);
        if (!$child) {
            $this->redirect('/children');
            return;
        }

        $db = \App\Core\Database::getInstance();
        $lang = Lang::getInstance();
        $cleaned = [];

        // Clean goals
        if ($this->input('clean_goals')) {
            $db->query("DELETE FROM child_goals WHERE child_id = ?", [$id]);
            $cleaned[] = $lang->t('goals');
        }

        // Clean transactions (and reset balance, levels)
        if ($this->input('clean_transactions')) {
            $db->query("DELETE FROM point_transactions WHERE child_id = ?", [$id]);
            $db->query("DELETE FROM child_level_history WHERE child_id = ?", [$id]);
            // Get level 1 ID (Beginner)
            $level1 = $db->query("SELECT id FROM levels WHERE level_number = 1 LIMIT 1")->fetch();
            $level1Id = $level1 ? $level1['id'] : null;
            $db->query("UPDATE children SET points_balance = 0, total_points_earned = 0, current_level_id = ? WHERE id = ?", [$level1Id, $id]);
            // Create initial level history for level 1
            if ($level1Id) {
                $db->query("INSERT INTO child_level_history (child_id, level_id, total_points_at_level, bonus_points_awarded) VALUES (?, ?, 0, 0)", [$id, $level1Id]);
            }
            $cleaned[] = $lang->t('transaction_history');
        }

        // Clean redemptions
        if ($this->input('clean_redemptions')) {
            $db->query("DELETE FROM reward_redemptions WHERE child_id = ?", [$id]);
            $cleaned[] = $lang->t('reward_redemptions');
        }

        // Clean streaks
        if ($this->input('clean_streaks')) {
            $db->query("DELETE FROM streaks WHERE child_id = ?", [$id]);
            $cleaned[] = $lang->t('streaks');
        }

        // Clean achievements
        if ($this->input('clean_achievements')) {
            $db->query("DELETE FROM child_achievements WHERE child_id = ?", [$id]);
            $cleaned[] = $lang->t('achievements');
        }

        // Clean wishlist
        if ($this->input('clean_wishlist')) {
            $db->query("DELETE FROM child_wishlists WHERE child_id = ?", [$id]);
            $cleaned[] = $lang->t('wishlist');
        }

        // Clean activity log
        if ($this->input('clean_activity')) {
            $db->query("DELETE FROM activity_log WHERE child_id = ?", [$id]);
            $cleaned[] = $lang->t('activity_log');
        }

        if (!empty($cleaned)) {
            $this->flash('success', $lang->t('cleanup_complete') . ': ' . implode(', ', $cleaned));
        }

        $this->redirect('/children/' . $id);
    }

    public function awardBonusChest(string $id): void
    {
        Auth::requireAuth();
        if (!$this->validateCsrf()) {
            $this->redirect('/children/' . $id);
            return;
        }

        $child = (new Child())->find((int)$id);
        if (!$child) {
            $this->redirect('/children');
            return;
        }

        $lang = Lang::getInstance();
        $reward = (int)$this->input('reward', 0);
        $multiplier = (float)$this->input('multiplier', 0);

        if ($reward <= 0 && $multiplier <= 1) {
            $this->flash('error', $lang->t('invalid_input'));
            $this->redirect('/children/' . $id);
            return;
        }

        $chestService = new ChestService();
        $result = $chestService->awardBonusChest((int)$id, $reward, $multiplier);

        if ($result['success']) {
            $this->flash('success', $lang->t('bonus_chest_awarded'));
        } else {
            $this->flash('error', $lang->t('error_occurred'));
        }

        $this->redirect('/children/' . $id);
    }

    public function cancelPendingChest(string $id, string $chestId): void
    {
        Auth::requireAuth();
        if (!$this->validateCsrf()) {
            $this->redirect('/children/' . $id);
            return;
        }

        $child = (new Child())->find((int)$id);
        if (!$child) {
            $this->redirect('/children');
            return;
        }

        $lang = Lang::getInstance();
        $chestService = new ChestService();
        $result = $chestService->cancelPendingChest((int)$chestId, (int)$id);

        if ($result) {
            $this->flash('success', $lang->t('pending_chest_cancelled'));
        } else {
            $this->flash('error', $lang->t('error_occurred'));
        }

        $this->redirect('/children/' . $id);
    }

    public function grantMultiplier(string $id): void
    {
        Auth::requireAuth();
        if (!$this->validateCsrf()) {
            $this->redirect('/children/' . $id);
            return;
        }

        $child = (new Child())->find((int)$id);
        if (!$child) {
            $this->redirect('/children');
            return;
        }

        $lang = Lang::getInstance();
        $multiplier = (float)$this->input('multiplier', 0);
        $duration = (int)$this->input('duration', 24);

        if ($multiplier < 1.5) {
            $this->flash('error', $lang->t('invalid_input'));
            $this->redirect('/children/' . $id);
            return;
        }

        // Cap duration at 168 hours (7 days)
        $duration = min(168, max(1, $duration));

        $chestService = new ChestService();
        $chestService->applyMultiplier((int)$id, $multiplier, 'admin_granted', $duration);

        $this->flash('success', $lang->t('multiplier_granted'));
        $this->redirect('/children/' . $id);
    }

    public function removeMultiplier(string $id): void
    {
        Auth::requireAuth();
        if (!$this->validateCsrf()) {
            $this->redirect('/children/' . $id);
            return;
        }

        $child = (new Child())->find((int)$id);
        if (!$child) {
            $this->redirect('/children');
            return;
        }

        $lang = Lang::getInstance();
        $chestService = new ChestService();
        $removed = $chestService->removeAllMultipliers((int)$id);

        if ($removed > 0) {
            $this->flash('success', $lang->t('multiplier_removed'));
        }

        $this->redirect('/children/' . $id);
    }

    private function handlePhotoUpload(array $file): ?string
    {
        $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowed)) return null;

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'child_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
        $destDir = __DIR__ . '/../../public/uploads/photos';
        $destPath = $destDir . '/' . $filename;

        if (!is_dir($destDir)) mkdir($destDir, 0755, true);

        if (function_exists('imagecreatefromstring')) {
            $src = imagecreatefromstring(file_get_contents($file['tmp_name']));
            if ($src) {
                $w = imagesx($src);
                $h = imagesy($src);
                $size = 300;
                $thumb = imagecreatetruecolor($size, $size);

                $scale = max($size / $w, $size / $h);
                $sw = (int)($size / $scale);
                $sh = (int)($size / $scale);
                $sx = (int)(($w - $sw) / 2);
                $sy = (int)(($h - $sh) / 2);

                imagecopyresampled($thumb, $src, 0, 0, $sx, $sy, $size, $size, $sw, $sh);
                imagejpeg($thumb, $destPath, 85);
                imagedestroy($src);
                imagedestroy($thumb);

                return 'uploads/photos/' . $filename;
            }
        }

        move_uploaded_file($file['tmp_name'], $destPath);
        return 'uploads/photos/' . $filename;
    }
}
