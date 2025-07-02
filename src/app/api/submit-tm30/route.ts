import { Pool } from 'pg';
import { type NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { Storage, Bucket, type File as GCSFile } from '@google-cloud/storage';
import stream from 'stream';
import { promisify } from 'util';
import { randomUUID } from 'crypto'; // Import Node.js crypto module for unique IDs

// Initialize Google Cloud Storage client lazily
let storage: Storage | null = null;
let bucket: { file: (name: string) => { save: (data: Buffer, options?: object) => Promise<void> } } | null = null;

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
      console.log('GCS initialized successfully');
    } else {
      console.log('GCS not configured - passport photos will not be uploaded');
    }
  } catch (error) {
    console.error('Failed to initialize GCS:', error);
  }

  return { storage, bucket };
}

// --- END: GCS & Formidable Configuration ---

// Initialize a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Necessary for Neon DB
  },
});

// Initialize Resend (you'll need to add RESEND_API_KEY to your .env.local file)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// --- NEW: Helper function to upload file to GCS with a sanitized name ---
async function uploadToGCS(file: File | null, hotelCode: string): Promise<string | null> {
  if (!file || !hotelCode) return null;

  const { bucket: currentBucket } = initializeGCS();
  if (!currentBucket) {
    console.log('GCS not configured, skipping photo upload');
    return null;
  }

  // --- START: Filename Sanitization ---
  // Get the file extension (e.g., '.jpg', '.png')
  const fileExtension = file.name.split('.').pop();

  // Generate a unique filename to avoid special characters and collisions
  const uniqueFileName = `${randomUUID()}.${fileExtension}`;

  // Create the new, clean path
  const filePath = `passport-photos/${hotelCode}/${uniqueFileName}`;
  // --- END: Filename Sanitization ---

  console.log(`📁 Creating GCS file path: ${filePath}`);

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const blob = currentBucket.file(filePath); // Use the new sanitized path

  const blobStream = (blob as GCSFile).createWriteStream({
    resumable: false,
    contentType: file.type,
  });

  return new Promise((resolve, reject) => {
    blobStream.on('error', (err) => {
      console.error(`❌ GCS upload error for ${filePath}:`, err);
      reject(err);
    });
    blobStream.on('finish', () => {
      // The publicUrl is now clean and predictable
      const bucketName = process.env.GCS_BUCKET_NAME;
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;
      console.log(`✅ GCS upload completed: ${publicUrl}`);
      resolve(publicUrl);
    });
    blobStream.end(fileBuffer);
  });
}

