<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Core\Auth;
use App\Models\Child;
use App\Models\PointTransaction;
use App\Models\RewardRedemption;
use App\Models\Setting;
use App\Services\PositivityService;

class DashboardController extends Controller
{
    public function index(): void
    {
        Auth::requireAuth();

        $childModel = new Child();
        $children = $childModel->getWithStats();
        $settings = (new Setting())->getAll();
        $recentTransactions = (new PointTransaction())->getRecent(10);
        $pendingRedemptions = (new RewardRedemption())->countPending();

        $totalPointsToday = 0;
        $db = \App\Core\Database::getInstance();
        // Exclude refunds from daily earned count
        $row = $db->query("SELECT COALESCE(SUM(points), 0) as total FROM point_transactions WHERE DATE(transaction_date) = CURDATE() AND points > 0 AND type != 'refund'")->fetch();
        $totalPointsToday = (int)$row['total'];

        // Get positivity stats for all children
        $childIds = array_column($children, 'id');
        $positivityService = new PositivityService();
        $positivityStats = $positivityService->getPositivityStatsForChildren($childIds);

        $this->render('dashboard/index', [
            'children' => $children,
            'recentTransactions' => $recentTransactions,
            'settings' => $settings,
            'pointsPerLari' => (int)($settings['points_per_lari'] ?? 10),
            'currencySymbol' => $settings['currency_symbol'] ?? '₾',
            'totalChildren' => count($children),
            'totalPointsToday' => $totalPointsToday,
            'pendingRedemptions' => $pendingRedemptions,
            'positivityStats' => $positivityStats,
            'csrfToken' => $this->csrfToken(),
        ]);
    }
}
