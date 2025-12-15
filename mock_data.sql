USE waste_less;
-- Disable foreign key checks to avoid errors during bulk insertion
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------
-- 1. WASTE TYPES (All types included as requested)
-- ------------------------------------------------------
INSERT INTO `waste_type` (`type_id`, `name`) VALUES 
(1, 'PLASTIC'),
(2, 'METAL'),
(3, 'GLASS'),
(4, 'PAPER'),
(5, 'ORGANIC');

-- ------------------------------------------------------
-- 2. USERS
-- Selecting a mix of regular users, a moderator, and an admin
-- ------------------------------------------------------
INSERT INTO `users` (`user_id`, `email`, `username`, `password_hash`, `total_xp`, `is_moderator`, `is_admin`) VALUES 
(1, 'cengiz@example.com', 'Cengiz Bilal', '$2a$10$kgh6oleQOEDuoJV0JLe2POfLRGB8XEOkRyuez.x5t0jindLdR3EKG', 100, 1, 1),
(2, 'kerim@example.com', 'kerim', '$2a$10$/m50zCCrHnfF3ftYXQgIMezdBs15zhAhbHnd3xnz7u1cgjzBbsgHu', 50, 1, 0),
(9, 'bartu@example.com', 'CuriousBartu', '$2a$10$G0gV5.a1gn2EkIAeoVxmMOndgr057ZA/ZhB3dyGCidolGPG9Odob.', 20, 1, 0),
(14, 'edmonds@example.com', 'edmonds_j', '$2a$10$gAyT4.F0G7FgS8nB5znSU.y/gwZ07oHKORjYS9OgRfI8TmxgCsJVC', 0, 0, 0),
(84, 'alice@example.com', 'Alice', '$2a$10$96zEEQ.m3x3pmHFYSVAky.YH2n95u2jLUOviARflQZuxWJXXOitAy', 10, 0, 0);

-- ------------------------------------------------------
-- 3. PROFILES
-- Note: If your init.sql has the trigger 'after_user_insert_create_profile', 
-- these rows technically exist now. We use ON DUPLICATE KEY UPDATE to fill in the bio/photo.
-- ------------------------------------------------------
INSERT INTO `profiles` (`user_id`, `biography`, `photo_url`) VALUES 
(1, 'Lead Developer & Admin', NULL),
(2, 'Lifeguarddd', 'https://waste-less-photo-storage-2.sfo3.digitaloceanspaces.com/profile/56db5364.png'),
(9, 'I am curious about recycling', 'https://waste-less-photo-storage-2.sfo3.digitaloceanspaces.com/profile/d8023613.jpg'),
(14, 'Just trying to reduce my footprint', NULL),
(84, 'Love organic recycling', 'https://waste-less-photo-storage-2.sfo3.digitaloceanspaces.com/profile/77056efb.png')
ON DUPLICATE KEY UPDATE biography=VALUES(biography), photo_url=VALUES(photo_url);

-- ------------------------------------------------------
-- 4. WASTE ITEMS
-- A selection of common items for each category
-- ------------------------------------------------------
INSERT INTO `waste_item` (`item_id`, `name`, `display_name`, `weight_in_grams`, `type_id`) VALUES 
-- Plastics (Type ID: 1)
(1, 'PET_BOTTLE_0_5_L', 'PET bottle 0.5 L', 18, 1),
(2, 'PET_BOTTLE_1_5_L', 'PET bottle 1.5 L', 32, 1),
(3, 'PLASTIC_CUP', 'Plastic cup 200–250 ml', 5, 1),
(4, 'TAKEAWAY_CONTAINER', 'Takeaway food container 650 ml', 28, 1),
(5, 'GROCERY_BAG_THIN', 'Grocery bag, thin', 7, 1),
(6, 'GROCERY_BAG_THICK', 'Grocery bag, thick', 25, 1),
(7, 'STRAW', 'Straw', 0.5, 1),
(8, 'COFFEE_LID', 'Coffee lid', 3, 1),
(9, 'YOGURT_CUP', 'Yogurt cup 200 ml', 12, 1),
(10, 'SHRINK_FILM_1M', 'Shrink film 1 m', 10, 1),
(11, 'BOTTLE_CAP', 'Bottle cap', 1.5, 1),
(12, 'PLASTIC_CUTLERY_SET', 'Cutlery set (fork + knife + spoon)', 9, 1),
(47, 'GRAM_PLASTIC', 'Custom (grams)', 1, 1),

