import cron from "node-cron";
import { sendEmail } from "../service/mail.service.js";

/**
 * Initializes all cron jobs for the backend.
 */
export function initCron() {
  console.log("Initializing cron jobs...");

  // Schedule a task to run every 30 seconds
  cron.schedule("*/30 * * * * *", async () => {
    console.log("[Cron Job] Running every 30 seconds: Sending test email to harshilu01@gmail.com");
    
    await sendEmail({
      to: "harshilu01@gmail.com",
      subject: "testing crone",
      text: "testing crone",
      html: "<p>testing crone</p>"
    });
  });
}
