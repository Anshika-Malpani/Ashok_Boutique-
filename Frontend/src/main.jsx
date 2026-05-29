import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AdminRoute from "./routes/AdminRoute";
import Home from "./home/Home.jsx";
import Designs from "./designs/Designs.jsx";
import AppointmentBooking from "./appointment/AppointmentBooking.jsx";
import TrackOrder from "./track_order/TrackOrder.jsx";
import Contact from "./contact/Contact.jsx";
import Signup from "./signup/Signup.jsx";
import DesignDetails from "./designs/DesignDetails.jsx";
import Login from "./signup/Login.jsx";
import Dashboard from "./dashboard/Dashboard.jsx";
import Order from "./order/Order.jsx";
import CreateOrder from "./order/CreateOrder.jsx";
import OrderDetails from "./order/OrderDetails.jsx";
import Customers from "./customers/Customers.jsx";
import Measurements from "./measurements/Measurements.jsx";
import ShowAppointments from "./appointment/ShowAppointments.jsx";
import Billing from "./billing/Billing.jsx";
import AdminDesigns from "./designs/AdminDesigns.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/designs",
    element: <Designs />,
  },
  {
    path: "/appointment",
    element: <AppointmentBooking />,
  },
  {
    path: "/track-order",
    element: <TrackOrder />,
  },
  {
    path: "/contact",
    element: <Contact />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/login",
    element: <Login/>,
  },
  {
    path: "/admin-dashboard",
      element: <AdminRoute><Dashboard/></AdminRoute>,
    },
  {
    path: "/orders",
    element: (
      <AdminRoute><Dashboard title="Orders"><Order /></Dashboard></AdminRoute>
    ),
  },
  { 
    path: "/orders/create",
    element: (
      <AdminRoute><Dashboard title="Create Order"><CreateOrder /></Dashboard></AdminRoute>
    ),
  },
  { 
    path: "/orders/:orderId",
    element: (
      <AdminRoute><Dashboard title="Order Details"><OrderDetails /></Dashboard></AdminRoute>
    ),
  },
  {
    path: "/customers",
    element: (
      <AdminRoute><Dashboard title="Customers"><Customers /></Dashboard></AdminRoute>
       
    ),
  },
  {
    path: "/measurements",
    element: (
      <AdminRoute><Dashboard title="Measurements"><Measurements /></Dashboard></AdminRoute>
        
    ),
  },
  {
    path: "/show-appointments",
    element: (
      <AdminRoute><Dashboard title="Appointments"><ShowAppointments /></Dashboard></AdminRoute>
        
    ),
  },
  {
    path: "/billing",
    element: (
      <AdminRoute><Dashboard title="Billing"><Billing /></Dashboard></AdminRoute>
        
    ),
  },
  {
    path: "/admin-designs",
    element: (
      <AdminRoute><Dashboard title="Designs"><AdminDesigns /></Dashboard></AdminRoute>
        
    ),
  },
  {
    path: "/design/:id",
    element: <DesignDetails />,
  }
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  
    <RouterProvider router={router} />

);
