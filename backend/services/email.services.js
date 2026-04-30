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





// =======================
// EXPORTS
// =======================



async function sendComplaintRaisedEmail(userEmail, name, complaint) {
  const subject = "Complaint Raised Successfully - CivicTrack";

  const text = `Hello ${name},

Your complaint has been raised successfully.

Title: ${complaint.title}
Category: ${complaint.category}
Description: ${complaint.description}
Status: ${complaint.status || "pending"}

We will notify you when there is an update.

Best regards,
Team CivicTrack`;

  const html = `
    <h2>Complaint Raised Successfully 🚧</h2>
    <p>Hello ${name},</p>

    <p>Your complaint has been raised successfully.</p>

    <h3>Complaint Details:</h3>
    <p><strong>Title:</strong> ${complaint.title}</p>
    <p><strong>Category:</strong> ${complaint.category}</p>
    <p><strong>Description:</strong> ${complaint.description}</p>
    <p><strong>Status:</strong> ${complaint.status || "pending"}</p>

    <p>We will notify you when there is an update.</p>

    <p><strong>— Team CivicTrack</strong></p>
  `;

  await sendEmail(userEmail, subject, text, html);
}


async function sendComplaintSuccessEmail(userEmail, name, complaint) {
  const subject = "Your Complaint Has Been Resolved - CivicTrack";

  const text = `Hello ${name},

Good news! Your complaint has been marked as resolved.

Title: ${complaint.title}
Category: ${complaint.category}
Description: ${complaint.description}
Status: Success

Thank you for helping improve your community.

Best regards,
Team CivicTrack`;

  const html = `
    <h2>Complaint Resolved ✅</h2>
    <p>Hello ${name},</p>

    <p>Good news! Your complaint has been marked as resolved.</p>

    <h3>Complaint Details:</h3>
    <p><strong>Title:</strong> ${complaint.title}</p>
    <p><strong>Category:</strong> ${complaint.category}</p>
    <p><strong>Description:</strong> ${complaint.description}</p>
    <p><strong>Status:</strong> Success</p>

    <p>Thank you for helping improve your community.</p>

    <p><strong>— Team CivicTrack</strong></p>
  `;

  await sendEmail(userEmail, subject, text, html);
}
module.exports = {
  sendRegistrationEmail,
  sendComplaintRaisedEmail,
  sendComplaintSuccessEmail
};