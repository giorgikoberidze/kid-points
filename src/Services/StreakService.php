<?php
namespace App\Services;

use App\Core\Database;

class StreakService
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function updateStreak(int $childId, int $categoryId): void
    {
        $streak = $this->db->query(
            "SELECT * FROM streaks WHERE child_id = ? AND category_id = ?",
            [$childId, $categoryId]
        )->fetch();

        $today = date('Y-m-d');

        if (!$streak) {
            $this->db->query(
                "INSERT INTO streaks (child_id, category_id, current_count, longest_count, last_date) VALUES (?, ?, 1, 1, ?)",
                [$childId, $categoryId, $today]
            );
            return;
        }

        // Normalize date format for comparison (handles datetime strings from DB)
        $lastDate = date('Y-m-d', strtotime($streak['last_date']));

        if ($lastDate === $today) {
            return;
        }

        $yesterday = date('Y-m-d', strtotime('-1 day'));
        if ($lastDate === $yesterday) {
            $newCount = $streak['current_count'] + 1;
            $longest = max($streak['longest_count'], $newCount);
        } else {
            $newCount = 1;
            $longest = $streak['longest_count'];
        }

        $this->db->query(
            "UPDATE streaks SET current_count = ?, longest_count = ?, last_date = ? WHERE child_id = ? AND category_id = ?",
            [$newCount, $longest, $today, $childId, $categoryId]
        );
    }

    public function recalculateStreak(int $childId, int $categoryId): void
    {
        $dates = $this->db->query(
            "SELECT DISTINCT DATE(transaction_date) as d
             FROM point_transactions
             WHERE child_id = ? AND category_id = ? AND type = 'earn'
             ORDER BY d DESC",
            [$childId, $categoryId]
        )->fetchAll(\PDO::FETCH_COLUMN);

        if (empty($dates)) {
            $this->db->query(
                "DELETE FROM streaks WHERE child_id = ? AND category_id = ?",
                [$childId, $categoryId]
            );
            return;
        }

        $currentCount = 1;
        $lastDate = $dates[0];
        for ($i = 1; $i < count($dates); $i++) {
            $prev = new \DateTime($dates[$i - 1]);
            $curr = new \DateTime($dates[$i]);
            $diff = $prev->diff($curr)->days;
            if ($diff === 1) {
                $currentCount++;
            } else {
                break;
            }
        }

        $streak = $this->db->query(
            "SELECT longest_count FROM streaks WHERE child_id = ? AND category_id = ?",
            [$childId, $categoryId]
        )->fetch();

        if ($streak) {
            $longest = max($streak['longest_count'], $currentCount);
            $this->db->query(
                "UPDATE streaks SET current_count = ?, longest_count = ?, last_date = ? WHERE child_id = ? AND category_id = ?",
                [$currentCount, $longest, $lastDate, $childId, $categoryId]
            );
        } else {
            $this->db->query(
                "INSERT INTO streaks (child_id, category_id, current_count, longest_count, last_date) VALUES (?, ?, ?, ?, ?)",
                [$childId, $categoryId, $currentCount, $currentCount, $lastDate]
            );
        }
    }

    public function getStreaks(int $childId): array
    {
        return $this->db->query("
            SELECT s.*, bc.name as category_name, bc.name_ka as category_name_ka, bc.icon as category_icon
            FROM streaks s
            JOIN behavior_categories bc ON s.category_id = bc.id
            WHERE s.child_id = ? AND s.current_count > 0
            ORDER BY s.current_count DESC
        ", [$childId])->fetchAll();
    }

    public function getMaxStreak(int $childId): int
    {
        $row = $this->db->query(
            "SELECT MAX(current_count) as max_streak FROM streaks WHERE child_id = ?",
            [$childId]
        )->fetch();
        return (int)($row['max_streak'] ?? 0);
    }
}
