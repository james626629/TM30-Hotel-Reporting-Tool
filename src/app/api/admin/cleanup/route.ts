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

// POST endpoint to cleanup old data
export async function POST(req: NextRequest) {
  try {
    console.log('=== DATA CLEANUP REQUEST ===');

    // Verify admin authentication
    const admin = await verifyAdminAuth(req);
    if (!admin) {
      console.log('❌ Unauthorized cleanup attempt');
      return NextResponse.json({
        error: 'Unauthorized - Invalid or missing authentication token',
        success: false
      }, { status: 401 });
    }

    console.log(`✅ Admin authenticated for cleanup: ${admin.hotelCode} - ${admin.hotelName}`);

    const client = await pool.connect();

    try {
      // Calculate date 7 days ago
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // First, get the count of records to be deleted for the admin's hotel
      const countQuery = `
        SELECT COUNT(*) as count
        FROM tm30_submissions
        WHERE hotel_name = $1 AND submitted_at < $2
      `;

      const countResult = await client.query(countQuery, [admin.hotelName, sevenDaysAgo.toISOString()]);
      const recordsToDelete = Number.parseInt(countResult.rows[0].count);

      console.log(`📊 Found ${recordsToDelete} records older than 7 days for ${admin.hotelName}`);

      if (recordsToDelete === 0) {
        return NextResponse.json({
          message: 'No records older than 7 days found for cleanup',
          recordsDeleted: 0,
          success: true
        });
      }

      // Delete old records for this hotel only
      const deleteQuery = `
        DELETE FROM tm30_submissions
        WHERE hotel_name = $1 AND submitted_at < $2
        RETURNING id, first_name, last_name, submitted_at
      `;

      const deleteResult = await client.query(deleteQuery, [admin.hotelName, sevenDaysAgo.toISOString()]);
      const deletedRecords = deleteResult.rows;

      console.log(`🗑️ Successfully deleted ${deletedRecords.length} old records for ${admin.hotelName}`);

      return NextResponse.json({
        message: `Successfully deleted ${deletedRecords.length} records older than 7 days`,
        recordsDeleted: deletedRecords.length,
        deletedRecords: deletedRecords.map(record => ({
          id: record.id,
          guestName: `${record.first_name} ${record.last_name}`,
          submittedAt: record.submitted_at
        })),
        success: true
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Data cleanup error:', error);
    return NextResponse.json({
      error: 'Data cleanup failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}

// GET endpoint to preview what would be deleted
export async function GET(req: NextRequest) {
  try {
    console.log('=== DATA CLEANUP PREVIEW ===');

    // Verify admin authentication
    const admin = await verifyAdminAuth(req);
    if (!admin) {
      return NextResponse.json({
        error: 'Unauthorized - Invalid or missing authentication token',
        success: false
      }, { status: 401 });
    }

    const client = await pool.connect();

    try {
      // Calculate date 7 days ago
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Get records that would be deleted for the admin's hotel
      const previewQuery = `
        SELECT id, first_name, last_name, submitted_at
        FROM tm30_submissions
        WHERE hotel_name = $1 AND submitted_at < $2
        ORDER BY submitted_at DESC
      `;

      const result = await client.query(previewQuery, [admin.hotelName, sevenDaysAgo.toISOString()]);
      const recordsToDelete = result.rows;

      console.log(`📋 Preview: ${recordsToDelete.length} records would be deleted for ${admin.hotelName}`);

      return NextResponse.json({
        message: `${recordsToDelete.length} records older than 7 days would be deleted`,
        recordCount: recordsToDelete.length,
        cutoffDate: sevenDaysAgo.toISOString(),
        recordsToDelete: recordsToDelete.map(record => ({
          id: record.id,
          guestName: `${record.first_name} ${record.last_name}`,
          submittedAt: record.submitted_at,
          daysOld: Math.floor((new Date().getTime() - new Date(record.submitted_at).getTime()) / (1000 * 60 * 60 * 24))
        })),
        success: true
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Data cleanup preview error:', error);
    return NextResponse.json({
      error: 'Data cleanup preview failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}
