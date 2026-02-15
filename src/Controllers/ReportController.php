<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Core\Auth;
use App\Models\Child;
use App\Models\Setting;
use App\Services\ReportService;

class ReportController extends Controller
{
    public function index(): void
    {
        Auth::requireAuth();

        $filters = [
            'child_id' => $this->input('child_id'),
            'date_from' => $this->input('date_from'),
            'date_to' => $this->input('date_to'),
        ];
        $filters = array_filter($filters);

        $service = new ReportService();
        $summary = $service->getSummary($filters);
        $pointsOverTime = $service->getPointsOverTime($filters);
        $byCategory = $service->getPointsByCategory($filters);
        $childComparison = $service->getChildComparison($filters);

        $children = (new Child())->findAll('name ASC');
        $settings = (new Setting())->getAll();

        $this->render('reports/index', [
            'summary' => $summary,
            'chartData' => json_encode([
                'pointsOverTime' => $pointsOverTime,
                'byCategory' => $byCategory,
                'childComparison' => $childComparison,
            ]),
            'children' => $children,
            'filters' => $filters,
            'settings' => $settings,
            'pointsPerLari' => (int)($settings['points_per_lari'] ?? 10),
            'currencySymbol' => $settings['currency_symbol'] ?? '₾',
            'csrfToken' => $this->csrfToken(),
        ]);
    }

    public function exportCsv(): void
    {
        Auth::requireAuth();

        $filters = [
            'child_id' => $this->input('child_id'),
            'date_from' => $this->input('date_from'),
            'date_to' => $this->input('date_to'),
        ];
        $filters = array_filter($filters);

        $csv = (new ReportService())->exportCsv($filters);

        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="kid-points-report-' . date('Y-m-d') . '.csv"');
        echo $csv;
        exit;
    }
}
