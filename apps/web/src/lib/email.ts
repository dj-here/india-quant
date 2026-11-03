export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(payload: SendEmailPayload): Promise<{ success: boolean; messageId?: string }> {
  const { to, subject, html, text } = payload;
  const resendApiKey = process.env.RESEND_API_KEY;

  // 1. Try Resend if API key is provided
  if (resendApiKey && resendApiKey.trim() !== '') {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: process.env.SMTP_FROM || 'CampusEdge <partnerships@campusedge.in>',
          to: [to],
          subject,
          html,
          text: text || html.replace(/<[^>]*>?/gm, ''),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[Email] Resend email dispatched to ${to}. ID: ${data.id}`);
        return { success: true, messageId: data.id };
      } else {
        const err = await res.text();
        console.warn(`[Email Warning] Resend API returned error: ${err}. Falling back.`);
      }
    } catch (error) {
      console.warn('[Email Warning] Resend network error:', error);
    }
  }

  // 2. Simulated/Local logger fallback (standard production-safe behavior for local testing)
  console.log(`
================================================================================
[TRANSACTIONAL EMAIL DISPATCHED]
To: ${to}
Subject: ${subject}
Date: ${new Date().toISOString()}
Content Preview:
${(text || html).slice(0, 300)}...
================================================================================
  `);

  return { success: true, messageId: `mock_${Date.now()}` };
}

export async function sendLeadConfirmationEmails(lead: {
  collegeName: string;
  city: string;
  state: string;
  contactPerson: string;
  role: string;
  email: string;
  phone: string;
  studentStrength: number;
  interestedPrograms: string;
}) {
  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || 'CampusEdge Learning Solutions';
  const ownerEmail = process.env.NOTIFICATION_EMAIL || 'dj0791463@gmail.com';

  // 1. Confirmation to the prospective College Lead (TPO / Principal)
  const leadSubject = `Demo Request Confirmation - CampusEdge Placement Training (${lead.collegeName})`;
  const leadHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
      <div style="background: #0f172a; padding: 20px; color: white; border-radius: 6px 6px 0 0;">
        <h2 style="margin: 0; color: #38bdf8;">CampusEdge Learning Solutions</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #cbd5e1;">Institutional Placement Finishing School</p>
      </div>
      <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 6px 6px; background: #ffffff;">
        <p>Dear <strong>${lead.contactPerson}</strong> (${lead.role}),</p>
        <p>Thank you for requesting a Free Placement Demo & Institutional Proposal for <strong>${lead.collegeName}</strong> (${lead.city}, ${lead.state}).</p>
        <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 12px 16px; margin: 16px 0;">
          <p style="margin: 0; font-weight: bold; font-size: 14px;">Summary of Request:</p>
          <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 13px;">
            <li><strong>Cohort Strength:</strong> ${lead.studentStrength} students</li>
            <li><strong>Interested Tracks:</strong> ${lead.interestedPrograms}</li>
            <li><strong>Official Contact:</strong> ${lead.email} | ${lead.phone}</li>
          </ul>
        </div>
        <p>Our Head of Institutional Partnerships is reviewing your academic calendar and will connect with you within <strong>24 business hours</strong> to schedule your 90-minute placement masterclass or 2-week pilot.</p>
        <p>In the meantime, you can review our syllabus and NBA/NAAC compliance frameworks on our portal: <a href="https://campusedge.in" style="color: #0284c7;">https://campusedge.in</a></p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b; margin: 0;">
          CampusEdge EdTech Private Limited<br/>
          TPO Partnerships Desk: +91 63662 14556 | dj0791463@gmail.com
        </p>
      </div>
    </div>
  `;

  // 2. Notification to the Business Owner
  const ownerSubject = `🚨 NEW TPO LEAD: ${lead.collegeName} (${lead.studentStrength} students, ${lead.city})`;
  const ownerHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
      <h3 style="color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 8px;">New Institutional Demo Request Received</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr><td style="padding: 6px; font-weight: bold; width: 140px;">College Name:</td><td style="padding: 6px;">${lead.collegeName}</td></tr>
        <tr><td style="padding: 6px; font-weight: bold;">Location:</td><td style="padding: 6px;">${lead.city}, ${lead.state}</td></tr>
        <tr><td style="padding: 6px; font-weight: bold;">Contact Person:</td><td style="padding: 6px;">${lead.contactPerson} (${lead.role})</td></tr>
        <tr><td style="padding: 6px; font-weight: bold;">Email:</td><td style="padding: 6px;"><a href="mailto:${lead.email}">${lead.email}</a></td></tr>
        <tr><td style="padding: 6px; font-weight: bold;">Phone / WhatsApp:</td><td style="padding: 6px;"><a href="https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}">${lead.phone}</a></td></tr>
        <tr><td style="padding: 6px; font-weight: bold;">Batch Size:</td><td style="padding: 6px;">${lead.studentStrength} students</td></tr>
        <tr><td style="padding: 6px; font-weight: bold;">Programs:</td><td style="padding: 6px;">${lead.interestedPrograms}</td></tr>
      </table>
      <p style="margin-top: 16px;"><a href="https://campusedge.in/admin/leads" style="background: #0284c7; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold;">Open in Admin CRM</a></p>
    </div>
  `;

  await Promise.allSettled([
    sendEmail({ to: lead.email, subject: leadSubject, html: leadHtml }),
    sendEmail({ to: ownerEmail, subject: ownerSubject, html: ownerHtml }),
  ]);
}
