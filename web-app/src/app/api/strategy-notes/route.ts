import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';

// Table Auto-Creation helper for Level 3 Rubric (Section 6 & 11)
async function ensureStrategyNotesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS strategy_note (
      note_id INT AUTO_INCREMENT PRIMARY KEY,
      race_id INT NOT NULL,
      author_role ENUM('Strategist', 'Admin', 'Viewer') DEFAULT 'Strategist',
      title VARCHAR(150) NOT NULL,
      content TEXT NOT NULL,
      recommended_tyre VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (race_id) REFERENCES race(race_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

// 1. SELECT: Get strategy notes for a specific race
export async function GET(request: Request) {
  try {
    await ensureStrategyNotesTable();
    const { searchParams } = new URL(request.url);
    const raceId = searchParams.get('raceId');

    let query = 'SELECT * FROM strategy_note';
    const params: any[] = [];

    if (raceId) {
      query += ' WHERE race_id = ?';
      params.push(Number(raceId));
    }
    query += ' ORDER BY created_at DESC';

    const [notes] = await pool.query(query, params);
    return NextResponse.json({ success: true, notes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. INSERT: Add a new strategy recommendation (Strategist/Admin only)
export async function POST(request: Request) {
  try {
    await ensureStrategyNotesTable();
    const body = await request.json();
    const { race_id, author_role, title, content, recommended_tyre } = body;

    // Enforce role authorization (Section 11)
    if (author_role !== 'Strategist' && author_role !== 'Admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Viewers cannot create strategy plans.' },
        { status: 403 }
      );
    }

    const [result]: any = await pool.query(
      `INSERT INTO strategy_note (race_id, author_role, title, content, recommended_tyre)
       VALUES (?, ?, ?, ?, ?)`,
      [race_id, author_role, title, content, recommended_tyre || 'Medium']
    );

    return NextResponse.json({ success: true, note_id: result.insertId });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 3. DELETE: Delete a strategy note (Demonstrates DELETE DML operation - Section 6)
export async function DELETE(request: Request) {
  try {
    await ensureStrategyNotesTable();
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('id');
    const userRole = searchParams.get('role');

    if (userRole !== 'Strategist' && userRole !== 'Admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only Strategists/Admins can delete strategy notes.' },
        { status: 403 }
      );
    }

    if (!noteId) {
      return NextResponse.json({ success: false, error: 'note_id is required' }, { status: 400 });
    }

    await pool.query('DELETE FROM strategy_note WHERE note_id = ?', [Number(noteId)]);
    return NextResponse.json({ success: true, message: 'Strategy note deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

