<?php
namespace App\Models;

use App\Core\Model;

class Achievement extends Model
{
    protected string $table = 'achievements';

    public function getEarned(int $childId): array
    {
        return $this->db->query("
            SELECT a.*, ca.earned_at
            FROM achievements a
            JOIN child_achievements ca ON a.id = ca.achievement_id
            WHERE ca.child_id = ?
            ORDER BY ca.earned_at DESC
        ", [$childId])->fetchAll();
    }

    public function getAllWithStatus(int $childId): array
    {
        return $this->db->query("
            SELECT a.*, ca.earned_at
            FROM achievements a
            LEFT JOIN child_achievements ca ON a.id = ca.achievement_id AND ca.child_id = ?
            ORDER BY a.id
        ", [$childId])->fetchAll();
    }
}
