<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Core\Auth;
use App\Core\Lang;
use App\Core\Database;
use App\Models\Setting;

class SettingsController extends Controller
{
    public function index(): void
    {
        Auth::requireAuth();
        $settings = (new Setting())->getAll();

        // Get children with their gamification settings
        $db = Database::getInstance();
        $children = $db->query(
            "SELECT id, name, nickname, photo_path, celebration_style, pet_creature, pet_skin, pet_enabled, sound_enabled
             FROM children ORDER BY name"
        )->fetchAll();

        $this->render('settings/index', [
            'settings' => $settings,
            'children' => $children,
            'csrfToken' => $this->csrfToken(),
        ]);
    }

    public function update(): void
    {
        Auth::requireAuth();
        if (!$this->validateCsrf()) {
            $this->redirect('/settings');
            return;
        }

        $settingModel = new Setting();
        $settingModel->set('points_per_lari', $this->input('points_per_lari', '10'));
        $settingModel->set('currency_symbol', $this->input('currency_symbol', '₾'));
        $settingModel->set('currency_name', $this->input('currency_name', 'Lari'));
        $settingModel->set('use_game_terms', $this->input('use_game_terms', '0'));

        // Chest settings
        $settingModel->set('daily_chest_enabled', $this->input('daily_chest_enabled', '1'));
        $settingModel->set('daily_chest_reward', $this->input('daily_chest_reward', '10'));
        $settingModel->set('sunday_chest_enabled', $this->input('sunday_chest_enabled', '1'));
        $settingModel->set('sunday_chest_reward', $this->input('sunday_chest_reward', '25'));
        $settingModel->set('sunday_chest_multiplier', $this->input('sunday_chest_multiplier', '2'));

        $this->flash('success', Lang::getInstance()->t('settings_saved'));
        $this->redirect('/settings');
    }

    public function switchLanguage(string $locale): void
    {
        if (in_array($locale, ['en', 'ka'])) {
            Lang::setLocale($locale);
        }

        $referer = $_SERVER['HTTP_REFERER'] ?? $this->baseUrl() . '/';
        header('Location: ' . $referer);
        exit;
    }

    public function updateGamification(): void
    {
        Auth::requireAuth();
        if (!$this->validateCsrf()) {
            $this->redirect('/settings');
            return;
        }

        $settingModel = new Setting();

        // Save default gamification settings
        $settingModel->set('default_celebration_style', $this->input('default_celebration_style', 'epic'));
        $settingModel->set('default_pet_creature', $this->input('default_pet_creature', 'dragon'));
        $settingModel->set('default_pet_skin', $this->input('default_pet_skin', 'default'));
        $settingModel->set('default_pet_enabled', $this->input('default_pet_enabled', '1'));
        $settingModel->set('default_sound_enabled', $this->input('default_sound_enabled', '1'));

        // If apply_to_all is set, update all children with these defaults
        if ($this->input('apply_to_all') === '1') {
            $db = Database::getInstance();
            $db->query(
                "UPDATE children SET
                    celebration_style = ?,
                    pet_creature = ?,
                    pet_skin = ?,
                    pet_enabled = ?,
                    sound_enabled = ?",
                [
                    $this->input('default_celebration_style', 'epic'),
                    $this->input('default_pet_creature', 'dragon'),
                    $this->input('default_pet_skin', 'default'),
                    (int)$this->input('default_pet_enabled', '1'),
                    (int)$this->input('default_sound_enabled', '1')
                ]
            );
            $this->flash('success', Lang::getInstance()->t('defaults_applied'));
        } else {
            $this->flash('success', Lang::getInstance()->t('settings_saved'));
        }

        $this->redirect('/settings');
    }
}
