<?php
namespace App\Models;

use App\Core\Model;

class Level extends Model
{
    protected string $table = 'levels';

    /**
     * Get all active levels
     */
    public function getActive(): array
    {
        return $this->db->query(
            "SELECT * FROM {$this->table} WHERE is_active = 1 ORDER BY points_required ASC"
        )->fetchAll();
    }

    /**
     * Get level by level number
     */
    public function findByNumber(int $levelNumber): ?array
    {
        $result = $this->db->query(
            "SELECT * FROM {$this->table} WHERE level_number = ?",
            [$levelNumber]
        )->fetch();
        return $result ?: null;
    }
}
