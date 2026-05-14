const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendVoiceSubmissionEmail = async (voice, adminEmail) => {
  const adminContent = `
    <h2>New Voice Submission</h2>
    <p><strong>Title:</strong> ${voice.title}</p>
    <p><strong>Author:</strong> ${voice.authorName}</p>
    <p><strong>Email:</strong> ${voice.authorEmail}</p>
    <p><strong>Phone:</strong> ${voice.authorPhone || 'Not provided'}</p>
    <p><strong>Type:</strong> ${voice.type}</p>
    <p><strong>Content:</strong></p>
    <p>${voice.content.substring(0, 500)}...</p>
    <hr>
    <a href="${process.env.FRONTEND_URL}/admin/voices">Review in Admin Panel</a>
  `;
  
  await transporter.sendMail({
    from: `"Jeevajyothi Media" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `New Voice Submission: ${voice.title}`,
    html: adminContent
  });
  
  const userContent = `
    <h2>Thank you for your submission!</h2>
    <p>Dear ${voice.authorName},</p>
    <p>We have received your submission "<strong>${voice.title}</strong>" and it is under review.</p>
    <p>You will receive an update within 48 hours.</p>
    <br>
    <p>Blessings,<br>Jeevajyothi Media Team</p>
  `;
  
  await transporter.sendMail({
    from: `"Jeevajyothi Media" <${process.env.EMAIL_USER}>`,
    to: voice.authorEmail,
    subject: 'Your Voice Submission Received',
    html: userContent
  });
};

module.exports = { sendVoiceSubmissionEmail };