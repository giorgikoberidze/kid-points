<?php
namespace App\Models;

use App\Core\Model;

class ChildGoal extends Model
{
    protected string $table = 'child_goals';

    public function getForChild(int $childId, bool $includeCompleted = true): array
    {
        $where = $includeCompleted ? '' : 'AND is_completed = 0';
        return $this->db->query(
            "SELECT * FROM child_goals WHERE child_id = ? AND deleted_at IS NULL {$where} ORDER BY is_completed ASC, deadline ASC, created_at ASC",
            [$childId]
        )->fetchAll();
    }

    public function getActiveForChild(int $childId): array
    {
        return $this->db->query(
            "SELECT * FROM child_goals WHERE child_id = ? AND is_completed = 0 AND deleted_at IS NULL ORDER BY deadline ASC, created_at ASC",
            [$childId]
        )->fetchAll();
    }

    public function getPrimaryGoal(int $childId): ?array
    {
        $result = $this->db->query(
            "SELECT * FROM child_goals WHERE child_id = ? AND is_completed = 0 AND deleted_at IS NULL ORDER BY deadline ASC, created_at ASC LIMIT 1",
            [$childId]
        )->fetch();
        return $result ?: null;
    }

    public function markCompleted(int $id): void
    {
        $this->db->query(
            "UPDATE child_goals SET is_completed = 1, completed_at = NOW() WHERE id = ?",
            [$id]
        );
    }

    public function countActiveForChild(int $childId): int
    {
        $result = $this->db->query(
            "SELECT COUNT(*) as cnt FROM child_goals WHERE child_id = ? AND is_completed = 0 AND deleted_at IS NULL",
            [$childId]
        )->fetch();
        return (int)$result['cnt'];
    }

    public function getCompletedForChild(int $childId, int $limit = 10): array
    {
        return $this->db->query(
            "SELECT * FROM child_goals WHERE child_id = ? AND is_completed = 1 AND deleted_at IS NULL ORDER BY completed_at DESC LIMIT ?",
            [$childId, $limit]
        )->fetchAll();
    }

    public function belongsToChild(int $goalId, int $childId): bool
    {
        $goal = $this->find($goalId);
        return $goal && $goal['child_id'] === $childId && empty($goal['deleted_at']);
    }

    public function getFavoriteForChild(int $childId): ?array
    {
        $result = $this->db->query(
            "SELECT * FROM child_goals WHERE child_id = ? AND is_favorite = 1 AND is_completed = 0 AND deleted_at IS NULL LIMIT 1",
            [$childId]
        )->fetch();
        return $result ?: null;
    }

    public function setFavorite(int $goalId, int $childId): void
    {
        // First, unset all favorites for this child
        $this->db->query(
            "UPDATE child_goals SET is_favorite = 0 WHERE child_id = ?",
            [$childId]
        );
        // Then set the new favorite
        $this->db->query(
            "UPDATE child_goals SET is_favorite = 1 WHERE id = ? AND child_id = ?",
            [$goalId, $childId]
        );
    }

    public function unsetFavorite(int $goalId, int $childId): void
    {
        $this->db->query(
            "UPDATE child_goals SET is_favorite = 0 WHERE id = ? AND child_id = ?",
            [$goalId, $childId]
        );
    }
}
