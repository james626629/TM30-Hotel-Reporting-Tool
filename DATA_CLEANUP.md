# Automatic Data Cleanup System

## Overview

The TM30 Reporting Tool automatically deletes guest submission data after 7 days to comply with privacy regulations and the data collection notice shown to users.

## How It Works

### 1. Automatic Cleanup (Production)
- **Scheduled**: Runs daily at 2:00 AM UTC via Vercel Cron
- **Configuration**: `vercel.json` contains the cron schedule
- **Endpoint**: `POST /api/cleanup-old-submissions`

### 2. Manual Cleanup (Admin Panel)
- **Check Old Data**: Preview what records would be deleted
- **Delete Old Data**: Manually trigger cleanup process
- **Location**: Admin panel → Data Privacy Compliance section

## API Endpoints

### GET /api/cleanup-old-submissions
**Purpose**: Preview records that would be deleted (dry run)

**Response**:
```json
{
  "success": true,
  "cutoffDate": "2025-05-28T02:00:00.000Z",
  "totalRecordsToDelete": 15,
  "previewRecords": [
    {
      "id": 123,
      "name": "John Doe",
      "submittedAt": "2025-05-20T10:30:00.000Z",
      "daysOld": 8
    }
  ],
  "message": "15 records are ready for deletion (older than 7 days)"
}
```

### POST /api/cleanup-old-submissions
**Purpose**: Actually delete old records

**Response**:
```json
{
  "success": true,
  "message": "Successfully deleted 15 records older than 7 days",
  "deletedCount": 15,
  "cutoffDate": "2025-05-28T02:00:00.000Z",
  "deletedRecords": [
    {
      "id": 123,
      "name": "John Doe",
      "submittedAt": "2025-05-20T10:30:00.000Z"
    }
  ]
}
```

## Database Operations

### Deletion Criteria
```sql
DELETE FROM tm30_submissions
WHERE submitted_at < (NOW() - INTERVAL '7 days')
```

### What Gets Deleted
- All personal information (names, passport numbers, etc.)
- Contact information (email, phone)
- Hotel and room details
- Submission timestamps

### What's Preserved
- Hotel room keys configuration (separate table)
- System logs and analytics (anonymized)
- No personal data is retained

## Privacy Compliance

### Data Retention Policy
- **7 days maximum**: All guest data is automatically deleted
- **No exceptions**: System enforces deletion regardless of status
- **Secure deletion**: Records are permanently removed from database

### Audit Trail
- Cleanup operations are logged to console
- Deletion counts and timestamps are recorded
- No personal data is included in logs

### User Notification
- Privacy notice shown during registration
- Email confirmation includes retention policy
- Clear communication about automatic deletion

## Monitoring & Troubleshooting

### Success Indicators
- Cron job runs without errors
- Deletion counts match expected volumes
- No old records remain in database

### Common Issues
1. **Cron job fails**: Check Vercel dashboard for errors
2. **Database connection**: Verify DATABASE_URL environment variable
3. **Permission denied**: Ensure database user has DELETE permissions

### Manual Verification
```sql
-- Check for records older than 7 days
SELECT COUNT(*) FROM tm30_submissions
WHERE submitted_at < (NOW() - INTERVAL '7 days');

-- Should return 0 if cleanup is working
```

## Development vs Production

### Development
- Manual cleanup via admin panel
- No automatic scheduling by default
- Can use `cleanup-scheduler.ts` for testing

### Production (Vercel)
- Automatic daily cleanup via Vercel Cron
- Runs at 2:00 AM UTC every day
- Manual cleanup still available via admin panel

## Security Considerations

- Cleanup endpoint requires no authentication (intended for cron)
- No sensitive data exposed in API responses
- Deletion is irreversible - no recovery possible
- Complies with GDPR "right to erasure" automatically

## Future Enhancements

- [ ] Configurable retention period
- [ ] Email notifications to admins on cleanup
- [ ] Backup before deletion (encrypted)
- [ ] Audit log dashboard
- [ ] Per-hotel retention policies
