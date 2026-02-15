<?php
namespace App\Models;

use App\Core\Model;

class Setting extends Model
{
    protected string $table = 'settings';
    protected string $primaryKey = 'setting_key';

    public function get(string $key, string $default = ''): string
    {
        $row = $this->db->query("SELECT setting_value FROM settings WHERE setting_key = ?", [$key])->fetch();
        return $row ? $row['setting_value'] : $default;
    }

    public function set(string $key, string $value): void
    {
        $this->db->query(
            "INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
            [$key, $value, $value]
        );
    }

    public function getAll(): array
    {
        $rows = $this->db->query("SELECT * FROM settings")->fetchAll();
        $result = [];
        foreach ($rows as $row) {
            $result[$row['setting_key']] = $row['setting_value'];
        }
        return $result;
    }
}
