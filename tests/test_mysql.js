/**
 * MySQL Coursework Verification & Test Suite
 * Tests MySQL 8+ / MariaDB schema, tables, foreign keys, triggers,
 * stored procedures, views, and complex analytical queries.
 */

const mysql = require('../web-app/node_modules/mysql2/promise');

async function testMySQL() {
  console.log('🧪 Starting MySQL Verification Test Suite (motorsport_db)...\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  function assert(cond, msg) {
    if (!cond) throw new Error(msg || 'Assertion failed');
  }

  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'motorsport_db',
    waitForConnections: true,
    connectionLimit: 5,
  });

  try {
    // 1. Tables Verification
    await test('Relational Tables & Data Ingestion (data.zip)', async () => {
      const [rows] = await pool.query('SHOW TABLES');
      const tableNames = rows.map((r) => Object.values(r)[0]);
      const required = ['season', 'team', 'driver', 'circuit', 'race', 'race_result', 'qualifying_result', 'pit_stop', 'driver_standing'];
      for (const t of required) {
        assert(tableNames.includes(t), `Missing table: ${t}`);
      }

      // Check row counts
      const [races] = await pool.query('SELECT COUNT(*) as count FROM race');
      assert(races[0].count === 22, `Expected 22 races, got ${races[0].count}`);

      const [pitStops] = await pool.query('SELECT COUNT(*) as count FROM pit_stop');
      assert(pitStops[0].count >= 900, `Expected 900+ pit stops, got ${pitStops[0].count}`);

      const [standings] = await pool.query('SELECT COUNT(*) as count FROM driver_standing');
      assert(standings[0].count === 22, `Expected 22 driver standings, got ${standings[0].count}`);
    });

    // 2. View 1: view_race_classification
    await test('View 1: view_race_classification returns denormalized classification', async () => {
      const [rows] = await pool.query('SELECT * FROM view_race_classification WHERE round_no = 1 LIMIT 5');
      assert(rows.length > 0, 'view_race_classification returned 0 rows');
      assert(rows[0].circuit_name !== undefined, 'Missing circuit_name');
      assert(rows[0].driver_name !== undefined, 'Missing driver_name');
      assert(rows[0].team_name !== undefined, 'Missing team_name');
    });

    // 3. View 2: view_season_standings
    await test('View 2: view_season_standings returns ordered championship table', async () => {
      const [rows] = await pool.query('SELECT * FROM view_season_standings LIMIT 3');
      assert(rows.length === 3, 'Expected 3 top drivers');
      assert(rows[0].championship_rank === 1, 'Top driver must have rank 1');
      assert(rows[0].driver_name.includes('Verstappen'), 'Rank 1 driver should be Verstappen');
    });

    // 4. Stored Procedure: sp_get_driver_season_summary
    await test('Stored Procedure: sp_get_driver_season_summary executes and returns driver card', async () => {
      const [res] = await pool.query('CALL sp_get_driver_season_summary(2023, ?)', ['Verstappen']);
      assert(res[0] && res[0].length > 0, 'No record returned from stored procedure');
      const card = res[0][0];
      assert(card.driver_name.includes('Verstappen'), 'Driver name mismatch');
      assert(card.total_wins >= 1, 'Expected at least 1 win');
      assert(card.avg_pit_stop_duration !== null, 'Average pit stop duration should be computed');
    });

    // 5. Database Trigger: trg_validate_pit_stop_duration (Negative Duration Block)
    await test('Trigger trg_validate_pit_stop_duration: BLOCKS negative duration with SQLSTATE 45000', async () => {
      let threw = false;
      try {
        await pool.query(
          'INSERT INTO pit_stop (race_id, driver_id, lap_number, stop_time, duration) VALUES (1, 1, 999, "15:30:00", -9.99)'
        );
      } catch (err) {
        threw = true;
        assert(err.message.includes('cannot be negative'), `Expected trigger error, got: ${err.message}`);
      }
      assert(threw, 'Trigger failed to intercept negative pit stop duration');
    });

    // 6. Database Trigger: Accepts valid pit stop
    await test('Trigger trg_validate_pit_stop_duration: ACCEPTS valid pit stop record', async () => {
      const [ins] = await pool.query(
        'INSERT INTO pit_stop (race_id, driver_id, lap_number, stop_time, duration) VALUES (1, 1, 999, "15:30:00", 22.45)'
      );
      assert(ins.insertId > 0, 'Expected positive insertId');
      await pool.query('DELETE FROM pit_stop WHERE lap_number = 999');
    });

    // 7. Analytical Query 1: Constructor Standings
    await test('Query 1: Constructor Championship (Aggregations & Group By)', async () => {
      const [rows] = await pool.query(`
        SELECT t.team_name, SUM(rr.points) AS total_points, COUNT(CASE WHEN rr.position = 1 THEN 1 END) AS wins
        FROM team t
        JOIN race_result rr ON t.team_id = rr.team_id
        GROUP BY t.team_id, t.team_name
        ORDER BY total_points DESC
      `);
      assert(rows.length > 0, 'Expected constructor aggregation rows');
      assert(rows[0].team_name === 'Red Bull', 'Red Bull should lead constructor standings');
    });

    // 8. Analytical Query 2: Correlated Subquery
    await test('Query 2: Correlated Subquery (Above-average single race point scorers)', async () => {
      const [rows] = await pool.query(`
        SELECT r.round_no, d.driver_name, rr.points
        FROM race_result rr
        JOIN race r ON rr.race_id = r.race_id
        JOIN driver d ON rr.driver_id = d.driver_id
        WHERE rr.points > (
            SELECT AVG(points) 
            FROM race_result sub_rr 
            WHERE sub_rr.race_id = rr.race_id AND sub_rr.points > 0
        )
      `);
      assert(rows.length > 0, 'Correlated subquery returned 0 rows');
    });

    console.log('\n========================================');
    console.log(`🏁 MYSQL TEST SUITE: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================\n');

    if (failed > 0) process.exit(1);
  } finally {
    await pool.end();
  }
}

testMySQL().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
