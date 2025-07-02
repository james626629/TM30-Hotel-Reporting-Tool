import { Pool } from 'pg';
import { type NextRequest, NextResponse } from 'next/server';

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Necessary for Neon DB
  },
});

export async function POST(req: NextRequest) {
  try {
    // Calculate the cutoff date (7 days ago)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const client = await pool.connect();

    try {
      // First, get count of records that will be deleted for logging
      const countQuery = `
        SELECT COUNT(*) as count
        FROM tm30_submissions
        WHERE submitted_at < $1
      `;

      const countResult = await client.query(countQuery, [sevenDaysAgo.toISOString()]);
      const recordCount = Number.parseInt(countResult.rows[0].count);

      if (recordCount === 0) {
        return NextResponse.json({
          success: true,
          message: 'No records older than 7 days found',
          deletedCount: 0,
          cutoffDate: sevenDaysAgo.toISOString()
        });
      }

      // Delete records older than 7 days
      const deleteQuery = `
        DELETE FROM tm30_submissions
        WHERE submitted_at < $1
        RETURNING id, first_name, last_name, submitted_at
      `;

      const deleteResult = await client.query(deleteQuery, [sevenDaysAgo.toISOString()]);

      console.log(`Deleted ${deleteResult.rowCount} TM30 submissions older than 7 days:`, {
        cutoffDate: sevenDaysAgo.toISOString(),
        deletedRecords: deleteResult.rows.map(row => ({
          id: row.id,
          name: `${row.first_name} ${row.last_name}`,
          submittedAt: row.submitted_at
        }))
      });

      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${deleteResult.rowCount} records older than 7 days`,
        deletedCount: deleteResult.rowCount,
        cutoffDate: sevenDaysAgo.toISOString(),
        deletedRecords: deleteResult.rows.map(row => ({
          id: row.id,
          name: `${row.first_name} ${row.last_name}`,
          submittedAt: row.submitted_at
        }))
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error cleaning up old submissions:', error);

    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to cleanup old submissions',
      details: errorMessage
    }, { status: 500 });
  }
}

// GET endpoint to check how many records would be deleted (dry run)
export async function GET(req: NextRequest) {
  try {
    // Calculate the cutoff date (7 days ago)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const client = await pool.connect();

    try {
      // Get records that would be deleted (for preview)
      const previewQuery = `
        SELECT id, first_name, last_name, submitted_at,
               EXTRACT(DAY FROM NOW() - submitted_at) as days_old
        FROM tm30_submissions
        WHERE submitted_at < $1
        ORDER BY submitted_at ASC
        LIMIT 50
      `;

      const previewResult = await client.query(previewQuery, [sevenDaysAgo.toISOString()]);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as count
        FROM tm30_submissions
        WHERE submitted_at < $1
      `;

      const countResult = await client.query(countQuery, [sevenDaysAgo.toISOString()]);
      const totalCount = Number.parseInt(countResult.rows[0].count);

      return NextResponse.json({
        success: true,
        cutoffDate: sevenDaysAgo.toISOString(),
        totalRecordsToDelete: totalCount,
        previewRecords: previewResult.rows.map(row => ({
          id: row.id,
          name: `${row.first_name} ${row.last_name}`,
          submittedAt: row.submitted_at,
          daysOld: Math.floor(row.days_old)
        })),
        message: totalCount > 0
          ? `${totalCount} records are ready for deletion (older than 7 days)`
          : 'No records older than 7 days found'
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error checking old submissions:', error);

    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to check old submissions',
      details: errorMessage
    }, { status: 500 });
  }
}
