<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Core\Auth;

class AuthController extends Controller
{
    public function loginForm(): void
    {
        if (Auth::check()) {
            $this->redirect('/');
            return;
        }
        $this->render('auth/login', [
            'layout' => 'auth',
            'csrfToken' => $this->csrfToken(),
            'error' => null,
        ]);
    }

    public function login(): void
    {
        if (!$this->validateCsrf()) {
            $this->render('auth/login', [
                'layout' => 'auth',
                'csrfToken' => $this->csrfToken(),
                'error' => 'Invalid request.',
            ]);
            return;
        }

        $username = $this->input('username');
        $password = $this->input('password');

        if (Auth::attempt($username, $password)) {
            $this->redirect('/');
        } else {
            $this->render('auth/login', [
                'layout' => 'auth',
                'csrfToken' => $this->csrfToken(),
                'error' => $this->t('invalid_credentials'),
            ]);
        }
    }

    public function logout(): void
    {
        Auth::logout();
        $this->redirect('/login');
    }

    private function t(string $key): string
    {
        return \App\Core\Lang::getInstance()->t($key);
    }
}
