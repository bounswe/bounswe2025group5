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
    REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_goal_type`
    FOREIGN KEY (`type_id`)
    REFERENCES `waste_type` (`type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


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
    REFERENCES `users` (`user_id`) ON DELETE CASCADE,
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
  `description`   VARCHAR(400) NOT NULL,
  `type`          VARCHAR(50) NOT NULL,
  `amount`        DOUBLE NOT NULL,
  `current_amount` DOUBLE NOT NULL DEFAULT 0,
  `start_date`    DATE NOT NULL,
  `end_date`      DATE NOT NULL,
  `status`        ENUM('Active','Requested','Ended','Completed') DEFAULT 'Active',
  PRIMARY KEY (`challenge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `challenge_log` (
  `log_id`       INT NOT NULL AUTO_INCREMENT,
  `challenge_id` INT NOT NULL,
  `user_id`      INT NOT NULL,
  `amount`       DOUBLE NOT NULL,
  `timestamp`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  INDEX `fk_log_challenge_idx` (`challenge_id` ASC),
  INDEX `fk_log_user_idx` (`user_id` ASC),
  CONSTRAINT `fk_log_challenge`
    FOREIGN KEY (`challenge_id`)
    REFERENCES `challenges` (`challenge_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_challenge_log_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `challenge_user` (
  `challenge_id`  INT NOT NULL,
  `user_id`       INT NOT NULL,
  `amount`        DOUBLE NOT NULL DEFAULT 0,
  -- Composite Primary Key: A user can only be associated with a challenge once.
  PRIMARY KEY (`challenge_id`, `user_id`),
  INDEX `fk_cu_user_idx` (`user_id` ASC),
  CONSTRAINT `fk_cu_challenge`
    FOREIGN KEY (`challenge_id`)
    REFERENCES `challenges` (`challenge_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_cu_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`) -- Assuming you have a 'users' table
    ON DELETE CASCADE
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
  CONSTRAINT `posts_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



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
  CONSTRAINT `FK4ear62j8k2olcikuil4rye8la` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
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
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
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
        FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
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

DELIMITER $$
-- Trigger: Sets the owner of deleted posts and comments to the deleted_user. Which is the user with the id 12 currently
CREATE TRIGGER before_user_delete
    BEFORE DELETE ON users
    FOR EACH ROW
BEGIN
    -- Reassign posts to anonymous user
    UPDATE posts
    SET user_id = 12
    WHERE user_id = OLD.user_id;

    -- Reassign comments to anonymous user
    UPDATE comments
    SET user_id = 12
    WHERE user_id = OLD.user_id;
    END$$

DELIMITER ;



DELIMITER $$

-- ==========================================================================================
-- TRIGGER  After a new waste log is INSERTED
-- This trigger recalculates the progress for the goal associated with the newly added log.
-- ==========================================================================================
CREATE TRIGGER `log_after_insert`
AFTER INSERT ON `waste_log`
FOR EACH ROW
BEGIN
    DECLARE total_waste_grams DOUBLE;
    SELECT SUM(wi.weight_in_grams * wl.quantity)
    INTO total_waste_grams
    FROM `waste_log` wl
    JOIN `waste_item` wi ON wl.item_id = wi.item_id
    WHERE wl.goal_id = NEW.goal_id; 

    -- Update the percent_of_progress in the waste_goal table.
    -- IFNULL is used to handle the case where a goal has no logs, preventing division by null.
    UPDATE `waste_goal`
    SET percent_of_progress = (IFNULL(total_waste_grams, 0) / restriction_amount_grams) * 100
    WHERE goal_id = NEW.goal_id;
END$$

-- ==========================================================================================
-- TRIGGER : After a waste log is UPDATED
-- This trigger handles changes to a log, such as updating its quantity or moving it
-- ==========================================================================================
CREATE TRIGGER `log_after_update`
AFTER UPDATE ON `waste_log`
FOR EACH ROW
BEGIN
    DECLARE total_waste_grams DOUBLE;

    SELECT SUM(wi.weight_in_grams * wl.quantity)
    INTO total_waste_grams
    FROM `waste_log` wl
    JOIN `waste_item` wi ON wl.item_id = wi.item_id
    WHERE wl.goal_id = OLD.goal_id; 

    UPDATE `waste_goal`
    SET percent_of_progress = (IFNULL(total_waste_grams, 0) / restriction_amount_grams) * 100
    WHERE goal_id = OLD.goal_id;
    
END$$

-- ==========================================================================================
-- TRIGGER: After a waste log is DELETED
-- This trigger recalculates the progress for the goal from which a log was removed.
-- ==========================================================================================
CREATE TRIGGER `log_after_delete`
AFTER DELETE ON `waste_log`
FOR EACH ROW
BEGIN
    DECLARE total_waste_grams DOUBLE;
    
    SELECT SUM(wi.weight_in_grams * wl.quantity)
    INTO total_waste_grams
    FROM `waste_log` wl
    JOIN `waste_item` wi ON wl.item_id = wi.item_id
    WHERE wl.goal_id = OLD.goal_id; 

    -- Update the progress. If this was the last log for the goal, the total will be 0.
    UPDATE `waste_goal`
    SET percent_of_progress = (IFNULL(total_waste_grams, 0) / restriction_amount_grams) * 100
    WHERE goal_id = OLD.goal_id;
END$$

DELIMITER ;


DELIMITER $$
--  TRIGGER 
-- This single trigger handles all logic for the waste_goal table to prevent recursive update errors.
-- It recalculates progress if the restriction changes AND sets the completed status.
-- ==========================================================================================
CREATE TRIGGER `goal_before_update`
BEFORE UPDATE ON `waste_goal`
FOR EACH ROW
BEGIN
    DECLARE total_waste_grams DOUBLE;

    -- First, check if the restriction amount is being changed.
    IF NEW.restriction_amount_grams <> OLD.restriction_amount_grams THEN
        SELECT IFNULL(SUM(wi.weight_in_grams * wl.quantity), 0)
        INTO total_waste_grams
        FROM `waste_log` wl
        JOIN `waste_item` wi ON wl.item_id = wi.item_id
        WHERE wl.goal_id = NEW.goal_id;

        -- Modify the NEW row directly. 
        SET NEW.percent_of_progress = (total_waste_grams / NEW.restriction_amount_grams) * 100;
    END IF;

    -- Second, based on the final 'percent_of_progress' (whether it came from the
    IF NEW.percent_of_progress >= 100 THEN
        SET NEW.completed = 1;
    ELSE
        SET NEW.completed = 0;
    END IF;
END$$


-- Reset the delimiter back to the default
DELIMITER ;










DELIMITER $$
CREATE TRIGGER `after_challenge_user_insert`
AFTER INSERT ON `challenge_user`
FOR EACH ROW
BEGIN
    UPDATE `challenges`
    SET `current_amount` = (
        SELECT IFNULL(SUM(`amount`), 0)
        FROM `challenge_user`
        WHERE `challenge_id` = NEW.challenge_id
    )
    WHERE `challenge_id` = NEW.challenge_id;
END$$

CREATE TRIGGER `after_challenge_user_update`
AFTER UPDATE ON `challenge_user`
FOR EACH ROW
BEGIN
    UPDATE `challenges`
    SET `current_amount` = (
        SELECT IFNULL(SUM(`amount`), 0)
        FROM `challenge_user`
        WHERE `challenge_id` = NEW.challenge_id
    )
    WHERE `challenge_id` = NEW.challenge_id;
END$$

CREATE TRIGGER `after_challenge_user_delete`
AFTER DELETE ON `challenge_user`
FOR EACH ROW
BEGIN
    UPDATE `challenges`
    SET `current_amount` = (
        SELECT IFNULL(SUM(`amount`), 0)
        FROM `challenge_user`
        WHERE `challenge_id` = OLD.challenge_id
    )
    WHERE `challenge_id` = OLD.challenge_id;
END$$
DELIMITER ;




