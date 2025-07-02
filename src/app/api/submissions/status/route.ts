import { Pool } from 'pg';
import { type NextRequest, NextResponse } from 'next/server';

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Necessary for Neon DB
  },
});

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    // Check required parameters
    if (!body.id || !body.status) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters.',
        details: 'ID and status are required.'
      }, { status: 400 });
    }

    // Validate status values
    const validStatuses = ['PENDING', 'REPORTED', 'CANCELED'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid status value.',
        details: `Status must be one of: ${validStatuses.join(', ')}`
      }, { status: 400 });
    }

    // Connect to the database
    const client = await pool.connect();

    try {
      // Update the status
      const query = `
        UPDATE tm30_submissions
        SET
          status = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING id, first_name, last_name, status
      `;

      const result = await client.query(query, [body.status, body.id]);

      // Check if a record was actually updated
      if (result.rowCount === 0) {
        return NextResponse.json({
          success: false,
          error: 'Submission not found.',
          details: `No submission with ID ${body.id} exists.`
        }, { status: 404 });
      }

      // Return the updated submission
      return NextResponse.json({
        success: true,
        message: 'Status updated successfully.',
        data: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating submission status:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      error: 'Failed to update submission status.',
      details: errorMessage
    }, { status: 500 });
  }
}
