import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Download,
  FileText,
  Phone,
  Receipt,
  Save,
  Scissors,
  User,
  X,
} from "lucide-react";

import API_BASE_URL from "../config/api";
const statusOptions = [
  "Pending",
  "Measurement Taken",
  "Stitching",
  "Ready for Trial",
  "Delivered",
];

const statusStyles = {
  Pending: "bg-amber-100 text-amber-700",
  "Measurement Taken": "bg-indigo-100 text-indigo-700",
  Stitching: "bg-sky-100 text-sky-700",
  "Ready for Trial": "bg-violet-100 text-violet-700",
  Delivered: "bg-emerald-100 text-emerald-700",
};

const formatDate = (date) => {
  if (!date) {
    return "-";
  }

  return new Date(date).toISOString().slice(0, 10);
};

const formatMoney = (value) => `Rs ${Number(value || 0).toFixed(2)}`;
const formatInvoiceDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const measurementEntries = (measurement) => {
  if (!measurement?.measurements) {
    return [];
  }

  return Object.entries(measurement.measurements).filter(([, value]) => {
    return value !== null && value !== undefined && value !== "";
  });
};

const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [bills, setBills] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("Pending");
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [selectedDesignImage, setSelectedDesignImage] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setAlert({ type: "", message: "" });

        const orderResponse = await axios.get(`${API_BASE_URL}/orders/${orderId}`);
        const loadedOrder = orderResponse.data.order;
        setOrder(loadedOrder);
        setSelectedStatus(loadedOrder.status || "Pending");

        const billResponse = await axios.get(`${API_BASE_URL}/bills`, {
          params: { orderId: loadedOrder._id },
        });
        setBills(billResponse.data.bills || []);
      } catch (error) {
        setAlert({
          type: "error",
          message:
            error.response?.data?.message ||
            "Unable to load order details. Please check the backend server.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  useEffect(() => {
    if (!selectedDesignImage) {
      return;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedDesignImage(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectedDesignImage]);

  const latestBill = bills[0];
  const pricing = order?.pricingSummary || {};

  const downloadInvoice = (bill) => {
    if (!bill || !order) {
      return;
    }

    const doc = new jsPDF();
    const left = 12;
    let y = 12;
    const customer = bill.customerId || order.customerId || {};
    const payment = bill.paymentDetails || {};
    const garments = order.garments || [];
    const groupedItems = garments.reduce((current, garment) => {
      const itemName = `${garment.garmentType || "Garment"} Stitching`;
      const rate = Number(garment.stitchingCharge || 0);
      const key = `${itemName}-${rate}`;

      if (!current[key]) {
        current[key] = { itemName, qty: 0, rate };
      }

      current[key].qty += 1;
      return current;
    }, {});

    const invoiceItems = Object.values(groupedItems).map((item) => ({
      ...item,
      hideRate: true,
      amount: item.qty * item.rate,
    }));

    if (Number(payment.addonCharge || 0) > 0) {
      invoiceItems.push({
        itemName: "Extra Work",
        qty: 1,
        rate: Number(payment.addonCharge || 0),
        hideRate: false,
        amount: Number(payment.addonCharge || 0),
      });
    }

    if (Number(payment.fabricCharge || 0) > 0) {
      invoiceItems.push({
        itemName: "Fabric Charge",
        qty: 1,
        rate: Number(payment.fabricCharge || 0),
        hideRate: false,
        amount: Number(payment.fabricCharge || 0),
      });
    }

    const invoiceNumber = bill.billNumber
      ? String(bill.billNumber).replace(/^BILL/i, "INV")
      : `INV-${new Date().getFullYear()}-${String(order._id || "").slice(-4).toUpperCase()}`;

    const lines = [
                        "ASHOK BOUTIQUE",
      "Dhanshree Tower 1, B-38, Sector 2 Rd, Sector 2,",
      "Central Spine, Vidyadhar Nagar, Jaipur, Rajasthan 302039",
      "Phone: +91 9252010850 | WhatsApp: +91 9252010850",
                      "Email: ashokboutique@gmail.com",
      "========================================================",
      "",
      `Invoice No   : ${invoiceNumber}`,
      `Order ID     : ${order.orderNumber || "-"}`,
      `Invoice Date : ${formatInvoiceDate(bill.createdAt)}`,
      `Delivery Date: ${formatInvoiceDate(order.deliveryDate)}`,
      "",
      "--------------------------------------------------------",
      "Customer Details",
      "--------------------------------------------------------",
      `Name         : ${customer.name || order.customerDetails?.name || "-"}`,
      `Phone        : ${customer.phone || order.customerDetails?.phone || "-"}`,
      "",
      "--------------------------------------------------------",
      "Items / Services",
      "--------------------------------------------------------",
      "| S.No | Item Name          | Qty | Amount   |",
      "|------|--------------------|-----|----------|",
    ];

    invoiceItems.forEach((item, index) => {
      const serial = String(index + 1).padEnd(4, " ");
      const itemName = String(item.itemName).slice(0, 18).padEnd(18, " ");
      const qty = String(item.qty).padStart(3, " ");
      const amount = `Rs ${Number(item.amount).toFixed(0)}`
        .padStart(8, " ")
        .slice(0, 8);
      lines.push(`| ${serial} | ${itemName} | ${qty} | ${amount} |`);
    });

    lines.push(
      "",
      "--------------------------------------------------------",
      "Payment Summary",
      "--------------------------------------------------------",
      `Subtotal       : Rs ${Number(payment.subtotal || 0).toFixed(2)}`,
      `GST            : Rs ${Number(payment.gstAmount || 0).toFixed(2)}`,
      `Discount       : Rs ${Number(payment.discount || 0).toFixed(2)}`,
      `Grand Total    : Rs ${Number(bill.totalAmount || 0).toFixed(2)}`,
      `Advance Paid   : Rs ${Number(bill.advance || 0).toFixed(2)}`,
      `Balance Due    : Rs ${Number(bill.balance || 0).toFixed(2)}`,
      "",
      `Payment Mode   : ${bill.paymentMode || "-"}`,
      `Payment Status : ${bill.paymentStatus || "-"}`,
      "",
      "--------------------------------------------------------",
      "Notes",
      "--------------------------------------------------------",
      "- Delivery subject to trial confirmation.",
      "- No return on customized stitched items.",
      "- Thank you for choosing Ashok Boutique."
    );

    doc.setFont("courier", "normal");
    doc.setFontSize(10);
    doc.text(lines, left, y);

    doc.save(`${bill.billNumber || order.orderNumber || "invoice"}.pdf`);
  };

  const garmentSummary = useMemo(() => {
    return order?.garments?.map((garment) => garment.garmentType).join(" + ") || "-";
  }, [order]);

  const handleStatusSave = async () => {
    try {
      setSavingStatus(true);
      setAlert({ type: "", message: "" });

      const response = await axios.patch(
        `${API_BASE_URL}/orders/${order._id}/status`,
        { status: selectedStatus }
      );

      setOrder(response.data.order);
      setSelectedStatus(response.data.order.status);
      setAlert({
        type: "success",
        message: response.data.message || "Order status updated successfully.",
      });
    } catch (error) {
      setAlert({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to update order status. Please try again.",
      });
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 text-sm font-medium text-gray-500 shadow-sm">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#574848]"
        >
          <ArrowLeft size={16} />
          Back to Orders
        </Link>
        {alert.message && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
            {alert.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            to="/orders"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[#574848]"
          >
            <ArrowLeft size={16} />
            Back to Orders
          </Link>
          <h3 className="text-2xl font-bold text-[#574848]">
            {order.orderNumber}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {order.customerDetails?.name} | {garmentSummary}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              statusStyles[order.status] || "bg-gray-100 text-gray-700"
            }`}
          >
            {order.status}
          </span>
        </div>
      </div>

      {alert.message && (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm font-medium ${
            alert.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {alert.message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-[#f8f3f4] p-3 text-[#574848]">
                <User size={20} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#574848]">
                  Customer Details
                </h4>
                <p className="text-sm text-gray-500">
                  Contact details linked to this order.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-[#fcf9f9] px-4 py-3">
                <p className="text-xs font-semibold uppercase text-gray-500">Name</p>
                <p className="mt-1 font-semibold text-[#574848]">
                  {order.customerDetails?.name}
                </p>
              </div>
              <div className="rounded-xl bg-[#fcf9f9] px-4 py-3">
                <p className="text-xs font-semibold uppercase text-gray-500">Phone</p>
                <p className="mt-1 flex items-center gap-2 font-semibold text-[#574848]">
                  <Phone size={14} />
                  {order.customerDetails?.phone}
                </p>
              </div>
              
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-[#f8f3f4] p-3 text-[#574848]">
                <Scissors size={20} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#574848]">
                  Garments And Measurements
                </h4>
                <p className="text-sm text-gray-500">
                  Full garment details saved for this order.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {order.garments?.map((garment, index) => {
                const measurement = garment.measurement;
                const entries = measurementEntries(measurement);

                return (
                  <div
                    key={garment._id}
                    className="rounded-2xl border border-[#efe5e5] p-4 md:p-5"
                  >
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h4 className="font-bold text-[#574848]">
                          {index + 1}. {garment.garmentType}
                        </h4>
                        <p className="mt-1 text-sm text-gray-500">
                          {garment.designSelection || "-"} | {garment.fabric || "-"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                          statusStyles[garment.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {garment.status}
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-xl bg-[#fcf9f9] px-4 py-3">
                        <p className="text-xs font-semibold uppercase text-gray-500">
                          Stitching
                        </p>
                        <p className="mt-1 font-semibold text-[#574848]">
                          {formatMoney(garment.stitchingCharge)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-[#fcf9f9] px-4 py-3">
                        <p className="text-xs font-semibold uppercase text-gray-500">
                          Delivery
                        </p>
                        <p className="mt-1 font-semibold text-[#574848]">
                          {formatDate(garment.deliveryDate)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-[#fcf9f9] px-4 py-3">
                        <p className="text-xs font-semibold uppercase text-gray-500">
                          Measurement Updated
                        </p>
                        <p className="mt-1 font-semibold text-[#574848]">
                          {formatDate(measurement?.updatedDate)}
                        </p>
                      </div>
                    </div>

                    {entries.length > 0 && (
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {entries.map(([name, value]) => (
                          <div key={name} className="rounded-xl border border-[#efe5e5] px-4 py-3">
                            <p className="text-xs font-semibold uppercase text-gray-500">
                              {name}
                            </p>
                            <p className="mt-1 font-semibold text-[#574848]">
                              {value} in
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {measurement?.customMeasurements?.length > 0 && (
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {measurement.customMeasurements.map((item) => (
                          <div key={item._id || item.name} className="rounded-xl border border-[#efe5e5] px-4 py-3">
                            <p className="text-xs font-semibold uppercase text-gray-500">
                              {item.name}
                            </p>
                            <p className="mt-1 font-semibold text-[#574848]">
                              {item.value} in
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {garment.designImage?.preview && (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDesignImage({
                            src: garment.designImage.preview,
                            alt: `${garment.garmentType} design reference`,
                          })
                        }
                        className="mt-4 block w-full cursor-zoom-in overflow-hidden rounded-xl"
                        aria-label="View full design image"
                      >
                        <img
                          src={garment.designImage.preview}
                          alt={`${garment.garmentType} design reference`}
                          className="h-72 w-full rounded-xl object-cover transition hover:scale-[1.01]"
                        />
                      </button>
                    )}

                    {garment.stitchingNotes && (
                      <div className="mt-4 rounded-xl bg-[#fcf9f9] px-4 py-3">
                        <p className="text-xs font-semibold uppercase text-gray-500">
                          Notes
                        </p>
                        <p className="mt-1 text-sm leading-6 text-gray-700">
                          {garment.stitchingNotes}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-[#f8f3f4] p-3 text-[#574848]">
                <FileText size={20} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#574848]">Order Notes</h4>
                <p className="text-sm text-gray-500">
                  General instructions for the complete order.
                </p>
              </div>
            </div>
            <p className="rounded-xl bg-[#fcf9f9] px-4 py-3 text-sm leading-6 text-gray-700">
              {order.notes || "-"}
            </p>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
            <h4 className="text-lg font-bold text-[#574848]">Update Status</h4>
            <p className="mt-1 text-sm text-gray-500">
              Change the order progress from here.
            </p>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-medium text-[#574848]">
                Order Status
              </span>
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                className="w-full rounded-xl border border-[#e8dede] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#574848]"
              >
                {statusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={handleStatusSave}
              disabled={savingStatus || selectedStatus === order.status}
              className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#574848] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#463838] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save size={18} />
              {savingStatus ? "Saving..." : "Save Status"}
            </button>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-[#f8f3f4] p-3 text-[#574848]">
                <Receipt size={20} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#574848]">Bill Summary</h4>
                <p className="text-sm text-gray-500">
                  {latestBill?.billNumber || "Pricing saved with order"}
                </p>
              </div>
            </div>

            {latestBill && (
              <button
                type="button"
                onClick={() => downloadInvoice(latestBill)}
                className="mb-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#e8dede] px-4 py-3 text-sm font-semibold text-[#574848] transition hover:bg-[#f8f3f4]"
              >
                <Download size={16} />
                Download Invoice
              </button>
            )}

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-[#f0e6e6] pb-3">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-900">
                  {formatMoney(pricing.subtotal)}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#f0e6e6] pb-3">
                <span className="text-gray-600">Discount</span>
                <span className="font-semibold text-gray-900">
                  {formatMoney(pricing.discount)}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#f0e6e6] pb-3">
                <span className="text-gray-600">GST ({pricing.gstRate || 5}%)</span>
                <span className="font-semibold text-gray-900">
                  {formatMoney(pricing.gstAmount)}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#f0e6e6] pb-3">
                <span className="text-gray-600">Total</span>
                <span className="font-semibold text-gray-900">
                  {formatMoney(pricing.total)}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#f0e6e6] pb-3">
                <span className="text-gray-600">Advance</span>
                <span className="font-semibold text-gray-900">
                  {formatMoney(pricing.advance || latestBill?.advance)}
                </span>
              </div>
              <div className="flex items-center justify-between text-base">
                <span className="font-semibold text-[#574848]">Balance</span>
                <span className="text-2xl font-bold text-[#574848]">
                  {formatMoney(pricing.balance || latestBill?.balance)}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
            <h4 className="text-lg font-bold text-[#574848]">Order Timeline</h4>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center gap-3 rounded-xl bg-[#fcf9f9] px-4 py-3">
                <CalendarDays size={16} className="text-[#574848]" />
                <span>Created {formatDate(order.createdAt)}</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-[#fcf9f9] px-4 py-3">
                <CalendarDays size={16} className="text-[#574848]" />
                <span>Delivery {formatDate(order.deliveryDate)}</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-[#fcf9f9] px-4 py-3">
                <CreditCard size={16} className="text-[#574848]" />
                <span>{latestBill ? "Bill created" : "Bill not created yet"}</span>
              </div>
            </div>
          </section>

          
        </aside>
      </div>

      {selectedDesignImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-black/75"
            onClick={() => setSelectedDesignImage(null)}
            aria-label="Close image preview"
          />

          <div className="relative z-10 w-full max-w-5xl">
            <button
              type="button"
              className="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-black/80"
              onClick={() => setSelectedDesignImage(null)}
              aria-label="Close preview"
            >
              <X size={20} />
            </button>

            <img
              src={selectedDesignImage.src}
              alt={selectedDesignImage.alt}
              className="max-h-[85vh] w-full rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
