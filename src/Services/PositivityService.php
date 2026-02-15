<?php
namespace App\Services;

use App\Core\Database;

class PositivityService
{
    private Database $db;

    private const THRESHOLD = 50; // Minimum total points before calculating
    private const TREND_THRESHOLD = 5.0; // Percentage change to show trend

    // Positivity levels with their ranges, emojis, colors, and labels
    private const LEVELS = [
        ['min' => 95, 'max' => 100, 'level' => 'perfect',    'emoji' => '🌟', 'color' => '#fbbf24', 'label' => 'positivity_perfect'],
        ['min' => 90, 'max' => 95,  'level' => 'amazing',    'emoji' => '🤩', 'color' => '#14b8a6', 'label' => 'positivity_amazing'],
        ['min' => 80, 'max' => 90,  'level' => 'excellent',  'emoji' => '😄', 'color' => '#22c55e', 'label' => 'positivity_excellent'],
        ['min' => 70, 'max' => 80,  'level' => 'great',      'emoji' => '😊', 'color' => '#84cc16', 'label' => 'positivity_great'],
        ['min' => 60, 'max' => 70,  'level' => 'good',       'emoji' => '🙂', 'color' => '#eab308', 'label' => 'positivity_good'],
        ['min' => 50, 'max' => 60,  'level' => 'acceptable', 'emoji' => '😕', 'color' => '#f97316', 'label' => 'positivity_acceptable'],
        ['min' => 0,  'max' => 50,  'level' => 'critical',   'emoji' => '😢', 'color' => '#ef4444', 'label' => 'positivity_critical'],
    ];

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Get positivity stats for a child
     */
    public function getPositivityStats(int $childId): array
    {
        // Get total positive and negative points
        $stats = $this->db->query(
            "SELECT
                COALESCE(SUM(CASE WHEN points > 0 THEN points ELSE 0 END), 0) as total_positive,
                COALESCE(ABS(SUM(CASE WHEN points < 0 THEN points ELSE 0 END)), 0) as total_negative
            FROM point_transactions
            WHERE child_id = ?",
            [$childId]
        )->fetch();

        $totalPositive = (int)$stats['total_positive'];
        $totalNegative = (int)$stats['total_negative'];
        $totalPoints = $totalPositive + $totalNegative;

        // Check if below threshold
        if ($totalPoints < self::THRESHOLD) {
            return [
                'total_positive' => $totalPositive,
                'total_negative' => $totalNegative,
                'total_points' => $totalPoints,
                'percentage' => null,
                'level' => 'neutral',
                'emoji' => '😐',
                'color' => '#9ca3af',
                'label' => 'positivity_neutral',
                'trend' => null,
                'trend_change' => null,
            ];
        }

        // Calculate percentage
        $percentage = ($totalPositive / $totalPoints) * 100;

        // Determine level
        $levelData = $this->getLevelData($percentage);

        // Calculate trend
        $trend = $this->calculateTrend($childId, $percentage);

        return [
            'total_positive' => $totalPositive,
            'total_negative' => $totalNegative,
            'total_points' => $totalPoints,
            'percentage' => round($percentage, 1),
            'level' => $levelData['level'],
            'emoji' => $levelData['emoji'],
            'color' => $levelData['color'],
            'label' => $levelData['label'],
            'trend' => $trend['trend'],
            'trend_change' => $trend['change'],
        ];
    }

