<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Core\Auth;
use App\Models\Child;
use App\Models\BehaviorCategory;
use App\Models\PointTransaction;
use App\Models\Setting;
use App\Services\PointService;

class PointController extends Controller
{
    public function create(string $childId): void
    {
        Auth::requireAuth();
        $child = (new Child())->find((int)$childId);
        if (!$child) {
            $this->redirect('/');
            return;
        }

        $categories = (new BehaviorCategory())->getActive();
        $positive = array_filter($categories, fn($c) => $c['type'] === 'positive');
        $negative = array_filter($categories, fn($c) => $c['type'] === 'negative');

        $this->render('points/create', [
            'child' => $child,
            'positive' => $positive,
            'negative' => $negative,
            'csrfToken' => $this->csrfToken(),
        ]);
    }

    public function store(): void
    {
        Auth::requireAuth();
        if (!$this->validateCsrf()) {
            $this->redirect('/');
            return;
        }

        $childId = (int)$this->input('child_id');
        $categoryId = $this->input('category_id');
        $note = $this->input('note');
        $image = $this->input('image') ?: null;
        $manualPoints = $this->input('manual_points');

        $service = new PointService();
        $lang = \App\Core\Lang::getInstance();

        if ($categoryId) {
            $service->awardPoints($childId, (int)$categoryId, $note, $image);
            $message = $lang->t('points_awarded');
            // Check if multiplier was applied
            if (!empty($_SESSION['points_multiplied'])) {
                $mp = $_SESSION['points_multiplied'];
                $message .= ' (' . $mp['multiplier'] . 'x ' . $lang->t('multiplied') . ': +' . $mp['bonus_points'] . ' ' . $lang->t('bonus') . ')';
                unset($_SESSION['points_multiplied']);
            }
            $this->flash('success', $message);
        } elseif ($manualPoints !== null && $manualPoints !== '') {
            $service->adjustPoints($childId, (int)$manualPoints, $note ?: 'Manual adjustment', $image);
            $message = $lang->t('points_awarded');
            // Check if multiplier was applied
            if (!empty($_SESSION['points_multiplied'])) {
                $mp = $_SESSION['points_multiplied'];
                $message .= ' (' . $mp['multiplier'] . 'x ' . $lang->t('multiplied') . ': +' . $mp['bonus_points'] . ' ' . $lang->t('bonus') . ')';
                unset($_SESSION['points_multiplied']);
            }
            $this->flash('success', $message);
        }

        $redirect = $this->input('redirect', '/children/' . $childId);
        $this->redirect($redirect);
    }

    public function history(): void
    {
        Auth::requireAuth();

        $page = max(1, (int)$this->input('page', 1));
        $perPage = 20;
        $filters = [
            'child_id' => $this->input('child_id'),
            'category_id' => $this->input('category_id'),
            'type' => $this->input('type'),
            'date_from' => $this->input('date_from'),
            'date_to' => $this->input('date_to'),
        ];
        $filters = array_filter($filters);

        $txModel = new PointTransaction();
        $total = $txModel->countFiltered($filters);
        $transactions = $txModel->getFiltered($filters, $perPage, ($page - 1) * $perPage);

        $children = (new Child())->findAll('name ASC');
        $categories = (new BehaviorCategory())->findAll('sort_order ASC');
        $settings = (new Setting())->getAll();

        $this->render('points/history', [
            'transactions' => $transactions,
            'children' => $children,
            'categories' => $categories,
            'filters' => $filters,
            'page' => $page,
            'totalPages' => max(1, ceil($total / $perPage)),
            'settings' => $settings,
            'csrfToken' => $this->csrfToken(),
        ]);
    }
}
