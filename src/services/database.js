// src/services/database.js
import Dexie from "dexie";

// Initialize Dexie database
const db = new Dexie("ThreadCraftDB");

// Define database schema
db.version(1).stores({
  clients:
    "id, name, phoneNumber, secondaryPhone, registrationDate, lastOrderDate",
  measurements: "id, clientId, garmentType, version, isActive, createdAt",
  orders: "id, clientId, orderDate, deliveryDate, status, paymentStatus",
  settings: "key",
});

// ==================== CLIENT OPERATIONS ====================

export const clientService = {
  // Create new client
  async create(clientData) {
    const id = `CLI-${new Date()
      .toISOString()
      .split("T")[0]
      .replace(/-/g, "")}-${String((await db.clients.count()) + 1).padStart(
      4,
      "0"
    )}`;
    const client = {
      id,
      name: clientData.name,
      phoneNumber: clientData.phoneNumber,
      secondaryPhone: clientData.secondaryPhone || "",
      address: clientData.address || "",
      email: clientData.email || "",
      notes: clientData.notes || "",
      registrationDate: new Date().toISOString(),
      lastOrderDate: null,
      totalOrders: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.clients.add(client);
    return client;
  },

  // Get all clients
  async getAll() {
    return await db.clients.toArray();
  },

  // Get client by ID
  async getById(id) {
    return await db.clients.get(id);
  },

  // Search clients
  async search(query) {
    const lowerQuery = query.toLowerCase();
    return await db.clients
      .filter(
        (client) =>
          client.name.toLowerCase().includes(lowerQuery) ||
          client.phoneNumber.includes(query) ||
          client.id.toLowerCase().includes(lowerQuery)
      )
      .toArray();
  },

  // Update client
  async update(id, updates) {
    await db.clients.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return await db.clients.get(id);
  },

  // Delete client
  async delete(id) {
    await db.clients.delete(id);
  },

  // Check if phone number exists
  async phoneExists(phoneNumber) {
    const client = await db.clients
      .where("phoneNumber")
      .equals(phoneNumber)
      .first();
    return !!client;
  },
};

// ==================== MEASUREMENT OPERATIONS ====================

export const measurementService = {
  // Create new measurement
  async create(measurementData) {
    const id = `MEAS-${crypto.randomUUID()}`;

    // Deactivate previous measurements for same client and garment type
    const existing = await db.measurements
      .where("[clientId+garmentType+isActive]")
      .equals([measurementData.clientId, measurementData.garmentType, true])
      .toArray();

    for (const m of existing) {
      await db.measurements.update(m.id, { isActive: false });
    }

    const measurement = {
      id,
      clientId: measurementData.clientId,
      garmentType: measurementData.garmentType,
      measurements: measurementData.measurements,
      unit: measurementData.unit || "inches",
      notes: measurementData.notes || "",
      version: existing.length + 1,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await db.measurements.add(measurement);
    return measurement;
  },

  // Get measurements by client ID
  async getByClientId(clientId) {
    return await db.measurements.where("clientId").equals(clientId).toArray();
  },

  // Get active measurements by client and garment type
  async getActive(clientId, garmentType) {
    return await db.measurements
      .where({ clientId, garmentType, isActive: true })
      .first();
  },

  // Get measurement by ID
  async getById(id) {
    return await db.measurements.get(id);
  },

  // Update measurement
  async update(id, updates) {
    await db.measurements.update(id, updates);
    return await db.measurements.get(id);
  },

  // Delete measurement
  async delete(id) {
    await db.measurements.delete(id);
  },

  // Get measurement history
  async getHistory(clientId, garmentType) {
    return await db.measurements
      .where({ clientId, garmentType })
      .reverse()
      .sortBy("version");
  },
};

// ==================== ORDER OPERATIONS ====================

export const orderService = {
  // Create new order
  async create(orderData) {
    const id = `ORD-${new Date()
      .toISOString()
      .split("T")[0]
      .replace(/-/g, "")}-${String((await db.orders.count()) + 1).padStart(
      4,
      "0"
    )}`;

    const order = {
      id,
      clientId: orderData.clientId,
      clientName: orderData.clientName,
      clientPhone: orderData.clientPhone,
      orderDate: orderData.orderDate || new Date().toISOString(),
      deliveryDate: orderData.deliveryDate,
      priority: orderData.priority || "normal",
      garmentType: orderData.garmentType,
      quantity: orderData.quantity || 1,
      fabricDetails: orderData.fabricDetails || {},
      designDetails: orderData.designDetails || {},
      measurementId: orderData.measurementId,
      measurementSnapshot: orderData.measurementSnapshot || {},
      specialInstructions: orderData.specialInstructions || "",
      status: "placed",
      statusHistory: [
        {
          status: "placed",
          timestamp: new Date().toISOString(),
          notes: "Order created",
        },
      ],
      pricing: orderData.pricing || {
        baseCharge: 0,
        customizations: [],
        materialCharges: 0,
        urgentCharges: 0,
        subtotal: 0,
        discount: { amount: 0, reason: "" },
        total: 0,
      },
      payments: [],
      totalPaid: 0,
      balanceDue: orderData.pricing?.total || 0,
      paymentStatus: "not_paid",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      deliveredAt: null,
    };

    await db.orders.add(order);

    // Update client's last order date
    await db.clients.update(orderData.clientId, {
      lastOrderDate: order.orderDate,
      totalOrders: await db.orders
        .where("clientId")
        .equals(orderData.clientId)
        .count(),
    });

    return order;
  },

  // Get all orders
  async getAll() {
    return await db.orders.reverse().sortBy("orderDate");
  },

  // Get order by ID
  async getById(id) {
    return await db.orders.get(id);
  },

  // Get orders by client ID
  async getByClientId(clientId) {
    return await db.orders
      .where("clientId")
      .equals(clientId)
      .reverse()
      .sortBy("orderDate");
  },

  // Update order
  async update(id, updates) {
    await db.orders.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return await db.orders.get(id);
  },

  // Update order status
  async updateStatus(id, status, notes = "") {
    const order = await db.orders.get(id);
    const statusUpdate = {
      status,
      timestamp: new Date().toISOString(),
      notes,
    };

    const updates = {
      status,
      statusHistory: [...order.statusHistory, statusUpdate],
      updatedAt: new Date().toISOString(),
    };

    if (status === "completed") {
      updates.completedAt = new Date().toISOString();
    } else if (status === "delivered") {
      updates.deliveredAt = new Date().toISOString();
    }

    await db.orders.update(id, updates);
    return await db.orders.get(id);
  },

  // Add payment
  async addPayment(orderId, paymentData) {
    const order = await db.orders.get(orderId);
    const payment = {
      amount: paymentData.amount,
      date: paymentData.date || new Date().toISOString(),
      method: paymentData.method || "cash",
      type: paymentData.type || "advance",
      receiptNumber: paymentData.receiptNumber || "",
      notes: paymentData.notes || "",
    };

    const totalPaid = order.totalPaid + payment.amount;
    const balanceDue = order.pricing.total - totalPaid;

    let paymentStatus = "not_paid";
    if (totalPaid >= order.pricing.total) {
      paymentStatus = "fully_paid";
    } else if (totalPaid > 0) {
      paymentStatus = "partially_paid";
    }

    await db.orders.update(orderId, {
      payments: [...order.payments, payment],
      totalPaid,
      balanceDue,
      paymentStatus,
      updatedAt: new Date().toISOString(),
    });

    return await db.orders.get(orderId);
  },

  // Delete order
  async delete(id) {
    await db.orders.delete(id);
  },

  // Filter orders
  async filter({ status, startDate, endDate, clientId }) {
    let query = db.orders;

    if (status) {
      query = query.where("status").equals(status);
    }

    let results = await query.toArray();

    if (startDate || endDate || clientId) {
      results = results.filter((order) => {
        if (clientId && order.clientId !== clientId) return false;
        if (startDate && new Date(order.orderDate) < new Date(startDate))
          return false;
        if (endDate && new Date(order.orderDate) > new Date(endDate))
          return false;
        return true;
      });
    }

    return results.sort(
      (a, b) => new Date(b.orderDate) - new Date(a.orderDate)
    );
  },

  // Get orders by date range
  async getByDateRange(startDate, endDate) {
    const orders = await db.orders.toArray();
    return orders.filter((order) => {
      const orderDate = new Date(order.orderDate);
      return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
    });
  },

  // Get overdue orders
  async getOverdue() {
    const today = new Date().toISOString().split("T")[0];
    const orders = await db.orders.toArray();
    return orders.filter(
      (order) =>
        order.deliveryDate < today &&
        order.status !== "delivered" &&
        order.status !== "cancelled"
    );
  },
};

// ==================== SETTINGS OPERATIONS ====================

export const settingsService = {
  // Set a setting
  async set(key, value) {
    await db.settings.put({ key, value, updatedAt: new Date().toISOString() });
  },

  // Get a setting
  async get(key, defaultValue = null) {
    const setting = await db.settings.get(key);
    return setting ? setting.value : defaultValue;
  },

  // Get all settings
  async getAll() {
    const settings = await db.settings.toArray();
    return settings.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {});
  },

  // Delete a setting
  async delete(key) {
    await db.settings.delete(key);
  },
};

// ==================== UTILITY OPERATIONS ====================

export const dbUtils = {
  // Clear all data
  async clearAll() {
    await db.clients.clear();
    await db.measurements.clear();
    await db.orders.clear();
    await db.settings.clear();
  },

  // Export all data
  async exportData() {
    return {
      clients: await db.clients.toArray(),
      measurements: await db.measurements.toArray(),
      orders: await db.orders.toArray(),
      settings: await db.settings.toArray(),
      exportDate: new Date().toISOString(),
    };
  },

  // Import data
  async importData(data) {
    await db.transaction(
      "rw",
      [db.clients, db.measurements, db.orders, db.settings],
      async () => {
        if (data.clients) await db.clients.bulkPut(data.clients);
        if (data.measurements) await db.measurements.bulkPut(data.measurements);
        if (data.orders) await db.orders.bulkPut(data.orders);
        if (data.settings) await db.settings.bulkPut(data.settings);
      }
    );
  },

  // Get database stats
  async getStats() {
    return {
      totalClients: await db.clients.count(),
      totalOrders: await db.orders.count(),
      totalMeasurements: await db.measurements.count(),
      activeOrders: await db.orders
        .where("status")
        .notEqual("delivered")
        .and((order) => order.status !== "cancelled")
        .count(),
    };
  },
};

// ==================== SEED DATA FOR TESTING ====================

export const seedDatabase = async () => {
  // Check if data already exists
  const clientCount = await db.clients.count();
  if (clientCount > 0) {
    console.log("Database already has data. Skipping seed.");
    return;
  }

  console.log("Seeding database with sample data...");

  // Add sample clients
  const client1 = await clientService.create({
    name: "Priya Menon",
    phoneNumber: "9876543210",
    address: "123 MG Road, Kochi, Kerala 682001",
    email: "priya.menon@email.com",
    notes: "Prefers cotton fabrics",
  });

  const client2 = await clientService.create({
    name: "Anjali Nair",
    phoneNumber: "9876543211",
    address: "456 Marine Drive, Ernakulam",
    email: "anjali.nair@email.com",
  });

  // Add sample measurements
  await measurementService.create({
    clientId: client1.id,
    garmentType: "churidar",
    measurements: {
      topLength: 42,
      shoulder: 14.5,
      sleeveLength: 20,
      chest: 38,
      waist: 34,
      hip: 40,
      bottomLength: 38,
      bottomWaist: 30,
      thigh: 22,
      bottomOpening: 10,
    },
    unit: "inches",
    notes: "Standard measurements",
  });

  await measurementService.create({
    clientId: client1.id,
    garmentType: "blouse",
    measurements: {
      length: 15,
      shoulder: 13,
      sleeveLength: 12,
      bust: 36,
      waist: 32,
      underbust: 34,
      armhole: 16,
      neck: 14,
    },
    unit: "inches",
  });

  // Add sample orders
  const measurement = await measurementService.getActive(
    client1.id,
    "churidar"
  );

  await orderService.create({
    clientId: client1.id,
    clientName: client1.name,
    clientPhone: client1.phoneNumber,
    deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    garmentType: "churidar",
    measurementId: measurement.id,
    measurementSnapshot: measurement.measurements,
    fabricDetails: {
      type: "Cotton",
      providedBy: "client",
    },
    designDetails: {
      description: "Simple churidar with embroidery on sleeves",
    },
    pricing: {
      baseCharge: 800,
      customizations: [
        { description: "Embroidery on sleeves", amount: 200 },
        { description: "Lining", amount: 100 },
      ],
      materialCharges: 0,
      urgentCharges: 0,
      subtotal: 1100,
      discount: { amount: 0, reason: "" },
      total: 1100,
    },
  });

  // Add settings
  await settingsService.set("businessName", "ThreadCraft Tailoring");
  await settingsService.set("businessAddress", "Kochi, Kerala");
  await settingsService.set("businessPhone", "9876543210");
  await settingsService.set("defaultUnit", "inches");

  console.log("Database seeded successfully!");
};

// Initialize database on first load
export const initDatabase = async () => {
  try {
    // Open database to trigger schema creation
    await db.open();
    console.log("Database initialized successfully");

    // Seed if empty
    const clientCount = await db.clients.count();
    if (clientCount === 0) {
      await seedDatabase();
    }

    return true;
  } catch (error) {
    console.error("Database initialization failed:", error);
    return false;
  }
};

export default db;
