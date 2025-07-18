import { Pool } from 'pg';
import { type NextRequest, NextResponse } from 'next/server';

// Initialize a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Necessary for Neon DB
  },
});

export async function GET(req: NextRequest) {
  try {
    console.log('=== CLEANING UP PROCESSED ROOM SCHEDULE ENTRIES START ===');

    const client = await pool.connect();

    try {
      const deleteQuery = `
        DELETE FROM room_availability_schedule
        WHERE processed = TRUE;
      `;

      const result = await client.query(deleteQuery);
      console.log(`✅ Deleted ${result.rowCount} processed room schedule entries.`);

      return NextResponse.json({
        message: `Deleted ${result.rowCount} processed room schedule entries.`,
        deletedCount: result.rowCount,
        success: true
      }, { status: 200 });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Failed to clean up processed room schedule entries:', error);
    return NextResponse.json({
      error: 'Failed to clean up processed room schedule entries',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}
