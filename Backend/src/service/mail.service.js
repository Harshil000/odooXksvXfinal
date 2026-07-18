import nodemailer from "nodemailer";

/**
 * Sends a generic email using SMTP configuration.
 * Logs a warning if SMTP configuration is missing, avoiding application crashes.
 */
export async function sendEmail({ to, subject, text, html }) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER;
  const passRaw = process.env.SMTP_PASS;
  const pass = typeof passRaw === "string" ? passRaw.replace(/\s+/g, "") : passRaw;
  const from = process.env.MAIL_FROM;

  if (!host || !user || !pass || !from) {
    console.warn("SMTP configuration missing in .env (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM). Skipping email.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
  }
}

/**
 * Sends a return reminder email.
 */
export async function sendReturnReminderEmail({ to, productName, daysLeft, dueDate, durationType }) {
  let relativeDayStr = "";
  let badgeColor = "#e8f5e9";
  let textColor = "#2e7d32";
  
  if (daysLeft === 3) {
    relativeDayStr = "Due in 3 days";
    badgeColor = "#fff3e0"; // light orange
    textColor = "#e65100";  // dark orange
  } else if (daysLeft === 1) {
    relativeDayStr = "Due tomorrow";
    badgeColor = "#ffe0b2"; // medium orange
    textColor = "#f57c00";
  } else if (daysLeft === 0) {
    relativeDayStr = "Due today";
    badgeColor = "#ffebee"; // light red
    textColor = "#c62828";  // dark red
  }

  const subject = `Rental Return Reminder: "${productName}" is due ${relativeDayStr.toLowerCase()}!`;
  
  const formattedDate = new Date(dueDate).toLocaleDateString("en-US", {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="background-color: ${badgeColor}; color: ${textColor}; padding: 6px 16px; border-radius: 50px; font-size: 0.85em; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
          ${relativeDayStr}
        </span>
        <h2 style="color: #1e293b; margin-top: 15px; margin-bottom: 5px; font-size: 22px; font-weight: 700;">Rental Return Notice</h2>
        <p style="color: #64748b; margin: 0; font-size: 14px;">Friendly reminder to arrange your product return</p>
      </div>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500; width: 40%;">Product Name</td>
            <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 700; text-align: right;">${productName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500;">Due Date</td>
            <td style="padding: 10px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500;">Rental Period Type</td>
            <td style="padding: 10px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right; text-transform: capitalize;">${durationType || "standard"}</td>
          </tr>
        </table>
      </div>
      
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 25px 0;">
        Please ensure the item is returned on schedule to prevent late fees or penalty charges. If you have already dropped off the item or contacted support, you can safely ignore this reminder.
      </p>
      
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
      <div style="text-align: center; color: #94a3b8; font-size: 12px; font-weight: 500;">
        Thank you for renting with Zenith Rental
      </div>
    </div>
  `;

  await sendEmail({ to, subject, text: `Reminder: your rental for "${productName}" is due ${relativeDayStr.toLowerCase()} (${formattedDate}).`, html });
}

/**
 * Sends an overdue penalty warning email.
 */
export async function sendOverduePenaltyEmail({ to, productName, daysDelayed, penaltyRate, totalPenalty, dueDate, durationType }) {
  const subject = `URGENT: Rental OVERDUE for "${productName}" - Penalty Charges Accruing`;

  const formattedDate = new Date(dueDate).toLocaleDateString("en-US", {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #fecaca; border-radius: 12px; background-color: #fff8f8; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.05);">
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="background-color: #fee2e2; color: #dc2626; padding: 6px 16px; border-radius: 50px; font-size: 0.85em; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
          OVERDUE BY ${daysDelayed} DAYS
        </span>
        <h2 style="color: #991b1b; margin-top: 15px; margin-bottom: 5px; font-size: 22px; font-weight: 700;">Urgent: Overdue Notice</h2>
        <p style="color: #7f1d1d; margin: 0; font-size: 14px; opacity: 0.85;">Late return detected for your rental product</p>
      </div>

      <div style="background-color: #ffffff; border: 1px solid #fee2e2; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500; width: 40%;">Product Name</td>
            <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 700; text-align: right;">${productName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500;">Scheduled Return Date</td>
            <td style="padding: 10px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${formattedDate}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500;">Rental Period Type</td>
            <td style="padding: 10px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right; text-transform: capitalize;">${durationType || "standard"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500;">Daily Penalty Rate</td>
            <td style="padding: 10px 0; color: #b91c1c; font-size: 14px; font-weight: 600; text-align: right;">$${Number(penaltyRate).toFixed(2)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500;">Days Missed</td>
            <td style="padding: 10px 0; color: #b91c1c; font-size: 14px; font-weight: 700; text-align: right;">${daysDelayed} days</td>
          </tr>
          <tr style="background-color: #fef2f2;">
            <td style="padding: 12px 10px; color: #991b1b; font-size: 15px; font-weight: 700;">Total Penalty Accrued</td>
            <td style="padding: 12px 10px; color: #b91c1c; font-size: 17px; font-weight: 800; text-align: right;">$${Number(totalPenalty).toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <p style="color: #7f1d1d; font-size: 14px; line-height: 1.6; margin: 0 0 25px 0; font-weight: 500;">
        You are liable to pay these penalty charges under the terms of your rental contract. Please return the product immediately to prevent further penalty accrual.
      </p>

      <hr style="border: 0; border-top: 1px solid #fee2e2; margin: 25px 0;" />
      <div style="text-align: center; color: #94a3b8; font-size: 12px; font-weight: 500;">
        Zenith Rental Support — If you have returned the item, please contact us immediately.
      </div>
    </div>
  `;

  await sendEmail({
    to,
    subject,
    text: `URGENT: your rental for "${productName}" is overdue by ${daysDelayed} days. Penalty due: $${Number(totalPenalty).toFixed(2)}.`,
    html
  });
}