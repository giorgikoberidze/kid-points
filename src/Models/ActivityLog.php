<?php
namespace App\Models;

use App\Core\Model;

class ActivityLog extends Model
{
    protected string $table = 'activity_log';

    public function log(
        string $actorType,
        ?int $actorId,
        ?int $childId,
        string $action,
        string $entityType,
        ?int $entityId = null,
        ?array $details = null
    ): int {
        return $this->create([
            'actor_type' => $actorType,
            'actor_id' => $actorId,
            'child_id' => $childId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'details' => $details ? json_encode($details) : null
        ]);
    }

    public function getFiltered(array $filters = [], int $limit = 20, int $offset = 0): array
    {
        $where = [];
        $params = [];

        if (!empty($filters['child_id'])) {
            $where[] = 'al.child_id = ?';
            $params[] = $filters['child_id'];
        }

        if (!empty($filters['action'])) {
            $where[] = 'al.action = ?';
            $params[] = $filters['action'];
        }

        if (!empty($filters['actor_type'])) {
            $where[] = 'al.actor_type = ?';
            $params[] = $filters['actor_type'];
        }

        if (!empty($filters['date_from'])) {
            $where[] = 'al.created_at >= ?';
            $params[] = $filters['date_from'] . ' 00:00:00';
        }

        if (!empty($filters['date_to'])) {
            $where[] = 'al.created_at <= ?';
            $params[] = $filters['date_to'] . ' 23:59:59';
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "SELECT al.*, c.nickname as child_name, c.name as child_full_name
                FROM activity_log al
                LEFT JOIN children c ON al.child_id = c.id
                {$whereClause}
                ORDER BY al.created_at DESC
                LIMIT ? OFFSET ?";

        $params[] = $limit;
        $params[] = $offset;

        return $this->db->query($sql, $params)->fetchAll();
    }

    public function countFiltered(array $filters = []): int
    {
        $where = [];
        $params = [];

        if (!empty($filters['child_id'])) {
            $where[] = 'child_id = ?';
            $params[] = $filters['child_id'];
        }

        if (!empty($filters['action'])) {
            $where[] = 'action = ?';
            $params[] = $filters['action'];
        }

        if (!empty($filters['actor_type'])) {
            $where[] = 'actor_type = ?';
            $params[] = $filters['actor_type'];
        }

        if (!empty($filters['date_from'])) {
            $where[] = 'created_at >= ?';
            $params[] = $filters['date_from'] . ' 00:00:00';
        }

        if (!empty($filters['date_to'])) {
            $where[] = 'created_at <= ?';
            $params[] = $filters['date_to'] . ' 23:59:59';
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $result = $this->db->query(
            "SELECT COUNT(*) as cnt FROM activity_log {$whereClause}",
            $params
        )->fetch();

        return (int)$result['cnt'];
    }

    public function getForChild(int $childId, int $limit = 10): array
    {
        return $this->db->query(
            "SELECT * FROM activity_log WHERE child_id = ? ORDER BY created_at DESC LIMIT ?",
            [$childId, $limit]
        )->fetchAll();
    }

    public function getDistinctActions(): array
    {
        $results = $this->db->query(
            "SELECT DISTINCT action FROM activity_log ORDER BY action"
        )->fetchAll();
        return array_column($results, 'action');
    }
}
