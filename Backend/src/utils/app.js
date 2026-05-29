import express from "express";
import cors from "cors";
import authRoutes from "../routes/authRoutes.js";
import orderRoutes from "../routes/orderRoutes.js";
import billRoutes from "../routes/billRoutes.js";
import measurementRoutes from "../routes/measurementRoutes.js";
import customerRoutes from "../routes/customerRoutes.js";
import appointmentRoutes from "../routes/appointmentRoutes.js";
import designRoutes from "../routes/designRoutes.js";


const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));


app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/measurements", measurementRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/designs", designRoutes);

  
export default app;
