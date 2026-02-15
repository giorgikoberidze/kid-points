-- Migration: Add child goals and wishlists functionality
-- Run this migration to add goal-setting and wishlist features

-- Child Goals table
CREATE TABLE IF NOT EXISTS child_goals (
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

-- Child Wishlists table
CREATE TABLE IF NOT EXISTS child_wishlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    reward_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE,
    UNIQUE KEY unique_child_reward (child_id, reward_id)
) ENGINE=InnoDB;

-- Add columns to reward_redemptions for child-initiated requests
ALTER TABLE reward_redemptions
    ADD COLUMN requested_by ENUM('admin', 'child') DEFAULT 'admin' AFTER status,
    ADD COLUMN cancelled_at DATETIME NULL AFTER requested_by;
