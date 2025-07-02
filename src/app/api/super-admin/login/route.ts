import { type NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-change-in-production';

export async function POST(req: NextRequest) {
  try {
    console.log('=== SUPER ADMIN LOGIN ATTEMPT ===');

    const { username, password } = await req.json();
    console.log(`Super admin login attempt for username: ${username}`);

    // Validate input
    if (!username || !password) {
      return NextResponse.json({
        error: 'Username and password are required',
        success: false
      }, { status: 400 });
    }

    const client = await getPool().connect();

    try {
      // Check if super_admins table exists, if not create it
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS super_admins (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          full_name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP NULL,
          is_active BOOLEAN DEFAULT TRUE
        );

        CREATE INDEX IF NOT EXISTS idx_super_admins_username ON super_admins(username);
        CREATE INDEX IF NOT EXISTS idx_super_admins_active ON super_admins(is_active);
      `;

      await client.query(createTableQuery);

      // Check if super admin exists, if not create default one
      const checkSuperAdminQuery = `
        SELECT COUNT(*) FROM super_admins WHERE is_active = true
      `;
      const countResult = await client.query(checkSuperAdminQuery);
      console.log('countResult:', countResult);

      // if (Number.parseInt(countResult.rows[0].count) === 0) {
      //   // Create default super admin account with strong password
      //   const defaultPassword = 'SuperAdmin@TM30_2024!';
      //   const hashedPassword = await bcrypt.hash(defaultPassword, 12);

      //   const insertSuperAdminQuery = `
      //     INSERT INTO super_admins (username, password_hash, full_name)
      //     VALUES ($1, $2, $3)
      //   `;

      //   await client.query(insertSuperAdminQuery, ['superadmin', hashedPassword, 'System Administrator']);
      //   console.log('✅ Default super admin created with username: superadmin');
      // }

      // Also ensure there's a super admin entry in hotel_admins table for access to regular admin panel
      const hotelAdminCheckQuery = `
        SELECT COUNT(*) FROM hotel_admins WHERE hotel_code = 'SUPERADMIN'
      `;
      const hotelAdminResult = await client.query(hotelAdminCheckQuery);

      if (Number.parseInt(hotelAdminResult.rows[0].count) === 0) {
        // Create super admin entry in hotel_admins table
        const superPassword = 'SuperAdmin@TM30_2024!';
        const hashedSuperPassword = await bcrypt.hash(superPassword, 12);

        const insertHotelSuperAdminQuery = `
          INSERT INTO hotel_admins (hotel_code, hotel_name, password_hash)
          VALUES ('SUPERADMIN', 'System Administration', $1)
          ON CONFLICT (hotel_code) DO NOTHING
        `;

        await client.query(insertHotelSuperAdminQuery, [hashedSuperPassword]);
        console.log('✅ Super admin entry created in hotel_admins table');
      }

      // Authenticate the super admin
      const adminQuery = `
        SELECT id, username, password_hash, full_name, is_active
        FROM super_admins
        WHERE username = $1 AND is_active = true
      `;

      const result = await client.query(adminQuery, [username]);

      if (result.rows.length === 0) {
        console.log('❌ Super admin not found:', username);
        return NextResponse.json({
          error: 'Invalid credentials',
          success: false
        }, { status: 401 });
      }

      const superAdmin = result.rows[0];

      // Verify password
      const passwordMatch = await bcrypt.compare(password, superAdmin.password_hash);

      if (!passwordMatch) {
        console.log('❌ Invalid password for super admin:', username);
        return NextResponse.json({
          error: 'Invalid credentials',
          success: false
        }, { status: 401 });
      }

      // Update last login
      const updateLoginQuery = `
        UPDATE super_admins
        SET last_login = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      await client.query(updateLoginQuery, [superAdmin.id]);

      // Generate JWT token
      const token = jwt.sign(
        {
          superAdminId: superAdmin.id,
          username: superAdmin.username,
          fullName: superAdmin.full_name,
          type: 'super_admin'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('✅ Super admin login successful:', username);

      return NextResponse.json({
        message: 'Super admin login successful',
        success: true,
        token,
        superAdmin: {
          id: superAdmin.id,
          username: superAdmin.username,
          fullName: superAdmin.full_name
        }
      }, { status: 200 });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Super admin login error:', error);
    return NextResponse.json({
      error: 'Login failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}
