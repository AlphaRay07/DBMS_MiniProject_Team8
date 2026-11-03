import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const raceId = Number(params.id);

    // 1. Race Header
    const [raceHeader]: any = await pool.query(
      `
      SELECT r.race_id, r.round_no, r.race_date, c.circuit_name, c.location, c.country
      FROM race r
      JOIN circuit c ON r.circuit_id = c.circuit_id
      WHERE r.race_id = ?
    `,
      [raceId]
    );

    if (!raceHeader || raceHeader.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Race not found' },
        { status: 404 }
      );
    }

    // 2. Results using view_race_classification
    const [results]: any = await pool.query(
      `
      SELECT 
        position,
        grid_position,
        driver_name,
        team_name,
        laps_completed,
        points,
        status,
        (grid_position - position) AS positions_gained
      FROM view_race_classification
      WHERE race_id = ?
      ORDER BY position ASC
    `,
      [raceId]
    );

    // 3. Pit Stops
    const [pitStops]: any = await pool.query(
      `
      SELECT 
        ps.lap_number,
        ps.stop_time,
        ps.duration,
        d.driver_name,
        t.team_name
      FROM pit_stop ps
      JOIN driver d ON ps.driver_id = d.driver_id
      JOIN race_result rr ON ps.race_id = rr.race_id AND d.driver_id = rr.driver_id
      JOIN team t ON rr.team_id = t.team_id
      WHERE ps.race_id = ?
      ORDER BY ps.lap_number ASC, ps.duration ASC
    `,
      [raceId]
    );

    return NextResponse.json({
      success: true,
      race: raceHeader[0],
      results,
      pitStops,
    });
  } catch (error: any) {
    console.error('Error fetching race details:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

