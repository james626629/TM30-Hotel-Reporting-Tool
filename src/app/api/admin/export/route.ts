import { Pool } from 'pg';
import { type NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import * as XLSX from 'xlsx';

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
function formatDate(dateString: string | null): string {
  if (!dateString) return '';

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
      return '';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return '';
  }
}

// GET endpoint to export data as Excel
export async function GET(req: NextRequest) {
  try {
    console.log('=== EXCEL EXPORT REQUEST ===');

    // Verify admin authentication
    const admin = await verifyAdminAuth(req);
    if (!admin) {
      console.log('❌ Unauthorized export attempt');
      return NextResponse.json({
        error: 'Unauthorized - Invalid or missing authentication token',
        success: false
      }, { status: 401 });
    }

    console.log(`✅ Admin authenticated for export: ${admin.hotelCode} - ${admin.hotelName}`);

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const searchTerm = searchParams.get('search') || '';
    const checkinDateFilter = searchParams.get('checkinDate') || '';

    const client = await pool.connect();

    try {
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
          checkin_date,
          checkout_date,
          phone_number,
          email,
          room_number,
          status,
          submitted_at
        FROM tm30_submissions
        WHERE hotel_name = $1
      `;

      const params: (string | number)[] = [admin.hotelName];

      // Apply same filters as the main submissions endpoint
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

      if (checkinDateFilter) {
        params.push(checkinDateFilter);
        // Cast to text to ensure string comparison for varchar(10) field
        query += ` AND checkin_date = $${params.length}::text`;
      }

      query += ` ORDER BY submitted_at DESC`;

      // Debug logging to understand the parameter mismatch
      console.log('🔍 Export Debug SQL Query:', query);
      console.log('🔍 Export Debug Params:', params);
      console.log('🔍 Export Debug Params length:', params.length);
      console.log('🔍 Export Search term:', searchTerm);
      console.log('🔍 Export Checkin date filter:', checkinDateFilter);

      const result = await client.query(query, params);
      const submissions = result.rows;

      console.log(`📊 Exporting ${submissions.length} records for ${admin.hotelName}`);

      // Format data for Excel export - matching required columns
      const excelData = submissions.map((submission, index) => ({
        'No.': index + 1,
        'First Name': submission.first_name,
        'Middle Name': submission.middle_name || '',
        'Last Name': submission.last_name,
        'Gender': submission.gender,
        'Passport Number': submission.passport_number,
        'Nationality': submission.nationality,
        'Birth Date': formatDate(submission.birth_date),
        'Check-out Date': formatDate(submission.checkout_date),
        'Phone Number': submission.phone_number || '',
        'Check-in Date': formatDate(submission.checkin_date),
        'Room Number': submission.room_number
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths for better readability
      const columnWidths = [
        { wpx: 50 },  // No.
        { wpx: 120 }, // First Name
        { wpx: 100 }, // Middle Name
        { wpx: 120 }, // Last Name
        { wpx: 70 },  // Gender
        { wpx: 130 }, // Passport Number
        { wpx: 100 }, // Nationality
        { wpx: 100 }, // Birth Date
        { wpx: 100 }, // Check-out Date
        { wpx: 120 }, // Phone Number
        { wpx: 100 }, // Check-in Date
        { wpx: 100 }, // Room Number
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      const sheetName = `${admin.hotelCode}_Submissions`;
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Generate Excel file buffer in XLS format
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xls' });

      // Create filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const filename = `${admin.hotelCode}_TM30_Submissions_${timestamp}.xls`;

      console.log(`✅ Excel file generated: ${filename}`);

      // Return the Excel file as response
      return new Response(excelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.ms-excel',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': excelBuffer.length.toString()
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Excel export error:', error);
    return NextResponse.json({
      error: 'Excel export failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}
