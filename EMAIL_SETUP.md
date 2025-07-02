# Email Setup Instructions

## To enable real email notifications, follow these steps:

### 1. Sign up for Resend (Free Tier Available)
1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key
1. Log in to your Resend dashboard
2. Go to API Keys section
3. Click "Create API Key"
4. Copy the API key

### 3. Configure Environment Variables
1. Open your `.env.local` file
2. Add your Resend API key:
   ```
   RESEND_API_KEY=re_your_api_key_here
   ```
3. Set the admin email address:
   ```
   ADMIN_EMAIL=your-admin@example.com
   ```

### 4. Domain Setup (Optional - for custom from addresses)
If you want to send emails from your own domain:
1. In Resend dashboard, go to Domains
2. Add your domain
3. Add the required DNS records
4. Update the `from` field in the API code

### 5. Test the Setup
1. Restart your development server: `bun dev`
2. Submit a test form
3. Check the console logs for email status
4. Check your email inbox

## Email Features

### Admin Email Notification
- Sent to the address specified in `ADMIN_EMAIL`
- Contains all guest information and submission ID
- Professional HTML formatting

### Guest Welcome Email
- Sent to the guest's email address
- Contains room key information
- Includes registration details and privacy notice

## Fallback Behavior
- If no `RESEND_API_KEY` is provided, emails will be logged to console
- The form submission will still work normally
- Email status is included in the API response

## Free Tier Limits
- Resend free tier: 3,000 emails/month, 100 emails/day
- Perfect for hotel guest registration use case

## Troubleshooting
- Check console logs for detailed error messages
- Verify API key is correct and active
- Ensure email addresses are valid
- Check spam folders for test emails
