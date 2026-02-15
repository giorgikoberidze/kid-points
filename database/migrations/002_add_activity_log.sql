-- Migration: Add activity log table for tracking all child actions
-- Run this migration to add comprehensive activity logging

CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    actor_type ENUM('admin', 'child') NOT NULL,
    actor_id INT NULL,
    child_id INT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NULL,
    details JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_activity_child (child_id),
    INDEX idx_activity_date (created_at),
    INDEX idx_activity_action (action),
    INDEX idx_activity_actor (actor_type, actor_id)
) ENGINE=InnoDB;
