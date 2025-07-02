import { type NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/database';

// GET endpoint to fetch available hotels and rooms
export async function GET(req: NextRequest) {
  try {
    const query = `
      SELECT
        hotel_id,
        hotel_name,
        room_number,
        room_key_number,
        enabled
      FROM hotel_room_keys
      WHERE enabled = true
      ORDER BY hotel_name, room_number;
    `;

    const client = await getPool().connect();
    try {
      const result = await client.query(query);
      console.log('Full database query result for hotels:', result);

      // Group rooms by hotel
      const hotelsMap = new Map();

      result.rows.forEach(row => {
        if (!hotelsMap.has(row.hotel_id)) {
          hotelsMap.set(row.hotel_id, {
            id: row.hotel_id,
            name: row.hotel_name,
            enabled: true,
            rooms: {}
          });
        }

        const hotel = hotelsMap.get(row.hotel_id);
        hotel.rooms[row.room_number] = row.room_key_number;
      });

      const hotels = Array.from(hotelsMap.values());

      return NextResponse.json({
        hotels: hotels,
        count: hotels.length
      }, { revalidate: 0, cache: 'no-store' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching hotel data:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('Full error object:', error); // Add this line to log the full error

    return NextResponse.json({
      error: 'Failed to fetch hotel data',
      details: errorMessage
    }, { status: 500 });
  }
}
