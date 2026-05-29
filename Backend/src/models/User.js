import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: String,
  phone: {
    type: String,
    unique: true,
  },
  password: String,
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    default: null,
  },

  role: {
    type: String,
    enum: ["customer", "admin"],
    default: "customer",
  },
});

export default mongoose.model("User", userSchema);