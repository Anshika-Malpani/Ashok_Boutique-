import mongoose from "mongoose";

const measurementSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },
    garmentType: {
      type: String,
      trim: true,
      default: "",
    },
    bust: {
      type: Number,
      default: null,
    },
    waist: {
      type: Number,
      default: null,
    },
    shoulder: {
      type: Number,
      default: null,
    },
    sleeve: {
      type: Number,
      default: null,
    },
    hips: {
      type: Number,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    measurements: {
      type: Map,
      of: Number,
      default: {},
    },
    customMeasurements: [
      {
        name: {
          type: String,
          trim: true,
        },
        value: {
          type: Number,
          default: null,
        },
      },
    ],
    updatedDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

measurementSchema.pre("save", function setUpdatedDate() {
  this.updatedDate = new Date();
});

export default mongoose.model("Measurement", measurementSchema);
