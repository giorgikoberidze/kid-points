<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Core\Auth;
use App\Models\Reward;
use App\Models\RewardRedemption;
use App\Models\Child;
use App\Models\Setting;
use App\Services\PointService;

class RewardController extends Controller
{
    public function index(): void
    {
        Auth::requireAuth();
        $rewards = (new Reward())->findAll('point_cost ASC');
        $redemptions = (new RewardRedemption())->getRecent(20);
        $children = (new Child())->findAll('name ASC');
        $settings = (new Setting())->getAll();

        $this->render('rewards/index', [
            'rewards' => $rewards,
            'redemptions' => $redemptions,
            'children' => $children,
            'settings' => $settings,
            'csrfToken' => $this->csrfToken(),
        ]);
    }

    public function create(): void
    {
        Auth::requireAuth();
        $this->render('rewards/create', [
            'csrfToken' => $this->csrfToken(),
        ]);
    }

    public function store(): void
    {
        Auth::requireAuth();
        if (!$this->validateCsrf()) {
            $this->redirect('/rewards');
            return;
        }

        (new Reward())->create([
            'name' => $this->input('name'),
            'name_ka' => $this->input('name_ka') ?: null,
            'description' => $this->input('description'),
            'description_ka' => $this->input('description_ka') ?: null,
            'point_cost' => (int)$this->input('point_cost'),
            'money_value' => $this->input('money_value') ?: null,
            'icon' => $this->input('icon', 'bi-gift'),
            'is_active' => $this->input('is_active') ? 1 : 0,
        ]);

        $this->flash('success', \App\Core\Lang::getInstance()->t('reward_created'));
        $this->redirect('/rewards');
    }

    public function edit(string $id): void
    {
        Auth::requireAuth();
        $reward = (new Reward())->find((int)$id);
        if (!$reward) {
            $this->redirect('/rewards');
            return;
        }
        $this->render('rewards/edit', [
            'reward' => $reward,
            'csrfToken' => $this->csrfToken(),
        ]);
    }

    public function update(string $id): void
    {
        Auth::requireAuth();
        if (!$this->validateCsrf()) {
            $this->redirect('/rewards');
            return;
        }

        (new Reward())->update((int)$id, [
            'name' => $this->input('name'),
            'name_ka' => $this->input('name_ka') ?: null,
            'description' => $this->input('description'),
            'description_ka' => $this->input('description_ka') ?: null,
            'point_cost' => (int)$this->input('point_cost'),
            'money_value' => $this->input('money_value') ?: null,
            'icon' => $this->input('icon', 'bi-gift'),
            'is_active' => $this->input('is_active') ? 1 : 0,
        ]);

        $this->flash('success', \App\Core\Lang::getInstance()->t('reward_updated'));
        $this->redirect('/rewards');
    }

    public function redeem(): void
    {
        Auth::requireAuth();
        if (!$this->validateCsrf()) {
            $this->redirect('/rewards');
            return;
        }

        $childId = (int)$this->input('child_id');
        $rewardId = (int)$this->input('reward_id');
        $lang = \App\Core\Lang::getInstance();

        $result = (new PointService())->redeemReward($childId, $rewardId);
        if ($result) {
            $this->flash('success', $lang->t('reward_redeemed'));
        } else {
            $this->flash('danger', $lang->t('not_enough_points'));
        }

        $this->redirect('/rewards');
    }

    public function fulfill(string $id): void
    {
        Auth::requireAuth();
        if (!$this->validateCsrf()) {
            $this->redirect('/rewards');
            return;
        }

        $db = \App\Core\Database::getInstance();
        $db->query("UPDATE reward_redemptions SET status = 'fulfilled' WHERE id = ?", [(int)$id]);
        $this->flash('success', \App\Core\Lang::getInstance()->t('reward_fulfilled'));
        $this->redirect('/rewards');
    }
}
