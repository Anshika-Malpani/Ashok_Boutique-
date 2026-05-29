import express from "express";
import Customer from "../models/Customer.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const customers = await Customer.find()
      .sort({ createdAt: -1 })
      .select("name phone address notes orders bills visitHistory createdAt");

    const normalizedCustomers = customers.map((customer) => ({
      _id: customer._id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address || "",
      notes: customer.notes || "",
      totalOrders: Array.isArray(customer.orders) ? customer.orders.length : 0,
      totalBills: Array.isArray(customer.bills) ? customer.bills.length : 0,
      lastVisitDate: customer.visitHistory?.length
        ? customer.visitHistory[customer.visitHistory.length - 1]?.date
        : null,
      createdAt: customer.createdAt,
    }));

    res.json({ customers: normalizedCustomers });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

export default router;
