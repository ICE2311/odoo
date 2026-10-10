import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  console.log('========================================');
  console.log(' 📬 Nodemailer SMTP Configuration Test');
  console.log('========================================\n');

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, ''); // Gmail app passwords can have spaces stripped
  const from = process.env.EMAIL_FROM || `Skyline SSA <${user}>`;

  // Optional recipient from CLI: npx tsx scripts/test-email.ts user@example.com
  const recipient = process.argv[2] || user;

  console.log('Configuration detected:');
  console.log(`- SMTP Host:   ${host}`);
  console.log(`- SMTP Port:   ${port}`);
  console.log(`- Secure (SSL):${secure}`);
  console.log(`- SMTP User:   ${user}`);
  console.log(`- Password:    ${pass ? '******** (configured)' : 'MISSING'}`);
  console.log(`- From Header: ${from}`);
  console.log(`- Sending To:  ${recipient}\n`);

  if (!host || !user || !pass) {
    console.error('❌ Error: Missing SMTP credentials in .env file!');
    console.error('Ensure SMTP_HOST, SMTP_USER, and SMTP_PASS are set.');
    process.exit(1);
  }

  // 1. Create Transporter
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    // Useful for testing with self-signed or modern TLS
    tls: {
      rejectUnauthorized: false,
    },
  });

  // 2. Verify connection configuration
  console.log('1️⃣  Verifying SMTP connection credentials...');
  try {
    await transporter.verify();
    console.log('✅ SMTP connection successfully established and authenticated!\n');
  } catch (err: any) {
    console.error('❌ SMTP Connection failed:');
    console.error(err.message || err);
    if (host.includes('gmail.com')) {
      console.log('\n💡 Tip for Gmail:');
      console.log('  1. You must use a 16-character Google "App Password", not your normal Gmail password.');
      console.log('  2. Enable 2-Step Verification on your Google Account: https://myaccount.google.com/security');
      console.log('  3. Create an App Password at: https://myaccount.google.com/apppasswords');
      console.log('  4. Set SMTP_PASS to that 16-character string.');
    }
    process.exit(1);
  }

  // 3. Send test email
  console.log(`2️⃣  Sending test email to ${recipient}...`);
  try {
    const info = await transporter.sendMail({
      from,
      to: recipient,
      subject: '✅ Skyline SSA — Nodemailer Test Email',
      text: `Hello!\n\nThis is a test email sent from your Skyline SSA application at ${new Date().toISOString()}.\n\nIf you see this, your Nodemailer SMTP configuration is working perfectly!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-top: 0;">🎉 Nodemailer is Working!</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.5;">
            This is a test email sent from your <strong>Skyline Student Association</strong> application.
          </p>
          <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 20px 0; font-family: monospace; font-size: 13px; color: #334155;">
            <div><strong>Timestamp:</strong> ${new Date().toLocaleString()}</div>
            <div><strong>Host:</strong> ${host}:${port}</div>
            <div><strong>Sender:</strong> ${from}</div>
            <div><strong>Recipient:</strong> ${recipient}</div>
          </div>
          <p style="color: #10b981; font-weight: bold;">
            All system transactional and announcement emails can now be delivered successfully.
          </p>
        </div>
      `,
    });

    console.log('✅ Email sent successfully!');
    console.log(`- Message ID: ${info.messageId}`);
    console.log(`- Response:   ${info.response}`);
    console.log('\n🎉 Your Nodemailer setup is fully working!');
  } catch (err: any) {
    console.error('❌ Failed to send email:');
    console.error(err.message || err);
    process.exit(1);
  }
}

main();

