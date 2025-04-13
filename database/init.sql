
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
CREATE TABLE IF NOT EXISTS UserRewards (
     user_id INT NOT NULL,
     reward_id INT NOT NULL,
     is_taken BOOLEAN DEFAULT false,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (user_id, reward_id),
     FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
     FOREIGN KEY (reward_id) REFERENCES Rewards(reward_id) ON DELETE CASCADE
);

-- Challenges table creation
CREATE TABLE IF NOT EXISTS Challenges (
    challenge_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(200) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM ('Active', 'Requested', 'Ended')
);

-- User-Challenges table creation
CREATE TABLE IF NOT EXISTS UserChallenge (
    user_id INT NOT NULL,
    challenge_id INT NOT NULL,
    joined_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, challenge_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (challenge_id) REFERENCES Challenges(challenge_id) ON DELETE CASCADE
);

-- Leaderboards table creation
CREATE TABLE IF NOT EXISTS Leaderboards (
    leaderboard_id INT PRIMARY KEY AUTO_INCREMENT,
    location VARCHAR(50),
    type ENUM ('Plastic', 'Organic', 'Paper', 'Metal', 'Glass')
);

-- User-Leaderboard table creation
CREATE TABLE IF NOT EXISTS UserLeaderboard (
    leaderboard_id INT NOT NULL,
    user_id INT NOT NULL,
    ranking INT NOT NULL,
    score INT NOT NULL,
    PRIMARY KEY (leaderboard_id, user_id),
    FOREIGN KEY (leaderboard_id) REFERENCES Leaderboards(leaderboard_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS Report (
    report_id INT PRIMARY KEY AUTO_INCREMENT,
    reason VARCHAR(500),
    report_date DATE NOT NULL,
    status ENUM ('Received', 'Resolved')
);