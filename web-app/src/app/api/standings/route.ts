import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';

export async function GET() {
  try {
    // 1. Driver Standings from view_season_standings
    const [drivers]: any = await pool.query(`
      SELECT 
        championship_rank,
        driver_name,
        driver_nationality,
        team_name,
        championship_points,
        total_wins
      FROM view_season_standings
      ORDER BY championship_rank ASC
    `);

    // 2. Team Standings from analytical query
    const [teams]: any = await pool.query(`
      SELECT 
        t.team_name,
        t.nationality,
        COUNT(CASE WHEN rr.position = 1 THEN 1 END) AS wins,
        COUNT(CASE WHEN rr.position <= 3 THEN 1 END) AS podiums,
        SUM(rr.points) AS total_points
      FROM team t
      JOIN race_result rr ON t.team_id = rr.team_id
      GROUP BY t.team_id, t.team_name, t.nationality
      ORDER BY total_points DESC
    `);

    return NextResponse.json({
      success: true,
      drivers,
      teams,
    });
  } catch (error: any) {
    console.error('Error fetching standings:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

