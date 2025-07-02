# Room Availability Management System

## Overview
The TM30 Guest Registration system now includes an intelligent room availability management system that automatically controls room booking status based on guest stays.

## How It Works

### 1. Room Booking Process
- When a guest submits the TM30 form, they select:
  - Number of guests (1 or 2)
  - Number of nights staying (1-30 nights)
  - Hotel and room number
- Upon successful form submission:
  - The selected room's `enabled` status changes from `true` to `false`
  - Room becomes unavailable for new bookings
  - A scheduled checkout date is calculated and stored

### 2. Automatic Room Re-enabling
- After the number of nights selected, the room automatically becomes available again
- A cron job runs every 4 hours to check for rooms that should be re-enabled
- When checkout time arrives, room `enabled` status changes from `false` to `true`

### 3. Database Structure

#### `hotel_room_keys` Table
- `enabled` column: Boolean value controlling room availability
- `true` = Room available for booking
- `false` = Room occupied/unavailable

#### `room_availability_schedule` Table (New)
- `hotel_id`: Hotel identifier
- `room_number`: Room number
- `re_enable_date`: Calculated checkout timestamp
- `processed`: Boolean flag to prevent duplicate processing

## API Endpoints

### Room Management
- **POST** `/api/migrate-room-schedule` - Creates the room availability table
- **GET** `/api/migrate-room-schedule` - Processes room re-enabling (cron job)

### Form Submission
- Room availability is automatically managed during TM30 form submission
- Failed submissions don't affect room availability

## Cron Jobs
```json
{
  "crons": [
    {
      "path": "/api/migrate-room-schedule",
      "schedule": "0 */4 * * *"
    }
  ]
}
```

## User Experience
1. **Guest selects stay duration** on Step 2
2. **Only available rooms shown** in hotel selection
3. **Room becomes occupied** immediately after booking
4. **Automatic checkout** processing without manual intervention

## Features
- ✅ Real-time room availability
- ✅ Automatic room state management
- ✅ Conflict prevention (double bookings)
- ✅ Scheduled checkout processing
- ✅ Multi-language support for nights selection
- ✅ Error handling for unavailable rooms

## Admin Benefits
- No manual room management required
- Automatic availability updates
- Prevents double bookings
- Real-time occupancy tracking
- Audit trail in database

## Testing the System
1. Submit a form with 1 night stay
2. Verify room becomes unavailable
3. Wait for cron job or manually trigger re-enabling
4. Verify room becomes available again

## Migration
Run the migration to create the new table:
```bash
curl -X POST http://localhost:3000/api/migrate-room-schedule
```
