import { inngest } from "../client.js";
import ticket from "../../models/ticket.js";
import user from "../../models/user.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";
import analyzeTicket from "../../utils/ai.js";

export const onTicketCreated = inngest.createFunction(
  { id: "on-ticket-created", retries: 2 },
  { event: "ticket/created" },
  async ({ event, step }) => {
    try {
      const { ticketId } = event.data;

      //fetch ticket from DB
      const ticketExist = await step.run("fetch-ticket", async () => {
        const ticketObject = await ticket.findById(ticketId);
        if (!ticketObject) {
          throw new NonRetriableError("Ticket not found");
        }
        return ticketObject;
      });

      await step.run("update-ticket-status", async () => {
        await ticket.findByIdAndUpdate(ticketExist._id, { status: "TODO" });
      });

      const aiResponse = await analyzeTicket(ticketExist);

      const relatedskills = await step.run("ai-processing", async () => {
        let skills = [];
        if (aiResponse) {
          await ticket.findByIdAndUpdate(ticketExist._id, {
            priority: !["low", "medium", "high"].includes(aiResponse.priority)
              ? "medium"
              : aiResponse.priority,
            helpfulNotes: aiResponse.helpfulNotes,
            status: aiResponse.status || "IN_PROGRESS",
            relatedSkills: aiResponse.relatedSkills,
          });
          skills = aiResponse.relatedSkills;
        }
        return skills;
      });

      const moderator = await step.run("assign-moderator", async () => {
        let userExist = await user.findOne({
          role: "moderator",
          skills: {
            $elemMatch: {
              $regex: relatedskills.join("|"),
              $options: "i",
            },
          },
        });
        if (!userExist) {
          userExist = await user.findOne({
            role: "admin",
          });
        }
        await ticket.findByIdAndUpdate(ticketExist._id, {
          assignedTo: userExist?._id,
        });
        return userExist;
      });

      await step.run("send-email-notification", async () => {
        if (moderator) {
          const finalTicket = await ticket.findById(ticketExist._id);
          const subject = `🎯 New Ticket Assigned: ${finalTicket.title}`;
          
          // Text version for email clients that don't support HTML
          const textContent = `
New Ticket Assignment

Hi ${moderator.email},

A new ticket has been assigned to you:

Ticket Title: ${finalTicket.title}
Description: ${finalTicket.description}
Priority: ${finalTicket.priority || 'Not set'}
Status: ${finalTicket.status || 'Not set'}
Created: ${new Date(finalTicket.createdAt).toLocaleString()}

${finalTicket.helpfulNotes ? `AI Notes: ${finalTicket.helpfulNotes}` : ''}

Please review and take action on this ticket as soon as possible.

View ticket: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/tickets/${finalTicket._id}

Best regards,
TicketMate System
          `;

          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>New Ticket Assignment</title>
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
                  padding-bottom: 20px;
                  border-bottom: 2px solid #e5e7eb;
                }
                .logo {
                  background-color: #2563eb;
                  color: white;
                  width: 50px;
                  height: 50px;
                  border-radius: 10px;
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 20px;
                  font-weight: bold;
                  margin-bottom: 15px;
                }
                h1 {
                  color: #1f2937;
                  margin: 0 0 10px 0;
                  font-size: 24px;
                }
                .subtitle {
                  color: #6b7280;
                  font-size: 16px;
                  margin: 0;
                }
                .content {
                  margin: 30px 0;
                }
                .greeting {
                  font-size: 16px;
                  margin-bottom: 25px;
                  color: #374151;
                }
                .ticket-card {
                  background-color: #f3f4f6;
                  border-radius: 8px;
                  padding: 25px;
                  margin: 25px 0;
                  border-left: 4px solid #2563eb;
                }
                .ticket-title {
                  font-size: 18px;
                  font-weight: 600;
                  color: #1f2937;
                  margin: 0 0 15px 0;
                }
                .ticket-details {
                  margin: 15px 0;
                }
                .detail-row {
                  display: flex;
                  justify-content: space-between;
                  margin: 8px 0;
                  padding: 8px 0;
                  border-bottom: 1px solid #e5e7eb;
                }
                .detail-label {
                  font-weight: 500;
                  color: #6b7280;
                  min-width: 100px;
                }
                .detail-value {
                  color: #1f2937;
                  text-align: right;
                }
                .priority-high {
                  color: #dc2626;
                  font-weight: 600;
                }
                .priority-medium {
                  color: #d97706;
                  font-weight: 600;
                }
                .priority-low {
                  color: #059669;
                  font-weight: 600;
                }
                .ai-notes {
                  background-color: #fef3c7;
                  border: 1px solid #f59e0b;
                  border-radius: 6px;
                  padding: 15px;
                  margin: 20px 0;
                }
                .ai-notes h4 {
                  color: #92400e;
                  margin: 0 0 10px 0;
                  font-size: 14px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                }
                .ai-notes p {
                  color: #78350f;
                  margin: 0;
                  font-size: 14px;
                  line-height: 1.5;
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
                .urgency {
                  background-color: #fef2f2;
                  border: 1px solid #fecaca;
                  border-radius: 6px;
                  padding: 15px;
                  margin: 20px 0;
                  text-align: center;
                }
                .urgency p {
                  color: #dc2626;
                  margin: 0;
                  font-weight: 500;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">T</div>
                  <h1>New Ticket Assignment</h1>
                  <p class="subtitle">A ticket has been assigned to you</p>
                </div>
                
                <div class="content">
                  <p class="greeting">
                    Hi ${moderator.email},<br><br>
                    A new ticket has been assigned to you and requires your attention.
                  </p>
                  
                  <div class="ticket-card">
                    <h3 class="ticket-title">${finalTicket.title}</h3>
                    <p style="color: #4b5563; margin: 0 0 20px 0;">${finalTicket.description}</p>
                    
                    <div class="ticket-details">
                      <div class="detail-row">
                        <span class="detail-label">Priority:</span>
                        <span class="detail-value priority-${finalTicket.priority || 'medium'}">${finalTicket.priority || 'Not set'}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value">${finalTicket.status || 'Not set'}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">Created:</span>
                        <span class="detail-value">${new Date(finalTicket.createdAt).toLocaleString()}</span>
                      </div>
                      ${finalTicket.relatedSkills && finalTicket.relatedSkills.length > 0 ? `
                      <div class="detail-row">
                        <span class="detail-label">Skills:</span>
                        <span class="detail-value">${finalTicket.relatedSkills.join(', ')}</span>
                      </div>
                      ` : ''}
                    </div>
                  </div>
                  
                  ${finalTicket.helpfulNotes ? `
                  <div class="ai-notes">
                    <h4>🤖 AI Analysis Notes</h4>
                    <p>${finalTicket.helpfulNotes}</p>
                  </div>
                  ` : ''}
                  
                  <div class="urgency">
                    <p>⚠️ Please review and take action on this ticket as soon as possible.</p>
                  </div>
                  
                  <div class="cta">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/tickets/${finalTicket._id}" class="cta-button">
                      View Ticket
                    </a>
                  </div>
                </div>
                
                <div class="footer">
                  <p>Best regards,<br>TicketMate System</p>
                  <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
                    This is an automated notification. Please do not reply to this email.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `;
          
          await sendMail(moderator.email, subject, htmlContent, textContent);
        }
      });

      return { success: true };
    } catch (err) {
      console.error("❌ Error running the step", err.message);
      return { success: false };
    }
  }
);
