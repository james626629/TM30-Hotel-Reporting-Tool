import { Pool } from 'pg';
import { type NextRequest, NextResponse } from 'next/server';

// Initialize a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Necessary for Neon DB
  },
});

export async function POST(req: NextRequest) {
  try {
    console.log('=== ROOM AVAILABILITY MIGRATION START ===');

    const client = await pool.connect();

    try {
      // Create room_availability_schedule table
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS room_availability_schedule (
          id SERIAL PRIMARY KEY,
          hotel_id VARCHAR(255) NOT NULL,
          room_number VARCHAR(50) NOT NULL,
          re_enable_date TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          processed BOOLEAN DEFAULT FALSE,
          UNIQUE(hotel_id, room_number)
        );

        CREATE INDEX IF NOT EXISTS idx_room_schedule_re_enable
        ON room_availability_schedule(re_enable_date)
        WHERE processed = FALSE;
      `;

      await client.query(createTableQuery);
      console.log('✅ room_availability_schedule table created successfully');

      return NextResponse.json({
        message: 'Room availability schedule table created successfully',
        success: true
      }, { status: 200 });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}

// Function to process room re-enabling (to be called by cron job)
export async function GET(req: NextRequest) {
  try {
    console.log('=== PROCESSING ROOM RE-ENABLING ===');

    const client = await pool.connect();

    try {
      // Get rooms that should be re-enabled (checkout date has passed)
      const selectQuery = `
        SELECT hotel_id, room_number, re_enable_date
        FROM room_availability_schedule
        WHERE re_enable_date::date <= NOW()::date AND processed = FALSE
      `;

      const result = await client.query(selectQuery);
      const roomsToReEnable = result.rows;

      console.log(`Found ${roomsToReEnable.length} rooms to re-enable`);

      let reEnabledCount = 0;

      for (const room of roomsToReEnable) {
        try {
          // Re-enable the room
          const updateRoomQuery = `
            UPDATE hotel_room_keys
            SET enabled = true
            WHERE hotel_id = $1 AND room_number = $2
          `;

          await client.query(updateRoomQuery, [room.hotel_id, room.room_number]);

          // Mark as processed
          const markProcessedQuery = `
            UPDATE room_availability_schedule
            SET processed = true
            WHERE hotel_id = $1 AND room_number = $2
          `;

          await client.query(markProcessedQuery, [room.hotel_id, room.room_number]);

          reEnabledCount++;
          console.log(`✅ Re-enabled room ${room.room_number} for hotel ${room.hotel_id}`);

        } catch (error) {
          console.error(`❌ Failed to re-enable room ${room.room_number}:`, error);
        }
      }

      return NextResponse.json({
        message: `Processed ${reEnabledCount} rooms for re-enabling`,
        roomsProcessed: reEnabledCount,
        success: true
      }, { status: 200 });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Room re-enabling process failed:', error);
    return NextResponse.json({
      error: 'Room re-enabling process failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}
