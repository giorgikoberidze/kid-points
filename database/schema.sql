CREATE DATABASE IF NOT EXISTS kid_points CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kid_points;

-- ============================================
-- CORE TABLES
-- ============================================

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    level_number INT NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    name_ka VARCHAR(100) NULL,
    points_required INT NOT NULL,
    theme_color VARCHAR(50) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    stars INT DEFAULT 1,
    badge_class VARCHAR(50) NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_levels_points (points_required),
    INDEX idx_levels_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE children (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    nickname VARCHAR(50) NULL,
    first_name VARCHAR(50) NULL,
    last_name VARCHAR(50) NULL,
    pin CHAR(4) NULL,
    date_of_birth DATE NULL,
    photo_path VARCHAR(255) NULL,
    points_balance INT DEFAULT 0,
    current_level_id INT NULL,
    total_points_earned INT DEFAULT 0,
    pending_level_up_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (current_level_id) REFERENCES levels(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE behavior_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_ka VARCHAR(100) NULL,
    type ENUM('positive','negative') NOT NULL,
    icon VARCHAR(50) DEFAULT 'bi-star',
    default_points INT NOT NULL,
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE point_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    category_id INT NULL,
    points INT NOT NULL,
    note TEXT NULL,
    image LONGTEXT NULL,
    type ENUM('earn','deduct','redeem','adjust','refund') NOT NULL,
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    multiplier_value DECIMAL(3,1) NULL,
    bonus_points INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES behavior_categories(id) ON DELETE SET NULL,
    INDEX idx_pt_child_date (child_id, transaction_date DESC),
    INDEX idx_pt_type (type)
) ENGINE=InnoDB;

CREATE TABLE rewards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_ka VARCHAR(100) NULL,
    description TEXT NULL,
    description_ka TEXT NULL,
    point_cost INT NOT NULL,
    money_value DECIMAL(10,2) NULL,
    icon VARCHAR(50) DEFAULT 'bi-gift',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE reward_redemptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    reward_id INT NOT NULL,
    points_spent INT NOT NULL,
    transaction_id INT NULL,
    status ENUM('pending','fulfilled','cancelled') DEFAULT 'pending',
    requested_by ENUM('admin','child') DEFAULT 'admin',
    cancelled_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES point_transactions(id) ON DELETE SET NULL,
    INDEX idx_rr_status (status, created_at DESC)
) ENGINE=InnoDB;

CREATE TABLE achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_ka VARCHAR(100) NULL,
    description TEXT NULL,
    description_ka TEXT NULL,
    icon VARCHAR(50) DEFAULT 'bi-trophy',
    criteria_type VARCHAR(50) NOT NULL,
    criteria_value INT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE child_achievements (
    child_id INT NOT NULL,
    achievement_id INT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (child_id, achievement_id),
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE streaks (
    child_id INT NOT NULL,
    category_id INT NOT NULL,
    current_count INT DEFAULT 0,
    longest_count INT DEFAULT 0,
    last_date DATE NULL,
    PRIMARY KEY (child_id, category_id),
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES behavior_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- ============================================
-- GOALS & WISHLISTS (Migration 001)
-- ============================================

CREATE TABLE child_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_ka VARCHAR(100) NULL,
    target_points INT NOT NULL,
    deadline DATE NULL,
    is_default TINYINT(1) DEFAULT 0,
    is_completed TINYINT(1) DEFAULT 0,
    is_favorite TINYINT(1) DEFAULT 0,
    completed_at DATETIME NULL,
    deleted_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    INDEX idx_child_goals_child (child_id),
    INDEX idx_child_goals_active (child_id, is_completed, deleted_at)
) ENGINE=InnoDB;

CREATE TABLE child_wishlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    reward_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE,
    UNIQUE KEY unique_child_reward (child_id, reward_id)
) ENGINE=InnoDB;

-- ============================================
-- ACTIVITY LOG (Migration 002)
-- ============================================

CREATE TABLE activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    actor_type ENUM('admin','child') NOT NULL,
    actor_id INT NULL,
    child_id INT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NULL,
    entity_id INT NULL,
    details JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    INDEX idx_activity_child (child_id),
    INDEX idx_activity_date (created_at),
    INDEX idx_activity_action (action),
    INDEX idx_activity_actor (actor_type, actor_id)
) ENGINE=InnoDB;

-- ============================================
-- LEVELS SYSTEM (Migration 003)
-- ============================================

CREATE TABLE child_level_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    level_id INT NOT NULL,
    total_points_at_level INT NOT NULL,
    bonus_points_awarded INT DEFAULT 0,
    reached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE,
    UNIQUE KEY unique_child_level (child_id, level_id),
    INDEX idx_level_history_child (child_id),
    INDEX idx_level_history_date (reached_at)
) ENGINE=InnoDB;

-- ============================================
-- CHEST SYSTEM (Migration 004)
-- ============================================

CREATE TABLE chest_rewards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    chest_type ENUM('daily','sunday','active_bonus','goal_small','goal_medium','goal_large','goal_epic') NOT NULL,
    reward_type ENUM('fixed_xp','multiplier') NOT NULL DEFAULT 'fixed_xp',
    reward_value INT NOT NULL DEFAULT 0,
    goal_id INT NULL,
    opened_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    INDEX idx_chest_child (child_id),
    INDEX idx_chest_opened (child_id, opened_at DESC)
) ENGINE=InnoDB;

CREATE TABLE daily_multipliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    multiplier DECIMAL(3,1) NOT NULL DEFAULT 1.0,
    started_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'chest',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    INDEX idx_multiplier_child (child_id),
    INDEX idx_multiplier_active (child_id, expires_at)
) ENGINE=InnoDB;

-- ============================================
-- SEED DATA
-- ============================================

-- Default settings
INSERT INTO settings (setting_key, setting_value) VALUES
('points_per_lari', '10'),
('currency_symbol', '₾'),
('currency_name', 'GEL'),
('app_language', 'en'),
('level_up_bonus_enabled', '1'),
('level_up_bonus_points', '10')
ON DUPLICATE KEY UPDATE setting_value = setting_value;

-- Default levels (7 total: Beginner → Legendary)
INSERT INTO levels (level_number, name, name_ka, points_required, theme_color, icon, stars, badge_class) VALUES
(1, 'Beginner', 'დამწყები', 0, '#86efac', '🌱', 1, 'level-beginner'),
(2, 'Junior', 'ჯუნიორი', 100, '#2dd4bf', '🌿', 2, 'level-junior'),
(3, 'Advancing', 'გამოცდილი', 300, '#60a5fa', '🌳', 3, 'level-advancing'),
(4, 'Expert', 'ექსპერტი', 600, '#a78bfa', '🏆', 4, 'level-expert'),
(5, 'Professional', 'პროფესიონალი', 1000, '#fbbf24', '👑', 5, 'level-pro'),
(6, 'Champion', 'ჩემპიონი', 2000, '#e0e7ff', '💎', 6, 'level-champion'),
(7, 'Legendary', 'ლეგენდარული', 5000, '#ff6b35', '🔱', 7, 'level-legendary')
ON DUPLICATE KEY UPDATE name = VALUES(name);
