DROP DATABASE waste_less;
CREATE DATABASE  waste_less;
Use  waste_less;
CREATE  TABLE IF NOT EXISTS  `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `total_xp` int DEFAULT '0',
  `is_moderator` tinyint(1) DEFAULT '0',
  `is_admin` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`)
) ;

CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `email` VARCHAR(255) NOT NULL,
  `token` VARCHAR(512) NOT NULL,
  `expiry_date` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `waste_goal` (
  `goal_id`               INT NOT NULL AUTO_INCREMENT,
  `user_id`               INT NOT NULL,
  `type_id`               INT NOT NULL,
  `restriction_amount_grams`   DOUBLE NOT NULL,
  `duration`              INT NOT NULL,
  `date`                  DATETIME(6) NOT NULL,
  `percent_of_progress`   DOUBLE NOT NULL DEFAULT 0.0,
  `completed`             INT  DEFAULT 0,
  PRIMARY KEY (`goal_id`),
  INDEX `fk_goal_user_idx` (`user_id` ASC),
  INDEX `fk_goal_type_idx` (`type_id` ASC),
  CONSTRAINT `fk_goal_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_goal_type`
    FOREIGN KEY (`type_id`)
    REFERENCES `waste_type` (`type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE   IF NOT EXISTS waste_type (
    type_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS  waste_item (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    weight_in_grams DOUBLE PRECISION NOT NULL,
    type_id INT NOT NULL,
    FOREIGN KEY (type_id) REFERENCES waste_type(type_id)
);

CREATE TABLE IF NOT EXISTS `waste_log` (
  `log_id`    INT NOT NULL AUTO_INCREMENT,
  `user_id`   INT NOT NULL,
  `goal_id`   INT NOT NULL,
  `item_id`   INT NOT NULL,
  `quantity`  INT NOT NULL,
  `date`      DATETIME(6) NOT NULL,
  PRIMARY KEY (`log_id`),
  INDEX `fk_log_user_idx` (`user_id` ASC),
  INDEX `fk_log_goal_idx` (`goal_id` ASC),
  INDEX `fk_log_item_idx` (`item_id` ASC),
  CONSTRAINT `fk_log_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_log_goal`
    FOREIGN KEY (`goal_id`)
    REFERENCES `waste_goal` (`goal_id`),
  CONSTRAINT `fk_log_item`
    FOREIGN KEY (`item_id`)
    REFERENCES `waste_item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `challenges` (
  `challenge_id`  INT NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(100) NOT NULL,
  `description`   VARCHAR(200) NOT NULL,
  `amount`        DOUBLE NOT NULL,
  `start_date`    DATE NOT NULL,
  `end_date`      DATE NOT NULL,
  `status`        ENUM('Active','Requested','Ended') DEFAULT 'Active',
  `type_id`       INT NOT NULL,
  PRIMARY KEY (`challenge_id`),
  INDEX `fk_challenge_type_idx` (`type_id` ASC),
  CONSTRAINT `fk_challenge_type`
    FOREIGN KEY (`type_id`)
    REFERENCES `waste_type` (`type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE IF NOT EXISTS  `posts` (
  `post_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `content` varchar(1000) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `likes` int DEFAULT '0',
  `comments` int DEFAULT '0',
  `photo_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`post_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `posts_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `user_challenge_progress` (
  `user_id`             INT NOT NULL,
  `challenge_id`        INT NOT NULL,
  `remaining_amount`    DOUBLE DEFAULT NULL,
  PRIMARY KEY (`user_id`, `challenge_id`),
  INDEX `fk_progress_challenge_idx` (`challenge_id` ASC),
  CONSTRAINT `fk_progress_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_progress_challenge`
    FOREIGN KEY (`challenge_id`)
    REFERENCES `challenges` (`challenge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE  IF NOT EXISTS  `profiles` (
  `profile_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `biography` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`profile_id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



CREATE TABLE IF NOT EXISTS  `rewards` (
  `reward_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) NOT NULL,
  `points_required` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`reward_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



CREATE TABLE IF NOT EXISTS  `user_rewards` (
  `created_at` datetime(6) DEFAULT NULL,
  `is_taken` bit(1) NOT NULL,
  `reward_id` int NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`reward_id`,`user_id`),
  KEY `FK4ear62j8k2olcikuil4rye8la` (`user_id`),
  CONSTRAINT `FK4ear62j8k2olcikuil4rye8la` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `FKj53yk8gtooowu02nlq4isx5dd` FOREIGN KEY (`reward_id`) REFERENCES `rewards` (`reward_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;




CREATE TABLE  IF NOT EXISTS  `comments` (
  `comment_id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `user_id` int NOT NULL,
  `content` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`comment_id`),
  KEY `post_id` (`post_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`post_id`) ON DELETE CASCADE,
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



CREATE TABLE IF NOT EXISTS `post_likes` (
                                            `user_id` INT NOT NULL,
                                            `post_id` INT NOT NULL,
                                            `liked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                            PRIMARY KEY (`user_id`, `post_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    FOREIGN KEY (`post_id`) REFERENCES `posts` (`post_id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE `saved_posts` (
    `post_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `saved_at` DATETIME(6) DEFAULT NULL,
    PRIMARY KEY (`post_id`, `user_id`),
    KEY `FKs9a5ulcshnympbu557ps3qdlv` (`user_id`),
    CONSTRAINT `FK9poxgdc1595vxdxkyg202x4ge` 
        FOREIGN KEY (`post_id`) REFERENCES `posts` (`post_id`),
    CONSTRAINT `FKs9a5ulcshnympbu557ps3qdlv` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_0900_ai_ci;
  

  
CREATE TABLE IF NOT EXISTS  `notifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `message` varchar(255) NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE badge (
    name VARCHAR(255) NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (name, user_id),
    CONSTRAINT fk_badge_user FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- Trigger: after_like_insert
-- Purpose: After a new row is inserted into `post_likes`,
--          automatically increment the `likes` counter
--          in the corresponding row of the `posts` table.
DELIMITER $$
CREATE TRIGGER `after_like_insert`
    AFTER INSERT ON `post_likes`
    FOR EACH ROW
BEGIN
    UPDATE `posts`
    SET `likes` = `likes` + 1
    WHERE `post_id` = NEW.post_id;
END$$
DELIMITER ;

-- Trigger: after_like_delete
DELIMITER $$
CREATE TRIGGER after_like_delete
AFTER DELETE ON post_likes
FOR EACH ROW
BEGIN
    UPDATE posts
    SET likes = likes - 1
    WHERE post_id = OLD.post_id;
END$$
DELIMITER ;

-- Trigger: after_comment_insert
DELIMITER $$
CREATE TRIGGER after_comment_insert
AFTER INSERT ON comments
FOR EACH ROW
BEGIN
    UPDATE posts
    SET comments = comments + 1
    WHERE post_id = NEW.post_id;
END$$
DELIMITER ;

-- Trigger: after_comment_delete
DELIMITER $$
CREATE TRIGGER after_comment_delete
AFTER DELETE ON comments
FOR EACH ROW
BEGIN
    UPDATE posts
    SET comments = comments - 1
    WHERE post_id = OLD.post_id;
END$$
DELIMITER ;

DELIMITER $$
-- Trigger: after_user_insert_create_profile

CREATE TRIGGER after_user_insert_create_profile
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO profiles (user_id)
    VALUES (NEW.user_id);
END$$

DELIMITER ;
-- THESE COULD BE CHANGED SINCE THE LOGIC OF CHALLENGE WILL BE CHANGED, SO THESE TRIGGERS WERE NOT CREATED BUT GIVEN AS REFERENCE FOR FUTURE
/*
DELIMITER $$

-- After INSERT on waste_log
CREATE TRIGGER after_waste_log_insert
AFTER INSERT ON waste_log
FOR EACH ROW
BEGIN
    -- Update active user challenge progress
    UPDATE user_challenge_progress ucp
    JOIN challenges c ON ucp.challenge_id = c.challenge_id
    SET ucp.remaining_amount = ucp.remaining_amount - NEW.amount
    WHERE ucp.user_id = NEW.user_id
      AND ucp.waste_type = NEW.waste_type
      AND c.status = 'Active'
      AND c.start_date <= DATE(NEW.date)
      AND c.end_date   >= DATE(NEW.date);

    -- Update waste goal progress
    UPDATE waste_goal wg
    SET wg.percent_of_progress = LEAST(100, wg.percent_of_progress + (NEW.amount / wg.amount) * 100)
    WHERE wg.user_id = NEW.user_id
      AND wg.waste_type = NEW.waste_type
      AND wg.amount > 0
      AND DATE(NEW.date) BETWEEN DATE_SUB(DATE(wg.date), INTERVAL wg.duration DAY) AND DATE(wg.date);
END$$


-- After DELETE on waste_log
CREATE TRIGGER after_waste_log_delete
AFTER DELETE ON waste_log
FOR EACH ROW
BEGIN
    -- Rollback challenge progress
    UPDATE user_challenge_progress ucp
    JOIN challenges c ON ucp.challenge_id = c.challenge_id
    SET ucp.remaining_amount = ucp.remaining_amount + OLD.amount
    WHERE ucp.user_id = OLD.user_id
      AND ucp.waste_type = OLD.waste_type
      AND c.status = 'Active'
      AND c.start_date <= DATE(OLD.date)
      AND c.end_date   >= DATE(OLD.date);

    -- Rollback waste goal progress
    UPDATE waste_goal wg
    SET wg.percent_of_progress = GREATEST(0, wg.percent_of_progress - (OLD.amount / wg.amount) * 100)
    WHERE wg.user_id = OLD.user_id
      AND wg.waste_type = OLD.waste_type
      AND wg.amount > 0
      AND DATE(OLD.date) BETWEEN DATE_SUB(DATE(wg.date), INTERVAL wg.duration DAY) AND DATE(wg.date);
END$$


-- After UPDATE on waste_log
CREATE TRIGGER after_waste_log_update
AFTER UPDATE ON waste_log
FOR EACH ROW
BEGIN
    -- Rollback old challenge
    UPDATE user_challenge_progress ucp
    JOIN challenges c ON ucp.challenge_id = c.challenge_id
    SET ucp.remaining_amount = ucp.remaining_amount + OLD.amount
    WHERE ucp.user_id = OLD.user_id
      AND ucp.waste_type = OLD.waste_type
      AND c.status = 'Active'
      AND c.start_date <= DATE(OLD.date)
      AND c.end_date   >= DATE(OLD.date);

    -- Apply new challenge
    UPDATE user_challenge_progress ucp
    JOIN challenges c ON ucp.challenge_id = c.challenge_id
    SET ucp.remaining_amount = ucp.remaining_amount - NEW.amount
    WHERE ucp.user_id = NEW.user_id
      AND ucp.waste_type = NEW.waste_type
      AND c.status = 'Active'
      AND c.start_date <= DATE(NEW.date)
      AND c.end_date   >= DATE(NEW.date);

    -- Rollback old waste goal
    UPDATE waste_goal wg
    SET wg.percent_of_progress = GREATEST(0, wg.percent_of_progress - (OLD.amount / wg.amount) * 100)
    WHERE wg.user_id = OLD.user_id
      AND wg.waste_type = OLD.waste_type
      AND wg.amount > 0
      AND DATE(OLD.date) BETWEEN DATE_SUB(DATE(wg.date), INTERVAL wg.duration DAY) AND DATE(wg.date);

    -- Apply new waste goal
    UPDATE waste_goal wg
    SET wg.percent_of_progress = LEAST(100, wg.percent_of_progress + (NEW.amount / wg.amount) * 100)
    WHERE wg.user_id = NEW.user_id
      AND wg.waste_type = NEW.waste_type
      AND wg.amount > 0
      AND DATE(NEW.date) BETWEEN DATE_SUB(DATE(wg.date), INTERVAL wg.duration DAY) AND DATE(wg.date);
END$$

*/