-- Metal (Type ID: 2)
(13, 'ALUMINUM_CAN_330_ML', 'Aluminum can 330 ml', 14, 2),
(14, 'ALUMINUM_CAN_500_ML', 'Aluminum can 500 ml', 18, 2),
(15, 'FOOD_TIN', 'Food tin 400 g', 50, 2),
(16, 'TUNA_TIN', 'Tuna tin 160 g', 20, 2),
(17, 'ALUMINUM_FOIL_ROLL', 'Aluminum foil (small roll)', 15, 2),
(18, 'COFFEE_CAPSULE', 'Coffee capsule (aluminum)', 1.2, 2),
(19, 'METAL_JAR_LID', 'Metal jar lid', 8, 2),
(20, 'AEROSOL_CAN', 'Aerosol can (empty)', 45, 2),
(48, 'GRAM_METAL', 'Custom (grams)', 1, 2),

-- Glass (Type ID: 3)
(21, 'GLASS_BOTTLE_330_ML', 'Glass bottle 330 ml', 220, 3),
(22, 'GLASS_BOTTLE_750_ML', 'Glass bottle 750 ml', 500, 3),
(23, 'GLASS_JAR_250_ML', 'Jar 250 ml', 200, 3),
(24, 'GLASS_JAR_720_ML', 'Jar 720 ml', 450, 3),
(25, 'GLASS_CUP', 'Glass cup', 200, 3),
(49, 'GRAM_GLASS', 'Custom (grams)', 1, 3),

-- Paper (Type ID: 4)
(26, 'A4_SHEET', 'A4 sheet (80 gsm)', 5, 4),
(27, 'A4_REAM', 'A4 ream, 500 sheets', 2500, 4),
(28, 'PAPER_CUP', 'Paper cup 250 ml', 10, 4),
(29, 'PIZZA_BOX', 'Pizza box 30–33 cm', 220, 4),
(30, 'SHIPPING_CARTON_SMALL', 'Shipping carton, small', 200, 4),
(31, 'SHIPPING_CARTON_MEDIUM', 'Shipping carton, medium', 400, 4),
(32, 'PAPER_BAG', 'Paper bag, medium', 45, 4),
(33, 'NEWSPAPER_MAGAZINE', 'Newspaper or magazine', 200, 4),
(34, 'CARDBOARD_1_SQ_M', 'Corrugated cardboard 1 m²', 500, 4),
(50, 'GRAM_PAPER', 'Custom (grams)', 1, 4),

-- Organic (Type ID: 5)
(35, 'PLATE_LEFTOVERS', 'Plate leftovers', 220, 5),
(36, 'FRUIT_VEG_PEELS', 'Fruit and veg peels, one handful', 80, 5),
(37, 'COFFEE_GROUNDS', 'Coffee grounds, 1 cup', 65, 5),
(38, 'TEA_BAG', 'Tea bag', 2.5, 5),
(39, 'EGGSHELL', 'Eggshell (1 egg)', 6, 5),
(40, 'USED_COOKING_OIL_1L', 'Used cooking oil 1 L', 920, 5),
(41, 'BREAD_SLICE', 'Slice of bread', 30, 5),
(51, 'GRAM_ORGANIC', 'Custom (grams)', 1, 5);
-- 5. CHALLENGES
-- One Active, One Ended
-- ------------------------------------------------------
INSERT INTO `challenges` (`challenge_id`, `name`, `description`, `type`, `amount`, `current_amount`, `start_date`, `end_date`, `status`) VALUES 
(1, 'Glass Hero', 'A challenge to reduce glass waste in our community.', 3, 1000, 967, '2025-10-17', '2025-12-25', 'Active'),
(2, 'Organic Challenge', 'Lets collect organic waste!', 5, 10000, 3907.5, '2025-12-08', '2025-12-22', 'Active');

