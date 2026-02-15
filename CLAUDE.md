# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kid Points is a PHP-based child behavior and reward tracking application. Parents can manage children's point balances through behavior-based earning/deducting, with rewards that can be redeemed for points.

## Development Environment

- **Stack**: PHP 8.0+ with MySQL, running on XAMPP
- **URL**: http://localhost/kid-points/public
- **Database**: `kid_points` on MySQL (localhost:3306, user: root)

## Common Commands

```bash
# Initialize database
mysql -u root -proot < database/schema.sql
mysql -u root -proot kid_points < database/seed.sql

# Install dependencies
composer install
```

## Architecture

### MVC Framework (Custom, Lightweight)

Entry point: `public/index.php` → `App\Core\App` → Router dispatch

**Core classes** (`src/Core/`):
- `App` - Bootstrap, initializes router and loads routes from `routes/web.php`
- `Router` - Pattern-based routing with `{param}` placeholders, dispatches to `Controller@method`
- `Controller` - Base controller with `render()`, `redirect()`, flash messages, CSRF handling
- `Model` - Active Record-style base with `find()`, `findAll()`, `create()`, `update()`, `delete()`, `where()`
- `Database` - PDO singleton wrapper with transaction support
- `Auth` - Static authentication helper with `attempt()`, `check()`, `user()`, `requireAuth()`
- `Lang` - i18n singleton loading from `lang/{locale}.json`, accessed via `$lang->t('key')` or `t('key')` helper
- `Validator` - Input validation utilities

### Request Flow

1. Routes defined in `routes/web.php` using `$router->get('/path', 'Controller@method')`
2. Controllers extend `App\Core\Controller`, call `$this->render('folder.view', $data)`
3. Views are `.phtml` files in `views/`, rendered inside `views/layouts/app.phtml` (or `auth.phtml`)
4. Models extend `App\Core\Model`, set `protected string $table`

### Services (`src/Services/`)

Business logic layer used by controllers:
- `PointService` - Point transactions (award, adjust, redeem) with automatic balance updates
- `StreakService` - Tracks consecutive positive behaviors per category
- `AchievementService` - Awards achievements based on criteria (points earned, streaks, etc.)
- `ReportService` - Generates statistics and CSV exports

Services use Database transactions for multi-step operations.

### Database Schema

Key tables: `users`, `children`, `behavior_categories`, `point_transactions`, `rewards`, `reward_redemptions`, `achievements`, `child_achievements`, `streaks`, `settings`

Point flow: Categories define `default_points` and `type` (positive/negative). Transactions record all point changes. Child `points_balance` is recalculated after each transaction.

## Conventions

- Routes use POST for mutations (create/update/delete), GET for reads
- CSRF protection: forms include `$this->csrfToken()`, controllers validate with `$this->validateCsrf()`
- Flash messages: `$this->flash('success'|'error', 'message')`, displayed via `views/partials/flash.phtml`
- i18n: Translation keys in `lang/en.json` and `lang/ka.json`, access via `$lang->t('key')` in views
- Icons: Bootstrap Icons (bi-*) used throughout
- Authentication: Most routes require auth via `Auth::requireAuth()`. Exception: `/children/{id}/public` is unauthenticated

## Configuration

- `config/app.php` - base_url, timezone, app_name
- `config/database.php` - MySQL connection settings
