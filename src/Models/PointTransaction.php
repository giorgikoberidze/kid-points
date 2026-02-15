<?php
namespace App\Models;

use App\Core\Model;

class PointTransaction extends Model
{
    protected string $table = 'point_transactions';

    public function getForChild(int $childId, array $filters = [], int $limit = 20, int $offset = 0): array
    {
        $where = ['pt.child_id = ?'];
        $params = [$childId];
        $this->applyFilters($where, $params, $filters);

        $sql = "SELECT pt.*, bc.name as category_name, bc.name_ka as category_name_ka, bc.icon as category_icon,
                       r.name as reward_name, r.name_ka as reward_name_ka
                FROM point_transactions pt
                LEFT JOIN behavior_categories bc ON pt.category_id = bc.id
                LEFT JOIN reward_redemptions rr ON pt.id = rr.transaction_id
                LEFT JOIN rewards r ON rr.reward_id = r.id
                WHERE " . implode(' AND ', $where) . "
                ORDER BY pt.transaction_date DESC
                LIMIT {$limit} OFFSET {$offset}";
        return $this->db->query($sql, $params)->fetchAll();
    }

    public function getRecent(int $limit = 10): array
    {
        return $this->db->query("
            SELECT pt.*, COALESCE(c.nickname, c.name) as child_name, bc.name as category_name, bc.name_ka as category_name_ka, bc.icon as category_icon,
                   r.name as reward_name, r.name_ka as reward_name_ka
            FROM point_transactions pt
            JOIN children c ON pt.child_id = c.id
            LEFT JOIN behavior_categories bc ON pt.category_id = bc.id
            LEFT JOIN reward_redemptions rr ON pt.id = rr.transaction_id
            LEFT JOIN rewards r ON rr.reward_id = r.id
            ORDER BY pt.transaction_date DESC
            LIMIT {$limit}
        ")->fetchAll();
    }

    public function getFiltered(array $filters = [], int $limit = 20, int $offset = 0): array
    {
        $where = ['1=1'];
        $params = [];
        $this->applyFilters($where, $params, $filters);

        return $this->db->query("
            SELECT pt.*, COALESCE(c.nickname, c.name) as child_name, bc.name as category_name, bc.name_ka as category_name_ka, bc.icon as category_icon,
                   r.name as reward_name, r.name_ka as reward_name_ka
            FROM point_transactions pt
            JOIN children c ON pt.child_id = c.id
            LEFT JOIN behavior_categories bc ON pt.category_id = bc.id
            LEFT JOIN reward_redemptions rr ON pt.id = rr.transaction_id
            LEFT JOIN rewards r ON rr.reward_id = r.id
            WHERE " . implode(' AND ', $where) . "
            ORDER BY pt.transaction_date DESC
            LIMIT {$limit} OFFSET {$offset}
        ", $params)->fetchAll();
    }

    public function countFiltered(array $filters = []): int
    {
        $where = ['1=1'];
        $params = [];
        $this->applyFilters($where, $params, $filters);

        return (int)$this->db->query("
            SELECT COUNT(*) as cnt FROM point_transactions pt WHERE " . implode(' AND ', $where),
            $params
        )->fetch()['cnt'];
    }

    private function applyFilters(array &$where, array &$params, array $filters): void
    {
        if (!empty($filters['child_id'])) {
            $where[] = 'pt.child_id = ?';
            $params[] = $filters['child_id'];
        }
        if (!empty($filters['category_id'])) {
            $where[] = 'pt.category_id = ?';
            $params[] = $filters['category_id'];
        }
        if (!empty($filters['type'])) {
            $where[] = 'pt.type = ?';
            $params[] = $filters['type'];
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
