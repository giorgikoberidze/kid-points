<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Core\Auth;
use App\Models\BehaviorCategory;

class CategoryController extends Controller
{
    public function index(): void
    {
        Auth::requireAuth();
        $typeFilter = $this->input('type');

        $categoryModel = new BehaviorCategory();
        if ($typeFilter && in_array($typeFilter, ['positive', 'negative'])) {
            $categories = $categoryModel->getAllByType($typeFilter);
        } else {
            $categories = $categoryModel->findAll('sort_order ASC');
            $typeFilter = '';
        }

        $this->render('categories/index', [
            'categories' => $categories,
            'typeFilter' => $typeFilter,
            'csrfToken' => $this->csrfToken(),
        ]);
    }

    public function create(): void
    {
        Auth::requireAuth();
        $this->render('categories/create', [
            'csrfToken' => $this->csrfToken(),
        ]);
    }

    public function store(): void
    {
        Auth::requireAuth();
        if (!$this->validateCsrf()) {
            $this->redirect('/categories');
            return;
        }

        (new BehaviorCategory())->create([
            'name' => $this->input('name'),
            'name_ka' => $this->input('name_ka') ?: null,
            'type' => $this->input('type'),
            'icon' => $this->input('icon', 'bi-star'),
            'default_points' => (int)$this->input('default_points'),
            'sort_order' => (int)$this->input('sort_order', 0),
            'is_active' => $this->input('is_active') ? 1 : 0,
        ]);

        $this->flash('success', \App\Core\Lang::getInstance()->t('category_created'));
        $this->redirect('/categories');
    }

    public function edit(string $id): void
    {
        Auth::requireAuth();
        $category = (new BehaviorCategory())->find((int)$id);
        if (!$category) {
            $this->redirect('/categories');
            return;
        }
        $this->render('categories/edit', [
            'category' => $category,
            'csrfToken' => $this->csrfToken(),
        ]);
    }

    public function update(string $id): void
    {
        Auth::requireAuth();
        if (!$this->validateCsrf()) {
            $this->redirect('/categories');
            return;
        }

        (new BehaviorCategory())->update((int)$id, [
            'name' => $this->input('name'),
            'name_ka' => $this->input('name_ka') ?: null,
            'type' => $this->input('type'),
            'icon' => $this->input('icon', 'bi-star'),
            'default_points' => (int)$this->input('default_points'),
            'sort_order' => (int)$this->input('sort_order', 0),
            'is_active' => $this->input('is_active') ? 1 : 0,
        ]);

        $this->flash('success', \App\Core\Lang::getInstance()->t('category_updated'));
        $this->redirect('/categories');
    }

    public function destroy(string $id): void
    {
        Auth::requireAuth();
        if (!$this->validateCsrf()) {
            $this->redirect('/categories');
            return;
        }
        (new BehaviorCategory())->delete((int)$id);
        $this->flash('success', \App\Core\Lang::getInstance()->t('category_deleted'));
        $this->redirect('/categories');
    }

    public function inlineUpdate(string $id): void
    {
        Auth::requireAuth();
        header('Content-Type: application/json');

        if (!$this->validateCsrf()) {
            echo json_encode(['success' => false, 'error' => 'Invalid CSRF token']);
            exit;
        }

        $categoryModel = new BehaviorCategory();
        $category = $categoryModel->find((int)$id);
        if (!$category) {
            echo json_encode(['success' => false, 'error' => 'Category not found']);
            exit;
        }

        $field = $this->input('field');
        $value = $this->input('value');

        $allowedFields = ['name', 'name_ka', 'default_points'];
        if (!in_array($field, $allowedFields)) {
            echo json_encode(['success' => false, 'error' => 'Invalid field']);
            exit;
        }

        if ($field === 'default_points') {
            $value = (int)$value;
        }

        $categoryModel->update((int)$id, [$field => $value]);
        echo json_encode(['success' => true]);
        exit;
    }
}
