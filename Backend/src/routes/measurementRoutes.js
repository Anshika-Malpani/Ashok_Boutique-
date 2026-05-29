import express from "express";
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Measurement from "../models/Measurement.js";

const router = express.Router();

const toOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? null : numericValue;
};

const normalizeMeasurements = (measurements = {}) => {
  const normalizedEntries = Object.entries(measurements).reduce(
    (current, [key, value]) => {
      const trimmedKey = key.trim();
      const numericValue = toOptionalNumber(value);

      if (trimmedKey && numericValue !== null) {
        current[trimmedKey] = numericValue;
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

router.get("/", async (req, res) => {
  try {
    const { customerId, phone, orderId } = req.query;
    const filter = {};

    if (customerId) {
      filter.customerId = customerId;
    }

    if (orderId) {
      filter.orderId = orderId;
    }

    if (phone) {
      const customer = await Customer.findOne({ phone });

      if (!customer) {
        return res.json({
          measurements: [],
        });
      }

      filter.customerId = customer._id;
    }

    const measurements = await Measurement.find(filter)
      .sort({ updatedDate: -1 })
      .populate("customerId")
      .populate("orderId");

    res.json({
      measurements,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.put("/:measurementId", async (req, res) => {
  try {
    const { measurementId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(measurementId)) {
      return res.status(400).json({
        message: "Invalid measurement id",
      });
    }

    const {
      garmentType = "",
      notes = "",
      measurements = {},
      customMeasurements = [],
    } = req.body;

    const normalized = normalizeMeasurements(measurements);
    const cleanedCustomMeasurements = Array.isArray(customMeasurements)
      ? customMeasurements
          .filter((measurement) => measurement?.name?.trim())
          .map((measurement) => ({
            name: measurement.name.trim(),
            value: toOptionalNumber(measurement.value),
          }))
      : [];

    const updatedMeasurement = await Measurement.findByIdAndUpdate(
      measurementId,
      {
        $set: {
          garmentType,
          notes,
          bust: normalized.bust,
          waist: normalized.waist,
          shoulder: normalized.shoulder,
          sleeve: normalized.sleeve,
          hips: normalized.hips,
          measurements: normalized.values,
          customMeasurements: cleanedCustomMeasurements,
          updatedDate: new Date(),
        },
      },
      { new: true, runValidators: true }
    )
      .populate("customerId")
      .populate("orderId");

    if (!updatedMeasurement) {
      return res.status(404).json({
        message: "Measurement not found",
      });
    }

    res.json({
      message: "Measurement updated successfully",
      measurement: updatedMeasurement,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

export default router;
