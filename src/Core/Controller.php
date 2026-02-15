<?php
namespace App\Core;

abstract class Controller
{
    protected function render(string $view, array $data = []): void
    {
        $data['baseUrl'] = $this->baseUrl();
        $data['lang'] = Lang::getInstance();
        extract($data);

        $viewFile = __DIR__ . '/../../views/' . str_replace('.', '/', $view) . '.phtml';
        if (!file_exists($viewFile)) {
            die("View not found: {$view}");
        }

        ob_start();
        require $viewFile;
        $content = ob_get_clean();

        $layout = $data['layout'] ?? 'app';

        // If layout is false, just output the view content directly
        if ($layout === false) {
            echo $content;
            return;
        }

        $layoutFile = __DIR__ . '/../../views/layouts/' . $layout . '.phtml';
        if (file_exists($layoutFile)) {
            require $layoutFile;
        } else {
            echo $content;
        }
    }

    protected function redirect(string $path): void
    {
        header('Location: ' . $this->baseUrl() . $path);
        exit;
    }

    protected function baseUrl(): string
    {
        $config = require __DIR__ . '/../../config/app.php';
        return $config['base_url'];
    }

    protected function flash(string $type, string $message): void
    {
        $_SESSION['flash'] = ['type' => $type, 'message' => $message];
    }

    protected function getFlash(): ?array
    {
        $flash = $_SESSION['flash'] ?? null;
        unset($_SESSION['flash']);
        return $flash;
    }

    protected function validateCsrf(): bool
    {
        $token = $_POST['_csrf'] ?? '';
        return hash_equals($_SESSION['csrf_token'] ?? '', $token);
    }

    protected function csrfToken(): string
    {
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    protected function isPost(): bool
    {
        return $_SERVER['REQUEST_METHOD'] === 'POST';
    }

    protected function input(string $key, $default = null)
    {
        $value = $_POST[$key] ?? $_GET[$key] ?? $default;
        return is_string($value) ? trim($value) : $value;
    }
}
