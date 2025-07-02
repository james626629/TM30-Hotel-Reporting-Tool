import { Pool } from 'pg';
import { type NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Initialize a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Necessary for Neon DB
  },
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-change-in-production';

// Helper function to verify admin authentication
async function verifyAdminAuth(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: number; hotelCode: string; hotelName: string };

    return {
      adminId: decoded.adminId,
      hotelCode: decoded.hotelCode,
      hotelName: decoded.hotelName
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

// Helper function to format date as DD/MM/YYYY
function formatDate(dateString: string | null): string | null {
  if (!dateString) return null;

  try {
    // Handle different date formats
    let date: Date;

    // If already in DD/MM/YYYY format, parse it correctly
    if (typeof dateString === 'string' && dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = dateString.split('/').map(Number);
      date = new Date(year, month - 1, day); // month is 0-indexed
    } else {
      // Handle ISO date strings or other formats
      date = new Date(dateString);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return null;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    console.error('Error formatting date:', e, 'Input:', dateString);
    return null;
  }
}

// GET endpoint to fetch all submissions
export async function GET(req: NextRequest) {
  try {
    console.log('=== ADMIN SUBMISSIONS REQUEST ===');

    // Verify admin authentication
    const admin = await verifyAdminAuth(req);
    if (!admin) {
      console.log('❌ Unauthorized access attempt to submissions');
      return NextResponse.json({
        error: 'Unauthorized - Invalid or missing authentication token',
        success: false
      }, { status: 401 });
    }

    console.log(`✅ Admin authenticated: ${admin.hotelCode} - ${admin.hotelName}`);

    // Get search parameters from the URL if any
    const searchParams = req.nextUrl.searchParams;
    const searchTerm = searchParams.get('search') || '';
    const checkinDateFilter = searchParams.get('checkinDate') || '';

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
        checkin_date,
        phone_number,
        email,
        room_number,
        passport_photo_url,
        hotel_name,
        submitted_at,
        status,
        notes
      FROM tm30_submissions
    `;

    // Add hotel filter - admins can only see their hotel's submissions
    const params: (string | number)[] = [admin.hotelName];
    query += ` WHERE hotel_name = $1`;

    // Add search condition if searchTerm is provided
    if (searchTerm) {
      params.push(`%${searchTerm}%`);
      const searchParamIndex = params.length;
      query += `
        AND (
          first_name ILIKE $${searchParamIndex} OR
          last_name ILIKE $${searchParamIndex} OR
          passport_number ILIKE $${searchParamIndex} OR
          nationality ILIKE $${searchParamIndex} OR
          email ILIKE $${searchParamIndex} OR
          room_number ILIKE $${searchParamIndex}
        )
      `;
    }

    // Add check-in date filter if provided
    if (checkinDateFilter) {
      params.push(checkinDateFilter);
      // Cast both sides to text to ensure string comparison for varchar(10) field
      query += ` AND checkin_date = $${params.length}::text`;
    }

    // Order by most recent submissions first
    query += ` ORDER BY submitted_at DESC`;

    // Debug logging to understand the parameter mismatch
    console.log('🔍 Debug SQL Query:', query);
    console.log('🔍 Debug Params:', params);
    console.log('🔍 Debug Params length:', params.length);
    console.log('🔍 Search term:', searchTerm);
    console.log('🔍 Checkin date filter:', checkinDateFilter);

    const client = await pool.connect();
    try {
      const result = await client.query(query, params);

      // Format the dates before returning the data
      const formattedSubmissions = result.rows.map(row => ({
        ...row,
        // Format dates as DD/MM/YYYY strings
        birth_date: formatDate(row.birth_date),
        checkout_date: formatDate(row.checkout_date),
        checkin_date: formatDate(row.checkin_date),
        // Keep the submitted_at timestamp as is
      }));

      return NextResponse.json({
        submissions: formattedSubmissions,
        count: result.rowCount
      });
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
      error: 'Failed to fetch submissions',
      details: errorMessage
    }, { status: 500 });
  }
}
