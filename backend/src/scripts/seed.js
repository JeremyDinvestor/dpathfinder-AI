// Run with: npm run seed
// Fills (or resets) the isolated demo workspace with sample customers and orders.
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { resetDemoData } from "../services/demoService.js";

try {
  await connectDatabase();
  const counts = await resetDemoData({ force: true });
  console.log(`Demo data ready: ${counts.customers} customers, ${counts.orders} orders.`);
} catch (err) {
  console.error("Seeding failed:", err.message);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
