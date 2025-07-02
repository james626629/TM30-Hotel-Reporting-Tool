# Migration Guide: Personal to Company Accounts

## Overview
This guide covers the migration process from personal accounts to company accounts for:
- **Neon Database** (PostgreSQL hosting)
- **Resend.dev** (Email service)

## Pre-Migration Checklist

### 📋 Information to Gather
- [ ] Current database connection string
- [ ] Current Resend API key
- [ ] List of all environment variables
- [ ] Database schema and data backup
- [ ] Email templates and configurations
- [ ] Domain verification status (if using custom domains)

### 📊 Current System Inventory
- [ ] Document all database tables and their purposes
- [ ] List all email types being sent
- [ ] Note any custom email domains
- [ ] Record current usage metrics (storage, emails per month)

## Part 1: Neon Database Migration

### Step 1: Company Account Setup
1. **Create Company Neon Account**
   ```bash
   # Navigate to https://neon.tech
   # Sign up with company email
   # Choose appropriate plan (Pro/Scale for production)
   ```

2. **Create New Database Project**
   - Project Name: `tm30-reporting-production`
   - Region: Choose closest to your users
   - PostgreSQL Version: Latest stable (15+)

### Step 2: Database Migration Process

#### Option A: Manual Schema Recreation (Recommended)
```sql
-- 1. Export current schema
pg_dump --schema-only --no-owner --no-privileges $CURRENT_DATABASE_URL > schema.sql

-- 2. Export data
pg_dump --data-only --no-owner --no-privileges $CURRENT_DATABASE_URL > data.sql

-- 3. Apply to new database
psql $NEW_COMPANY_DATABASE_URL < schema.sql
psql $NEW_COMPANY_DATABASE_URL < data.sql
```

#### Option B: Using Neon Database Branching (If available)
```bash
# Create a branch from current database
neon branches create --name production-migration
```

### Step 3: Required Tables Verification
Ensure these tables exist in the new database:
```sql
-- Core tables
- tm30_submissions
- hotel_room_keys
- room_availability_schedule

-- Verify data integrity
SELECT COUNT(*) FROM tm30_submissions;
SELECT COUNT(*) FROM hotel_room_keys;
SELECT COUNT(*) FROM room_availability_schedule;
```

### Step 4: Update Environment Variables
```bash
# Old personal database
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb

# New company database
DATABASE_URL=postgresql://company_user:new_password@ep-yyy.us-east-1.aws.neon.tech/tm30_production
```

## Part 2: Resend.dev Migration

### Step 1: Company Account Setup
1. **Create Company Resend Account**
   ```bash
   # Navigate to https://resend.com
   # Sign up with company email
   # Choose appropriate plan based on email volume
   ```

2. **Domain Setup (If using custom domain)**
   ```bash
   # Add company domain
   # Configure DNS records:
   # - SPF record
   # - DKIM record
   # - DMARC record (optional but recommended)
   ```

### Step 2: API Key Migration
```bash
# Old personal API key
RESEND_API_KEY=re_xxxxx_personal_key

# New company API key
RESEND_API_KEY=re_yyyyy_company_key
```

### Step 3: Email Templates Migration
Current email templates to migrate:
- Guest welcome email (multilingual)
- Admin notification email
- Room key information email

### Step 4: From Address Configuration
```javascript
// Update in: /src/app/api/submit-tm30/route.ts
// Old
from: 'TM30 Registration <noreply@resend.dev>'

// New (with custom domain)
from: 'TM30 Registration <noreply@yourcompany.com>'
```

## Part 3: Environment Variables Update

### Development Environment (.env.local)
```bash
# Database
DATABASE_URL=postgresql://company_user:password@ep-yyy.us-east-1.aws.neon.tech/tm30_production

# Email Service
RESEND_API_KEY=re_yyyyy_company_key

# Admin Settings
ADMIN_EMAIL=admin@yourcompany.com

# Optional: Custom domain for emails
EMAIL_FROM_DOMAIN=yourcompany.com
```

### Production Environment (Vercel)
```bash
# Update in Vercel Dashboard > Project Settings > Environment Variables
# Or via Vercel CLI:

vercel env add DATABASE_URL production
vercel env add RESEND_API_KEY production
vercel env add ADMIN_EMAIL production
```

