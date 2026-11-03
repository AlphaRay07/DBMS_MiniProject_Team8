import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        r.race_id,
        r.round_no,
        r.race_date,
        c.circuit_name,
        c.location,
        c.country,
        (SELECT d.driver_name 
         FROM race_result rr 
         JOIN driver d ON rr.driver_id = d.driver_id 
         WHERE rr.race_id = r.race_id AND rr.position = 1 
         LIMIT 1) AS winner_name
      FROM race r
      JOIN circuit c ON r.circuit_id = c.circuit_id
      ORDER BY r.round_no ASC
    `);

    return NextResponse.json({ success: true, races: rows });
  } catch (error: any) {
    console.error('Error fetching races:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

