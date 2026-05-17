
// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import nodemailer from 'nodemailer';

// Helper function to get SMTP settings
async function getSmtpSettings() {
    try {
        const { rows } = await db.query("SELECT key, value FROM system_settings WHERE key LIKE 'smtp_%' OR key = 'logo_base64'");
        const settings = rows.reduce((acc, row) => {
            acc[row.key] = row.value;
            return acc;
        }, {} as Record<string, string>);
        
        if (!settings.smtp_email || !settings.smtp_password || !settings.smtp_server) {
             console.error("Missing SMTP settings.");
             return null;
        }

        return {
            email: settings.smtp_email,
            password: settings.smtp_password,
            server: settings.smtp_server,
            ssl: settings.smtp_ssl === 'true',
            logo: settings.logo_base64 || null
        };
    } catch (error) {
        console.error("Error fetching SMTP settings:", error);
        return null;
    }
}


export async function GET() {
  try {
    const { rows } = await db.query('SELECT id, full_name, username, email, phone_number, role FROM users');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Error fetching users', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { full_name, username, email, password, role, phone_number } = await request.json();
    
    if (!full_name || !username || !password || !role || !phone_number) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    // Per user request, storing password in plaintext.
    const password_hash = password;

    const { rows } = await db.query(
      `INSERT INTO users (full_name, username, email, password_hash, role, phone_number) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, full_name, username, email, phone_number, role`,
      [full_name, username, email || null, password_hash, role, phone_number]
    );
    const newUser = rows[0];

    // If an email was provided, send a welcome email
    if (newUser.email) {
      try {
        const smtpSettings = await getSmtpSettings();
        if (smtpSettings && smtpSettings.password) { // Check for password
          const transporter = nodemailer.createTransport({
            host: smtpSettings.server,
            port: smtpSettings.ssl ? 465 : 587,
            secure: smtpSettings.ssl, 
            auth: {
              user: smtpSettings.email,
              pass: smtpSettings.password,
            },
          });

          const attachments = [];
          if (smtpSettings.logo) {
              attachments.push({
                  filename: 'logo.png',
                  path: smtpSettings.logo,
                  cid: 'logo'
              });
          }
          const logoHtml = smtpSettings.logo ? `<div style="text-align: center; margin-bottom: 20px;"><img src="cid:logo" alt="Restaurant Logo" style="max-width: 150px; height: auto;"/></div>` : '';

          const emailHtml = `
            <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; background-color: #f9f9f9; padding: 20px;">
              <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                ${logoHtml}
                <div style="padding: 20px;">
                  <h2>أهلاً بك في كرسبر!</h2>
                  <p>مرحباً ${newUser.full_name}،</p>
                  <p>يسعدنا انضمامك إلينا! تم إنشاء حسابك بنجاح.</p>
                  <p>يمكنك الآن تصفح قائمتنا، حفظ وجباتك المفضلة، والاستمتاع بتجربة طلب سريعة وسهلة.</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${request.headers.get('origin') || 'http://localhost:3000'}" style="background-color: #F4991A; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold;">ابدأ الطلب الآن</a>
                  </div>
                  <p>شكراً لاختيارك كرسبر.</p>
                </div>
                <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #888;">
                  <p>&copy; ${new Date().getFullYear()} كرسبر. جميع الحقوق محفوظة.</p>
                </div>
              </div>
            </div>
          `;

          await transporter.sendMail({
            from: `"كرسبر" <${smtpSettings.email}>`,
            to: newUser.email,
            subject: '🎉 أهلاً بك في كرسبر! حسابك جاهز.',
            html: emailHtml,
            attachments: attachments,
          });
        } else {
             console.error("Welcome email not sent: SMTP settings are incomplete (password might be missing).");
        }
      } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
          // Do not block the signup process if email fails
      }
    }
    
    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
     if (error.code === '23505') { // Unique violation
        return NextResponse.json({ message: 'اسم المستخدم أو البريد الإلكتروني أو رقم الهاتف موجود بالفعل.' }, { status: 409 });
    }
    console.error('Error creating user:', error);
    return NextResponse.json({ message: 'Error creating user', error: error.message }, { status: 500 });
  }
}
