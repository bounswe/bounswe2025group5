
-- Create the database (if not exists)
CREATE DATABASE IF NOT EXISTS  zero_waste_challenge_dev;

-- Use the database
USE zero_waste_challenge_dev;


-- User table creation
CREATE TABLE IF NOT EXISTS Users (
    user_id  INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255)  NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    total_xp INT DEFAULT 0,
    is_moderator BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Profile table creation
CREATE TABLE  IF NOT EXISTS  Profiles (
    profile_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    photo_url VARCHAR(255),
    biography TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
    );

-- Notification table creation
CREATE TABLE   IF NOT EXISTS Notifications (
   notification_id INT PRIMARY KEY AUTO_INCREMENT,
   user_id INT NOT NULL,
   message TEXT NOT NULL,
   is_read BOOLEAN DEFAULT FALSE,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
    );

-- Reward table creation
CREATE TABLE   IF NOT EXISTS Rewards (
    reward_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    points_required INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- User-Reward table creation
CREATE TABLE UserRewards (
     user_id INT NOT NULL,
     reward_id INT NOT NULL,
     is_taken BOOLEAN DEFAULT false,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (user_id, reward_id),
     FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
     FOREIGN KEY (reward_id) REFERENCES Rewards(reward_id) ON DELETE CASCADE
);

