
CREATE DATABASE  zero_waste_challenge_dev;
USE zero_waste_challenge_dev;

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


CREATE TABLE IF NOT EXISTS  `challenges` (
  `challenge_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(200) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('Active','Requested','Ended') DEFAULT NULL,
  PRIMARY KEY (`challenge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE IF NOT EXISTS  `forumfeeds` (
  `feed_id` int NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`feed_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS  `leaderboards` (
  `leaderboard_id` int NOT NULL AUTO_INCREMENT,
  `location` varchar(50) DEFAULT NULL,
  `type` enum('Plastic','Organic','Paper','Metal','Glass') DEFAULT NULL,
  PRIMARY KEY (`leaderboard_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
CREATE TABLE IF NOT EXISTS  `posts` (
  `post_id` int NOT NULL AUTO_INCREMENT,
  `feed_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  `content` varchar(1000) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `likes` int DEFAULT '0',
  `photo_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`post_id`),
  KEY `feed_id` (`feed_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`feed_id`) REFERENCES `forumfeeds` (`feed_id`) ON DELETE SET NULL,
  CONSTRAINT `posts_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS  `postattachments` (
  `attachment_id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `file_url` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`attachment_id`),
  KEY `post_id` (`post_id`),
  CONSTRAINT `postattachments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`post_id`) ON DELETE CASCADE
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
CREATE TABLE IF NOT EXISTS  `report` (
  `report_id` int NOT NULL AUTO_INCREMENT,
  `reason` varchar(500) DEFAULT NULL,
  `report_date` date NOT NULL,
  `status` enum('Received','Resolved') DEFAULT NULL,
  PRIMARY KEY (`report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
CREATE TABLE  IF NOT EXISTS  `userchallenge` (
  `user_id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`challenge_id`),
  KEY `challenge_id` (`challenge_id`),
  CONSTRAINT `userchallenge_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `userchallenge_ibfk_2` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`challenge_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS  `userleaderboard` (
  `leaderboard_id` int NOT NULL,
  `user_id` int NOT NULL,
  `ranking` int NOT NULL,
  `score` int NOT NULL,
  PRIMARY KEY (`leaderboard_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `userleaderboard_ibfk_1` FOREIGN KEY (`leaderboard_id`) REFERENCES `leaderboards` (`leaderboard_id`) ON DELETE CASCADE,
  CONSTRAINT `userleaderboard_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS `waste_goal` (
  `goal_id` int NOT NULL AUTO_INCREMENT,
  `amount` double NOT NULL,
  `completed` int DEFAULT NULL,
  `date` datetime(6) DEFAULT NULL,
  `duration` int NOT NULL,
  `unit` enum('Bottles','Grams','Kilograms','Liters','Units') NOT NULL,
  `waste_type` enum('Glass','Metal','Organic','Paper','Plastic') NOT NULL,
  `user_id` int NOT NULL,
  `percent_of_progress` double NOT NULL,
  PRIMARY KEY (`goal_id`),
  KEY `FKse1ot0u1fnhydngk6twcr7o9c` (`user_id`),
  CONSTRAINT `FKse1ot0u1fnhydngk6twcr7o9c` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS  `waste_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `amount` double NOT NULL,
  `date` datetime(6) NOT NULL,
  `waste_type` enum('Glass','Metal','Organic','Paper','Plastic') NOT NULL,
  `goal_id` int NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`log_id`),
  KEY `FKp4jk44o8g52bo9xgvrtafh6rd` (`goal_id`),
  KEY `FK1molkjvpagax7fnro61pvmkw1` (`user_id`),
  CONSTRAINT `FK1molkjvpagax7fnro61pvmkw1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `FKp4jk44o8g52bo9xgvrtafh6rd` FOREIGN KEY (`goal_id`) REFERENCES `waste_goal` (`goal_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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

CREATE TABLE IF NOT EXISTS  `badge` (
  `badge_id` int NOT NULL AUTO_INCREMENT,
  `description` varchar(255) NOT NULL,
  `criteria` varchar(255) NOT NULL,
  PRIMARY KEY (`badge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS  `userhasbadge` (
  `user_id` int NOT NULL,
  `badge_id` int NOT NULL,
  `date_achieved` date NOT NULL,
  PRIMARY KEY (`user_id`,`badge_id`),
  KEY `badge_id` (`badge_id`),
  CONSTRAINT `userhasbadge_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `userhasbadge_ibfk_2` FOREIGN KEY (`badge_id`) REFERENCES `badge` (`badge_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- Create post_likes table with proper foreign key constraints
CREATE TABLE IF NOT EXISTS `post_likes` (
                                            `user_id` INT NOT NULL,
                                            `post_id` INT NOT NULL,
                                            `liked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                            PRIMARY KEY (`user_id`, `post_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    FOREIGN KEY (`post_id`) REFERENCES `posts` (`post_id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Trigger to increment likes count when a new like is added
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

-- Trigger to decrement likes count when a like is removed
DELIMITER $$
    CREATE TRIGGER `after_like_delete`
        AFTER DELETE ON `post_likes`
        FOR EACH ROW
    BEGIN
        UPDATE `posts`
        SET `likes` = `likes` - 1
        WHERE `post_id` = OLD.post_id;
        END$$
        DELIMITER ;