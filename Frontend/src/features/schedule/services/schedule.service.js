import { getScheduleOrders } from "../api/schedule.api";
import { toDateKey } from "../utils/date.util";
import { mapOrderToScheduleItem } from "../utils/schedule.mapper";

export async function loadScheduleItems() {
  const data = await getScheduleOrders();
  const todayKey = toDateKey(new Date());
  return (data.orders || []).map((order) => mapOrderToScheduleItem(order, todayKey));
}
