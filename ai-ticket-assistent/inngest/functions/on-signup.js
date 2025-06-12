import { inngest } from "../client.js";
import user from "../../models/user.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";

export const onUserSignup = inngest.createFunction(
  { id: "on-user-signup", retries: 2 },
  { event: "user/signup" },
  async ({ event, step }) => {
    try {
      const { email } = event.data;
      const userExist = await step.run("get-user-email", async () => {
        const userObject = await user.findOne({ email });
        if (!userObject) {
          throw new NonRetriableError("User no longer exists in our database");
        }
        return userObject;
      });

      await step.run("send-welcome-email", async () => {
        const subject = `Welcome to TicketMate! 🎉`;

        // Text version for email clients that don't support HTML
        const textContent = `
Welcome to TicketMate!

Hi there! 👋

Thank you for signing up for TicketMate! We're excited to have you on board and help you streamline your ticket management process.

What you can do with TicketMate:
✓ Create and manage support tickets
✓ Track ticket status and progress
✓ Collaborate with your team
✓ Get real-time updates and notifications
✓ Access your tickets from anywhere

Get started now: ${process.env.FRONTEND_URL || "http://localhost:3000"}

If you have any questions or need assistance, don't hesitate to reach out to our support team. We're here to help!

Best regards,
The TicketMate Team

---
This email was sent to ${
          userExist.email
        }. If you didn't sign up for TicketMate, please ignore this email.
        `;

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to TicketMate</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
              }
              .container {
                background-color: #ffffff;
                border-radius: 8px;
                padding: 40px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo {
                background-color: #2563eb;
                color: white;
                width: 60px;
                height: 60px;
                border-radius: 12px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 20px;
              }
              h1 {
                color: #1f2937;
                margin: 0 0 10px 0;
                font-size: 28px;
              }
              .subtitle {
                color: #6b7280;
                font-size: 16px;
                margin: 0;
              }
              .content {
                margin: 30px 0;
              }
              .welcome-text {
                font-size: 16px;
                margin-bottom: 20px;
                color: #374151;
              }
              .features {
                background-color: #f3f4f6;
                border-radius: 6px;
                padding: 20px;
                margin: 25px 0;
              }
              .features h3 {
                color: #1f2937;
                margin: 0 0 15px 0;
                font-size: 18px;
              }
              .feature-list {
                list-style: none;
                padding: 0;
                margin: 0;
              }
              .feature-list li {
                padding: 8px 0;
                color: #4b5563;
                position: relative;
                padding-left: 25px;
              }
              .feature-list li:before {
                content: "✓";
                color: #10b981;
                font-weight: bold;
                position: absolute;
                left: 0;
              }
              .cta {
                text-align: center;
                margin: 30px 0;
              }
              .cta-button {
                display: inline-block;
                background-color: #2563eb;
                color: white;
                text-decoration: none;
                padding: 12px 30px;
                border-radius: 6px;
                font-weight: 500;
                font-size: 16px;
              }
              .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">T</div>
                <h1>Welcome to TicketMate!</h1>
                <p class="subtitle">Your ticket management solution</p>
              </div>
              
              <div class="content">
                <p class="welcome-text">
                  Hi there! 👋<br><br>
                  Thank you for signing up for TicketMate! We're excited to have you on board and help you streamline your ticket management process.
                </p>
                
                <div class="features">
                  <h3>What you can do with TicketMate:</h3>
                  <ul class="feature-list">
                    <li>Create and manage support tickets</li>
                    <li>Track ticket status and progress</li>
                    <li>Collaborate with your team</li>
                    <li>Get real-time updates and notifications</li>
                    <li>Access your tickets from anywhere</li>
                  </ul>
                </div>
                
                <div class="cta">
                  <a href="${
                    process.env.FRONTEND_URL || "http://localhost:3000"
                  }" class="cta-button">
                    Get Started Now
                  </a>
                </div>
                
                <p class="welcome-text">
                  If you have any questions or need assistance, don't hesitate to reach out to our support team. We're here to help!
                </p>
              </div>
              
              <div class="footer">
                <p>Best regards,<br>The TicketMate Team</p>
                <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
                  This email was sent to ${
                    userExist.email
                  }. If you didn't sign up for TicketMate, please ignore this email.
                </p>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendMail(userExist.email, subject, htmlContent, textContent);
      });

      return { success: true };
    } catch (error) {
      console.error("❌ Error running step", error.message);
      return { success: false };
    }
  }
);
