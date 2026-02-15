<?php
/** @var \App\Core\Router $router */
$router = $this->router;

// Auth
$router->get('/login', 'AuthController@loginForm');
$router->post('/login', 'AuthController@login');
$router->get('/logout', 'AuthController@logout');

// Child Portal - Auth
$router->get('/child-login', 'ChildAuthController@loginForm');
$router->post('/child-login', 'ChildAuthController@login');
$router->get('/child-logout', 'ChildAuthController@logout');

// Child Portal - Main
$router->get('/my', 'ChildPortalController@index');

// Child Portal - Goals
$router->get('/my/goals', 'ChildPortalController@goals');
$router->post('/my/goals', 'ChildPortalController@storeGoal');
$router->post('/my/goals/{id}/update', 'ChildPortalController@updateGoal');
$router->post('/my/goals/{id}/delete', 'ChildPortalController@deleteGoal');
$router->post('/my/goals/{id}/favorite', 'ChildPortalController@toggleFavorite');

// Child Portal - Rewards
$router->get('/my/rewards', 'ChildPortalController@rewards');
$router->post('/my/rewards/request', 'ChildPortalController@requestReward');
$router->post('/my/rewards/{id}/cancel', 'ChildPortalController@cancelRewardRequest');

// Child Portal - Wishlist
$router->post('/my/wishlist/add', 'ChildPortalController@addToWishlist');
$router->post('/my/wishlist/remove', 'ChildPortalController@removeFromWishlist');

// Child Portal - History
$router->get('/my/points-history', 'ChildPortalController@pointsHistory');
$router->get('/my/redemption-history', 'ChildPortalController@redemptionHistory');

// Child Portal - Treasure Chest
$router->post('/my/chest/open', 'ChildPortalController@openChest');
$router->post('/my/chest/open-pending', 'ChildPortalController@openPendingChest');

// Dashboard
$router->get('/', 'DashboardController@index');

// Language switch
$router->get('/language/{locale}', 'SettingsController@switchLanguage');

// Children
$router->get('/children', 'ChildController@index');
$router->get('/children/create', 'ChildController@create');
$router->post('/children', 'ChildController@store');
$router->get('/children/{id}', 'ChildController@show');
$router->get('/children/{id}/edit', 'ChildController@edit');
$router->post('/children/{id}/update', 'ChildController@update');
$router->post('/children/{id}/delete', 'ChildController@destroy');
$router->get('/children/{id}/public', 'ChildController@publicView');

// Admin Goal Management (for children)
$router->post('/children/{childId}/goals', 'ChildController@storeGoal');
$router->post('/children/{childId}/goals/{goalId}/update', 'ChildController@updateGoal');
$router->post('/children/{childId}/goals/{goalId}/delete', 'ChildController@deleteGoal');

// Child Data Cleanup
$router->get('/children/{id}/cleanup', 'ChildController@cleanupForm');
$router->post('/children/{id}/cleanup', 'ChildController@cleanup');

// Award Bonus Chest
$router->post('/children/{id}/bonus-chest', 'ChildController@awardBonusChest');
$router->post('/children/{id}/bonus-chest/{chestId}/cancel', 'ChildController@cancelPendingChest');

// Multiplier Management
$router->post('/children/{id}/multiplier/grant', 'ChildController@grantMultiplier');
$router->post('/children/{id}/multiplier/remove', 'ChildController@removeMultiplier');

// Points
$router->get('/points/add/{childId}', 'PointController@create');
$router->post('/points', 'PointController@store');
$router->get('/points/history', 'PointController@history');

// Categories
$router->get('/categories', 'CategoryController@index');
$router->get('/categories/create', 'CategoryController@create');
$router->post('/categories', 'CategoryController@store');
$router->get('/categories/{id}/edit', 'CategoryController@edit');
$router->post('/categories/{id}/update', 'CategoryController@update');
$router->post('/categories/{id}/inline-update', 'CategoryController@inlineUpdate');
$router->post('/categories/{id}/delete', 'CategoryController@destroy');

// Rewards
$router->get('/rewards', 'RewardController@index');
$router->get('/rewards/create', 'RewardController@create');
$router->post('/rewards', 'RewardController@store');
$router->get('/rewards/{id}/edit', 'RewardController@edit');
$router->post('/rewards/{id}/update', 'RewardController@update');
$router->post('/rewards/redeem', 'RewardController@redeem');
$router->post('/rewards/{id}/fulfill', 'RewardController@fulfill');

// Reports
$router->get('/reports', 'ReportController@index');
$router->get('/reports/export', 'ReportController@exportCsv');

// Activity Log
$router->get('/activity', 'ActivityController@index');

// Settings
$router->get('/settings', 'SettingsController@index');
$router->post('/settings', 'SettingsController@update');
$router->post('/settings/gamification', 'SettingsController@updateGamification');