    /**
     * Get positivity stats for multiple children (optimized for dashboard/list)
     */
    public function getPositivityStatsForChildren(array $childIds): array
    {
        if (empty($childIds)) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($childIds), '?'));

        // Current stats
        $currentStats = $this->db->query(
            "SELECT
                child_id,
                COALESCE(SUM(CASE WHEN points > 0 THEN points ELSE 0 END), 0) as total_positive,
                COALESCE(ABS(SUM(CASE WHEN points < 0 THEN points ELSE 0 END)), 0) as total_negative
            FROM point_transactions
            WHERE child_id IN ({$placeholders})
            GROUP BY child_id",
            $childIds
        )->fetchAll();

        // Last week stats for trend
        $weekAgo = date('Y-m-d H:i:s', strtotime('-7 days'));
        $lastWeekStats = $this->db->query(
            "SELECT
                child_id,
                COALESCE(SUM(CASE WHEN points > 0 THEN points ELSE 0 END), 0) as total_positive,
                COALESCE(ABS(SUM(CASE WHEN points < 0 THEN points ELSE 0 END)), 0) as total_negative
            FROM point_transactions
            WHERE child_id IN ({$placeholders}) AND transaction_date < ?
            GROUP BY child_id",
            [...$childIds, $weekAgo]
        )->fetchAll();

        // Index last week stats by child_id
        $lastWeekByChild = [];
        foreach ($lastWeekStats as $stat) {
            $lastWeekByChild[$stat['child_id']] = $stat;
        }

        // Build results
        $results = [];
        foreach ($currentStats as $stat) {
            $childId = $stat['child_id'];
            $totalPositive = (int)$stat['total_positive'];
            $totalNegative = (int)$stat['total_negative'];
            $totalPoints = $totalPositive + $totalNegative;

            if ($totalPoints < self::THRESHOLD) {
                $results[$childId] = [
                    'total_positive' => $totalPositive,
                    'total_negative' => $totalNegative,
                    'total_points' => $totalPoints,
                    'percentage' => null,
                    'level' => 'neutral',
                    'emoji' => '😐',
                    'color' => '#9ca3af',
                    'label' => 'positivity_neutral',
                    'trend' => null,
                    'trend_change' => null,
                ];
                continue;
            }

            $percentage = ($totalPositive / $totalPoints) * 100;
            $levelData = $this->getLevelData($percentage);

            // Calculate trend from last week data
            $trend = ['trend' => null, 'change' => null];
            if (isset($lastWeekByChild[$childId])) {
                $lwPositive = (int)$lastWeekByChild[$childId]['total_positive'];
                $lwNegative = (int)$lastWeekByChild[$childId]['total_negative'];
                $lwTotal = $lwPositive + $lwNegative;
                if ($lwTotal >= self::THRESHOLD) {
                    $lwPercentage = ($lwPositive / $lwTotal) * 100;
                    $change = $percentage - $lwPercentage;
                    $trend = [
                        'trend' => $change >= self::TREND_THRESHOLD ? 'up' : ($change <= -self::TREND_THRESHOLD ? 'down' : 'stable'),
                        'change' => round($change, 1),
                    ];
                }
            }

            $results[$childId] = [
                'total_positive' => $totalPositive,
                'total_negative' => $totalNegative,
                'total_points' => $totalPoints,
                'percentage' => round($percentage, 1),
                'level' => $levelData['level'],
                'emoji' => $levelData['emoji'],
                'color' => $levelData['color'],
                'label' => $levelData['label'],
                'trend' => $trend['trend'],
                'trend_change' => $trend['change'],
            ];
        }

        // Fill in missing children (no transactions)
        foreach ($childIds as $id) {
            if (!isset($results[$id])) {
                $results[$id] = [
                    'total_positive' => 0,
                    'total_negative' => 0,
                    'total_points' => 0,
                    'percentage' => null,
                    'level' => 'neutral',
                    'emoji' => '😐',
                    'color' => '#9ca3af',
                    'label' => 'positivity_neutral',
                    'trend' => null,
                    'trend_change' => null,
                ];
            }
        }

        return $results;
    }

    /**
     * Get level data based on percentage
     */
    private function getLevelData(float $percentage): array
    {
        foreach (self::LEVELS as $level) {
            if ($percentage >= $level['min'] && $percentage < $level['max']) {
                return $level;
            }
        }
        // 100% exactly falls into perfect
        return self::LEVELS[0];
    }

    /**
     * Calculate trend compared to last week
     */
    private function calculateTrend(int $childId, float $currentPercentage): array
    {
        $weekAgo = date('Y-m-d H:i:s', strtotime('-7 days'));

        // Get stats from before last week
        $lastWeekStats = $this->db->query(
            "SELECT
                COALESCE(SUM(CASE WHEN points > 0 THEN points ELSE 0 END), 0) as total_positive,
                COALESCE(ABS(SUM(CASE WHEN points < 0 THEN points ELSE 0 END)), 0) as total_negative
            FROM point_transactions
            WHERE child_id = ? AND transaction_date < ?",
            [$childId, $weekAgo]
        )->fetch();

        $lwPositive = (int)$lastWeekStats['total_positive'];
        $lwNegative = (int)$lastWeekStats['total_negative'];
        $lwTotal = $lwPositive + $lwNegative;

        // Not enough data from last week
        if ($lwTotal < self::THRESHOLD) {
            return ['trend' => null, 'change' => null];
        }

        $lwPercentage = ($lwPositive / $lwTotal) * 100;
        $change = $currentPercentage - $lwPercentage;

        if ($change >= self::TREND_THRESHOLD) {
            return ['trend' => 'up', 'change' => round($change, 1)];
        } elseif ($change <= -self::TREND_THRESHOLD) {
            return ['trend' => 'down', 'change' => round($change, 1)];
        }

        return ['trend' => 'stable', 'change' => round($change, 1)];
    }
}
