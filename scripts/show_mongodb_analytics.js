/**
 * Instant MongoDB Viva Demonstration Script
 * Connects directly to local MongoDB and prints collections, indexes,
 * sample telemetry document, and the live Aggregation Pipeline table in <1s.
 */

const path = require('path');
const { MongoClient } = require('../web-app/node_modules/mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/motorsport_telemetry';

async function main() {
  console.log('🏎️ Connecting to MongoDB (motorsport_telemetry)...\n');
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();

    // 1. Collections & Indexes
    console.log('--- 1. ACTIVE COLLECTIONS & COMPOUND INDEXES ---');
    const colInfos = await db.listCollections().toArray();
    for (const info of colInfos) {
      const name = info.name;
      const col = db.collection(name);
      const count = await col.countDocuments();
      const indexes = await col.indexes();
      console.log(`📂 Collection: ${name.padEnd(20)} [${count} documents]`);
      indexes.forEach(idx => {
        console.log(`   └── Index: ${idx.name} -> ${JSON.stringify(idx.key)}`);
      });
    }

    // 2. Sample Telemetry Document
    console.log('\n--- 2. SAMPLE HIGH-FREQUENCY TELEMETRY DOCUMENT ---');
    const sample = await db.collection('telemetry_samples').findOne({}, { projection: { _id: 0 } });
    console.dir(sample, { depth: null, colors: true });

    // 3. Live Aggregation Pipeline (Speed Trap & Stint Analytics)
    console.log('\n--- 3. LIVE AGGREGATION PIPELINE ($match ➔ $group ➔ $project ➔ $sort) ---');
    const pipeline = [
      { $match: { race_id: 1 } },
      {
        $group: {
          _id: { driver_id: '$driver_id', driver_code: '$driver_code' },
          top_speed: { $max: '$telemetry.speed' },
          avg_speed: { $avg: '$telemetry.speed' },
          avg_throttle: { $avg: '$telemetry.throttle' },
          total_drs_samples: { $sum: '$telemetry.drs' },
          samples_analyzed: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          driver_code: '$_id.driver_code',
          top_speed: { $round: ['$top_speed', 1] },
          avg_speed: { $round: ['$avg_speed', 1] },
          avg_throttle: { $round: ['$avg_throttle', 1] },
          total_drs_samples: 1,
          samples_analyzed: 1,
        },
      },
      { $sort: { top_speed: -1 } },
    ];

    const aggResults = await db.collection('telemetry_samples').aggregate(pipeline).toArray();

    console.table(aggResults.map((r, idx) => ({
      Rank: `#${idx + 1}`,
      Driver: r.driver_code,
      'Top Speed (km/h)': `${r.top_speed} km/h`,
      'Avg Speed (km/h)': `${r.avg_speed} km/h`,
      'Avg Throttle': `${r.avg_throttle}%`,
      'DRS Activations': r.total_drs_samples,
      'Samples Processed': r.samples_analyzed,
    })));

    console.log('✅ Aggregation pipeline executed live against MongoDB collection.\n');
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    console.log('Make sure MongoDB is running with: node scripts/start_mongodb.js');
  } finally {
    await client.close();
  }
}

main();
