<?php
namespace App\Models;

use App\Core\Model;

class Reward extends Model
{
    protected string $table = 'rewards';

    public function getActive(): array
    {
        return $this->db->query("SELECT * FROM rewards WHERE is_active = 1 ORDER BY point_cost")->fetchAll();
    }
}
