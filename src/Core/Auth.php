<?php
namespace App\Core;

class Auth
{
    public static function attempt(string $username, string $password): bool
    {
        $db = Database::getInstance();
        $user = $db->query("SELECT * FROM users WHERE username = ?", [$username])->fetch();
        if ($user && password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user'] = $user;
            return true;
        }
        return false;
    }

    public static function check(): bool
    {
        return isset($_SESSION['user_id']);
    }

    public static function user(): ?array
    {
        return $_SESSION['user'] ?? null;
    }

    public static function logout(): void
    {
        session_destroy();
    }

    public static function requireAuth(): void
    {
        if (!self::check()) {
            $config = require __DIR__ . '/../../config/app.php';
            header('Location: ' . $config['base_url'] . '/login');
            exit;
        }
    }
}
