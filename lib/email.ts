import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    await transporter.sendMail({
      from: `VocabWise <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    })
  } catch (err: unknown) {
    const e = err as { code?: string; command?: string; response?: string; message?: string }
    console.error('[email] sendMail failed:', {
      code: e.code,
      command: e.command,
      response: e.response,
      message: e.message,
      GMAIL_USER: process.env.GMAIL_USER ? `set (${process.env.GMAIL_USER})` : 'MISSING',
      GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? `set (${process.env.GMAIL_APP_PASSWORD.length} chars)` : 'MISSING',
    })
    throw err
  }
}
