require("dotenv").config(); // 🔥 MUST BE FIRST LINE

const nodemailer = require("nodemailer");

// =======================
// TRANSPORTER
// =======================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // 🔥 App Password
  },
});

// =======================
// VERIFY CONNECTION
// =======================
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Error connecting to email server:", error);
  } else {
    console.log("✅ Email server is ready to send messages");
  }
});

// =======================
// CORE EMAIL FUNCTION
// =======================
const sendEmail = async (to, subject, text, html) => {
  try {
    if (!to) {
      throw new Error("Recipient email (to) is missing");
    }

    console.log("📨 Sending to:", to);

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    });

    console.log("📧 Message sent:", info.messageId);
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
  }
};

// =======================
// EMAIL TEMPLATES
// =======================

async function sendRegistrationEmail(userEmail, name) {
  const subject = "Welcome to CivicTrack 🚧";

  const text = `Hello ${name},

Welcome to CivicTrack!

You are now part of a community working together to improve local civic issues like potholes, garbage, water leaks, and more.

With CivicTrack, you can:
- Report issues in your area
- Track complaint status
- Support existing issues through upvotes
- Help authorities prioritize real problems

Let’s build a better neighborhood together.

Best regards,  
Team CivicTrack`;

  const html = `
  <h2>Welcome to CivicTrack 🚧</h2>
  <p>Hello ${name},</p>
  <p>We're excited to have you onboard!</p>

  <p>You can now:</p>
  <ul>
    <li>📍 Report civic issues in your area</li>
    <li>📊 Track complaint progress</li>
    <li>👍 Support issues by upvoting</li>
    <li>🤝 Contribute to a better community</li>
  </ul>

  <p>Together, we can make our city cleaner and safer.</p>

  <p><strong>— Team CivicTrack</strong></p>
  `;

  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
  const subject = "Transaction Successful!";
  const text = `Hello ${name},

Your transaction of $${amount} to account ${toAccount} was successful.

Best regards,
The Backend Ledger Team`;

  const html = `<p>Hello ${name},</p>
  <p>Your transaction of $${amount} to account ${toAccount} was successful.</p>
  <p>Best regards,<br>The Backend Ledger Team</p>`;

  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
  const subject = "Transaction Failed";
  const text = `Hello ${name},

We regret to inform you that your transaction of $${amount} to account ${toAccount} has failed. Please try again later.

Best regards,
The Backend Ledger Team`;

  const html = `<p>Hello ${name},</p>
  <p>We regret to inform you that your transaction of $${amount} to account ${toAccount} has failed.</p>
  <p>Please try again later.</p>
  <p>Best regards,<br>The Backend Ledger Team</p>`;

  await sendEmail(userEmail, subject, text, html);
}

// =======================
// EXPORTS
// =======================
module.exports = {
  sendRegistrationEmail,
  sendTransactionEmail,
  sendTransactionFailureEmail,
};