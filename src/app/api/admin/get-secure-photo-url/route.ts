import { Pool } from 'pg';
import { type NextRequest, NextResponse } from 'next/server';
import { Storage, type Bucket } from '@google-cloud/storage';
import jwt from 'jsonwebtoken';

// Initialize Google Cloud Storage client lazily
let storage: Storage | null = null;
let bucket: Bucket | null = null;

function initializeGCS() {
  if (storage) return { storage, bucket };

  try {
    if (process.env.GCS_PROJECT_ID && process.env.GCS_CLIENT_EMAIL && process.env.GCS_PRIVATE_KEY && process.env.GCS_BUCKET_NAME) {
      storage = new Storage({
        projectId: process.env.GCS_PROJECT_ID,
        credentials: {
          client_email: process.env.GCS_CLIENT_EMAIL,
          private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
      });
      bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
      console.log('GCS initialized successfully for photo viewing');
    } else {
      console.log('GCS not configured for photo viewing');
    }
  } catch (error) {
    console.error('Failed to initialize GCS for photo viewing:', error);
  }

  return { storage, bucket };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-change-in-production';

// Helper function to verify admin authentication
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

// Helper function to extract file path from full URL
function getFilePathFromUrl(url: string): string | null {
  try {
    // Extract the file path from URLs like:
    // https://storage.googleapis.com/bucket-name/passport-photos/HOTEL_CODE/timestamp-filename.jpg
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');

    // Find the passport-photos part and get everything after the bucket name
    const bucketName = process.env.GCS_BUCKET_NAME;
    const bucketIndex = pathParts.indexOf(bucketName || '');

    if (bucketIndex !== -1 && bucketIndex + 1 < pathParts.length) {
      // Get the path after the bucket name
      return pathParts.slice(bucketIndex + 1).join('/');
    }

    // Fallback: if the URL starts with passport-photos, use it directly
    const passportPhotosIndex = pathParts.findIndex(part => part === 'passport-photos');
    if (passportPhotosIndex !== -1) {
      return pathParts.slice(passportPhotosIndex).join('/');
    }

    return null;
  } catch (error) {
    console.error('Error parsing photo URL:', error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    console.log('=== SECURE PHOTO URL REQUEST ===');

    // 1. Verify admin authentication
    const admin = await verifyAdminAuth(req);
    if (!admin) {
      return NextResponse.json({
        error: 'Unauthorized - Invalid or missing authentication token',
        success: false
      }, { status: 401 });
    }

    console.log(`✅ Admin authenticated: ${admin.hotelCode} - ${admin.hotelName}`);

    // 2. Get and validate file path
    const { searchParams } = new URL(req.url);
    const photoUrl = searchParams.get('photoUrl');

    if (!photoUrl) {
      return NextResponse.json({
        error: 'Photo URL parameter is required',
        success: false
      }, { status: 400 });
    }

    const filePath = getFilePathFromUrl(photoUrl);
    if (!filePath) {
      return NextResponse.json({
        error: 'Invalid photo URL format',
        success: false
      }, { status: 400 });
    }

    console.log(`📁 Extracted file path: ${filePath}`);

    // 3. Security check: Ensure admin can only access their hotel's photos
    const expectedPrefix = `passport-photos/${admin.hotelCode}/`;
    if (!filePath.startsWith(expectedPrefix)) {
      console.log(`❌ Access denied: ${admin.hotelCode} tried to access ${filePath}`);
      return NextResponse.json({
        error: 'Forbidden - Access denied to this photo',
        success: false
      }, { status: 403 });
    }

    // 4. Initialize and check if GCS is configured
    const { bucket: currentBucket } = initializeGCS();
    if (!currentBucket) {
      return NextResponse.json({
        error: 'Photo storage not configured',
        success: false
      }, { status: 503 });
    }

    // 5. Generate signed URL
    const options = {
      version: 'v4' as const,
      action: 'read' as const,
      expires: Date.now() + 15 * 60 * 1000, // URL expires in 15 minutes
    };

    console.log(`🔐 Generating signed URL for: ${filePath}`);

    const [signedUrl] = await currentBucket
      .file(filePath)
      .getSignedUrl(options);

    console.log(`✅ Signed URL generated successfully for hotel: ${admin.hotelCode}`);

    return NextResponse.json({
      success: true,
      signedUrl,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error generating secure photo URL:', error);
    return NextResponse.json({
      error: 'Failed to generate secure photo URL',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}
