import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const driver = searchParams.get('driver') || 'Verstappen';
    const year = Number(searchParams.get('year')) || 2023;

    // Call MySQL Stored Procedure
    const [result]: any = await pool.query(
      'CALL sp_get_driver_season_summary(?, ?)',
      [year, driver]
    );

    const summary = result[0] && result[0][0] ? result[0][0] : null;

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error('Error executing stored procedure:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

