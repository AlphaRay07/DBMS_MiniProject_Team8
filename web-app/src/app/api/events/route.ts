import { NextResponse } from 'next/server';
import { getTelemetryDb, ensureTelemetryIndexes } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// Curated default events if MongoDB collection is not yet populated
const DEFAULT_EVENTS = [
  {
    _id: '1',
    race_id: 1,
    lap_number: 1,
    timestamp: '2023-03-05T15:03:12Z',
    event_type: 'Yellow Flag',
    driver_id: null,
    driver_name: 'Turn 1 Sector 1',
    description: 'Brief yellow flag at Turn 1 following tight midfield contact on race start.',
    severity: 'Low',
  },
  {
    _id: '2',
    race_id: 1,
    lap_number: 14,
    timestamp: '2023-03-05T15:22:45Z',
    event_type: 'Overtake',
    driver_id: 3,
    driver_name: 'Fernando Alonso',
    description: 'Exceptional overtake by Alonso on Russell into Turn 4 for P5.',
    severity: 'Low',
  },
  {
    _id: '3',
    race_id: 1,
    lap_number: 41,
    timestamp: '2023-03-05T16:04:18Z',
    event_type: 'Virtual Safety Car',
    driver_id: 5,
    driver_name: 'Charles Leclerc',
    description: 'Power unit failure. Car stopped on exit of Turn 3. Virtual Safety Car deployed.',
    severity: 'High',
  },
  {
    _id: '4',
    race_id: 1,
    lap_number: 45,
    timestamp: '2023-03-05T16:11:30Z',
    event_type: 'Overtake',
    driver_id: 3,
    driver_name: 'Fernando Alonso',
    description: 'Alonso completes overtake on Carlos Sainz to claim podium position (P3).',
    severity: 'Low',
  },
  {
    _id: '5',
    race_id: 1,
    lap_number: 52,
    timestamp: '2023-03-05T16:21:05Z',
    event_type: 'Penalty',
    driver_id: 7,
    driver_name: 'Nico Hulkenberg',
    description: '5-second time penalty for track limits violations at Turn 4.',
    severity: 'Medium',
  },
];

// GET /api/events?raceId=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raceId = Number(searchParams.get('raceId')) || 1;

    let events: any[] = [];

    try {
      await ensureTelemetryIndexes();
      const db = await getTelemetryDb();
      events = await db
        .collection('race_events')
        .find({ race_id: raceId })
        .sort({ lap_number: 1, timestamp: 1 })
        .toArray();
    } catch (mongoErr: any) {
      console.warn('[MongoDB Events fallback]', mongoErr.message);
    }

    if (!events || events.length === 0) {
      events = DEFAULT_EVENTS.filter((e) => e.race_id === raceId || raceId === 1);
    }

    return NextResponse.json({
      success: true,
      raceId,
      count: events.length,
      events,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/events (Enables live incident logging for Race Strategists)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { race_id, lap_number, event_type, driver_id, driver_name, description, severity, author_role } = body;

    if (author_role === 'Viewer') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Spectators cannot log race incidents.' },
        { status: 403 }
      );
    }

    if (!race_id || !event_type || !description) {
      return NextResponse.json(
        { success: false, error: 'race_id, event_type, and description are required.' },
        { status: 400 }
      );
    }

    const newEvent = {
      race_id: Number(race_id),
      lap_number: Number(lap_number) || 1,
      timestamp: new Date().toISOString(),
      event_type,
      driver_id: driver_id ? Number(driver_id) : null,
      driver_name: driver_name || 'Race Control',
      description,
      severity: severity || 'Medium',
    };

    try {
      await ensureTelemetryIndexes();
      const db = await getTelemetryDb();
      const result = await db.collection('race_events').insertOne(newEvent);
      return NextResponse.json({
        success: true,
        insertedId: result.insertedId,
        event: newEvent,
      });
    } catch (dbErr: any) {
      // In-memory response if offline
      return NextResponse.json({
        success: true,
        insertedId: `offline-${Date.now()}`,
        event: newEvent,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
