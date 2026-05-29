import mongoose from "mongoose";

const garmentItemSchema = new mongoose.Schema(
  {
    garmentType: {
      type: String,
      required: true,
      trim: true,
    },
    fabric: {
      type: String,
      trim: true,
      default: "",
    },
    stitchingCharge: {
      type: Number,
      default: 0,
    },
    designSelection: {
      type: String,
      trim: true,
      default: "",
    },
    designImage: {
      name: {
        type: String,
        trim: true,
        default: "",
      },
      preview: {
        type: String,
        default: "",
      },
    },
    deliveryDate: {
      type: Date,
    },
    stitchingNotes: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      default: "Pending",
      trim: true,
    },
    measurement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Measurement",
    },
  },
  { _id: true }
);

const pricingSummarySchema = new mongoose.Schema(
  {
    stitchingTotal: {
      type: Number,
      default: 0,
    },
    fabricCharge: {
      type: Number,
      default: 0,
    },
    addonCharge: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    taxableAmount: {
      type: Number,
      default: 0,
    },
    gstRate: {
      type: Number,
      default: 5,
    },
    gstAmount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    advance: {
      type: Number,
      default: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const customerDetailsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    customerDetails: customerDetailsSchema,
    garments: [garmentItemSchema],
    measurementIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Measurement",
      },
    ],
    status: {
      type: String,
      default: "Pending",
      trim: true,
    },
    deliveryDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    pricingSummary: pricingSummarySchema,
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
