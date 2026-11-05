-- Motorsport Race Performance and Strategy Management System
-- DBMS Coursework: SQL Analytics, Views, Stored Procedures, and Triggers
-- Database: motorsport_db

USE motorsport_db;

-- 1. ANALYTICAL QUERIES (Demonstrating Joins, Aggregation, Subqueries, Ordering)

-- Query 1: Constructor / Team Championship Standings
-- Aggregates total points, podiums (top 3 finishes), and race wins per team.
SELECT 
    t.team_name,
    t.nationality,
    COUNT(CASE WHEN rr.position = 1 THEN 1 END) AS wins,
    COUNT(CASE WHEN rr.position <= 3 THEN 1 END) AS podiums,
    SUM(rr.points) AS total_points
FROM team t
JOIN race_result rr ON t.team_id = rr.team_id
GROUP BY t.team_id, t.team_name, t.nationality
ORDER BY total_points DESC;

-- Query 2: Driver Qualifying vs. Race Finish & Positions Gained/Lost
-- Shows grid position vs race finish for Bahrain GP (Round 1), highlighting overtake performance.
SELECT 
    d.driver_name,
    t.team_name,
    qr.position AS qual_position,
    rr.grid_position,
    rr.position AS finish_position,
    (rr.grid_position - rr.position) AS positions_gained,
    rr.status
FROM race r
JOIN race_result rr ON r.race_id = rr.race_id
JOIN driver d ON rr.driver_id = d.driver_id
JOIN team t ON rr.team_id = t.team_id
LEFT JOIN qualifying_result qr ON qr.race_id = r.race_id AND qr.driver_id = d.driver_id
WHERE r.round_no = 1
ORDER BY rr.position ASC;

-- Query 3: Pit Stop Strategy and Efficiency Analysis
-- Calculates pit stop count, fastest stop, and average stop duration per driver across a race.
SELECT 
    r.round_no,
    c.circuit_name,
    d.driver_name,
    t.team_name,
    COUNT(ps.stop_id) AS total_pit_stops,
    MIN(ps.duration) AS fastest_stop_seconds,
    ROUND(AVG(ps.duration), 3) AS avg_stop_seconds
FROM pit_stop ps
JOIN race r ON ps.race_id = r.race_id
JOIN circuit c ON r.circuit_id = c.circuit_id
JOIN driver d ON ps.driver_id = d.driver_id
JOIN race_result rr ON r.race_id = rr.race_id AND d.driver_id = rr.driver_id
JOIN team t ON rr.team_id = t.team_id
WHERE r.round_no = 1 -- Example: Round 1 Bahrain GP
GROUP BY r.round_no, c.circuit_name, d.driver_id, d.driver_name, t.team_name
ORDER BY total_pit_stops DESC, avg_stop_seconds ASC;

-- Query 4: Subquery Analysis - Drivers who scored above average points in a single race
-- Demonstrates correlated subquery comparing individual performance to the race field.
SELECT 
    r.round_no,
    d.driver_name,
    t.team_name,
    rr.position,
    rr.points
FROM race_result rr
JOIN race r ON rr.race_id = r.race_id
JOIN driver d ON rr.driver_id = d.driver_id
JOIN team t ON rr.team_id = t.team_id
WHERE rr.points > (
    SELECT AVG(points) 
    FROM race_result sub_rr 
    WHERE sub_rr.race_id = rr.race_id AND sub_rr.points > 0
)
ORDER BY r.round_no ASC, rr.position ASC;

-- Query 5: Season Driver Consistency and DNF (Did Not Finish) Rates
-- Demonstrates CASE WHEN conditions, COUNT, and percentage calculations.
SELECT 
    d.driver_name,
    t.team_name,
    COUNT(rr.result_id) AS total_starts,
    COUNT(CASE WHEN rr.status IN ('Finished', 'Lapped') OR rr.status LIKE '+% Lap%' THEN 1 END) AS total_finishes,
    COUNT(CASE WHEN rr.status NOT IN ('Finished', 'Lapped') AND rr.status NOT LIKE '+% Lap%' THEN 1 END) AS total_dnfs,
    ROUND((COUNT(CASE WHEN rr.status IN ('Finished', 'Lapped') OR rr.status LIKE '+% Lap%' THEN 1 END) / COUNT(rr.result_id)) * 100, 1) AS completion_percentage
