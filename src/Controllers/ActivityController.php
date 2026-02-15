<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Core\Auth;
use App\Core\Lang;
use App\Models\ActivityLog;
use App\Models\Child;
use App\Services\ActivityService;

class ActivityController extends Controller
{
    public function index(): void
    {
        Auth::requireAuth();

        $page = max(1, (int)$this->input('page', 1));
        $perPage = 20;
        $offset = ($page - 1) * $perPage;

        $filters = [];
        $childId = $this->input('child_id');
        if ($childId) {
            $filters['child_id'] = (int)$childId;
        }

        $action = $this->input('action');
        if ($action) {
            $filters['action'] = $action;
        }

        $actorType = $this->input('actor_type');
        if ($actorType) {
            $filters['actor_type'] = $actorType;
        }

        $dateFrom = $this->input('date_from');
        if ($dateFrom) {
            $filters['date_from'] = $dateFrom;
        }

        $dateTo = $this->input('date_to');
        if ($dateTo) {
            $filters['date_to'] = $dateTo;
        }

        $logModel = new ActivityLog();
        $activities = $logModel->getFiltered($filters, $perPage, $offset);
        $totalCount = $logModel->countFiltered($filters);
        $totalPages = ceil($totalCount / $perPage);

        $children = (new Child())->findAll('COALESCE(nickname, name) ASC');
        $distinctActions = $logModel->getDistinctActions();

        $activityService = new ActivityService();
        $lang = Lang::getInstance();

        $this->render('activity/index', [
            'activities' => $activities,
            'children' => $children,
            'distinctActions' => $distinctActions,
            'filters' => $filters,
            'currentPage' => $page,
            'totalPages' => $totalPages,
            'totalCount' => $totalCount,
            'activityService' => $activityService,
            'locale' => $lang->getLocale(),
        ]);
    }
}
