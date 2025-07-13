import { Pool } from 'pg';
import { type NextRequest, NextResponse } from 'next/server';

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Necessary for Neon DB
  },
});

export async function GET(req: NextRequest) {
  // Check for a 'dry-run' query parameter
  const dryRun = req.nextUrl.searchParams.get('dry-run') === 'true';

  try {
    // Calculate the cutoff date (7 days ago)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const client = await pool.connect();

    try {
      if (dryRun) {
        // DRY RUN: Only retrieve records without deleting
        const previewQuery = `
          SELECT id, first_name, last_name, submitted_at,
                 EXTRACT(DAY FROM NOW() - submitted_at) as days_old
          FROM tm30_submissions
          WHERE submitted_at < $1
          ORDER BY submitted_at ASC
          LIMIT 50
        `;
        const previewResult = await client.query(previewQuery, [sevenDaysAgo.toISOString()]);

        const countQuery = `
          SELECT COUNT(*) as count
          FROM tm30_submissions
          WHERE submitted_at < $1
        `;
        const countResult = await client.query(countQuery, [sevenDaysAgo.toISOString()]);
        const totalCount = Number.parseInt(countResult.rows[0].count);

        return NextResponse.json({
          success: true,
          dryRun: true,
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

      } else {
        // ACTUAL DELETION (Cron Job)
        console.log('Cleanup old submissions cron job triggered.');
        console.log(`Cleanup cutoff date: ${sevenDaysAgo.toISOString()}`);

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
      }
    } finally {
      client.release();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error in cleanup-old-submissions:', errorMessage, (error as Error).stack);

    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
      details: errorMessage
    }, { status: 500 });
  }
}
