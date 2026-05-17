
// src/app/api/auth/forgot-password/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import nodemailer from 'nodemailer';

const MAX_REQUESTS = 2;
const LOCKOUT_PERIOD_HOURS = 1;


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


export async function POST(request: Request) {
  try {
    const { identifier } = await request.json();
    if (!identifier) {
      return NextResponse.json({ message: 'البريد الإلكتروني مطلوب.' }, { status: 400 });
    }

    // Find user by email
    const { rows } = await db.query(
        `SELECT id, full_name, email, password_hash, password_reset_requests FROM users WHERE email = $1`,
        [identifier]
    );

    if (rows.length === 0) {
      // Return a generic success message to prevent user enumeration
      return NextResponse.json({ message: 'تم إرسال طلب إعادة التعيين بنجاح.' });
    }

    const user = rows[0];
    const now = new Date();
    
    const recentRequests: Date[] = (user.password_reset_requests || [])
      .map((ts: string) => new Date(ts))
      .filter((ts: Date) => now.getTime() - ts.getTime() < LOCKOUT_PERIOD_HOURS * 60 * 60 * 1000);

    if (recentRequests.length >= MAX_REQUESTS) {
        return NextResponse.json({ message: `لقد تجاوزت الحد المسموح به. يرجى المحاولة مرة أخرى بعد ساعة.` }, { status: 429 });
    }


    if (!user.email) {
        return NextResponse.json({ message: 'هذا الحساب غير مرتبط ببريد إلكتروني. يرجى التواصل مع إدارة المطعم.' }, { status: 400 });
    }

    const smtpSettings = await getSmtpSettings();
    if (!smtpSettings || !smtpSettings.password) { // Check for password explicitly
         return NextResponse.json({ message: 'خدمة البريد الإلكتروني غير مهيأة حاليًا.' }, { status: 500 });
    }

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
            cid: 'logo' // same cid value as in the html img src
        });
    }
    const logoHtml = smtpSettings.logo ? `<div style="text-align: center; margin-bottom: 20px;"><img src="cid:logo" alt="Restaurant Logo" style="max-width: 150px; height: auto;"/></div>` : '';

    const emailHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; background-color: #f9f9f9; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                ${logoHtml}
                <div style="padding: 20px;">
                    <h2>إعادة تعيين كلمة المرور</h2>
                    <p>مرحباً ${user.full_name},</p>
                    <p>لقد طلبت إعادة تعيين كلمة المرور لحسابك في مطعم كرسبر.</p>
                    <p>كلمة مرورك الحالية هي:</p>
                    <p style="font-size: 1.5rem; font-weight: bold; color: #F4991A; border: 1px solid #eee; padding: 10px; background: #f9f9f9; text-align: center; direction: ltr;">
                      ${user.password_hash}
                    </p>
                    <p>يمكنك استخدامها لتسجيل الدخول إلى حسابك.</p>
                </div>
                <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #888;">
                  <p>&copy; ${new Date().getFullYear()} كرسبر. جميع الحقوق محفوظة.</p>
                  <p>إذا لم تطلب هذا الإجراء، يمكنك تجاهل هذه الرسالة.</p>
                </div>
            </div>
        </div>
    `;

    await transporter.sendMail({
      from: `"كرسبر" <${smtpSettings.email}>`,
      to: user.email,
      subject: 'إعادة تعيين كلمة المرور - مطعم كرسبر',
      html: emailHtml,
      attachments: attachments,
    });

    // Update the request timestamps
    const updatedRequests = [...recentRequests, now];
    await db.query(
      'UPDATE users SET password_reset_requests = $1 WHERE id = $2',
      [JSON.stringify(updatedRequests), user.id]
    );

    
    return NextResponse.json({ message: 'إذا كان البريد الإلكتروني صحيحاً، سيتم إرسال كلمة المرور إليه.' });

  } catch (error: any) {
    console.error('[Forgot Password API] Error:', error);
    // Return a more specific error message
    return NextResponse.json({ message: error.message || 'حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.' }, { status: 500 });
  }
}
