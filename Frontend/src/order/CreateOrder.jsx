import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  FileText,
  ImagePlus,
  Palette,
  Plus,
  Receipt,
  Save,
  Scissors,
  Trash2,
  User,
} from "lucide-react";

import API_BASE_URL from "../config/api";
const GST_RATE = 0.05;

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
const formatMoney = (value) => `Rs ${Number(value || 0).toFixed(2)}`;
const formatInvoiceDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const normalizePhoneNumber = (rawPhone, defaultCountryCode = "91") => {
  if (!rawPhone) {
    return "";
  }

  const digits = String(rawPhone).replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.length === 10) {
    return `${defaultCountryCode}${digits}`;
  }

  if (digits.startsWith("0") && digits.length === 11) {
    return `${defaultCountryCode}${digits.slice(1)}`;
  }

  return digits;
};

const createWhatsAppInvoiceLink = (bill, fallbackPhone = "") => {
  const order = bill?.orderId || {};
  const customer = bill?.customerId || {};
  const payment = bill?.paymentDetails || {};
  const phone = normalizePhoneNumber(
    customer?.phone || order?.customerDetails?.phone || fallbackPhone
  );

  if (!phone) {
    return "";
  }

  const message = [
    "ASHOK BOUTIQUE",
    "",
    `Invoice No: ${bill?.billNumber || "-"}`,
    `Order ID: ${order?.orderNumber || "-"}`,
    `Invoice Date: ${formatInvoiceDate(bill?.createdAt)}`,
    "",
    "Items / Services",
    ...((order?.garments || []).map(
      (garment, index) =>
        `${index + 1}. ${garment.garmentType || "Garment"} (Qty 1) = ${formatMoney(
          garment.stitchingCharge
        )}`
    ) || []),
    "",
    "Payment Summary",
    `Subtotal: ${formatMoney(payment.subtotal)}`,
    `GST: ${formatMoney(payment.gstAmount)}`,
    `Discount: ${formatMoney(payment.discount)}`,
    `Grand Total: ${formatMoney(bill?.totalAmount)}`,
    `Advance Paid: ${formatMoney(bill?.advance)}`,
    `Balance Due: ${formatMoney(bill?.balance)}`,
    "",
    "Thank you for choosing Ashok Boutique.",
  ].join("\n");

  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
};

const createInvoicePdfBlob = (bill) => {
  const order = bill?.orderId || {};
  const customer = bill?.customerId || {};
  const payment = bill?.paymentDetails || {};

  const doc = new jsPDF();
  const lines = [
    "      ASHOK BOUTIQUE",
    "Dhanshree Tower 1, B-38, Sector 2 Rd, Sector 2,",
    "Central Spine, Vidyadhar Nagar, Jaipur, Rajasthan 302039",
    "Phone: +91 9252010850 | WhatsApp: +91 9252010850",
    "Email: ashokboutique@gmail.com",
    "========================================================",
    "",
    `Invoice No   : ${bill?.billNumber || "-"}`,
    `Order ID     : ${order?.orderNumber || "-"}`,
    `Invoice Date : ${formatInvoiceDate(bill?.createdAt)}`,
    `Delivery Date: ${formatInvoiceDate(order?.deliveryDate)}`,
    "",
    "--------------------------------------------------------",
    "Customer Details",
    "--------------------------------------------------------",
    `Name         : ${customer?.name || order?.customerDetails?.name || "-"}`,
    `Phone        : ${customer?.phone || order?.customerDetails?.phone || "-"}`,
    `Address      : ${customer?.address || order?.customerDetails?.address || "-"}`,
    "",
    "--------------------------------------------------------",
    "Items / Services",
    "--------------------------------------------------------",
    ...((order?.garments || []).map(
      (garment, index) =>
        `${index + 1}. ${garment.garmentType || "Garment"} (Qty 1) = ${formatMoney(
          garment.stitchingCharge
        )}`
    ) || []),
    "",
    "--------------------------------------------------------",
    "Payment Summary",
    "--------------------------------------------------------",
    `Subtotal       : ${formatMoney(payment.subtotal)}`,
    `GST            : ${formatMoney(payment.gstAmount)}`,
    `Discount       : ${formatMoney(payment.discount)}`,
    `Grand Total    : ${formatMoney(bill?.totalAmount)}`,
    `Advance Paid   : ${formatMoney(bill?.advance)}`,
    `Balance Due    : ${formatMoney(bill?.balance)}`,
    "",
    `Payment Mode   : ${bill?.paymentMode || "-"}`,
    `Payment Status : ${bill?.paymentStatus || "-"}`,
  ];

  doc.setFont("courier", "normal");
  doc.setFontSize(10);
  doc.text(lines, 12, 12);

  return doc.output("blob");
};

