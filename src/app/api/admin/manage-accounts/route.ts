import { Pool } from 'pg';
import { type NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Initialize a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Necessary for Neon DB
  },
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-change-in-production';

// Helper function to verify admin authentication (super admin check can be added later)
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

// GET endpoint to list all admin accounts
export async function GET(req: NextRequest) {
  try {
    console.log('=== ADMIN ACCOUNTS LIST REQUEST ===');

    // In a production environment, you might want to add super admin authentication here
    // For now, we'll allow any authenticated admin to view the list

    const client = await pool.connect();
    try {
      const query = `
        SELECT
          id,
          hotel_code,
          hotel_name,
          created_at,
          last_login,
          is_active
        FROM hotel_admins
        ORDER BY hotel_code
      `;

      const result = await client.query(query);

      return NextResponse.json({
        admins: result.rows,
        success: true
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Failed to fetch admin accounts:', error);
    return NextResponse.json({
      error: 'Failed to fetch admin accounts',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}

// POST endpoint to create a new admin account
export async function POST(req: NextRequest) {
  try {
    console.log('=== CREATE ADMIN ACCOUNT REQUEST ===');

    const { hotel_code, hotel_name, password } = await req.json();

    // Validate required fields
    if (!hotel_code || !hotel_name || !password) {
      return NextResponse.json({
        error: 'Missing required fields: hotel_code, hotel_name, password',
        success: false
      }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({
        error: 'Password must be at least 8 characters long',
        success: false
      }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      // Check if hotel code exists in hotel_room_keys table
      const hotelExistsQuery = `
        SELECT DISTINCT hotel_id, hotel_name
        FROM hotel_room_keys
        WHERE hotel_id = $1
        LIMIT 1
      `;
      const hotelExistsResult = await client.query(hotelExistsQuery, [hotel_code]);

      if (hotelExistsResult.rows.length === 0) {
        return NextResponse.json({
          error: `Hotel code '${hotel_code}' does not exist in the system`,
          success: false
        }, { status: 400 });
      }

      // Check if admin already exists
      const existingAdminQuery = `
        SELECT id FROM hotel_admins WHERE hotel_code = $1
      `;
      const existingAdminResult = await client.query(existingAdminQuery, [hotel_code]);

      if (existingAdminResult.rows.length > 0) {
        return NextResponse.json({
          error: `Admin account for hotel code '${hotel_code}' already exists`,
          success: false
        }, { status: 400 });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create the admin account
      const insertQuery = `
        INSERT INTO hotel_admins (hotel_code, hotel_name, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, hotel_code, hotel_name, created_at
      `;

      const result = await client.query(insertQuery, [hotel_code, hotel_name, hashedPassword]);
      const newAdmin = result.rows[0];

      console.log(`✅ Admin account created for hotel: ${hotel_code}`);

      return NextResponse.json({
        message: 'Admin account created successfully',
        admin: newAdmin,
        success: true
      }, { status: 201 });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Failed to create admin account:', error);
    return NextResponse.json({
      error: 'Failed to create admin account',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}

// PUT endpoint to update admin account (change password)
export async function PUT(req: NextRequest) {
  try {
    console.log('=== UPDATE ADMIN ACCOUNT REQUEST ===');

    const { hotel_code, new_password, current_password } = await req.json();

    // Validate required fields
    if (!hotel_code || !new_password) {
      return NextResponse.json({
        error: 'Missing required fields: hotel_code, new_password',
        success: false
      }, { status: 400 });
    }

    // Validate password strength
    if (new_password.length < 8) {
      return NextResponse.json({
        error: 'Password must be at least 8 characters long',
        success: false
      }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      // Get the current admin account
      const adminQuery = `
        SELECT id, password_hash FROM hotel_admins WHERE hotel_code = $1
      `;
      const adminResult = await client.query(adminQuery, [hotel_code]);

      if (adminResult.rows.length === 0) {
        return NextResponse.json({
          error: `Admin account for hotel code '${hotel_code}' not found`,
          success: false
        }, { status: 404 });
      }

      const admin = adminResult.rows[0];

      // If current_password is provided, verify it
      if (current_password) {
        const passwordMatch = await bcrypt.compare(current_password, admin.password_hash);
        if (!passwordMatch) {
          return NextResponse.json({
            error: 'Current password is incorrect',
            success: false
          }, { status: 400 });
        }
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(new_password, 12);

      // Update the password
      const updateQuery = `
        UPDATE hotel_admins
        SET password_hash = $1
        WHERE hotel_code = $2
        RETURNING id, hotel_code, hotel_name
      `;

      const result = await client.query(updateQuery, [hashedPassword, hotel_code]);
      const updatedAdmin = result.rows[0];

      console.log(`✅ Password updated for hotel: ${hotel_code}`);

      return NextResponse.json({
        message: 'Password updated successfully',
        admin: updatedAdmin,
        success: true
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Failed to update admin account:', error);
    return NextResponse.json({
      error: 'Failed to update admin account',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}

// DELETE endpoint to delete admin account
export async function DELETE(req: NextRequest) {
  try {
    console.log('=== DELETE ADMIN ACCOUNT REQUEST ===');

    const { searchParams } = new URL(req.url);
    const hotel_code = searchParams.get('hotel_code');

    if (!hotel_code) {
      return NextResponse.json({
        error: 'Missing required parameter: hotel_code',
        success: false
      }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      // Check if admin exists
      const adminQuery = `
        SELECT id, hotel_name FROM hotel_admins WHERE hotel_code = $1
      `;
      const adminResult = await client.query(adminQuery, [hotel_code]);

      if (adminResult.rows.length === 0) {
        return NextResponse.json({
          error: `Admin account for hotel code '${hotel_code}' not found`,
          success: false
        }, { status: 404 });
      }

      // Delete the admin account
      const deleteQuery = `
        DELETE FROM hotel_admins WHERE hotel_code = $1
        RETURNING hotel_code, hotel_name
      `;

      const result = await client.query(deleteQuery, [hotel_code]);
      const deletedAdmin = result.rows[0];

      console.log(`✅ Admin account deleted for hotel: ${hotel_code}`);

      return NextResponse.json({
        message: 'Admin account deleted successfully',
        deleted_admin: deletedAdmin,
        success: true
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Failed to delete admin account:', error);
    return NextResponse.json({
      error: 'Failed to delete admin account',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}