FROM driver d
JOIN race_result rr ON d.driver_id = rr.driver_id
LEFT JOIN team t ON rr.team_id = t.team_id
GROUP BY d.driver_id, d.driver_name, t.team_name
ORDER BY completion_percentage DESC, total_finishes DESC;


-- 2. VIEWS (Relational Abstractions for Dashboard & Reporting)

-- View 1: Complete Race Classification View
-- Denormalizes race results with circuit, driver, and constructor details for easy querying.
CREATE OR REPLACE VIEW view_race_classification AS
SELECT 
    r.race_id,
    r.round_no,
    r.race_date,
    c.circuit_name,
    c.country,
    rr.position,
    rr.grid_position,
    d.driver_id,
    d.driver_name,
    t.team_id,
    t.team_name,
    rr.laps_completed,
    rr.points,
    rr.status
FROM race r
JOIN circuit c ON r.circuit_id = c.circuit_id
JOIN race_result rr ON r.race_id = rr.race_id
JOIN driver d ON rr.driver_id = d.driver_id
JOIN team t ON rr.team_id = t.team_id;

-- View 2: Season Driver Standings with Constructor Summary View
CREATE OR REPLACE VIEW view_season_standings AS
SELECT 
    ds.position AS championship_rank,
    d.driver_name,
    d.nationality AS driver_nationality,
    t.team_name,
    ds.points AS championship_points,
    ds.wins AS total_wins,
    s.year AS season_year
FROM driver_standing ds
JOIN driver d ON ds.driver_id = d.driver_id
LEFT JOIN team t ON d.team_id = t.team_id
JOIN season s ON ds.season_id = s.season_id
ORDER BY ds.position ASC;


-- 3. STORED PROCEDURE (Encapsulating Business Logic)

-- Procedure: Get Driver Performance Card for a Specific Season
-- Returns head-to-head metrics for a given driver: wins, points, best finish, and avg pit stop.
DROP PROCEDURE IF EXISTS sp_get_driver_season_summary;

DELIMITER //
CREATE PROCEDURE sp_get_driver_season_summary(
    IN p_year INT,
    IN p_driver_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    SELECT 
        d.driver_name,
        s.year AS season,
        COUNT(rr.result_id) AS races_entered,
        MIN(rr.position) AS best_finish,
        SUM(rr.points) AS total_points,
        COUNT(CASE WHEN rr.position = 1 THEN 1 END) AS total_wins,
        COUNT(CASE WHEN rr.position <= 3 THEN 1 END) AS podiums,
        (
            SELECT ROUND(AVG(ps.duration), 3)
            FROM pit_stop ps
            JOIN race r ON ps.race_id = r.race_id
            WHERE ps.driver_id = d.driver_id AND r.season_id = s.season_id
        ) AS avg_pit_stop_duration
    FROM driver d
    JOIN race_result rr ON d.driver_id = rr.driver_id
    JOIN race r ON rr.race_id = r.race_id
    JOIN season s ON r.season_id = s.season_id
    WHERE s.year = p_year AND d.driver_name LIKE CONCAT('%', p_driver_name COLLATE utf8mb4_unicode_ci, '%')
    GROUP BY d.driver_id, d.driver_name, s.season_id, s.year;
END //
DELIMITER ;


-- 4. TRIGGER (Enforcing Integrity & Business Logic)

-- Trigger: Validate Pit Stop Duration Before Insert/Update
-- Ensures no negative durations and warns/caps anomalous records.
DROP TRIGGER IF EXISTS trg_validate_pit_stop_duration;

DELIMITER //
CREATE TRIGGER trg_validate_pit_stop_duration
BEFORE INSERT ON pit_stop
FOR EACH ROW
BEGIN
    IF NEW.duration < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: Pit stop duration cannot be negative.';
    END IF;
END //
DELIMITER ;

