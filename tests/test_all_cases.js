/**
 * Comprehensive Automated Test Suite
 * Tests all functional, edge, and security/role-based test cases
 * across MySQL and MongoDB endpoints.
 */

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🧪 Starting Full Test Suite for Motorsport Strategy System...\n');
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

  function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
  }

  // --- SUITE 1: Frontend & Page Rendering ---
  console.log('--- SUITE 1: Frontend & SSR ---');
  await test('GET / returns 200 and loads HTML structure', async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const html = await res.text();
    assert(html.includes('Motorsport Race Performance'), 'HTML missing header title');
    assert(html.includes('Telemetry &amp; Race Events') || html.includes('Telemetry & Race Events'), 'HTML missing Student B Telemetry tab');
  });

  // --- SUITE 2: MongoDB Telemetry Engine (/api/telemetry) ---
  console.log('\n--- SUITE 2: MongoDB Telemetry Engine ---');
  await test('GET /api/telemetry with dual driver comparison (VER vs HAM)', async () => {
    const res = await fetch(`${BASE_URL}/api/telemetry?raceId=1&lap=15&driverId=1&compareDriverId=4`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Response success should be true');
    assert(Array.isArray(data.samples), 'samples should be an array');
    assert(data.samples.length > 0, 'samples should not be empty');
    
    // Check sample fields
    const s = data.samples[0];
    assert(s.telemetry !== undefined, 'sample should have telemetry object');
    assert(typeof s.telemetry.speed === 'number', 'telemetry.speed should be number');
    assert(typeof s.telemetry.throttle === 'number', 'telemetry.throttle should be number');
    assert(typeof s.telemetry.drs === 'number', 'telemetry.drs should be number');
  });

  await test('GET /api/telemetry on boundary laps (Lap 1 & Lap 50)', async () => {
    const res1 = await fetch(`${BASE_URL}/api/telemetry?raceId=1&lap=1&driverId=1`);
    const data1 = await res1.json();
    assert(data1.success === true && data1.samples.length > 0, 'Lap 1 failed');

    const res50 = await fetch(`${BASE_URL}/api/telemetry?raceId=1&lap=50&driverId=1`);
    const data50 = await res50.json();
    assert(data50.success === true && data50.samples.length > 0, 'Lap 50 failed');
  });

  await test('GET /api/telemetry edge case: invalid non-numeric parameters', async () => {
    const res = await fetch(`${BASE_URL}/api/telemetry?raceId=invalid&lap=abc&driverId=xyz`);
    assert(res.status === 200, `Expected graceful 200 fallback, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Should gracefully fall back to valid response');
  });

  // --- SUITE 3: MongoDB Race Events & Role Authorization ---
  console.log('\n--- SUITE 3: MongoDB Race Events & Authorization ---');
  await test('GET /api/events returns structured event timeline', async () => {
    const res = await fetch(`${BASE_URL}/api/events?raceId=1`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Response success should be true');
    assert(Array.isArray(data.events), 'events should be an array');
    assert(data.events.length > 0, 'should contain historical race incidents');

    const ev = data.events[0];
    assert(typeof ev.event_type === 'string', 'event_type should be string');
    assert(typeof ev.lap_number === 'number', 'lap_number should be number');
    assert(typeof ev.description === 'string', 'description should be string');
  });

  await test('POST /api/events security: Viewer role is BLOCKED (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        race_id: 1,
        lap_number: 10,
        event_type: 'Yellow Flag',
        description: 'Unauthorized test event',
        author_role: 'Viewer'
      })
    });
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
    const data = await res.json();
    assert(data.success === false, 'Viewer request must not succeed');
    assert(data.error.includes('Unauthorized'), 'Error message should indicate unauthorized');
  });

  await test('POST /api/events input validation: missing required fields returns 400', async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        author_role: 'Strategist' // Missing race_id, event_type, description
      })
    });
    assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
    const data = await res.json();
    assert(data.success === false, 'Missing fields request must not succeed');
  });

  await test('POST /api/events authorized: Strategist can create incident document (200)', async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        race_id: 1,
        lap_number: 22,
        event_type: 'Virtual Safety Car',
        driver_name: 'Carlos Sainz',
        description: 'Debris on main straight after kerb strike. VSC deployed.',
        severity: 'High',
        author_role: 'Strategist'
      })
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Strategist incident creation should succeed');
    assert(data.insertedId !== undefined, 'Should return inserted document identifier');
    assert(data.event.event_type === 'Virtual Safety Car', 'Event payload should match');
  });

  // --- SUITE 4: MongoDB Aggregation Pipeline ---
  console.log('\n--- SUITE 4: MongoDB Aggregation Pipeline ---');
  await test('GET /api/analytics/speed-trap executes aggregation and sorts descending', async () => {
    const res = await fetch(`${BASE_URL}/api/analytics/speed-trap?raceId=1`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Response success should be true');
    assert(Array.isArray(data.leaderboard), 'leaderboard should be an array');
    assert(data.leaderboard.length >= 2, 'leaderboard should have drivers');

    // Verify descending sort order on top_speed
    for (let i = 0; i < data.leaderboard.length - 1; i++) {
      assert(
        data.leaderboard[i].top_speed >= data.leaderboard[i + 1].top_speed,
        `Sort violation: ${data.leaderboard[i].top_speed} should be >= ${data.leaderboard[i + 1].top_speed}`
      );
    }

    // Verify aggregated metric fields
    const leader = data.leaderboard[0];
    assert(typeof leader.top_speed === 'number', 'top_speed should be number');
    assert(typeof leader.avg_speed === 'number', 'avg_speed should be number');
    assert(typeof leader.avg_throttle === 'number', 'avg_throttle should be number');
    assert(typeof leader.total_drs_samples === 'number', 'total_drs_samples should be number');
  });

  // --- SUITE 5: Relational Strategy Desk & Role Authorization ---
  console.log('\n--- SUITE 5: Strategy Desk Authorization ---');
  await test('POST /api/strategy-notes security: Viewer role is BLOCKED (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/strategy-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        race_id: 1,
        author_role: 'Viewer',
        title: 'Unauthorized Note',
        content: 'Should be rejected'
      })
    });
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
    const data = await res.json();
    assert(data.success === false, 'Viewer note creation must fail');
  });

  await test('DELETE /api/strategy-notes security: Viewer role is BLOCKED (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/strategy-notes?id=1&role=Viewer`, {
      method: 'DELETE'
    });
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
    const data = await res.json();
    assert(data.success === false, 'Viewer note deletion must fail');
  });

  // --- SUMMARY ---
  console.log('\n========================================');
  console.log(`🏁 TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
