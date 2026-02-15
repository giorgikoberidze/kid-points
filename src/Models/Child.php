<?php
namespace App\Models;

use App\Core\Model;

class Child extends Model
{
    protected string $table = 'children';

    public function updateBalance(int $id): void
    {
        $this->db->query(
            "UPDATE children SET points_balance = COALESCE((SELECT SUM(points) FROM point_transactions WHERE child_id = ?), 0) WHERE id = ?",
            [$id, $id]
        );
    }

    public function getWithStats(): array
    {
        return $this->db->query("
            SELECT c.*,
                COALESCE((SELECT MAX(s.current_count) FROM streaks s WHERE s.child_id = c.id), 0) as max_streak,
                l.name as level_name,
                l.name_ka as level_name_ka,
                l.icon as level_icon,
                l.theme_color as level_color,
                l.stars as level_stars,
                l.badge_class as level_badge_class,
                l.level_number
            FROM children c
            LEFT JOIN levels l ON c.current_level_id = l.id
            ORDER BY COALESCE(c.nickname, c.name)
        ")->fetchAll();
    }

    public function findByNicknameAndPin(string $nickname, string $pin): ?array
    {
        $result = $this->db->query(
            "SELECT * FROM children WHERE (nickname = ? OR name = ?) AND pin = ? LIMIT 1",
            [$nickname, $nickname, $pin]
        )->fetch();

        return $result ?: null;
    }

    public function findByPin(string $pin): ?array
    {
        $result = $this->db->query(
            "SELECT * FROM children WHERE pin = ? LIMIT 1",
            [$pin]
        )->fetch();

        return $result ?: null;
    }
}