const downloadPdfBlob = (blob, fileName) => {
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(blobUrl);
};

const garmentOptions = ["Blouse", "Lehenga", "Kurti", "Suit", "Gown", "Indo Western"];

const measurementFields = {
  Blouse: [
    "Bust",
    "Waist",
    "Shoulder",
    "Sleeve Length",
    "Armhole",
    "Neck Depth",
    "Blouse Length",
  ],
  Lehenga: ["Waist", "Hips", "Lehenga Length", "Flare", "Can Can Length"],
  Kurti: [
    "Bust",
    "Waist",
    "Hips",
    "Shoulder",
    "Sleeve Length",
    "Kurti Length",
    "Side Slit",
  ],
  Suit: [
    "Bust",
    "Waist",
    "Hips",
    "Shoulder",
    "Sleeve Length",
    "Kameez Length",
    "Bottom Length",
  ],
  Gown: [
    "Bust",
    "Waist",
    "Hips",
    "Shoulder",
    "Sleeve Length",
    "Gown Length",
    "Flare",
  ],
  "Indo Western": [
    "Bust",
    "Waist",
    "Hips",
    "Shoulder",
    "Sleeve Length",
    "Top Length",
    "Bottom Length",
  ],
};

const initialCustomerForm = {
  customerName: "",
  phone: "",
  address: "",
  notes: "",
};

const initialBillForm = {
  fabricCharge: "",
  addonCharge: "",
  discount: "",
  advance: "",
  paymentMode: "Cash",
};

const createGarment = (id) => ({
  id,
  garmentType: "Blouse",
  fabric: "",
  stitchingCharge: "",
  designSelection: "Classic",
  designImage: null,
  deliveryDate: "",
  stitchingNotes: "",
  status: "Pending",
  measurements: {},
  customMeasurements: [],
});

