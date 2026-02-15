<?php
namespace App\Models;

use App\Core\Model;

class BehaviorCategory extends Model
{
    protected string $table = 'behavior_categories';

    public function getActive(): array
    {
        return $this->db->query("SELECT * FROM behavior_categories WHERE is_active = 1 ORDER BY sort_order")->fetchAll();
    }

    public function getByType(string $type): array
    {
        return $this->db->query("SELECT * FROM behavior_categories WHERE type = ? AND is_active = 1 ORDER BY sort_order", [$type])->fetchAll();
    }

    public function getAllByType(string $type): array
    {
        return $this->db->query("SELECT * FROM behavior_categories WHERE type = ? ORDER BY sort_order", [$type])->fetchAll();
    }
}
