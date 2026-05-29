import mongoose from "mongoose";

const designImageSchema = new mongoose.Schema(
  {
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
  { _id: false }
);

const designSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["Blouse", "Kurti", "Indo Western", "Lehenga", "Other Designs"],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: designImageSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

export default mongoose.model("Design", designSchema);