const CreateOrder = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("order");
  const [customerForm, setCustomerForm] = useState(initialCustomerForm);
  const [garments, setGarments] = useState([createGarment(1)]);
  const [billForm, setBillForm] = useState(initialBillForm);
  const [orderNotes, setOrderNotes] = useState("");
  const [savedOrderId, setSavedOrderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({
    type: "",
    message: "",
    whatsappLink: "",
  });

  const billSummary = useMemo(() => {
    const garmentStitchingTotal = garments.reduce(
      (total, garment) => total + Number(garment.stitchingCharge || 0),
      0
    );
    const subtotal =
      garmentStitchingTotal +
      Number(billForm.fabricCharge || 0) +
      Number(billForm.addonCharge || 0);
    const taxableAmount = Math.max(subtotal - Number(billForm.discount || 0), 0);
    const gstAmount = roundMoney(taxableAmount * GST_RATE);
    const total = roundMoney(taxableAmount + gstAmount);
    const balance = roundMoney(Math.max(total - Number(billForm.advance || 0), 0));

    return {
      garmentStitchingTotal,
      subtotal,
      taxableAmount,
      gstRate: GST_RATE * 100,
      gstAmount,
      total,
      balance,
    };
  }, [billForm, garments]);

  const garmentSummary = useMemo(
    () => garments.map((garment) => garment.garmentType).join(" + "),
    [garments]
  );

  const markOrderAsChanged = () => {
    setSavedOrderId("");
  };

  const buildOrderPayload = () => ({
    customer: {
      name: customerForm.customerName,
      phone: customerForm.phone,
      address: customerForm.address,
      notes: customerForm.notes,
    },
    garments,
    notes: orderNotes,
    pricingSummary: {
      fabricCharge: Number(billForm.fabricCharge || 0),
      addonCharge: Number(billForm.addonCharge || 0),
      discount: Number(billForm.discount || 0),
      gstRate: billSummary.gstRate,
      gstAmount: billSummary.gstAmount,
      advance: Number(billForm.advance || 0),
    },
  });

  const handleCustomerChange = (event) => {
    const { name, value } = event.target;
    markOrderAsChanged();
    setCustomerForm((current) => ({ ...current, [name]: value }));
  };

  const updateGarment = (garmentId, updates) => {
    markOrderAsChanged();
    setGarments((current) =>
      current.map((garment) =>
        garment.id === garmentId ? { ...garment, ...updates } : garment
      )
    );
  };

  const handleGarmentFieldChange = (garmentId, event) => {
    const { name, value } = event.target;

    if (name === "garmentType") {
      updateGarment(garmentId, {
        garmentType: value,
        measurements: {},
        customMeasurements: [],
      });
      return;
    }

    updateGarment(garmentId, { [name]: value });
  };

  const handleMeasurementChange = (garmentId, field, value) => {
    markOrderAsChanged();
    setGarments((current) =>
      current.map((garment) =>
        garment.id === garmentId
          ? {
              ...garment,
              measurements: {
                ...garment.measurements,
                [field]: value,
              },
            }
          : garment
      )
    );
  };

  const addGarment = () => {
    markOrderAsChanged();
    setGarments((current) => [...current, createGarment(Date.now())]);
  };

  const removeGarment = (garmentId) => {
    markOrderAsChanged();
    setGarments((current) => current.filter((garment) => garment.id !== garmentId));
  };

  const addCustomMeasurement = (garmentId) => {
    markOrderAsChanged();
    setGarments((current) =>
      current.map((garment) =>
        garment.id === garmentId
          ? {
              ...garment,
              customMeasurements: [
                ...garment.customMeasurements,
                { id: Date.now(), name: "", value: "" },
              ],
            }
          : garment
      )
    );
  };

  const updateCustomMeasurement = (garmentId, measurementId, field, value) => {
    markOrderAsChanged();
    setGarments((current) =>
      current.map((garment) =>
        garment.id === garmentId
          ? {
              ...garment,
              customMeasurements: garment.customMeasurements.map((measurement) =>
                measurement.id === measurementId
                  ? { ...measurement, [field]: value }
                  : measurement
              ),
            }
          : garment
      )
    );
  };

  const removeCustomMeasurement = (garmentId, measurementId) => {
    markOrderAsChanged();
    setGarments((current) =>
      current.map((garment) =>
        garment.id === garmentId
          ? {
              ...garment,
              customMeasurements: garment.customMeasurements.filter(
                (measurement) => measurement.id !== measurementId
              ),
            }
          : garment
      )
    );
  };

  const handleDesignImageChange = (garmentId, event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateGarment(garmentId, {
        designImage: {
          name: file.name,
          preview: reader.result,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const removeDesignImage = (garmentId) => {
    updateGarment(garmentId, { designImage: null });
  };

  const handleBillChange = (event) => {
    const { name, value } = event.target;
    setBillForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setSubmitStatus({ type: "", message: "", whatsappLink: "" });

      let orderId = savedOrderId;

      if (!orderId) {
        const orderResponse = await axios.post(
          `${API_BASE_URL}/orders`,
          buildOrderPayload()
        );

        orderId = orderResponse.data.order._id;
        setSavedOrderId(orderId);
      }

      if (activeTab === "bill") {
        const billResponse = await axios.post(`${API_BASE_URL}/bills`, {
          orderId,
          paymentDetails: {
            fabricCharge: Number(billForm.fabricCharge || 0),
            addonCharge: Number(billForm.addonCharge || 0),
            discount: Number(billForm.discount || 0),
            stitchingTotal: billSummary.garmentStitchingTotal,
            subtotal: billSummary.subtotal,
            taxableAmount: billSummary.taxableAmount,
            gstRate: billSummary.gstRate,
            gstAmount: billSummary.gstAmount,
          },
          totalAmount: billSummary.total,
          advance: Number(billForm.advance || 0),
          paymentMode: billForm.paymentMode,
        });

        const billMessage =
          billResponse.data.message || "Order and bill saved successfully in MongoDB.";
        const savedBill = billResponse.data.bill;
        const whatsappLink = createWhatsAppInvoiceLink(savedBill, customerForm.phone);
        const pdfBlob = createInvoicePdfBlob(savedBill);
        const pdfName = `${savedBill?.billNumber || "invoice"}.pdf`;
        downloadPdfBlob(pdfBlob, pdfName);

        if (whatsappLink) {
          window.open(whatsappLink, "_blank", "noopener,noreferrer");
        }

        setSubmitStatus({
          type: "success",
          message: whatsappLink
            ? `${billMessage} PDF downloaded and WhatsApp opened. Attach the downloaded PDF and send.`
            : `${billMessage} PDF downloaded. Customer phone number missing, WhatsApp link not created.`,
          whatsappLink,
        });
        navigate("/orders");
        return;
      }

      setSubmitStatus({
        type: "success",
        message: "Order, customer, and measurements saved successfully in MongoDB.",
        whatsappLink: "",
      });
      setActiveTab("bill");
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to save order details. Please check the backend server.",
        whatsappLink: "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            to="/orders"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[#574848]"
          >
            <ArrowLeft size={16} />
            All Orders
          </Link>
          <h3 className="text-2xl font-bold text-[#574848]">Create New Order</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add one customer order with multiple garments and garment-wise designs.
          </p>
        </div>

        <div className="flex rounded-2xl bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("order")}
            className={`flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
              activeTab === "order"
                ? "bg-[#574848] text-white"
                : "text-[#574848] hover:bg-[#f8f3f4]"
            }`}
          >
            <FileText size={17} />
            Order Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bill")}
            className={`flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
              activeTab === "bill"
                ? "bg-[#574848] text-white"
                : "text-[#574848] hover:bg-[#f8f3f4]"
            }`}
          >
            <Receipt size={17} />
            Create Bill
          </button>
        </div>
      </div>

      {submitStatus.message && (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm font-medium ${
            submitStatus.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {submitStatus.message}
          {submitStatus.type === "success" && submitStatus.whatsappLink && (
            <a
              href={submitStatus.whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-lg border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              Send Invoice On WhatsApp
            </a>
          )}
        </div>
      )}

      {activeTab === "order" ? (
        <form className="grid gap-6 xl:grid-cols-[1fr_360px]" onSubmit={handleSubmit}>
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
                    Add contact information for this boutique order.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#574848]">
                    Customer Name
                  </span>
                  <input
                    required
                    name="customerName"
                    value={customerForm.customerName}
                    onChange={handleCustomerChange}
                    className="w-full rounded-xl border border-[#e8dede] px-4 py-3 text-sm outline-none transition focus:border-[#574848]"
                    placeholder="Enter customer name"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#574848]">
                    Phone Number
                  </span>
                  <input
                    required
                    name="phone"
                    value={customerForm.phone}
                    onChange={handleCustomerChange}
                    className="w-full rounded-xl border border-[#e8dede] px-4 py-3 text-sm outline-none transition focus:border-[#574848]"
                    placeholder="Enter phone number"
                  />
                </label>

              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[#f8f3f4] p-3 text-[#574848]">
                    <Scissors size={20} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#574848]">
                      Garments And Measurements
                    </h4>
                    <p className="text-sm text-gray-500">
                      Add blouse, lehenga, kurta, or any other garment in the same order.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addGarment}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#574848] px-4 text-sm font-semibold text-white transition hover:bg-[#463838]"
                >
                  <Plus size={17} />
                  Add Garment
                </button>
              </div>

              <div className="space-y-5">
                {garments.map((garment, index) => {
                  const fields = measurementFields[garment.garmentType] || [];

                  return (
                    <div
                      key={garment.id}
                      className="rounded-2xl border border-[#efe5e5] p-4 md:p-5"
                    >
                      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h4 className="font-bold text-[#574848]">
                            Garment {index + 1}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Measurements and design are saved for this garment only.
                          </p>
                        </div>

                        {garments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeGarment(garment.id)}
                            className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#f0d6d6] px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                          >
                            <Trash2 size={16} />
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-[#574848]">
                            Garment Type
                          </span>
                          <select
                            name="garmentType"
                            value={garment.garmentType}
                            onChange={(event) =>
                              handleGarmentFieldChange(garment.id, event)
                            }
                            className="w-full rounded-xl border border-[#e8dede] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#574848]"
                          >
                            {garmentOptions.map((option) => (
                              <option key={option}>{option}</option>
                            ))}
                          </select>
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-[#574848]">
                            Fabric
                          </span>
                          <input
                            name="fabric"
                            value={garment.fabric}
                            onChange={(event) =>
                              handleGarmentFieldChange(garment.id, event)
                            }
                            className="w-full rounded-xl border border-[#e8dede] px-4 py-3 text-sm outline-none transition focus:border-[#574848]"
                            placeholder="Silk, cotton, georgette"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-[#574848]">
                            Stitching Charge
                          </span>
                          <input
                            required
                            type="number"
                            min="0"
                            name="stitchingCharge"
                            value={garment.stitchingCharge}
                            onChange={(event) =>
                              handleGarmentFieldChange(garment.id, event)
                            }
                            className="w-full rounded-xl border border-[#e8dede] px-4 py-3 text-sm outline-none transition focus:border-[#574848]"
                            placeholder="Rs"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 flex items-center gap-2 text-sm font-medium text-[#574848]">
                            <Palette size={15} />
                            Design Selection
                          </span>
                          <select
                            name="designSelection"
                            value={garment.designSelection}
                            onChange={(event) =>
                              handleGarmentFieldChange(garment.id, event)
                            }
                            className="w-full rounded-xl border border-[#e8dede] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#574848]"
                          >
                            <option>Classic</option>
                            <option>Heavy Embroidery</option>
                            <option>Mirror Work</option>
                            <option>Princess Cut</option>
                            <option>Custom Reference</option>
                          </select>
                        </label>

                        <div className="block md:col-span-2">
                          <span className="mb-2 flex items-center gap-2 text-sm font-medium text-[#574848]">
                            <ImagePlus size={15} />
                            Design Image
                          </span>

                          {garment.designImage ? (
                            <div className="flex flex-col gap-4 rounded-xl border border-[#e8dede] p-3 sm:flex-row sm:items-center">
                              <img
                                src={garment.designImage.preview}
                                alt={`${garment.garmentType} design reference`}
                                className="h-32 w-full rounded-xl object-cover sm:w-40"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-[#574848]">
                                  {garment.designImage.name}
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                  Reference image attached for this garment.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => removeDesignImage(garment.id)}
                                  className="mt-3 flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#f0d6d6] px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                                >
                                  <Trash2 size={16} />
                                  Remove Image
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#d8caca] bg-[#fcf9f9] px-4 py-5 text-center transition hover:border-[#574848] hover:bg-[#f8f3f4]">
                              <ImagePlus size={24} className="text-[#574848]" />
                              <span className="mt-2 text-sm font-semibold text-[#574848]">
                                Upload Design Image
                              </span>
                              <span className="mt-1 text-xs text-gray-500">
                                Add a reference photo for this garment only.
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(event) =>
                                  handleDesignImageChange(garment.id, event)
                                }
                                className="sr-only"
                              />
                            </label>
                          )}
                        </div>

                        <label className="block">
                          <span className="mb-2 flex items-center gap-2 text-sm font-medium text-[#574848]">
                            <CalendarDays size={15} />
                            Delivery Date
                          </span>
                          <input
                            required
                            type="date"
                            name="deliveryDate"
                            value={garment.deliveryDate}
                            onChange={(event) =>
                              handleGarmentFieldChange(garment.id, event)
                            }
                            className="w-full rounded-xl border border-[#e8dede] px-4 py-3 text-sm outline-none transition focus:border-[#574848]"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-[#574848]">
                            Status
                          </span>
                          <select
                            name="status"
                            value={garment.status}
                            onChange={(event) =>
                              handleGarmentFieldChange(garment.id, event)
                            }
                            className="w-full rounded-xl border border-[#e8dede] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#574848]"
                          >
                            <option>Pending</option>
                            <option>Measurement Taken</option>
                            <option>Stitching</option>
                            <option>Ready for Trial</option>
                            <option>Delivered</option>
                          </select>
                        </label>
                      </div>

                      <div className="mt-5">
                        <div className="mb-4">
                          <h6 className="font-semibold text-[#574848]">
                            {garment.garmentType} Measurements
                          </h6>
                          <p className="text-sm text-gray-500">
                            These fields change based on the selected garment type.
                          </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          {fields.map((field) => (
                            <label key={field} className="block">
                              <span className="mb-2 block text-sm font-medium text-[#574848]">
                                {field}
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={garment.measurements[field] || ""}
                                onChange={(event) =>
                                  handleMeasurementChange(
                                    garment.id,
                                    field,
                                    event.target.value
                                  )
                                }
                                className="w-full rounded-xl border border-[#e8dede] px-4 py-3 text-sm outline-none transition focus:border-[#574848]"
                                placeholder="Inches"
                              />
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5">
                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h6 className="font-semibold text-[#574848]">
                              Other Measurements
                            </h6>
                            <p className="text-sm text-gray-500">
                              Add extra measurement names that are not in the default list.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => addCustomMeasurement(garment.id)}
                            className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#e8dede] px-3 text-sm font-semibold text-[#574848] transition hover:bg-[#f8f3f4]"
                          >
                            <Plus size={16} />
                            Add Field
                          </button>
                        </div>

                        {garment.customMeasurements.length > 0 && (
                          <div className="space-y-3">
                            {garment.customMeasurements.map((measurement) => (
                              <div
                                key={measurement.id}
                                className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
                              >
                                <input
                                  value={measurement.name}
                                  onChange={(event) =>
                                    updateCustomMeasurement(
                                      garment.id,
                                      measurement.id,
                                      "name",
                                      event.target.value
                                    )
                                  }
                                  className="w-full rounded-xl border border-[#e8dede] px-4 py-3 text-sm outline-none transition focus:border-[#574848]"
                                  placeholder="Measurement name"
                                />
                                <input
                                  type="number"
                                  min="0"
                                  value={measurement.value}
                                  onChange={(event) =>
                                    updateCustomMeasurement(
                                      garment.id,
                                      measurement.id,
                                      "value",
                                      event.target.value
                                    )
                                  }
                                  className="w-full rounded-xl border border-[#e8dede] px-4 py-3 text-sm outline-none transition focus:border-[#574848]"
                                  placeholder="Inches"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeCustomMeasurement(
                                      garment.id,
                                      measurement.id
                                    )
                                  }
                                  className="flex min-h-11 items-center justify-center rounded-xl border border-[#f0d6d6] px-3 text-rose-700 transition hover:bg-rose-50"
                                  aria-label="Remove measurement"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <label className="mt-5 block">
                        <span className="mb-2 block text-sm font-medium text-[#574848]">
                          Stitching Notes
                        </span>
                        <textarea
                          name="stitchingNotes"
                          value={garment.stitchingNotes}
                          onChange={(event) =>
                            handleGarmentFieldChange(garment.id, event)
                          }
                          rows="4"
                          className="w-full resize-none rounded-xl border border-[#e8dede] px-4 py-3 text-sm outline-none transition focus:border-[#574848]"
                          placeholder="Lining, sleeve pattern, neck depth, trial notes"
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
              <h4 className="text-lg font-bold text-[#574848]">Order Notes</h4>
              <p className="mt-1 text-sm text-gray-500">
                Add general instructions that apply to the complete order.
              </p>
              <textarea
                value={orderNotes}
                onChange={(event) => {
                  markOrderAsChanged();
                  setOrderNotes(event.target.value);
                }}
                rows="4"
                className="mt-5 w-full resize-none rounded-xl border border-[#e8dede] px-4 py-3 text-sm outline-none transition focus:border-[#574848]"
                placeholder="Trial timing, delivery instructions, packaging notes"
              />
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
              <h4 className="text-lg font-bold text-[#574848]">Order Summary</h4>
              <p className="mt-1 text-sm text-gray-500">
                This order currently includes {garments.length} garment
                {garments.length === 1 ? "" : "s"}.
              </p>

              <div className="mt-5 space-y-3">
                {garments.map((garment, index) => (
                  <div
                    key={garment.id}
                    className="rounded-xl border border-[#efe5e5] px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-[#574848]">
                      {index + 1}. {garment.garmentType}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {garment.designSelection} | {garment.status}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      Rs {garment.stitchingCharge || 0}
                    </p>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#574848] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#463838] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Save size={18} />
                {isSubmitting ? "Saving..." : "Save Order"}
              </button>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
              <h4 className="text-lg font-bold text-[#574848]">Next Step</h4>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                After adding garment details, open the billing tab to create a bill
                for this same order.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("bill")}
                className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#e8dede] px-4 py-3 text-sm font-semibold text-[#574848] transition hover:bg-[#f8f3f4]"
              >
                <Receipt size={18} />
                Create Bill
              </button>
            </section>
          </aside>
        </form>
      ) : (
        <form className="grid gap-6 xl:grid-cols-[1fr_360px]" onSubmit={handleSubmit}>
          <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-[#f8f3f4] p-3 text-[#574848]">
                <Receipt size={20} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#574848]">Create Bill</h4>
                <p className="text-sm text-gray-500">
                  Add charges, advance payment, and payment mode for this order.
                </p>
              </div>
            </div>

            <div className="mb-5 rounded-2xl border border-[#efe5e5] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-[#574848]">
                    Garment Stitching Charges
                  </h4>
                  <p className="text-sm text-gray-500">
                    These charges are taken from garment details.
                  </p>
                </div>
                <span className="rounded-full bg-[#f8f3f4] px-3 py-1 text-sm font-bold text-[#574848]">
                  Rs {billSummary.garmentStitchingTotal}
                </span>
              </div>

              <div className="space-y-2">
                {garments.map((garment, index) => (
                  <div
                    key={garment.id}
                    className="flex items-center justify-between rounded-xl bg-[#fcf9f9] px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-gray-700">
                      {index + 1}. {garment.garmentType}
                    </span>
                    <span className="font-semibold text-[#574848]">
                      Rs {garment.stitchingCharge || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#574848]">
                  Fabric Charge
                </span>
                <input
                  type="number"
                  min="0"
                  name="fabricCharge"
                  value={billForm.fabricCharge}
                  onChange={handleBillChange}
                  className="w-full rounded-xl border border-[#e8dede] px-4 py-3 text-sm outline-none transition focus:border-[#574848]"
                  placeholder="Rs"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#574848]">
                  Extra Work Charge
                </span>
                <input
                  type="number"
                  min="0"
                  name="addonCharge"
                  value={billForm.addonCharge}
                  onChange={handleBillChange}
                  className="w-full rounded-xl border border-[#e8dede] px-4 py-3 text-sm outline-none transition focus:border-[#574848]"
                  placeholder="Rs"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#574848]">
                  Discount
                </span>
                <input
                  type="number"
                  min="0"
                  name="discount"
                  value={billForm.discount}
                  onChange={handleBillChange}
                  className="w-full rounded-xl border border-[#e8dede] px-4 py-3 text-sm outline-none transition focus:border-[#574848]"
                  placeholder="Rs"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#574848]">
                  Advance Paid
                </span>
                <input
                  type="number"
                  min="0"
                  name="advance"
                  value={billForm.advance}
                  onChange={handleBillChange}
                  className="w-full rounded-xl border border-[#e8dede] px-4 py-3 text-sm outline-none transition focus:border-[#574848]"
                  placeholder="Rs"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-[#574848]">
                  <CreditCard size={15} />
                  Payment Mode
                </span>
                <select
                  name="paymentMode"
                  value={billForm.paymentMode}
                  onChange={handleBillChange}
                  className="w-full rounded-xl border border-[#e8dede] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#574848]"
                >
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Card</option>
                  <option>Bank Transfer</option>
                </select>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#574848] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#463838] disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
            >
              <Receipt size={18} />
              {isSubmitting ? "Saving..." : "Generate Bill"}
            </button>
          </section>

          <aside className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
            <h4 className="text-lg font-bold text-[#574848]">Bill Summary</h4>
            <p className="mt-1 text-sm text-gray-500">
              Preview billing details before generating the bill.
            </p>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-[#f8f3f4] px-4 py-3 text-sm">
                <span className="text-gray-600">Customer</span>
                <span className="font-semibold text-[#574848]">
                  {customerForm.customerName || "Not selected"}
                </span>
              </div>
              <div className="rounded-xl bg-[#f8f3f4] px-4 py-3 text-sm">
                <span className="text-gray-600">Garments</span>
                <p className="mt-1 font-semibold text-[#574848]">{garmentSummary}</p>
              </div>
              <div className="flex items-center justify-between border-b border-[#f0e6e6] pb-3 text-sm">
                <span className="text-gray-600">Stitching Charges</span>
                <span className="font-semibold text-gray-900">
                  Rs {billSummary.garmentStitchingTotal}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#f0e6e6] pb-3 text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-900">
                  Rs {billSummary.subtotal}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#f0e6e6] pb-3 text-sm">
                <span className="text-gray-600">GST ({billSummary.gstRate}%)</span>
                <span className="font-semibold text-gray-900">
                  Rs {billSummary.gstAmount}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#f0e6e6] pb-3 text-sm">
                <span className="text-gray-600">Total With GST</span>
                <span className="font-semibold text-gray-900">
                  Rs {billSummary.total}
                </span>
              </div>
              <div className="flex items-center justify-between text-base">
                <span className="font-semibold text-[#574848]">Balance</span>
                <span className="text-2xl font-bold text-[#574848]">
                  Rs {billSummary.balance}
                </span>
              </div>
            </div>
          </aside>
        </form>
      )}
    </div>
  );
};

export default CreateOrder;
