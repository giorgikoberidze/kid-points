USE kid_points;

-- Admin user (password: Koberidze_1981)
INSERT INTO users (username, email, password_hash, display_name) VALUES
('admin', 'admin@kidpoints.local', '$2y$10$7nGgzIBh5eN8yR3EaO.kyO.cCTzcLOPr7sDgU./0iWa5h/7/oeJTu', 'Admin');

-- Behavior categories
INSERT INTO behavior_categories (name, name_ka, type, icon, default_points, sort_order) VALUES
('Cleaned Room', 'ოთახის დალაგება', 'positive', 'bi-house-check', 5, 1),
('Did Homework', 'საშინაო დავალება', 'positive', 'bi-book', 5, 2),
('Helped Sibling', 'დაეხმარა და-ძმას', 'positive', 'bi-people', 3, 3),
('Brushed Teeth', 'კბილების გახეხვა', 'positive', 'bi-emoji-smile', 2, 4),
('Was Polite', 'თავაზიანობა', 'positive', 'bi-hand-thumbs-up', 2, 5),
('Read a Book', 'წიგნის კითხვა', 'positive', 'bi-journal-text', 4, 6),
('Ate Vegetables', 'ბოსტნეულის ჭამა', 'positive', 'bi-tree', 2, 7),
('Helped with Chores', 'საოჯახო საქმეებში დახმარება', 'positive', 'bi-bucket', 3, 8),
('Shared Toys', 'სათამაშოების გაზიარება', 'positive', 'bi-box2-heart', 3, 9),
('Good Bedtime Routine', 'კარგი ძილის რეჟიმი', 'positive', 'bi-moon-stars', 3, 10),
('Was Rude', 'უხეშობა', 'negative', 'bi-emoji-frown', -5, 11),
('Didn''t Listen', 'არ დაუჯერა', 'negative', 'bi-ear', -3, 12),
('Hit Sibling', 'და-ძმის ცემა', 'negative', 'bi-exclamation-triangle', -10, 13),
('Made a Mess', 'არეულობა მოაწყო', 'negative', 'bi-trash', -3, 14),
('Threw Tantrum', 'ისტერიკა მოაწყო', 'negative', 'bi-lightning', -5, 15),
('Didn''t Do Homework', 'საშინაო არ გააკეთა', 'negative', 'bi-x-circle', -5, 16);

-- Achievements
INSERT INTO achievements (name, name_ka, description, description_ka, icon, criteria_type, criteria_value) VALUES
('First Steps', 'პირველი ნაბიჯები', 'Earned your first 10 points!', 'მოიგეთ პირველი 10 ქულა!', 'bi-star', 'total_points', 10),
('Century Club', '100-იანების კლუბი', 'Reached 100 points total!', 'მიაღწიეთ 100 ქულას!', 'bi-award', 'total_points', 100),
('500 Points Club', '500 ქულის კლუბი', 'Reached 500 points total!', 'მიაღწიეთ 500 ქულას!', 'bi-trophy', 'total_points', 500),
('Point Master', 'ქულების ოსტატი', 'Reached 1000 points total!', 'მიაღწიეთ 1000 ქულას!', 'bi-gem', 'total_points', 1000),
('7-Day Streak', '7-დღიანი სერია', 'Positive behavior 7 days in a row!', 'დადებითი ქცევა 7 დღე ზედიზედ!', 'bi-fire', 'streak', 7),
('30-Day Streak', '30-დღიანი სერია', 'Positive behavior 30 days in a row!', 'დადებითი ქცევა 30 დღე ზედიზედ!', 'bi-lightning-charge', 'streak', 30),
('First Reward', 'პირველი ჯილდო', 'Redeemed your first reward!', 'გამოისყიდეთ პირველი ჯილდო!', 'bi-gift', 'redemptions', 1),
('Helping Hand', 'დამხმარე ხელი', 'Helped siblings 10 times!', 'და-ძმას 10-ჯერ დაეხმარეთ!', 'bi-heart', 'category_count', 10);

-- Settings
INSERT INTO settings (setting_key, setting_value) VALUES
('points_per_lari', '10'),
('currency_symbol', '₾'),
('currency_name', 'Lari'),
('app_language', 'en');
