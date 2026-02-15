<?php
namespace App\Core;

class App
{
    private Router $router;

    public function __construct()
    {
        $config = require __DIR__ . '/../../config/app.php';
        date_default_timezone_set($config['timezone']);

        session_start();

        $this->router = new Router();
        require __DIR__ . '/../../routes/web.php';
    }

    public function getRouter(): Router
    {
        return $this->router;
    }

    public function run(): void
    {
        $uri = $_GET['url'] ?? '';
        $uri = '/' . trim($uri, '/');
        $method = $_SERVER['REQUEST_METHOD'];

        $this->router->dispatch($method, $uri);
    }
}
