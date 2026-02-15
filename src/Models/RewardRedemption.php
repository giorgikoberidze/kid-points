<?php
namespace App\Models;

use App\Core\Model;

class RewardRedemption extends Model
{
    protected string $table = 'reward_redemptions';

    public function getForChild(int $childId): array
    {
        return $this->db->query("
            SELECT rr.*, r.name as reward_name, r.name_ka as reward_name_ka, r.icon as reward_icon
            FROM reward_redemptions rr
            JOIN rewards r ON rr.reward_id = r.id
            WHERE rr.child_id = ?
            ORDER BY rr.created_at DESC
        ", [$childId])->fetchAll();
    }

    public function getRecent(int $limit = 10): array
    {
        return $this->db->query("
            SELECT rr.*, r.name as reward_name, r.name_ka as reward_name_ka, COALESCE(c.nickname, c.name) as child_name
            FROM reward_redemptions rr
            JOIN rewards r ON rr.reward_id = r.id
            JOIN children c ON rr.child_id = c.id
            ORDER BY rr.created_at DESC
            LIMIT {$limit}
        ")->fetchAll();
    }

    public function countPending(): int
    {
        return (int)$this->db->query("SELECT COUNT(*) as cnt FROM reward_redemptions WHERE status = 'pending'")->fetch()['cnt'];
    }

    public function getForChildWithDetails(int $childId, int $limit = 50, int $offset = 0): array
    {
        return $this->db->query("
            SELECT rr.*, r.name as reward_name, r.name_ka as reward_name_ka, r.icon as reward_icon,
                   r.point_cost, r.money_value
            FROM reward_redemptions rr
            JOIN rewards r ON rr.reward_id = r.id
            WHERE rr.child_id = ?
            ORDER BY rr.created_at DESC
            LIMIT ? OFFSET ?
        ", [$childId, $limit, $offset])->fetchAll();
    }

    public function getPendingForChild(int $childId): array
    {
        return $this->db->query("
            SELECT rr.*, r.name as reward_name, r.name_ka as reward_name_ka, r.icon as reward_icon,
                   r.point_cost, r.money_value
            FROM reward_redemptions rr
            JOIN rewards r ON rr.reward_id = r.id
            WHERE rr.child_id = ? AND rr.status = 'pending'
            ORDER BY rr.created_at DESC
        ", [$childId])->fetchAll();
    }

    public function canCancel(int $redemptionId, int $childId): bool
    {
        $redemption = $this->db->query(
            "SELECT * FROM reward_redemptions WHERE id = ? AND child_id = ?",
            [$redemptionId, $childId]
        )->fetch();

        return $redemption && $redemption['status'] === 'pending';
    }

    public function countForChild(int $childId, array $filters = []): int
    {
        $where = 'child_id = ?';
        $params = [$childId];

        if (!empty($filters['status'])) {
            $where .= ' AND status = ?';
            $params[] = $filters['status'];
        }

        return $this->count($where, $params);
    }
}
