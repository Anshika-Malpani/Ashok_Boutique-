import express from "express";
import Bill from "../models/Bill.js";
import Customer from "../models/Customer.js";
import Order from "../models/Order.js";

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

const createBillNumber = () =>
  `BILL-${Date.now().toString(36).toUpperCase()}-${Math.floor(
    Math.random() * 1000
  )
    .toString()
    .padStart(3, "0")}`;

const getPaymentStatus = (totalAmount, advance) => {
  if (advance <= 0) {
    return "Unpaid";
  }

  if (advance >= totalAmount) {
    return "Paid";
  }

  return "Partial";
};

const paymentStatusOptions = ["Unpaid", "Partial", "Paid"];

router.post("/", async (req, res) => {
  try {
    const {
      orderId,
      paymentDetails = {},
      advance,
      paymentMode = "Cash",
      paymentStatus,
    } = req.body;

    if (!orderId) {
      return res.status(400).json({
        message: "orderId is required",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const stitchingTotal = toNumber(
      paymentDetails.stitchingTotal ?? order.pricingSummary?.stitchingTotal
    );
    const fabricCharge = toNumber(paymentDetails.fabricCharge);
    const addonCharge = toNumber(paymentDetails.addonCharge);
    const discount = toNumber(paymentDetails.discount);
    const subtotal = toNumber(
      paymentDetails.subtotal ?? stitchingTotal + fabricCharge + addonCharge
    );
    const taxableAmount = Math.max(subtotal - discount, 0);
    const gstAmount = roundMoney(taxableAmount * GST_RATE);
    const resolvedTotal = roundMoney(taxableAmount + gstAmount);
    const resolvedAdvance = toNumber(advance);
    const balance = roundMoney(Math.max(resolvedTotal - resolvedAdvance, 0));

    const bill = await Bill.create({
      billNumber: createBillNumber(),
      orderId: order._id,
      customerId: order.customerId,
      paymentDetails: {
        fabricCharge,
        addonCharge,
        discount,
        stitchingTotal,
        subtotal,
        taxableAmount,
        gstRate: GST_RATE * 100,
        gstAmount,
      },
      totalAmount: resolvedTotal,
      advance: resolvedAdvance,
      balance,
      paymentMode,
      paymentStatus: paymentStatus || getPaymentStatus(resolvedTotal, resolvedAdvance),
    });

    order.pricingSummary.fabricCharge = bill.paymentDetails.fabricCharge;
    order.pricingSummary.addonCharge = bill.paymentDetails.addonCharge;
    order.pricingSummary.discount = bill.paymentDetails.discount;
    order.pricingSummary.stitchingTotal = bill.paymentDetails.stitchingTotal;
    order.pricingSummary.subtotal = bill.paymentDetails.subtotal;
    order.pricingSummary.taxableAmount = bill.paymentDetails.taxableAmount;
    order.pricingSummary.gstRate = bill.paymentDetails.gstRate;
    order.pricingSummary.gstAmount = bill.paymentDetails.gstAmount;
    order.pricingSummary.total = bill.totalAmount;
    order.pricingSummary.advance = bill.advance;
    order.pricingSummary.balance = bill.balance;
    await order.save();

    await Customer.findByIdAndUpdate(order.customerId, {
      $addToSet: {
        bills: bill._id,
      },
      $push: {
        visitHistory: {
          action: "Bill created",
          order: order._id,
          bill: bill._id,
          notes: `Created ${bill.billNumber}`,
        },
      },
    });

    const populatedBill = await Bill.findById(bill._id)
      .populate("orderId")
      .populate("customerId");

    res.status(201).json({
      message: "Bill created successfully",
      bill: populatedBill,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const filter = req.query.orderId ? { orderId: req.query.orderId } : {};
    const bills = await Bill.find(filter)
      .sort({ createdAt: -1 })
      .populate("orderId")
      .populate("customerId");

    res.json({
      bills,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.patch("/:billId/status", async (req, res) => {
  try {
    const { paymentStatus, advance } = req.body;

    if (!paymentStatusOptions.includes(paymentStatus)) {
      return res.status(400).json({
        message: "Valid paymentStatus is required",
      });
    }

    const bill = await Bill.findById(req.params.billId);

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found",
      });
    }

    const totalAmount = toNumber(bill.totalAmount);
    let resolvedAdvance = bill.advance;

    if (paymentStatus === "Paid") {
      resolvedAdvance = totalAmount;
    } else if (paymentStatus === "Unpaid") {
      resolvedAdvance = 0;
    } else {
      resolvedAdvance =
        advance === undefined || advance === null ? toNumber(bill.advance) : toNumber(advance);

      if (resolvedAdvance <= 0 || resolvedAdvance >= totalAmount) {
        return res.status(400).json({
          message: "Partial payment amount must be greater than 0 and less than total amount",
        });
      }
    }

    bill.paymentStatus = paymentStatus;
    bill.advance = roundMoney(resolvedAdvance);
    bill.balance = roundMoney(Math.max(totalAmount - resolvedAdvance, 0));
    await bill.save();

    const order = await Order.findById(bill.orderId);

    if (order) {
      order.pricingSummary.total = bill.totalAmount;
      order.pricingSummary.advance = bill.advance;
      order.pricingSummary.balance = bill.balance;
      await order.save();
    }

    await Customer.findByIdAndUpdate(bill.customerId, {
      $push: {
        visitHistory: {
          action: "Bill status updated",
          order: bill.orderId,
          bill: bill._id,
          notes: `${bill.billNumber} marked ${paymentStatus}`,
        },
      },
    });

    const populatedBill = await Bill.findById(bill._id)
      .populate("orderId")
      .populate("customerId");

    res.json({
      message: "Bill status updated successfully",
      bill: populatedBill,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

export default router;
