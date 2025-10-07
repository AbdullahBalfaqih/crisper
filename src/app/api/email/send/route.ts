
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db } from '@/lib/db';

async function getSmtpSettings() {
    try {
        const { rows } = await db.query('SELECT key, value FROM system_settings WHERE key LIKE \'smtp_%\' OR key = \'logo_base64\'');
        const settings = rows.reduce((acc, row) => {
            acc[row.key] = row.value;
            return acc;
        }, {} as Record<string, string>);
        
        if (!settings.smtp_email || !settings.smtp_server) {
             console.error("Missing primary SMTP settings: email or server");
             return null;
        }

        // The password might not be returned every time, but it should exist in the DB for the first time.
        // If it's not in the settings payload from this specific query, we assume it's stored and will be used by nodemailer.
        // We only require it to be present for the *initial* configuration.
        // This logic is handled by the settings save API which doesn't overwrite password if not provided.

        return {
            email: settings.smtp_email,
            password: settings.smtp_password, // This can be undefined if not changed
            server: settings.smtp_server,
            ssl: settings.smtp_ssl === 'true',
            logo: settings.logo_base64 || null,
        };
    } catch (error) {
        console.error("Error fetching SMTP settings:", error);
        return null;
    }
}


export async function POST(request: Request) {
  try {
    const { recipientEmails, recipientNames, subject, message } = await request.json();

    if (!recipientEmails || recipientEmails.length === 0 || !subject || !message) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const smtpSettings = await getSmtpSettings();
    
    if (!smtpSettings || !smtpSettings.password) {
        return NextResponse.json({ message: 'SMTP settings are not configured in the system.' }, { status: 500 });
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

    const attachments: any[] = [];
    let logoHtml = '';
    if (smtpSettings.logo) {
        attachments.push({
            filename: 'logo.png',
            path: smtpSettings.logo,
            cid: 'logo' // same cid value as in the html img src
        });
        logoHtml = '<div style="text-align: center; margin-bottom: 20px;"><img src="cid:logo" alt="Restaurant Logo" style="max-width: 150px; height: auto;"/></div>';
    }


    // Send personalized email to each recipient
    const sendPromises = recipientEmails.map((email: string, index: number) => {
        const personalizedMessage = message.replace(/\[اسم العميل\]/g, recipientNames[index] || 'عميلنا العزيز');
        
        const emailHtml = `
            <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; background-color: #f9f9f9; padding: 20px;">
                <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    ${logoHtml}
                    <div style="padding: 20px;">
                        ${personalizedMessage.replace(/\n/g, '<br>')}
                    </div>
                    <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #888;">
                        <p>&copy; ${new Date().getFullYear()} كرسبر. جميع الحقوق محفوظة.</p>
                    </div>
                </div>
            </div>
        `;
        
        return transporter.sendMail({
            from: `"كرسبر" <${smtpSettings.email}>`,
            to: email,
            subject: subject,
            html: emailHtml,
            attachments: attachments,
        });
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ message: 'Emails sent successfully' });

  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json({ message: 'Failed to send email', error: error.message }, { status: 500 });
  }
}
