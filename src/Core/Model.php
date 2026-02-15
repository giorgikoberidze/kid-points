<?php
namespace App\Core;

abstract class Model
{
    protected Database $db;
    protected string $table;
    protected string $primaryKey = 'id';

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function find(int $id): ?array
    {
        $stmt = $this->db->query("SELECT * FROM {$this->table} WHERE {$this->primaryKey} = ?", [$id]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function findAll(string $orderBy = 'id ASC'): array
    {
        return $this->db->query("SELECT * FROM {$this->table} ORDER BY {$orderBy}")->fetchAll();
    }

    public function create(array $data): int
    {
        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));
        $this->db->query("INSERT INTO {$this->table} ({$columns}) VALUES ({$placeholders})", array_values($data));
        return (int)$this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $set = implode(', ', array_map(fn($col) => "{$col} = ?", array_keys($data)));
        $values = array_values($data);
        $values[] = $id;
        $this->db->query("UPDATE {$this->table} SET {$set} WHERE {$this->primaryKey} = ?", $values);
        return true;
    }

    public function delete(int $id): bool
    {
        $this->db->query("DELETE FROM {$this->table} WHERE {$this->primaryKey} = ?", [$id]);
        return true;
    }

    public function where(string $column, $value): array
    {
        return $this->db->query("SELECT * FROM {$this->table} WHERE {$column} = ?", [$value])->fetchAll();
    }

    public function count(string $where = '1=1', array $params = []): int
    {
        return (int)$this->db->query("SELECT COUNT(*) as cnt FROM {$this->table} WHERE {$where}", $params)->fetch()['cnt'];
    }
}
