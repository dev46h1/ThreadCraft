// src/services/testDatabase.js
import {
  clientService,
  measurementService,
  orderService,
  settingsService,
  dbUtils,
  seedDatabase,
} from "./database";

export const testDatabase = async () => {
  console.log("=== Testing ThreadCraft Database ===\n");

  try {
    // Test 1: Seed Database
    console.log("1. Seeding database...");
    await seedDatabase();
    console.log("✓ Database seeded\n");

    // Test 2: Get all clients
    console.log("2. Fetching all clients...");
    const clients = await clientService.getAll();
    console.log(
      `✓ Found ${clients.length} clients:`,
      clients.map((c) => c.name)
    );
    console.log("");

    // Test 3: Search clients
    console.log('3. Searching for "Priya"...');
    const searchResults = await clientService.search("Priya");
    console.log(
      `✓ Found ${searchResults.length} result(s):`,
      searchResults[0]?.name
    );
    console.log("");

    // Test 4: Get measurements
    console.log("4. Fetching measurements for first client...");
    const measurements = await measurementService.getByClientId(clients[0].id);
    console.log(
      `✓ Found ${measurements.length} measurement(s) for ${clients[0].name}`
    );
    console.log("");

    // Test 5: Get orders
    console.log("5. Fetching all orders...");
    const orders = await orderService.getAll();
    console.log(`✓ Found ${orders.length} order(s)`);
    if (orders.length > 0) {
      console.log(
        `  First order: ${orders[0].id} - ${orders[0].garmentType} - Status: ${orders[0].status}`
      );
    }
    console.log("");

    // Test 6: Database stats
    console.log("6. Getting database statistics...");
    const stats = await dbUtils.getStats();
    console.log("✓ Database stats:", stats);
    console.log("");

    // Test 7: Settings
    console.log("7. Fetching settings...");
    const businessName = await settingsService.get("businessName");
    const allSettings = await settingsService.getAll();
    console.log(`✓ Business name: ${businessName}`);
    console.log("✓ All settings:", allSettings);
    console.log("");

    // Test 8: Create new client
    console.log("8. Creating new client...");
    const newClient = await clientService.create({
      name: "Test User",
      phoneNumber: "9999999999",
      address: "Test Address",
      email: "test@test.com",
    });
    console.log(`✓ Created client: ${newClient.id} - ${newClient.name}`);
    console.log("");

    // Test 9: Update order status
    if (orders.length > 0) {
      console.log("9. Updating order status...");
      const updatedOrder = await orderService.updateStatus(
        orders[0].id,
        "stitching",
        "Started stitching"
      );
      console.log(
        `✓ Updated order ${updatedOrder.id} to status: ${updatedOrder.status}`
      );
      console.log("");
    }

    // Test 10: Export data
    console.log("10. Exporting data...");
    const exportedData = await dbUtils.exportData();
    console.log("✓ Data exported successfully");
    console.log(`  - Clients: ${exportedData.clients.length}`);
    console.log(`  - Orders: ${exportedData.orders.length}`);
    console.log(`  - Measurements: ${exportedData.measurements.length}`);
    console.log("");

    console.log("=== All tests passed! ===");
    return true;
  } catch (error) {
    console.error("❌ Test failed:", error);
    return false;
  }
};

// Auto-run tests if this file is imported
export default testDatabase;
