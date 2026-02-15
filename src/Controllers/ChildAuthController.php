<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Core\Lang;
use App\Models\Child;
use App\Services\ActivityService;

class ChildAuthController extends Controller
{
    public function loginForm(): void
    {
        // If already logged in as child, redirect to portal
        if (!empty($_SESSION['child_id'])) {
            $this->redirect('/my');
            return;
        }

        // Set default locale to Georgian for child portal if not set
        if (empty($_SESSION['locale']) && empty($_COOKIE['locale'])) {
            Lang::setLocale('ka');
        }

        $this->render('child-portal/login', [
            'layout' => false,
        ]);
    }

    public function login(): void
    {
        if (!$this->isPost()) {
            $this->redirect('/child-login');
            return;
        }

        $pin = $this->input('pin');

        if (empty($pin) || strlen($pin) < 4) {
            $this->flash('error', Lang::getInstance()->t('invalid_pin'));
            $this->redirect('/child-login');
            return;
        }

        // Find child by PIN only
        $child = (new Child())->findByPin($pin);

        if (!$child) {
            $this->flash('error', Lang::getInstance()->t('invalid_pin'));
            $this->redirect('/child-login');
            return;
        }

        // Set session
        $_SESSION['child_id'] = $child['id'];
        $_SESSION['child_nickname'] = $child['nickname'] ?? $child['name'];

        // Log login
        (new ActivityService())->logChildAction($child['id'], 'child_login', 'session');

        $this->redirect('/my');
    }

    public function logout(): void
    {
        // Log logout before clearing session
        if (!empty($_SESSION['child_id'])) {
            (new ActivityService())->logChildAction($_SESSION['child_id'], 'child_logout', 'session');
        }

        unset($_SESSION['child_id']);
        unset($_SESSION['child_nickname']);
        $this->redirect('/child-login');
    }
}
