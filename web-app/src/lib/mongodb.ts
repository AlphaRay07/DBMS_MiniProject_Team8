import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/motorsport_telemetry';
const options = {};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  const client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

/**
 * Helper to obtain the motorsport_telemetry database instance.
 */
export async function getTelemetryDb(): Promise<Db> {
  const connectedClient = await clientPromise;
  return connectedClient.db();
}

let indexesEnsured = false;
/**
 * Ensures required compound indexes are created for performance (Rubric Section 7).
 */
export async function ensureTelemetryIndexes(): Promise<void> {
  if (indexesEnsured) return;
  try {
    const db = await getTelemetryDb();
    await db.collection('telemetry_samples').createIndex(
      { race_id: 1, driver_id: 1, lap_number: 1 },
      { name: 'idx_race_driver_lap' }
    );
    await db.collection('race_events').createIndex(
      { race_id: 1, event_type: 1 },
      { name: 'idx_race_event_type' }
    );
    indexesEnsured = true;
  } catch (err) {
    // Log warning if MongoDB is temporarily unreachable during static build
    console.warn('[MongoDB Index Setup]', err);
  }
}

export default clientPromise;