## Part 4: Migration Testing

### Database Migration Testing
```sql
-- Test database connectivity
SELECT version();

-- Test data integrity
SELECT COUNT(*) FROM tm30_submissions;
SELECT COUNT(*) FROM hotel_room_keys WHERE enabled = true;

-- Test room availability system
SELECT * FROM room_availability_schedule WHERE processed = false;
```

### Email Testing
```bash
# Test API endpoint
curl -X POST http://localhost:3000/api/submit-tm30 \
  -H "Content-Type: application/json" \
  -d '{
    "numberOfGuests": 1,
    "numberOfNights": 1,
    "email": "test@yourcompany.com",
    "hotelName": "Test Hotel",
    "roomNumber": "101",
    "firstName": "Test",
    "lastName": "User",
    "passportNumber": "TEST123",
    "nationality": "USA",
    "gender": "M",
    "birthDate": "01/01/1990",
    "checkoutDate": "01/01/2025"
  }'
```

## Part 5: DNS and Domain Configuration

### For Custom Email Domain
```bash
# DNS Records to add:
# Replace 'yourcompany.com' with your actual domain

# SPF Record (TXT)
"v=spf1 include:_spf.resend.com ~all"

# DKIM Record (TXT) - Get from Resend dashboard
# Name: resend._domainkey.yourcompany.com
# Value: [Provided by Resend]

# DMARC Record (TXT) - Optional but recommended
# Name: _dmarc.yourcompany.com
"v=DMARC1; p=quarantine; rua=mailto:dmarc@yourcompany.com"
```

## Part 6: Rollback Plan

### Database Rollback
```sql
-- Keep backup of personal database active during migration
-- If issues occur, update environment variable back to:
DATABASE_URL=postgresql://old_personal_connection_string
```

### Email Rollback
```bash
# Revert to personal Resend account
RESEND_API_KEY=re_xxxxx_personal_key
```

## Part 7: Post-Migration Verification

### ✅ Checklist
- [ ] All forms submit successfully
- [ ] Emails are sent and received
- [ ] Room availability system works
- [ ] Database queries perform well
- [ ] Admin panel functions correctly
- [ ] Cron jobs execute properly
- [ ] All languages display correctly

### Performance Monitoring
```bash
# Monitor database performance
# Check email delivery rates
# Verify room booking system
# Test multilingual functionality
```

## Part 8: Cost Optimization

### Neon Database
- **Current Plan**: Note current usage
- **Recommended Plan**: Pro ($20/month) or Scale ($69/month)
- **Storage**: Monitor actual usage vs allocated
- **Compute**: Optimize for expected traffic

### Resend.dev
- **Current Plan**: Note email volume
- **Recommended Plan**: Pro ($20/month) for 100k emails
- **Domain**: Custom domain recommended for production

## Part 9: Security Considerations

### Access Control
```bash
# Database
- Use strong passwords
- Enable connection limits
- Set up IP restrictions if needed
- Enable audit logging

# Email Service
- Rotate API keys regularly
- Set up webhook authentication
- Monitor bounce rates
- Implement rate limiting
```

### Secrets Management
```bash
# Use environment variables only
# Never commit secrets to git
# Use Vercel's secure environment variable storage
# Consider using a secrets manager for enterprise
```

## Part 10: Timeline and Responsibilities

### Migration Timeline (Recommended: 1-2 days)
- **Day 1 Morning**: Set up company accounts and configure
- **Day 1 Afternoon**: Migrate database and test
- **Day 2 Morning**: Migrate email service and test
- **Day 2 Afternoon**: Full system testing and go-live

### Responsibilities
- **Dev Team**: Technical migration and testing
- **IT Team**: DNS configuration and domain setup
- **Admin Team**: Account setup and billing
- **QA Team**: Full system testing

## Emergency Contacts
```bash
# Support Contacts
Neon Database Support: support@neon.tech
Resend Support: support@resend.com

# Internal Contacts
Project Lead: [Name] <email@company.com>
DevOps Team: [Name] <devops@company.com>
IT Admin: [Name] <it@company.com>
```

## Final Notes
- Schedule migration during low-traffic hours
- Have rollback plan ready
- Monitor system closely for 24-48 hours post-migration
- Update documentation with new account details
- Cancel personal accounts after successful migration and grace period
