<?php
namespace App\Services;

use App\Core\Database;

class SummaryService
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function getWeeklySummary(int $childId): array
    {
        $thisWeekStart = date('Y-m-d', strtotime('monday this week'));
        $thisWeekEnd = date('Y-m-d', strtotime('sunday this week'));
        $lastWeekStart = date('Y-m-d', strtotime('monday last week'));
        $lastWeekEnd = date('Y-m-d', strtotime('sunday last week'));

        $thisWeek = $this->getWeekStats($childId, $thisWeekStart, $thisWeekEnd);
        $lastWeek = $this->getWeekStats($childId, $lastWeekStart, $lastWeekEnd);

        $earnedChange = $thisWeek['earned'] - $lastWeek['earned'];
        $spentChange = $thisWeek['spent'] - $lastWeek['spent'];

        $bestDay = $this->getBestDayThisWeek($childId, $thisWeekStart, $thisWeekEnd);

        return [
            'this_week' => [
                'earned' => $thisWeek['earned'],
                'spent' => $thisWeek['spent'],
                'net' => $thisWeek['earned'] - $thisWeek['spent'],
                'transactions' => $thisWeek['transactions']
            ],
            'last_week' => [
                'earned' => $lastWeek['earned'],
                'spent' => $lastWeek['spent'],
                'net' => $lastWeek['earned'] - $lastWeek['spent'],
                'transactions' => $lastWeek['transactions']
            ],
            'comparison' => [
                'earned_change' => $earnedChange,
                'earned_trend' => $earnedChange > 0 ? 'up' : ($earnedChange < 0 ? 'down' : 'same'),
                'spent_change' => $spentChange,
                'spent_trend' => $spentChange > 0 ? 'up' : ($spentChange < 0 ? 'down' : 'same')
            ],
            'best_day' => $bestDay
        ];
    }

    private function getWeekStats(int $childId, string $startDate, string $endDate): array
    {
        // Earned: positive points, excluding refunds (refunds restore spent points, not earnings)
        // Spent: negative points (redemptions, deductions), minus any refunds
        $result = $this->db->query(
            "SELECT
                COALESCE(SUM(CASE WHEN points > 0 AND type != 'refund' THEN points ELSE 0 END), 0) as earned,
                COALESCE(SUM(CASE WHEN points < 0 THEN ABS(points) ELSE 0 END), 0) as spent_raw,
                COALESCE(SUM(CASE WHEN type = 'refund' THEN points ELSE 0 END), 0) as refunded,
                COUNT(*) as transactions
             FROM point_transactions
             WHERE child_id = ? AND DATE(transaction_date) BETWEEN ? AND ?",
            [$childId, $startDate, $endDate]
        )->fetch();

        // Spent = raw spent - refunded (refunds reduce the spent amount)
        $spent = max(0, (int)$result['spent_raw'] - (int)$result['refunded']);

        return [
            'earned' => (int)$result['earned'],
            'spent' => $spent,
            'transactions' => (int)$result['transactions']
        ];
    }

    private function getBestDayThisWeek(int $childId, string $startDate, string $endDate): ?array
    {
        // Exclude refunds from "best day" calculation - only count actual earnings
        $result = $this->db->query(
            "SELECT DATE(transaction_date) as day,
                    SUM(CASE WHEN points > 0 AND type != 'refund' THEN points ELSE 0 END) as earned
             FROM point_transactions
             WHERE child_id = ? AND DATE(transaction_date) BETWEEN ? AND ? AND points > 0 AND type != 'refund'
             GROUP BY DATE(transaction_date)
             ORDER BY earned DESC
             LIMIT 1",
            [$childId, $startDate, $endDate]
        )->fetch();

        if (!$result || !$result['earned']) {
            return null;
        }

        // Return day key for translation (Monday -> day_monday)
        $dayKey = 'day_' . strtolower(date('l', strtotime($result['day'])));

        return [
            'date' => $result['day'],
            'day_key' => $dayKey,
            'earned' => (int)$result['earned']
        ];
    }

}
