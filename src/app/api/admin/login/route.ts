import { type NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-change-in-production';

export async function POST(req: NextRequest) {
  try {
    console.log('=== ADMIN LOGIN ATTEMPT ===');

    const { hotelCode, password } = await req.json();
    console.log(`Admin login attempt for hotelCode: ${hotelCode}`);

    if (!hotelCode || !password) {
      return NextResponse.json({
        error: 'Hotel code and password are required',
        success: false
      }, { status: 400 });
    }

    const client = await getPool().connect();

    try {
      // Find admin by hotel code
      const query = `
        SELECT id, hotel_code, hotel_name, password_hash, is_active
        FROM hotel_admins
        WHERE hotel_code = $1 AND is_active = true
      `;

      const result = await client.query(query, [hotelCode.toUpperCase()]);

      if (result.rows.length === 0) {
        console.log(`❌ Admin login failed - hotel code not found: ${hotelCode}`);
        return NextResponse.json({
          error: 'Invalid hotel code or password',
          success: false
        }, { status: 401 });
      }

      const admin = result.rows[0];

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

      if (!isPasswordValid) {
        console.log(`❌ Admin login failed - invalid password for hotel: ${hotelCode}`);
        return NextResponse.json({
          error: 'Invalid hotel code or password',
          success: false
        }, { status: 401 });
      }

      // Update last login timestamp
      const updateLoginQuery = `
        UPDATE hotel_admins
        SET last_login = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      await client.query(updateLoginQuery, [admin.id]);

      // Generate JWT token
      const token = jwt.sign(
        {
          adminId: admin.id,
          hotelCode: admin.hotel_code,
          hotelName: admin.hotel_name
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log(`✅ Admin login successful for hotel: ${admin.hotel_code}`);

      return NextResponse.json({
        message: 'Login successful',
        success: true,
        admin: {
          id: admin.id,
          hotelCode: admin.hotel_code,
          hotelName: admin.hotel_name
        },
        token
      }, { status: 200 });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Admin login error:', error);
    return NextResponse.json({
      error: 'Login failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}
