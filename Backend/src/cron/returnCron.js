import cron from "node-cron";
import { getPool } from "../config/database.js";
import { SELECT_ACTIVE_RENTING_ORDERS_FOR_CRON_QUERY } from "../queries/cron.query.js";
import { sendReturnReminderEmail, sendOverduePenaltyEmail } from "../service/mail.service.js";

/**
 * Initializes and schedules the renting return status checks.
 * Runs every 1 minute for testing.
 */
export function initCron() {
  console.log("[Cron] Initializing renting return status check cron job (1-minute intervals)...");

  cron.schedule("0 0 * * * *", async () => {
    console.log("[Cron] Running renting return status check...");
    try {
      const pool = getPool();
      const { rows: orders } = await pool.query(SELECT_ACTIVE_RENTING_ORDERS_FOR_CRON_QUERY);

      if (orders.length === 0) {
        console.log("[Cron] No active renting orders found to check.");
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const order of orders) {
        const dueDate = new Date(order.end_date);
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        const emailDetails = {
          to: order.customer_email,
          productName: order.product_name,
          dueDate: order.end_date,
          durationType: order.duration_type,
        };

        if (diffDays === 3) {
          console.log(`[Cron] REMINDER: Order #${order.rent_id} is due in 3 days. Sending email to ${order.customer_email}...`);
          await sendReturnReminderEmail({
            ...emailDetails,
            daysLeft: 3,
          });
        } else if (diffDays === 1) {
          console.log(`[Cron] REMINDER: Order #${order.rent_id} is due tomorrow. Sending email to ${order.customer_email}...`);
          await sendReturnReminderEmail({
            ...emailDetails,
            daysLeft: 1,
          });
        } else if (diffDays === 0) {
          console.log(`[Cron] REMINDER: Order #${order.rent_id} is due today. Sending email to ${order.customer_email}...`);
          await sendReturnReminderEmail({
            ...emailDetails,
            daysLeft: 0,
          });
        } else if (diffDays < 0) {
          const daysDelayed = Math.abs(diffDays);
          const penaltyRate = Number(order.penalty || 0);
          const totalPenalty = daysDelayed * penaltyRate;

          console.log(`[Cron] OVERDUE: Order #${order.rent_id} is overdue by ${daysDelayed} days. Penalty rate: $${penaltyRate}, Total: $${totalPenalty}. Sending email to ${order.customer_email}...`);
          await sendOverduePenaltyEmail({
            ...emailDetails,
            daysDelayed,
            penaltyRate,
            totalPenalty,
          });
        }
      }
    } catch (error) {
      console.error("[Cron Error] Failed during return cron checks:", error.message);
    }
  });
}
