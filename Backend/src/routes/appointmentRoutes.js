

import express from "express";

import {
  createAppointment,
  getAllAppointments,
  updateAppointmentStatus,
  getMyAppointments,
  getAppointmentStats,
} from "../controllers/appointmentController.js";

const router = express.Router();

router.post("/", createAppointment);

router.get("/", getAllAppointments);

router.get("/my-appointments/:userId", getMyAppointments);

router.get("/admin/stats", getAppointmentStats);

router.put("/:id", updateAppointmentStatus);

export default router;