<?php
namespace App\Models;

use App\Core\Model;

class ChildWishlist extends Model
{
    protected string $table = 'child_wishlists';

    public function getForChild(int $childId): array
    {
        return $this->db->query(
            "SELECT cw.*, r.name as reward_name, r.name_ka as reward_name_ka,
                    r.description, r.description_ka, r.point_cost, r.icon, r.money_value
             FROM child_wishlists cw
             JOIN rewards r ON cw.reward_id = r.id
             WHERE cw.child_id = ? AND r.is_active = 1
             ORDER BY cw.created_at DESC",
            [$childId]
        )->fetchAll();
    }

    public function add(int $childId, int $rewardId): bool
    {
        try {
            $this->db->query(
                "INSERT IGNORE INTO child_wishlists (child_id, reward_id) VALUES (?, ?)",
                [$childId, $rewardId]
            );
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function remove(int $childId, int $rewardId): bool
    {
        $this->db->query(
            "DELETE FROM child_wishlists WHERE child_id = ? AND reward_id = ?",
            [$childId, $rewardId]
        );
        return true;
    }

    public function isInWishlist(int $childId, int $rewardId): bool
    {
        $result = $this->db->query(
            "SELECT 1 FROM child_wishlists WHERE child_id = ? AND reward_id = ?",
            [$childId, $rewardId]
        )->fetch();
        return (bool)$result;
    }

    public function getWishlistRewardIds(int $childId): array
    {
        $results = $this->db->query(
            "SELECT reward_id FROM child_wishlists WHERE child_id = ?",
            [$childId]
        )->fetchAll();
        return array_column($results, 'reward_id');
    }
}
