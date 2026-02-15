-- Migration: Add gamification levels system
-- Run this migration to add level progression tracking for children

-- Levels definition table
CREATE TABLE IF NOT EXISTS levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    level_number INT NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    name_ka VARCHAR(100) NULL,
    points_required INT NOT NULL,
    theme_color VARCHAR(50) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    stars INT NOT NULL DEFAULT 1,
    badge_class VARCHAR(50) NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_levels_points (points_required),
    INDEX idx_levels_active (is_active, points_required)
) ENGINE=InnoDB;

-- Track when children reach each level
CREATE TABLE IF NOT EXISTS child_level_history (
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

-- Add level tracking columns to children table
ALTER TABLE children
ADD COLUMN current_level_id INT NULL AFTER points_balance,
ADD COLUMN total_points_earned INT DEFAULT 0 AFTER current_level_id,
ADD COLUMN pending_level_up_id INT NULL AFTER total_points_earned;

-- Add foreign key for current_level_id (after levels table exists)
ALTER TABLE children
ADD CONSTRAINT fk_children_level FOREIGN KEY (current_level_id) REFERENCES levels(id) ON DELETE SET NULL;

-- Settings for level-up bonuses
INSERT INTO settings (setting_key, setting_value) VALUES
('level_up_bonus_enabled', '1'),
('level_up_bonus_points', '10')
ON DUPLICATE KEY UPDATE setting_value = setting_value;

-- Seed the 7 default levels
INSERT INTO levels (level_number, name, name_ka, points_required, theme_color, icon, stars, badge_class) VALUES
(1, 'Beginner', 'დამწყები', 0, '#86efac', '🌱', 1, 'level-beginner'),
(2, 'Junior', 'ჯუნიორი', 100, '#2dd4bf', '🌿', 2, 'level-junior'),
(3, 'Advancing', 'გამოცდილი', 300, '#60a5fa', '🌳', 3, 'level-advancing'),
(4, 'Expert', 'ექსპერტი', 600, '#a78bfa', '🏆', 4, 'level-expert'),
(5, 'Professional', 'პროფესიონალი', 1000, '#fbbf24', '👑', 5, 'level-pro'),
(6, 'Champion', 'ჩემპიონი', 2000, '#e0e7ff', '💎', 6, 'level-champion'),
(7, 'Legendary', 'ლეგენდარული', 5000, '#ff6b35', '🔱', 7, 'level-legendary')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Initialize total_points_earned for existing children
UPDATE children c
SET total_points_earned = COALESCE((
    SELECT SUM(points)
    FROM point_transactions pt
    WHERE pt.child_id = c.id AND pt.points > 0
), 0);

-- Set initial level for existing children based on their total_points_earned
UPDATE children c
SET current_level_id = (
    SELECT l.id
    FROM levels l
    WHERE l.is_active = 1 AND l.points_required <= c.total_points_earned
    ORDER BY l.points_required DESC
    LIMIT 1
)
WHERE c.total_points_earned >= 0;

-- Create initial level history records for existing children
INSERT INTO child_level_history (child_id, level_id, total_points_at_level, bonus_points_awarded, reached_at)
SELECT c.id, c.current_level_id, c.total_points_earned, 0, c.created_at
FROM children c
WHERE c.current_level_id IS NOT NULL
ON DUPLICATE KEY UPDATE total_points_at_level = VALUES(total_points_at_level);