// Email sending function
async function sendEmail(to: string, subject: string, htmlContent: string, fromEmail?: string) {
  try {
    if (!process.env.RESEND_API_KEY || !resend) {
      // Fallback to console logging if no API key is set or resend failed to initialize
      console.log('=== EMAIL NOTIFICATION (NO API KEY OR RESEND FAILED) ===');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${htmlContent}`);
      console.log('======================================');
      return { success: true, method: 'console' };
    }

    const { data, error } = await resend.emails.send({
      from: fromEmail || 'TM30 Registration <james@thekpiplus.com>', // You can change this when you have a custom domain
      to: [to],
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Email sending error:', error);
      return { success: false, error };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error };
  }
}

// Translation function for email templates
function getEmailTranslations(language: string) {
  const translations = {
    en: {
      successMessage: 'Registration successful! Your submission ID is:',
      guestSubject: 'Welcome to {{hotelName}} - Room Key Information',
      guestWelcome: 'Welcome to {{hotelName}}!',
      guestDear: 'Dear {{firstName}} {{lastName}},',
      guestThankYou: 'Thank you for completing your TM30 registration. Your registration has been submitted successfully.',
      guestRoomInfo: 'Your Room Information',
      guestRoomNumber: 'Room Number:',
      guestRoomKey: 'Room Key Code:',
      guestRegDetails: 'Registration Details:',
      guestSubmissionId: 'Submission ID:',
      guestCheckinDate: 'Check-in Date:',
      guestCheckoutDate: 'Check-out Date:',
      guestRegTime: 'Registration Time:',
      guestHelp: 'If you have any questions or need assistance, please contact the hotel reception.',
      guestEnjoy: 'We hope you enjoy your stay!',
      guestPrivacy: 'Note: Your personal data will be automatically deleted from our system after 7 days as per our privacy policy.'
    },
    th: {
      successMessage: 'ลงทะเบียนสำเร็จ! รหัสการส่งของท่านคือ:',
      guestSubject: 'ยินดีต้อนรับสู่ {{hotelName}} - ข้อมูลกุญแจห้อง',
      guestWelcome: 'ยินดีต้อนรับสู่ {{hotelName}}!',
      guestDear: 'เรียน {{firstName}} {{lastName}},',
      guestThankYou: 'ขอบคุณที่ทำการลงทะเบียน TM30 เสร็จสมบูรณ์ การลงทะเบียนของท่านได้ส่งเรียบร้อยแล้ว',
      guestRoomInfo: 'ข้อมูลห้องของท่าน',
      guestRoomNumber: 'หมายเลขห้อง:',
      guestRoomKey: 'รหัสกุญแจห้อง:',
      guestRegDetails: 'รายละเอียดการลงทะเบียน:',
      guestSubmissionId: 'รหัสการส่ง:',
      guestCheckinDate: 'วันที่เช็คอิน:',
      guestCheckoutDate: 'วันที่เช็คเอาท์:',
      guestRegTime: 'เวลาที่ลงทะเบียน:',
      guestHelp: 'หากท่านมีคำถามหรือต้องการความช่วยเหลือ กรุณาติดต่อแผนกต้อนรับของโรงแรม',
      guestEnjoy: 'เราหวังว่าท่านจะเพลิดเพลินกับการพักของท่าน!',
      guestPrivacy: 'หมายเหตุ: ข้อมูลส่วนบุคคลของท่านจะถูกลบออกจากระบบของเราโดยอัตโนมัติหลังจาก 7 วัน ตามนโยบายความเป็นส่วนตัวของเรา'
    },
    zh: {
      successMessage: '登记成功！您的提交ID是:',
      guestSubject: '欢迎来到 {{hotelName}} - 房间钥匙信息',
      guestWelcome: '欢迎来到 {{hotelName}}!',
      guestDear: '亲爱的 {{firstName}} {{lastName}},',
      guestThankYou: '感谢您完成TM30登记。您的登记已成功提交。',
      guestRoomInfo: '您的房间信息',
      guestRoomNumber: '房间号:',
      guestRoomKey: '房间钥匙代码:',
      guestRegDetails: '登记详情:',
      guestSubmissionId: '提交ID:',
      guestCheckinDate: '入住日期:',
      guestCheckoutDate: '退房日期:',
      guestRegTime: '登记时间:',
      guestHelp: '如果您有任何问题或需要帮助，请联系酒店前台。',
      guestEnjoy: '我们希望您度过愉快的住宿时光！',
      guestPrivacy: '注意：根据我们的隐私政策，您的个人数据将在7天后自动从我们的系统中删除。'
    },
    ru: {
      successMessage: 'Регистрация успешна! Ваш ID подачи:',
      guestSubject: 'Добро пожаловать в {{hotelName}} - Информация о ключе от номера',
      guestWelcome: 'Добро пожаловать в {{hotelName}}!',
      guestDear: 'Уважаемый {{firstName}} {{lastName}},',
      guestThankYou: 'Спасибо за завершение регистрации TM30. Ваша регистрация была успешно отправлена.',
      guestRoomInfo: 'Информация о вашем номере',
      guestRoomNumber: 'Номер комнаты:',
      guestRoomKey: 'Код ключа от комнаты:',
      guestRegDetails: 'Детали регистрации:',
      guestSubmissionId: 'ID подачи:',
      guestCheckinDate: 'Дата заезда:',
      guestCheckoutDate: 'Дата выезда:',
      guestRegTime: 'Время регистрации:',
      guestHelp: 'Если у вас есть вопросы или нужна помощь, обратитесь к стойке регистрации отеля.',
      guestEnjoy: 'Мы надеемся, что вам понравится ваше пребывание!',
      guestPrivacy: 'Примечание: Ваши персональные данные будут автоматически удалены из нашей системы через 7 дней в соответствии с нашей политикой конфиденциальности.'
    }
  };

  return translations[language as keyof typeof translations] || translations.en;
}

// Function to get room key number from database
async function getRoomKeyNumber(hotelId: string, roomNumber: string): Promise<string | null> {
  const client = await pool.connect();
  try {
    const query = `
      SELECT room_key_number
      FROM hotel_room_keys
      WHERE hotel_id = $1 AND room_number = $2 AND enabled = true
    `;
    const result = await client.query(query, [hotelId, roomNumber]);
    return result.rows.length > 0 ? result.rows[0].room_key_number : null;
  } finally {
    client.release();
  }
}

// Function to disable room (mark as occupied)
async function disableRoom(hotelId: string, roomNumber: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const query = `
      UPDATE hotel_room_keys
      SET enabled = false
      WHERE hotel_id = $1 AND room_number = $2 AND enabled = true
    `;
    const result = await client.query(query, [hotelId, roomNumber]);
    return (result.rowCount ?? 0) > 0;
  } finally {
    client.release();
  }
}

// Function to schedule room re-enabling after checkout
async function scheduleRoomReEnable(hotelId: string, roomNumber: string, numberOfNights: number): Promise<void> {
  const client = await pool.connect();
  try {
    // Calculate checkout date
    const checkoutDate = new Date();
    checkoutDate.setDate(checkoutDate.getDate() + numberOfNights);

    // Insert or update a room availability schedule record
    const query = `
      INSERT INTO room_availability_schedule (hotel_id, room_number, re_enable_date, created_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (hotel_id, room_number)
      DO UPDATE SET re_enable_date = $3, created_at = $4
    `;
    await client.query(query, [hotelId, roomNumber, checkoutDate, new Date()]);
  } finally {
    client.release();
  }
}

// --- The main POST function, updated to use request.formData() ---
export async function POST(req: NextRequest) {
  try {
    console.log('=== TM30 FORM SUBMISSION START (with native FormData) ===');

    // --- Use the built-in formData() method to parse the request ---
    let formData: FormData;
    try {
      formData = await req.formData();
      console.log('✅ FormData parsed successfully');
    } catch (formDataError) {
      console.error('❌ Failed to parse FormData:', formDataError);
      return NextResponse.json({
        error: 'Failed to parse form data',
        details: formDataError instanceof Error ? formDataError.message : 'Unknown FormData error',
        success: false
      }, { status: 400 });
    }

    // --- Extract text fields and files directly from the FormData object ---
    console.log('📝 Extracting form fields...');

    let numberOfGuests: number, numberOfNights: number;
    let email: string, hotelName: string, roomNumber: string;
    let firstName: string, lastName: string, gender: string, passportNumber: string, nationality: string;
    let birthDate: string, checkinDate: string, checkoutDate: string;
    let firstName2: string, lastName2: string, gender2: string, passportNumber2: string, nationality2: string;
    let birthDate2: string, checkinDate2: string, checkoutDate2: string;
    let passportPhoto: File | null, passportPhoto2: File | null;
    let language: string;
    let middleName: string, phoneNumber: string, middleName2: string, phoneNumber2: string;
    let consent: boolean;

    try {
      // Step 2 data (now from a previous step, so it will be the room's data)
      numberOfGuests = Number(formData.get('numberOfGuests'));
      numberOfNights = Number(formData.get('numberOfNights'));

      // Step 3 data
      email = formData.get('email') as string;
      hotelName = formData.get('hotelName') as string;
      roomNumber = formData.get('roomNumber') as string;

      // Step 4 data - Guest 1
      firstName = formData.get('firstName') as string;
      middleName = formData.get('middleName') as string || ''; // Optional, provide default
      lastName = formData.get('lastName') as string;
      gender = formData.get('gender') as string;
      passportNumber = formData.get('passportNumber') as string;
      nationality = formData.get('nationality') as string;
      birthDate = formData.get('birthDate') as string;     // In DD/MM/YYYY format from the form
      checkinDate = formData.get('checkinDate') as string;
      checkoutDate = formData.get('checkoutDate') as string;  // In DD/MM/YYYY format from the form
      phoneNumber = formData.get('phoneNumber') as string || ''; // Optional, provide default

      // Guest 2 data (optional)
      firstName2 = formData.get('firstName2') as string || '';
      middleName2 = formData.get('middleName2') as string || '';
      lastName2 = formData.get('lastName2') as string || '';
      gender2 = formData.get('gender2') as string || '';
      passportNumber2 = formData.get('passportNumber2') as string || '';
      nationality2 = formData.get('nationality2') as string || '';
      birthDate2 = formData.get('birthDate2') as string || '';
      checkinDate2 = formData.get('checkinDate2') as string || '';
      checkoutDate2 = formData.get('checkoutDate2') as string || '';
      phoneNumber2 = formData.get('phoneNumber2') as string || '';

      // Consent and Language
      consent = formData.get('consent') === 'true'; // Convert 'true' string to boolean
      language = formData.get('language') as string || 'en';

      // Extract files
      passportPhoto = formData.get('passportPhoto') as File | null;
      passportPhoto2 = formData.get('passportPhoto2') as File | null;

      console.log('✅ Form fields extracted successfully', {
        numberOfGuests,
        numberOfNights,
        email: email ? '***@***' : 'missing',
        hotelName,
        roomNumber,
        firstName: firstName ? 'provided' : 'missing',
        lastName: lastName ? 'provided' : 'missing',
        hasPassportPhoto: !!passportPhoto,
        hasPassportPhoto2: !!passportPhoto2,
        language
      });

    } catch (extractionError) {
      console.error('❌ Failed to extract form fields:', extractionError);
      return NextResponse.json({
        error: 'Failed to extract form fields',
        details: extractionError instanceof Error ? extractionError.message : 'Unknown extraction error',
        success: false
      }, { status: 400 });
    }

    // Get the hotel ID from the hotel name to lookup room key and for photo organization
    console.log('🏨 Determining hotel ID...');
    let hotelId = '';
    if (hotelName === 'Phunaya Old Town') {
      hotelId = 'P256';
    } else if (hotelName === 'The KPI Plus Residence') {
      hotelId = 'K123';
    } else if (hotelName === 'Bangkok Grand Hotel') {
      hotelId = 'B427';
    }

    // If we can't find a matching hotel ID, try to extract it from the form data
    if (!hotelId) {
      const client = await pool.connect();
      try {
        const hotelLookupQuery = `
          SELECT DISTINCT hotel_id
          FROM hotel_room_keys
          WHERE hotel_name = $1 AND enabled = true
          LIMIT 1
        `;
        const hotelResult = await client.query(hotelLookupQuery, [hotelName]);
        if (hotelResult.rows.length > 0) {
          hotelId = hotelResult.rows[0].hotel_id;
        }
      } finally {
        client.release();
      }
    }

    console.log(`🏨 Hotel ID determined: ${hotelId}`);

    // --- Upload Photos to Google Cloud Storage (with error handling) ---
    console.log('📸 Starting passport photo upload to GCS...');
    let passportPhotoUrl: string | null = null;
    let passportPhotoUrl2: string | null = null;

    try {
      if (passportPhoto) {
        console.log('📸 Uploading photo for guest 1...');
        passportPhotoUrl = await uploadToGCS(passportPhoto, hotelId);
        console.log('✅ Guest 1 photo uploaded successfully');
      }

      if (passportPhoto2) {
        console.log('📸 Uploading photo for guest 2...');
        passportPhotoUrl2 = await uploadToGCS(passportPhoto2, hotelId);
        console.log('✅ Guest 2 photo uploaded successfully');
      }

      console.log('✅ GCS Upload completed:', {
        passportPhotoUrl: passportPhotoUrl ? 'uploaded' : 'none',
        passportPhotoUrl2: passportPhotoUrl2 ? 'uploaded' : 'none'
      });
    } catch (error) {
      console.error('❌ GCS upload failed, continuing without photo URLs:', error);
      // For now, continue without photo URLs if GCS isn't configured
      // In production, you might want to handle this differently
    }


    // Form data validation
    console.log('🔍 Validating required fields...');
    const requiredFields = {
      numberOfGuests,
      firstName: firstName ? 'provided' : 'MISSING',
      lastName: lastName ? 'provided' : 'MISSING',
      passportNumber: passportNumber ? 'provided' : 'MISSING',
      gender: gender ? 'provided' : 'MISSING',
      nationality: nationality ? 'provided' : 'MISSING',
      birthDate: birthDate ? 'provided' : 'MISSING',
      checkinDate: checkinDate ? 'provided' : 'MISSING',
      checkoutDate: checkoutDate ? 'provided' : 'MISSING',
      email: email ? 'provided' : 'MISSING',
      hotelName: hotelName ? 'provided' : 'MISSING',
      roomNumber: roomNumber ? 'provided' : 'MISSING'
    };
    console.log('✅ Required fields check:', requiredFields);

    // Validate guest 1 fields
    if (!firstName || !lastName || !passportNumber || !gender || !nationality || !birthDate || !checkinDate || !checkoutDate || !email || !hotelName || !roomNumber) {
      console.log('❌ Validation failed - missing required fields for guest 1');
      return NextResponse.json({
        error: 'Missing required fields',
        details: 'Please fill in all required fields for guest 1.'
      }, { status: 400 });
    }

    // Validate guest 2 fields if 2 guests selected
    if (numberOfGuests === 2) {
      console.log('🔍 Validating guest 2 fields:', {
        firstName2: firstName2 ? 'provided' : 'MISSING',
        lastName2: lastName2 ? 'provided' : 'MISSING',
        passportNumber2: passportNumber2 ? 'provided' : 'MISSING',
        gender2: gender2 ? 'provided' : 'MISSING',
        nationality2: nationality2 ? 'provided' : 'MISSING',
        birthDate2: birthDate2 ? 'provided' : 'MISSING',
        checkinDate2: checkinDate2 ? 'provided' : 'MISSING',
        checkoutDate2: checkoutDate2 ? 'provided' : 'MISSING'
      });

      if (!firstName2 || !lastName2 || !passportNumber2 || !gender2 || !nationality2 || !birthDate2 || !checkinDate2 || !checkoutDate2) {
        console.log('❌ Validation failed - missing required fields for guest 2');
        return NextResponse.json({
          error: 'Missing required fields',
          details: 'Please fill in all required fields for guest 2.'
        }, { status: 400 });
      }
    }

    console.log('✅ Validation passed - proceeding with submission');

    // Get room key number from database
    console.log(`Looking up room key for hotel: ${hotelId}, room: ${roomNumber}`);
    const roomKeyNumber = await getRoomKeyNumber(hotelId, roomNumber);
    console.log(`Room key number found: ${roomKeyNumber}`);

    if (!roomKeyNumber) {
      console.log('Room key lookup failed');
      return NextResponse.json({
        error: 'Invalid room selection',
        details: 'The selected room is not available or does not exist.'
      }, { status: 400 });
    }

    // Disable the room (mark as occupied)
    console.log(`Disabling room ${roomNumber} for hotel ${hotelId}`);
    const roomDisabled = await disableRoom(hotelId, roomNumber);
    if (!roomDisabled) {
      console.log('Failed to disable room - may already be occupied');
      return NextResponse.json({
        error: 'Room unavailable',
        details: 'The selected room has become unavailable. Please select another room.'
      }, { status: 400 });
    }

    // Schedule room re-enabling after checkout
    console.log(`Scheduling room re-enabling after ${numberOfNights} nights`);
    await scheduleRoomReEnable(hotelId, roomNumber, numberOfNights);

    // Insert guests into the database
    const client = await pool.connect();
    const submissionIds: string[] = [];
    const guests = [];

    // Add guest 1
    guests.push({
      firstName,
      middleName: middleName || null,
      lastName,
      gender,
      passportNumber,
      nationality,
      birthDate,
      checkoutDate,
      phoneNumber: phoneNumber || null,
      checkinDate,
      passportPhotoUrl: passportPhotoUrl,
    });

    // Add guest 2 if applicable
    if (numberOfGuests === 2) {
      guests.push({
        firstName: firstName2,
        middleName: middleName2 || null,
        lastName: lastName2,
        gender: gender2,
        passportNumber: passportNumber2,
        nationality: nationality2,
        birthDate: birthDate2,
        checkoutDate: checkoutDate2,
        phoneNumber: phoneNumber2 || null,
        checkinDate: checkinDate2,
        passportPhotoUrl: passportPhotoUrl2
      });
    }

    const query = `
      INSERT INTO tm30_submissions (
        first_name,
        middle_name,
        last_name,
        gender,
        passport_number,
        nationality,
        birth_date,
        checkout_date,
        phone_number,
        checkin_date,
        passport_photo_url,
        hotel_name,
        email,
        room_number,
        notes,
        status,
        submitted_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      ) RETURNING id;
    `;

    try {
      // Insert each guest
      for (let i = 0; i < guests.length; i++) {
        const guest = guests[i];
        const guestNumber = i + 1;

        const values = [
          guest.firstName,                           // first_name
          guest.middleName,                          // middle_name
          guest.lastName,                            // last_name
          guest.gender,                              // gender
          guest.passportNumber,                      // passport_number
          guest.nationality,                         // nationality
          guest.birthDate,                           // birth_date (keeping as DD/MM/YYYY)
          guest.checkoutDate,                        // checkout_date (keeping as DD/MM/YYYY)
          guest.phoneNumber,                         // phone_number
          guest.checkinDate,                         // checkin_date (keeping as DD/MM/YYYY)
          guest.passportPhotoUrl,                    // passport_photo_url
          hotelName,                                 // hotel_name
          email,                                     // email
          roomNumber,                                // room_number
          `Multi-guest form submission (Guest ${guestNumber} of ${numberOfGuests}) - ${numberOfNights} nights`, // notes
          'PENDING',                                 // status
          new Date().toISOString()                   // submitted_at
        ];

        const result = await client.query(query, values);
        submissionIds.push(result.rows[0].id);
      }
    } finally {
      client.release();
    }

    // Use the first submission ID as the primary ID for email purposes
    const submissionId = submissionIds[0];

    // Get translations for the selected language
    const t = getEmailTranslations(language);

    // Send email to hotel admin (always in English for admin)
    const adminT = getEmailTranslations('en');
    const adminEmailSubject = `New TM30 Submission${numberOfGuests > 1 ? 's' : ''} - ${numberOfGuests} Guest${numberOfGuests > 1 ? 's' : ''} - ID: ${submissionId}`;

    // Generate guest information HTML
    let guestInfoHtml = '';
    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i];
      const guestNumber = i + 1;
      guestInfoHtml += `
        <div class="guest-section" style="margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
          <h4 style="margin-top: 0; color: #2563eb;">Guest ${guestNumber} Information</h4>
          <div class="field"><span class="label">Name:</span> ${guest.firstName} ${guest.middleName ? `${guest.middleName} ` : ''}${guest.lastName}</div>
          <div class="field"><span class="label">Passport:</span> ${guest.passportNumber}</div>
          <div class="field"><span class="label">Nationality:</span> ${guest.nationality}</div>
          <div class="field"><span class="label">Birth Date:</span> ${guest.birthDate}</div>
          <div class="field"><span class="label">Check-in Date:</span> ${guest.checkinDate}</div>
          <div class="field"><span class="label">Check-out Date:</span> ${guest.checkoutDate}</div>
          <div class="field"><span class="label">Phone:</span> ${guest.phoneNumber || 'Not provided'}</div>
        </div>
      `;
    }

    const adminEmailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .details { background-color: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
          .field { margin-bottom: 10px; }
          .label { font-weight: bold; color: #555; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New TM30 Guest Registration${numberOfGuests > 1 ? 's' : ''}</h2>
            <p><strong>Number of Guests:</strong> ${numberOfGuests}</p>
            <p><strong>Primary Submission ID:</strong> ${submissionId}</p>
            ${submissionIds.length > 1 ? `<p><strong>All Submission IDs:</strong> ${submissionIds.join(', ')}</p>` : ''}
          </div>

          <div class="details">
            <h3>Booking Information</h3>
            <div class="field"><span class="label">Hotel:</span> ${hotelName}</div>
            <div class="field"><span class="label">Room:</span> ${roomNumber}</div>
            <div class="field"><span class="label">Email:</span> ${email}</div>
            <div class="field"><span class="label">Submitted:</span> ${new Date().toLocaleString()}</div>
          </div>

          <div class="details" style="margin-top: 20px;">
            <h3>Guest${numberOfGuests > 1 ? 's' : ''} Information</h3>
            ${guestInfoHtml}
          </div>

          <p style="margin-top: 20px;">Please review ${numberOfGuests > 1 ? 'these submissions' : 'this submission'} in the admin panel.</p>
        </div>
      </body>
      </html>
    `;

    // Send email to guest with room key information (in selected language)
    const guestEmailSubject = t.guestSubject.replace('{{hotelName}}', hotelName);
    const guestEmailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .room-info { background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e40af; }
          .details { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { font-size: 12px; color: #666; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${t.guestWelcome.replace('{{hotelName}}', hotelName)}</h2>
          </div>

          <p>${t.guestDear.replace('{{firstName}}', firstName).replace('{{lastName}}', lastName)}</p>

          <p>${t.guestThankYou}</p>

          <div class="room-info">
            <h3 style="color: #1e40af; margin-top: 0;">${t.guestRoomInfo}</h3>
            <p><strong>${t.guestRoomNumber}</strong> ${roomNumber}</p>
            <p><strong>${t.guestRoomKey}</strong> ${roomKeyNumber}</p>
          </div>

          <div class="details">
            <h4>${t.guestRegDetails}</h4>
            <ul>
              <li>${t.guestSubmissionId} ${submissionId}${submissionIds.length > 1 ? ` (+ ${submissionIds.slice(1).join(', ')})` : ''}</li>
              <li>Number of Guests: ${numberOfGuests}</li>
              <li>${t.guestCheckinDate} ${checkinDate}</li>
              <li>${t.guestCheckoutDate} ${checkoutDate}</li>
            </ul>
          </div>

          <p>${t.guestHelp}</p>

          <p>${t.guestEnjoy}</p>

          <div class="footer">
            <p><small>${t.guestPrivacy}</small></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResults = {
      adminEmail: { success: false },
      guestEmail: { success: false }
    };

    try {
      // Send admin email
      const adminEmailResult = await sendEmail(
        process.env.ADMIN_EMAIL || 'admin@hotel.com', // You can set this in .env.local
        adminEmailSubject,
        adminEmailContent
      );
      emailResults.adminEmail = adminEmailResult;

      // Send guest email
      const guestEmailResult = await sendEmail(
        email,
        guestEmailSubject,
        guestEmailContent
      );
      emailResults.guestEmail = guestEmailResult;

    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the entire request if email fails
    }

    return NextResponse.json({
      message: `TM30 registration submitted successfully for ${numberOfGuests} guest${numberOfGuests > 1 ? 's' : ''} staying ${numberOfNights} night${numberOfNights > 1 ? 's' : ''}`,
      submissionId,
      submissionIds,
      numberOfGuests,
      numberOfNights,
      roomKeyNumber: roomKeyNumber,
      emailStatus: emailResults,
      language: language, // Include language in response for frontend
      translations: t // Include translations for frontend display
    }, { status: 201 });

  } catch (error) {
    console.error('=== SUBMISSION ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
        errorMessage = error.message;
    }

    return NextResponse.json({
      error: 'Failed to submit TM30 form.',
      details: errorMessage,
      success: false
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
