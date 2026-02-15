<?php
namespace App\Core;

class Validator
{
    private array $errors = [];

    public function required(string $field, $value, string $label = ''): self
    {
        if (empty(trim((string)$value))) {
            $this->errors[$field] = ($label ?: $field) . ' is required.';
        }
        return $this;
    }

    public function numeric(string $field, $value, string $label = ''): self
    {
        if (!empty($value) && !is_numeric($value)) {
            $this->errors[$field] = ($label ?: $field) . ' must be a number.';
        }
        return $this;
    }

    public function min(string $field, $value, int $min, string $label = ''): self
    {
        if (strlen((string)$value) < $min) {
            $this->errors[$field] = ($label ?: $field) . " must be at least {$min} characters.";
        }
        return $this;
    }

    public function fails(): bool
    {
        return !empty($this->errors);
    }

    public function errors(): array
    {
        return $this->errors;
    }

    public function firstError(): string
    {
        return reset($this->errors) ?: '';
    }
}
