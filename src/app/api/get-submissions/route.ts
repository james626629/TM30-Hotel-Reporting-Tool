import { Pool } from 'pg';
import { type NextRequest, NextResponse } from 'next/server';

// Initialize a connection pool for the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Necessary for Neon DB
  },
});

export async function GET(req: NextRequest) {
  try {
    // Parse query parameters for filtering and pagination
    const url = new URL(req.url);

    // Search term (optional)
    const search = url.searchParams.get('search') || '';

    // Pagination (optional)
    const page = Number.parseInt(url.searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(url.searchParams.get('limit') || '50', 10); // Default to 50 records per page
    const offset = (page - 1) * limit;

    // Sorting (optional)
    const sortBy = url.searchParams.get('sortBy') || 'id';
    const sortOrder = url.searchParams.get('sortOrder') || 'DESC'; // Default newest first

    // Status filter (optional)
    const status = url.searchParams.get('status') || '';

    // Build the query with proper SQL injection protection
    let query = `
      SELECT
        id,
        first_name,
        middle_name,
        last_name,
        gender,
        passport_number,
        nationality,
        birth_date,
        checkout_date,
        phone_number,
        hotel_name,
        submitted_at,
        status,
        notes
      FROM tm30_submissions
      WHERE 1=1
    `;

    const queryParams: (string | number)[] = [];
    let paramCounter = 1;

    // Add search filter if provided
    if (search) {
      query += `
        AND (
          first_name ILIKE $${paramCounter} OR
          last_name ILIKE $${paramCounter} OR
          passport_number ILIKE $${paramCounter} OR
          nationality ILIKE $${paramCounter}
        )
      `;
      queryParams.push(`%${search}%`);
      paramCounter++;
    }

    // Add status filter if provided
    if (status) {
      query += ` AND status = $${paramCounter}`;
      queryParams.push(status);
      paramCounter++;
    }

    // Add sorting
    query += ` ORDER BY ${sortBy} ${sortOrder === 'ASC' ? 'ASC' : 'DESC'}`;

    // Add pagination
    query += ` LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
    queryParams.push(limit, offset);

    // Count total records (for pagination)
    let countQuery = `
      SELECT COUNT(*) as total FROM tm30_submissions WHERE 1=1
    `;

    if (search) {
      countQuery += `
        AND (
          first_name ILIKE $1 OR
          last_name ILIKE $1 OR
          passport_number ILIKE $1 OR
          nationality ILIKE $1
        )
      `;
    }

    if (status && search) {
      countQuery += ` AND status = $2`;
    } else if (status) {
      countQuery += ` AND status = $1`;
    }

    // Get connection from pool
    const client = await pool.connect();

    try {
      // Execute the count query
      const countResult = await client.query(countQuery, search ? [
        `%${search}%`,
        ...(status ? [status] : [])
      ] : status ? [status] : []);

      const total = Number.parseInt(countResult.rows[0].total, 10);

      // Execute the main query
      const result = await client.query(query, queryParams);
      const submissions = result.rows;

      // Format dates for better client-side consumption (maintain ISO format, client will handle display)
      submissions.forEach(submission => {
        if (submission.birth_date) {
          submission.birth_date = submission.birth_date.toISOString().split('T')[0];
        }
        if (submission.checkout_date) {
          submission.checkout_date = submission.checkout_date.toISOString().split('T')[0];
        }
      });

      return NextResponse.json({
        submissions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }, { status: 200 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching submissions:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      error: 'Failed to fetch TM30 submissions.',
      details: errorMessage
    }, { status: 500 });
  }
}
