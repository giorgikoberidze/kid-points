<?php
namespace App\Services;

use App\Core\Database;

class AchievementService
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function checkAndAward(int $childId): void
    {
        $achievements = $this->db->query("SELECT * FROM achievements")->fetchAll();
        $earned = $this->db->query(
            "SELECT achievement_id FROM child_achievements WHERE child_id = ?",
            [$childId]
        )->fetchAll(\PDO::FETCH_COLUMN);

        $child = $this->db->query("SELECT * FROM children WHERE id = ?", [$childId])->fetch();
        // Exclude refunds - they restore spent points but don't count as earned points for achievements
        $totalEarned = (int)$this->db->query(
            "SELECT COALESCE(SUM(points), 0) as total FROM point_transactions WHERE child_id = ? AND points > 0 AND type != 'refund'",
            [$childId]
        )->fetch()['total'];

        $maxStreak = (new StreakService())->getMaxStreak($childId);
        $redemptionCount = (int)$this->db->query(
            "SELECT COUNT(*) as cnt FROM reward_redemptions WHERE child_id = ?",
            [$childId]
        )->fetch()['cnt'];

        foreach ($achievements as $a) {
            if (in_array($a['id'], $earned)) continue;

            $qualifies = false;
            switch ($a['criteria_type']) {
                case 'total_points':
                    $qualifies = $totalEarned >= $a['criteria_value'];
                    break;
                case 'streak':
                    $qualifies = $maxStreak >= $a['criteria_value'];
                    break;
                case 'redemptions':
                    $qualifies = $redemptionCount >= $a['criteria_value'];
                    break;
            }

            if ($qualifies) {
                $this->db->query(
                    "INSERT IGNORE INTO child_achievements (child_id, achievement_id) VALUES (?, ?)",
                    [$childId, $a['id']]
                );
            }
        }
    }

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
}
