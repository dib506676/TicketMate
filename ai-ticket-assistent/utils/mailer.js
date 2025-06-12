import nodemailer from "nodemailer";

export const sendMail = async (to, subject, html, text) => {
  // Check if HTML content is provided
  if (!html) {
    throw new Error("HTML content is required for sending emails");
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAILTRAP_SMTP_USER,
        pass: process.env.MAILTRAP_SMTP_PASS,
      },
    });

    const mailOptions = {
      from: '"Inngest TMS"',
      to,
      subject,
      text, // Primary content
    };

    // Add text as fallback if provided
    if (html) {
      mailOptions.html = html;
    }

    const info = await transporter.sendMail(mailOptions);

    console.log("Message sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Mail error", error.message);
    throw error;
  }
};