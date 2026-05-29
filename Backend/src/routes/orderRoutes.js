import express from "express";
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Measurement from "../models/Measurement.js";
import Order from "../models/Order.js";
import User from "../models/User.js";

const router = express.Router();
const GST_RATE = 0.05;

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? 0 : numericValue;
};

const toOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? null : numericValue;
};

const createOrderNumber = () =>
  `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(
    Math.random() * 1000
  )
    .toString()
    .padStart(3, "0")}`;

const orderLookupFilter = (orderId) => {
  if (mongoose.Types.ObjectId.isValid(orderId)) {
    return { _id: orderId };
  }

  return { orderNumber: orderId };
};

const populateOrder = (query) =>
  query.populate("customerId").populate("measurementIds").populate("garments.measurement");

const getEarliestDate = (garments) => {
  const dates = garments
    .map((garment) => garment.deliveryDate)
    .filter(Boolean)
    .map((date) => new Date(date))
    .filter((date) => !Number.isNaN(date.getTime()));

  if (!dates.length) {
    return undefined;
  }

  return new Date(Math.min(...dates.map((date) => date.getTime())));
};

const normalizeMeasurements = (measurements = {}) => {
  const normalizedEntries = Object.entries(measurements).reduce(
    (current, [key, value]) => {
      const numericValue = toOptionalNumber(value);

      if (numericValue !== null) {
        current[key] = numericValue;
      }

      return current;
    },
    {}
  );

  return {
    values: normalizedEntries,
    bust: toOptionalNumber(measurements.Bust),
    waist: toOptionalNumber(measurements.Waist),
    shoulder: toOptionalNumber(measurements.Shoulder),
    sleeve: toOptionalNumber(measurements["Sleeve Length"] ?? measurements.Sleeve),
    hips: toOptionalNumber(measurements.Hips),
  };
};

const buildPricingSummary = (garments, pricingSummary = {}) => {
  const stitchingTotal = garments.reduce(
    (total, garment) => total + toNumber(garment.stitchingCharge),
    0
  );
  const fabricCharge = toNumber(pricingSummary.fabricCharge);
  const addonCharge = toNumber(pricingSummary.addonCharge);
  const discount = toNumber(pricingSummary.discount);
  const advance = toNumber(pricingSummary.advance);
  const subtotal = stitchingTotal + fabricCharge + addonCharge;
  const taxableAmount = Math.max(subtotal - discount, 0);
  const gstAmount = roundMoney(taxableAmount * GST_RATE);
  const total = roundMoney(taxableAmount + gstAmount);
  const balance = Math.max(total - advance, 0);

  return {
    stitchingTotal,
    fabricCharge,
    addonCharge,
    discount,
    subtotal,
    taxableAmount,
    gstRate: GST_RATE * 100,
    gstAmount,
    total,
    advance,
    balance: roundMoney(balance),
  };
};

router.post("/", async (req, res) => {
  try {
    const {
      customer = {},
      garments = [],
      notes = "",
      status,
      pricingSummary,
    } = req.body;

    if (!customer.name || !customer.phone) {
      return res.status(400).json({
        message: "Customer name and phone are required",
      });
    }

    if (!Array.isArray(garments) || garments.length === 0) {
      return res.status(400).json({
        message: "At least one garment is required",
      });
    }

    const savedCustomer = await Customer.findOneAndUpdate(
      { phone: customer.phone },
      {
        $set: {
          name: customer.name,
          phone: customer.phone,
          address: customer.address || "",
          notes: customer.notes || "",
        },
        $setOnInsert: {
          visitHistory: [],
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    await User.findOneAndUpdate(
      { phone: savedCustomer.phone },
      { $set: { customerId: savedCustomer._id } }
    );

    const order = new Order({
      orderNumber: createOrderNumber(),
      customerId: savedCustomer._id,
      customerDetails: {
        name: savedCustomer.name,
        phone: savedCustomer.phone,
        address: savedCustomer.address,
        notes: savedCustomer.notes,
      },
      status: status || garments[0]?.status || "Pending",
      deliveryDate: getEarliestDate(garments),
      notes,
      pricingSummary: buildPricingSummary(garments, pricingSummary),
    });

    const measurementDocs = await Promise.all(
      garments.map((garment) => {
        const normalized = normalizeMeasurements(garment.measurements);
        const customMeasurements = (garment.customMeasurements || [])
          .filter((measurement) => measurement.name)
          .map((measurement) => ({
            name: measurement.name,
            value: toOptionalNumber(measurement.value),
          }));

        return Measurement.create({
          customerId: savedCustomer._id,
          orderId: order._id,
          garmentType: garment.garmentType,
          bust: normalized.bust,
          waist: normalized.waist,
          shoulder: normalized.shoulder,
          sleeve: normalized.sleeve,
          hips: normalized.hips,
          notes: garment.stitchingNotes || "",
          measurements: normalized.values,
          customMeasurements,
        });
      })
    );

    order.measurementIds = measurementDocs.map((measurement) => measurement._id);
    order.garments = garments.map((garment, index) => ({
      garmentType: garment.garmentType,
      fabric: garment.fabric || "",
      stitchingCharge: toNumber(garment.stitchingCharge),
      designSelection: garment.designSelection || "",
      designImage: garment.designImage || {},
      deliveryDate: garment.deliveryDate || undefined,
      stitchingNotes: garment.stitchingNotes || "",
      status: garment.status || "Pending",
      measurement: measurementDocs[index]._id,
    }));

    const savedOrder = await order.save();

    await Customer.findByIdAndUpdate(savedCustomer._id, {
      $addToSet: {
        orders: savedOrder._id,
        measurements: { $each: savedOrder.measurementIds },
      },
      $push: {
        visitHistory: {
          action: "Order created",
          order: savedOrder._id,
          notes: `Created ${savedOrder.orderNumber}`,
        },
      },
    });

    const populatedOrder = await Order.findById(savedOrder._id)
      .populate("customerId")
      .populate("measurementIds")
      .populate("garments.measurement");

    res.status(201).json({
      message: "Order created successfully",
      order: populatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("customerId")
      .populate("measurementIds")
      .populate("garments.measurement");

    res.json({
      orders,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/track/customer/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        message: "Valid customer id is required",
      });
    }

    const customer = await Customer.findById(customerId).select(
      "name phone address"
    );

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const orders = await populateOrder(
      Order.find({ customerId }).sort({ createdAt: -1 })
    );

    res.json({
      customer,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/:orderId", async (req, res) => {
  try {
    const order = await populateOrder(
      Order.findOne(orderLookupFilter(req.params.orderId))
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.json({
      order,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.patch("/:orderId/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        message: "Status is required",
      });
    }

    const order = await Order.findOne(orderLookupFilter(req.params.orderId));

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    order.status = status;
    order.garments = order.garments.map((garment) => {
      garment.status = status;
      return garment;
    });

    const savedOrder = await order.save();

    await Customer.findByIdAndUpdate(savedOrder.customerId, {
      $push: {
        visitHistory: {
          action: "Order status updated",
          order: savedOrder._id,
          notes: `${savedOrder.orderNumber} marked ${status}`,
        },
      },
    });

    const populatedOrder = await populateOrder(Order.findById(savedOrder._id));

    res.json({
      message: "Order status updated successfully",
      order: populatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

export default router;
