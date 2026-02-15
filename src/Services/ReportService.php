<?php
namespace App\Services;

use App\Core\Database;

class ReportService
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function getSummary(array $filters): array
    {
        $where = ['1=1'];
        $params = [];
        $this->applyFilters($where, $params, $filters);

        // Exclude refunds from earned (refunds restore spent points, not earnings)
        // Deducted includes redemptions; refunds reduce the effective spent amount
        $row = $this->db->query("
            SELECT
                COALESCE(SUM(CASE WHEN points > 0 AND type != 'refund' THEN points ELSE 0 END), 0) as total_earned,
                COALESCE(SUM(CASE WHEN points < 0 THEN points ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN type = 'refund' THEN points ELSE 0 END), 0) as total_deducted,
                COALESCE(SUM(points), 0) as net,
                COUNT(*) as tx_count
            FROM point_transactions pt
            WHERE " . implode(' AND ', $where),
            $params
        )->fetch();
        return $row;
    }

    public function getPointsOverTime(array $filters): array
    {
        $where = ['1=1'];
        $params = [];
        $this->applyFilters($where, $params, $filters);

        $rows = $this->db->query("
            SELECT DATE(transaction_date) as day, SUM(points) as total
            FROM point_transactions pt
            WHERE " . implode(' AND ', $where) . "
            GROUP BY DATE(transaction_date)
            ORDER BY day
        ", $params)->fetchAll();

        return [
            'labels' => array_column($rows, 'day'),
            'data' => array_map('intval', array_column($rows, 'total')),
        ];
    }

    public function getPointsByCategory(array $filters): array
    {
        $where = ['1=1'];
        $params = [];
        $this->applyFilters($where, $params, $filters);

        $rows = $this->db->query("
            SELECT bc.name, ABS(SUM(pt.points)) as total
            FROM point_transactions pt
            JOIN behavior_categories bc ON pt.category_id = bc.id
            WHERE " . implode(' AND ', $where) . "
            GROUP BY bc.id, bc.name
            ORDER BY total DESC
        ", $params)->fetchAll();

        return [
            'labels' => array_column($rows, 'name'),
            'data' => array_map('intval', array_column($rows, 'total')),
        ];
    }

    public function getChildComparison(array $filters): array
    {
        $where = ['1=1'];
        $params = [];
        if (!empty($filters['date_from'])) {
            $where[] = 'pt.transaction_date >= ?';
            $params[] = $filters['date_from'] . ' 00:00:00';
        }
        if (!empty($filters['date_to'])) {
            $where[] = 'pt.transaction_date <= ?';
            $params[] = $filters['date_to'] . ' 23:59:59';
        }

        $rows = $this->db->query("
            SELECT COALESCE(c.nickname, c.name) as name, COALESCE(SUM(pt.points), 0) as total
            FROM children c
            LEFT JOIN point_transactions pt ON c.id = pt.child_id AND " . implode(' AND ', $where) . "
            GROUP BY c.id, COALESCE(c.nickname, c.name)
            ORDER BY total DESC
        ", $params)->fetchAll();

        return [
            'labels' => array_column($rows, 'name'),
            'data' => array_map('intval', array_column($rows, 'total')),
        ];
    }

    public function exportCsv(array $filters): string
    {
        $where = ['1=1'];
        $params = [];
        $this->applyFilters($where, $params, $filters);

        $rows = $this->db->query("
            SELECT pt.transaction_date, COALESCE(c.nickname, c.name) as child_name, bc.name as category_name,
                   pt.type, pt.points, pt.note
            FROM point_transactions pt
            JOIN children c ON pt.child_id = c.id
            LEFT JOIN behavior_categories bc ON pt.category_id = bc.id
            WHERE " . implode(' AND ', $where) . "
            ORDER BY pt.transaction_date DESC
        ", $params)->fetchAll();

        $output = "Date,Child,Category,Type,Points,Note\n";
        foreach ($rows as $row) {
            $output .= sprintf(
                "%s,%s,%s,%s,%d,%s\n",
                $row['transaction_date'],
                '"' . str_replace('"', '""', $row['child_name']) . '"',
                '"' . str_replace('"', '""', $row['category_name'] ?? '') . '"',
                $row['type'],
                $row['points'],
                '"' . str_replace('"', '""', $row['note'] ?? '') . '"'
            );
        }
        return $output;
    }

    private function applyFilters(array &$where, array &$params, array $filters): void
    {
        if (!empty($filters['child_id'])) {
            $where[] = 'pt.child_id = ?';
            $params[] = $filters['child_id'];
        }
        if (!empty($filters['date_from'])) {
            $where[] = 'pt.transaction_date >= ?';
            $params[] = $filters['date_from'] . ' 00:00:00';
        }
        if (!empty($filters['date_to'])) {
            $where[] = 'pt.transaction_date <= ?';
            $params[] = $filters['date_to'] . ' 23:59:59';
        }
    }
}
