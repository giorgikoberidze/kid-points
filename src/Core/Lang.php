<?php
namespace App\Core;

class Lang
{
    private static ?Lang $instance = null;
    private array $translations = [];
    private string $locale = 'en';

    private function __construct()
    {
        $this->locale = $_SESSION['locale'] ?? $_COOKIE['locale'] ?? 'en';
        $file = __DIR__ . '/../../lang/' . $this->locale . '.json';
        if (file_exists($file)) {
            $this->translations = json_decode(file_get_contents($file), true) ?? [];
        }
    }

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function t(string $key, array $replace = []): string
    {
        $text = $this->translations[$key] ?? $key;
        foreach ($replace as $k => $v) {
            $text = str_replace(':' . $k, $v, $text);
        }
        return $text;
    }

    public function getLocale(): string
    {
        return $this->locale;
    }

    /**
     * Format a date according to the current locale
     */
    public function formatDate(string $date, string $format = 'short'): string
    {
        $timestamp = strtotime($date);
        if ($timestamp === false) {
            return $date;
        }

        if ($this->locale === 'ka') {
            // Georgian date formats (numeric, more universally understood)
            return match ($format) {
                'short' => date('d.m.Y', $timestamp),
                'long' => date('d.m.Y H:i', $timestamp),
                'time' => date('H:i', $timestamp),
                'month_day' => date('d.m', $timestamp),
                default => date('d.m.Y', $timestamp),
            };
        }

        // English date formats
        return match ($format) {
            'short' => date('M j, Y', $timestamp),
            'long' => date('M j, Y H:i', $timestamp),
            'time' => date('H:i', $timestamp),
            'month_day' => date('M j', $timestamp),
            default => date('M j, Y', $timestamp),
        };
    }

    public static function setLocale(string $locale): void
    {
        $_SESSION['locale'] = $locale;
        setcookie('locale', $locale, time() + 86400 * 365, '/');
        self::$instance = null;
    }
}

function t(string $key, array $replace = []): string
{
    return Lang::getInstance()->t($key, $replace);
}
