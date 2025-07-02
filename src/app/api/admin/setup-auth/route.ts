import { Pool } from 'pg';
import { type NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// Initialize a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Necessary for Neon DB
  },
});

export async function POST(req: NextRequest) {
  try {
    console.log('=== HOTEL ADMIN AUTH TABLE SETUP START ===');

    const client = await pool.connect();

    try {
      // Create hotel_admins table
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS hotel_admins (
          id SERIAL PRIMARY KEY,
          hotel_code VARCHAR(10) NOT NULL UNIQUE,
          hotel_name VARCHAR(255) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP NULL,
          is_active BOOLEAN DEFAULT TRUE
        );

        CREATE INDEX IF NOT EXISTS idx_hotel_admins_hotel_code ON hotel_admins(hotel_code);
        CREATE INDEX IF NOT EXISTS idx_hotel_admins_active ON hotel_admins(is_active);
      `;

      await client.query(createTableQuery);
      console.log('✅ hotel_admins table created successfully');

      // Insert sample hotel admin accounts with hashed passwords
      const sampleAdmins = [
        { hotel_code: 'P256', hotel_name: 'Phunaya Old Town', password: 'admin123' },
        { hotel_code: 'K123', hotel_name: 'The KPI Plus Residence', password: 'admin123' },
        { hotel_code: 'B427', hotel_name: 'Bangkok Grand Hotel', password: 'admin123' }
      ];

      for (const admin of sampleAdmins) {
        const hashedPassword = await bcrypt.hash(admin.password, 12);

        const insertQuery = `
          INSERT INTO hotel_admins (hotel_code, hotel_name, password_hash)
          VALUES ($1, $2, $3)
          ON CONFLICT (hotel_code)
          DO UPDATE SET
            hotel_name = EXCLUDED.hotel_name,
            password_hash = EXCLUDED.password_hash
        `;

        await client.query(insertQuery, [admin.hotel_code, admin.hotel_name, hashedPassword]);
        console.log(`✅ Admin account created/updated for hotel: ${admin.hotel_code}`);
      }

      return NextResponse.json({
        message: 'Hotel admin authentication table and sample accounts created successfully',
        success: true,
        accounts: sampleAdmins.map(admin => ({
          hotel_code: admin.hotel_code,
          hotel_name: admin.hotel_name,
          default_password: admin.password
        }))
      }, { status: 200 });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Hotel admin auth setup failed:', error);
    return NextResponse.json({
      error: 'Hotel admin auth setup failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}

// DELETE endpoint to clear all existing admin accounts (useful for fresh setup)
export async function DELETE(req: NextRequest) {
  try {
    console.log('=== CLEAR ADMIN ACCOUNTS START ===');

    const client = await pool.connect();

    try {
      // Delete all existing admin accounts
      const deleteQuery = `
        DELETE FROM hotel_admins
        RETURNING hotel_code, hotel_name
      `;

      const result = await client.query(deleteQuery);
      const deletedAccounts = result.rows;

      console.log(`✅ Deleted ${deletedAccounts.length} admin accounts`);

      return NextResponse.json({
        message: `Successfully deleted ${deletedAccounts.length} admin accounts`,
        success: true,
        deleted_accounts: deletedAccounts
      }, { status: 200 });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Failed to clear admin accounts:', error);
    return NextResponse.json({
      error: 'Failed to clear admin accounts',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}

// PUT endpoint to reset with stronger passwords
export async function PUT(req: NextRequest) {
  try {
    console.log('=== RESET ADMIN ACCOUNTS WITH STRONGER PASSWORDS ===');

    const { newPasswords } = await req.json();

    // Default stronger passwords if not provided
    const defaultStrongPasswords = {
      'P256': 'P256@SecurePass2024!',
      'K123': 'K123@StrongAuth2024!',
      'B427': 'B427@HotelSecure2024!'
    };

    const passwordsToUse = newPasswords || defaultStrongPasswords;

    const client = await pool.connect();

    try {
      // First, clear existing accounts
      await client.query('DELETE FROM hotel_admins');

      // Re-create with stronger passwords
      const sampleAdmins = [
        { hotel_code: 'P256', hotel_name: 'Phunaya Old Town', password: passwordsToUse['P256'] },
        { hotel_code: 'K123', hotel_name: 'The KPI Plus Residence', password: passwordsToUse['K123'] },
        { hotel_code: 'B427', hotel_name: 'Bangkok Grand Hotel', password: passwordsToUse['B427'] }
      ];

      const createdAccounts = [];

      for (const admin of sampleAdmins) {
        const hashedPassword = await bcrypt.hash(admin.password, 12);

        const insertQuery = `
          INSERT INTO hotel_admins (hotel_code, hotel_name, password_hash)
          VALUES ($1, $2, $3)
          RETURNING id, hotel_code, hotel_name, created_at
        `;

        const result = await client.query(insertQuery, [admin.hotel_code, admin.hotel_name, hashedPassword]);
        createdAccounts.push({
          ...result.rows[0],
          password: admin.password // Include password in response for initial setup
        });
        console.log(`✅ Strong admin account created for hotel: ${admin.hotel_code}`);
      }

      return NextResponse.json({
        message: 'Admin accounts reset with stronger passwords successfully',
        success: true,
        accounts: createdAccounts
      }, { status: 200 });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Failed to reset admin accounts:', error);
    return NextResponse.json({
      error: 'Failed to reset admin accounts with stronger passwords',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}
