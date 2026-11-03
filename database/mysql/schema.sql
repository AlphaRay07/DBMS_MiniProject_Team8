-- Motorsport Race Performance and Strategy Management System
-- Database Schema for MySQL 8+ (InnoDB)

CREATE DATABASE IF NOT EXISTS motorsport_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE motorsport_db;

-- 1. TEAM Table
CREATE TABLE IF NOT EXISTS team (
    team_id INT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    nationality VARCHAR(50),
    base VARCHAR(100),
    jolpica_constructor_id VARCHAR(50) UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. DRIVER Table
CREATE TABLE IF NOT EXISTS driver (
    driver_id INT AUTO_INCREMENT PRIMARY KEY,
    driver_name VARCHAR(100) NOT NULL,
    nationality VARCHAR(50),
    dob DATE,
    team_id INT,
    jolpica_driver_id VARCHAR(50) UNIQUE,
    FOREIGN KEY (team_id) REFERENCES team(team_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. SEASON Table
CREATE TABLE IF NOT EXISTS season (
    season_id INT AUTO_INCREMENT PRIMARY KEY,
    year INT NOT NULL UNIQUE,
    start_date DATE,
    end_date DATE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. CIRCUIT Table
CREATE TABLE IF NOT EXISTS circuit (
    circuit_id INT AUTO_INCREMENT PRIMARY KEY,
    circuit_name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    country VARCHAR(50),
    jolpica_circuit_id VARCHAR(50) UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. RACE Table
CREATE TABLE IF NOT EXISTS race (
    race_id INT AUTO_INCREMENT PRIMARY KEY,
    season_id INT NOT NULL,
    circuit_id INT NOT NULL,
    round_no INT NOT NULL,
    race_date DATE NOT NULL,
    UNIQUE (season_id, round_no),
    FOREIGN KEY (season_id) REFERENCES season(season_id) ON DELETE CASCADE,
    FOREIGN KEY (circuit_id) REFERENCES circuit(circuit_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. QUALIFYING_RESULT Table
CREATE TABLE IF NOT EXISTS qualifying_result (
    qualifying_id INT AUTO_INCREMENT PRIMARY KEY,
    race_id INT NOT NULL,
    driver_id INT NOT NULL,
    position INT,
    q1_time TIME(3),
    q2_time TIME(3),
    q3_time TIME(3),
    UNIQUE (race_id, driver_id),
    FOREIGN KEY (race_id) REFERENCES race(race_id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES driver(driver_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. PIT_STOP Table
CREATE TABLE IF NOT EXISTS pit_stop (
    stop_id INT AUTO_INCREMENT PRIMARY KEY,
    race_id INT NOT NULL,
    driver_id INT NOT NULL,
    lap_number INT NOT NULL,
    stop_time TIME,
    duration DECIMAL(8,3),
    CHECK (lap_number > 0),
    CHECK (duration IS NULL OR duration >= 0),
    FOREIGN KEY (race_id) REFERENCES race(race_id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES driver(driver_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. DRIVER_STANDING Table
CREATE TABLE IF NOT EXISTS driver_standing (
    standing_id INT AUTO_INCREMENT PRIMARY KEY,
    season_id INT NOT NULL,
    driver_id INT NOT NULL,
    position INT,
    points DECIMAL(6,2),
    wins INT,
    UNIQUE (season_id, driver_id),
    FOREIGN KEY (season_id) REFERENCES season(season_id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES driver(driver_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. RACE_RESULT Table
CREATE TABLE IF NOT EXISTS race_result (
    result_id INT AUTO_INCREMENT PRIMARY KEY,
    race_id INT NOT NULL,
    driver_id INT NOT NULL,
    position INT,
    grid_position INT,
    laps_completed INT,
    points DECIMAL(6,2) DEFAULT 0,
    status VARCHAR(50),
    team_id INT NULL,
    UNIQUE (race_id, driver_id),
    FOREIGN KEY (race_id) REFERENCES race(race_id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES driver(driver_id) ON DELETE RESTRICT,
    FOREIGN KEY (team_id) REFERENCES team(team_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