-- ------------------------------------------------------
-- 6. CHALLENGE PARTICIPATION
-- ------------------------------------------------------
INSERT INTO `challenge_user` (`challenge_id`, `user_id`, `amount`) VALUES 
(1, 2, 376),
(1, 9, 452.5),
(2, 2, 1237.5),
(2, 84, 18);

-- ------------------------------------------------------
-- 7. POSTS
-- Mock feed content
-- ------------------------------------------------------
INSERT INTO `posts` (`post_id`, `user_id`, `content`, `likes`, `comments`) VALUES 
(1, 9, 'Just picked up my first Tesla electric car. Less oil, cleaner air. #EV', 5, 1),
(2, 14, 'We finally set up three separate bins at home: plastic, metal, and glass. It creates a huge difference!', 12, 2),
(3, 2, 'We’ve launched the Kilyos Beach Cleanup Day challenge as WasteLess Community. Join us!', 21, 0);

-- ------------------------------------------------------
-- 8. COMMENTS & LIKES
-- Interactions on the posts above
-- ------------------------------------------------------
INSERT INTO `comments` (`comment_id`, `post_id`, `user_id`, `content`) VALUES 
(1, 1, 14, 'Congratulations!'),
(2, 2, 2, 'That is the first step! Good job.'),
(3, 2, 84, 'Woww, congratulations. Keep up the good work!');

INSERT INTO `post_likes` (`user_id`, `post_id`) VALUES 
(1, 1), (2, 1), (14, 1), (84, 1), -- Likes for Tesla post
(1, 2), (9, 2), (2, 2); -- Likes for Recycling bins post

-- ------------------------------------------------------
-- 9. FOLLOWS
-- ------------------------------------------------------
INSERT INTO `follows` (`follower_username`, `following_username`) VALUES 
('kerim', 'CuriousBartu'),
('Alice', 'Cengiz Bilal'),
('CuriousBartu', 'kerim');

-- ------------------------------------------------------
-- 10. WASTE GOALS
-- User goals to track progress
-- ------------------------------------------------------
INSERT INTO `waste_goal` (`goal_id`, `user_id`, `type_id`, `restriction_amount_grams`, `duration`, `date`, `percent_of_progress`, `completed`) VALUES 
(1, 14, 1, 5000, 30, '2025-10-20 17:30:26', 5.6, 0), -- Plastic restriction
(2, 84, 5, 10000, 30, '2025-12-09 12:54:47', 4.5, 0); -- Organic goal

-- ------------------------------------------------------
-- 11. WASTE LOGS
-- Logs attached to goals or general logging
-- ------------------------------------------------------
INSERT INTO `waste_log` (`goal_id`, `item_id`, `quantity`, `date`, `user_id`) VALUES 
(1, 5, 10, '2025-10-20 17:30:52', 14), -- Logged grocery bags
(1, 1, 5, '2025-10-21 17:30:52', 14),  -- Logged bottles
(2, 36, 2, '2025-12-10 12:00:00', 84);  -- Logged fruit peels

-- ------------------------------------------------------
-- 12. BADGES
-- ------------------------------------------------------
INSERT INTO `badge` (`name`, `user_id`) VALUES 
('GLASS HERO', 2),
('PLASTIC SAVER', 14),
('ORGANIC HERO', 84);
-- Re-enable foreign keys
SET FOREIGN_KEY_CHECKS = 1;
