import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  IndianRupee,
  PackageCheck,
  Search,
  Scissors,
  Shirt,
  UserRound,
  ChevronDown,
  ChevronUp,
  Filter,
  Calendar,
  TrendingUp,
  Star,
  Heart,
  Shield,
  Truck,
  ThumbsUp,
  Sparkles,
  Download,
  FileText,
  Printer,
  Share2,
  MapPin,
  Phone,
  Mail,
  User,
  CreditCard,
  Receipt,
  Package,
  Scissors as ScissorsIcon,
  Ruler,
  Watch,
  Gift,
  Home,
  Image,
  ZoomIn,
  Camera,
  Palette,
} from "lucide-react";

import Navbar from "../components/Navbar";
import API_BASE_URL from "../config/api";

const statusSteps = [
  { name: "Pending", icon: "📝", description: "Order received", color: "amber" },
  { name: "Measurement Taken", icon: "📏", description: "Measurements completed", color: "indigo" },
  { name: "Stitching", icon: "🪡", description: "In production", color: "sky" },
  { name: "Ready for Trial", icon: "👔", description: "Ready for fitting", color: "violet" },
  { name: "Delivered", icon: "🎁", description: "Order delivered", color: "emerald" },
];

const statusStyles = {
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  "Measurement Taken": "bg-indigo-100 text-indigo-700 border-indigo-200",
  Stitching: "bg-sky-100 text-sky-700 border-sky-200",
  "Ready for Trial": "bg-violet-100 text-violet-700 border-violet-200",
  Delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMoney = (value) => `₹ ${Number(value || 0).toFixed(0)}`;

const readCustomerId = () => {
  const directCustomerId = localStorage.getItem("customerId") || localStorage.getItem("customerID");
  if (directCustomerId) return directCustomerId;

  try {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    const customerId = savedUser?.customerId;
    if (typeof customerId === "string") return customerId;
    return customerId?._id || "";
  } catch {
    return "";
  }
};

// Helper function to get garment image URL
const getGarmentImageUrl = (garment) => {
  if (garment.designImage) {
    if (typeof garment.designImage === 'string') {
      return garment.designImage;
    }
    if (garment.designImage.preview) {
      return garment.designImage.preview;
    }
    if (garment.designImage.url) {
      return garment.designImage.url;
    }
  }
  return null;
};

// Image Modal Component
const ImageModal = ({ imageUrl, onClose, title }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 rounded-full bg-white/20 hover:bg-white/30 transition text-white"
        >
          <AlertCircle size={24} />
        </button>
        {title && <p className="absolute -top-12 left-0 text-white text-sm">{title}</p>}
        <img
          src={imageUrl}
          alt={title || "Design preview"}
          className="w-full h-[90vh] object-contain  pt-20"
        />
      </div>
    </div>
  );
};

// Invoice Modal Component
const InvoiceModal = ({ order, customer, onClose }) => {
  const invoiceRef = useRef();

  const generateInvoiceHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice ${order.orderNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; background: #fff; padding: 40px; color: #333; }
          .invoice-container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
          .invoice-header { text-align: center; padding: 30px; border-bottom: 2px solid #574848; }
          .shop-name { font-size: 28px; font-weight: bold; color: #574848; margin-bottom: 10px; }
          .shop-details { font-size: 12px; color: #666; line-height: 1.5; }
          .invoice-title { font-size: 20px; font-weight: bold; color: #574848; margin: 20px 0; text-align: center; }
          .invoice-details { padding: 20px 30px; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .details-box { background: #f8f3f4; padding: 15px; border-radius: 8px; }
          .details-box h4 { font-size: 14px; color: #574848; margin-bottom: 10px; font-weight: bold; }
          .details-box p { font-size: 12px; margin: 5px 0; color: #333; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #e0e0e0; padding: 12px; text-align: left; font-size: 12px; }
          th { background: #f8f3f4; color: #574848; font-weight: bold; }
          .summary { text-align: right; margin-top: 20px; }
          .summary-row { display: flex; justify-content: flex-end; padding: 8px 0; }
          .summary-label { width: 150px; font-size: 12px; color: #666; }
          .summary-value { width: 120px; font-size: 12px; font-weight: bold; text-align: right; }
          .total-row { border-top: 2px solid #574848; margin-top: 10px; padding-top: 10px; }
          .footer { padding: 20px 30px; border-top: 1px solid #e0e0e0; font-size: 10px; color: #999; text-align: center; }
          @media print { body { padding: 0; } .invoice-container { box-shadow: none; } button { display: none; } }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="invoice-header">
            <div class="shop-name">Ashok Boutique</div>
            <div class="shop-details">
              Dhanshree Tower 1, B-38, Sector 2 Rd, Vidyadhar Nagar, Jaipur - 302039<br/>
              📞 +91 9252010850 | ✉️ ashokboutique@gmail.com<br/>
              GST No: 08ABCDE1234F1Z
            </div>
          </div>
          <div class="invoice-title">TAX INVOICE</div>
          <div class="invoice-details">
            <div class="details-grid">
              <div class="details-box">
                <h4>Invoice To:</h4>
                <p><strong>${customer?.name || "Customer"}</strong></p>
                <p>${customer?.phone || "-"}</p>
                <p>${customer?.email || "-"}</p>
              </div>
              <div class="details-box">
                <h4>Invoice Details:</h4>
                <p><strong>Invoice No:</strong> INV-${order.orderNumber}</p>
                <p><strong>Order No:</strong> ${order.orderNumber}</p>
                <p><strong>Order Date:</strong> ${formatDate(order.createdAt)}</p>
                <p><strong>Invoice Date:</strong> ${formatDate(new Date())}</p>
              </div>
            </div>
            <table>
              <thead><tr><th>#</th><th>Garment Type</th><th>Fabric</th><th>Qty</th><th>Rate (₹)</th><th>Amount (₹)</th></tr></thead>
              <tbody>
                ${order.garments?.map((garment, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${garment.garmentType}</td>
                    <td>${garment.fabric || "-"}</td>
                    <td>1</td>
                    <td>${Number(garment.stitchingCharge || 0).toFixed(0)}</td>
                    <td>${Number(garment.stitchingCharge || 0).toFixed(0)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="summary">
              <div class="summary-row"><span class="summary-label">Subtotal:</span><span class="summary-value">₹ ${Number(order.pricingSummary?.subtotal || 0).toFixed(0)}</span></div>
              <div class="summary-row"><span class="summary-label">GST (5%):</span><span class="summary-value">₹ ${Number((order.pricingSummary?.subtotal || 0) * 0.05).toFixed(0)}</span></div>
              <div class="summary-row total-row"><span class="summary-label" style="font-weight: bold;">Total Amount:</span><span class="summary-value" style="font-weight: bold;">₹ ${Number(order.pricingSummary?.total || 0).toFixed(0)}</span></div>
              <div class="summary-row"><span class="summary-label">Amount Paid:</span><span class="summary-value" style="color: green;">₹ ${Number(order.pricingSummary?.paid || 0).toFixed(0)}</span></div>
              <div class="summary-row total-row"><span class="summary-label" style="font-weight: bold;">Balance Due:</span><span class="summary-value" style="font-weight: bold; color: #d97706;">₹ ${Number(order.pricingSummary?.balance || 0).toFixed(0)}</span></div>
            </div>
          </div>
          <div class="footer">
            <p>This is a computer generated invoice. No signature required.</p>
            <p>Thank you for shopping with Ashok Boutique!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownload = () => {
    try {
      const htmlContent = generateInvoiceHTML();
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${order.orderNumber}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download invoice:', err);
      alert('Failed to download invoice. Please try again.');
    }
  };

  const handlePrint = () => {
    const printContent = invoiceRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto pt-28">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#efe5e5] px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Receipt size={24} className="text-[#574848]" />
            <h3 className="text-xl font-bold text-[#574848]">Tax Invoice</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#f8f3f4] transition"
          >
            <AlertCircle size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Invoice Content */}
        <div ref={invoiceRef} className="p-8 max-h-[70vh] overflow-y-auto">
          {/* Shop Header */}
          <div className="text-center pb-6 border-b border-[#efe5e5]">
            <h1 className="text-3xl font-bold text-[#574848]">Ashok Boutique</h1>
            <p className="text-sm text-gray-500 mt-1">Dhanshree Tower 1, B-38, Sector 2 Rd, Vidyadhar Nagar, Jaipur - 302039</p>
            <p className="text-sm text-gray-500">📞 +91 9252010850 | ✉️ ashokboutique@gmail.com</p>
            <p className="text-sm text-gray-500">GST No: 08ABCDE1234F1Z | MSME Reg: UDYAM-RJ-02-0012345</p>
          </div>

          {/* Invoice Details */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <p className="text-xs text-gray-500 font-medium">Invoice To</p>
              <div className="mt-2 p-3 bg-[#f8f3f4] rounded-lg">
                <p className="font-semibold text-[#574848]">{customer?.name || "Customer"}</p>
                <p className="text-sm text-gray-600">{customer?.phone}</p>
                <p className="text-sm text-gray-600">{customer?.email}</p>
                {customer?.address && <p className="text-sm text-gray-600 mt-1">{customer.address}</p>}
              </div>
            </div>
            <div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Invoice No</p>
                  <p className="text-sm font-semibold text-[#574848]">INV-{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Order No</p>
                  <p className="text-sm font-semibold text-[#574848]">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Invoice Date</p>
                  <p className="text-sm text-[#574848]">{formatDate(new Date())}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Order Date</p>
                  <p className="text-sm text-[#574848]">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">GSTIN</p>
                  <p className="text-sm text-[#574848]">08ABCDE1234F1Z</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Place of Supply</p>
                  <p className="text-sm text-[#574848]">Rajasthan</p>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mt-8">
            <h4 className="font-semibold text-[#574848] mb-3">Order Items</h4>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f8f3f4] border-b border-[#efe5e5]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#574848]">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#574848]">Garment Type</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#574848]">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#574848]">Rate</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#574848]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.garments?.map((garment, idx) => (
                  <tr key={garment._id} className="border-b border-[#efe5e5]">
                    <td className="px-4 py-3 text-sm text-[#574848]">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm text-[#574848]">{garment.garmentType}</td>
                    <td className="px-4 py-3 text-sm text-right">1</td>
                    <td className="px-4 py-3 text-sm text-right">{formatMoney(garment.stitchingCharge)}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">{formatMoney(garment.stitchingCharge)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Amount Summary */}
          <div className="mt-6 flex justify-end">
            <div className="w-80">
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="text-sm font-medium">{formatMoney(order.pricingSummary?.subtotal)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-600">GST (5%):</span>
                <span className="text-sm font-medium">{formatMoney(order.pricingSummary?.subtotal * 0.05)}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-[#efe5e5]">
                <span className="text-sm font-bold text-[#574848]">Total Amount:</span>
                <span className="text-lg font-bold text-[#574848]">{formatMoney(order.pricingSummary?.total)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-600">Amount Paid:</span>
                <span className="text-sm font-medium text-green-600">{formatMoney(order.pricingSummary?.advance)}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-[#efe5e5]">
                <span className="text-sm font-bold text-[#574848]">Balance Due:</span>
                <span className="text-md font-bold text-amber-600">{formatMoney(order.pricingSummary?.balance)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#efe5e5]">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-medium">Payment Terms</p>

                <p className="text-sm text-gray-600">• Balance payment on delivery</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Declaration</p>
                <p className="text-sm text-gray-600 mt-1">We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
              </div>
            </div>
            <div className="text-center mt-6">
              <p className="text-xs text-gray-400">This is a computer generated invoice. No signature required.</p>
              <p className="text-xs text-gray-400 mt-1">Thank you for shopping with Ashok Boutique!</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-[#efe5e5] px-6 py-4 flex gap-3 rounded-b-2xl">
          {/* <button
            onClick={handleDownload}
            className="flex-1 py-2 rounded-xl bg-[#574848] text-white font-semibold hover:bg-[#463a3a] transition flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Download PDF
          </button> */}
          <button
            onClick={handlePrint}
            className="flex-1 py-2 rounded-xl border-2 border-[#574848] text-[#574848] font-semibold hover:bg-[#f8f3f4] transition flex items-center justify-center gap-2"
          >
            <Printer size={18} />
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  );
};


const TrackOrder = () => {
  const [customerId] = useState(() => readCustomerId());
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => (readCustomerId() ? "" : "No customer ID found. Please login."));
  const [selectedYear, setSelectedYear] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageTitle, setSelectedImageTitle] = useState("");
  const itemsPerPage = 10;

  useEffect(() => {
    if (!customerId) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await axios.get(`${API_BASE_URL}/orders/track/customer/${customerId}`);
        const loadedOrders = response.data.orders || [];
        setCustomer(response.data.customer || null);
        setOrders(loadedOrders);
        setSelectedOrderId(loadedOrders[0]?._id || "");
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load your orders. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [customerId]);

  const availableYears = useMemo(() => {
    const years = new Set();
    orders.forEach(order => {
      if (order.createdAt) {
        years.add(new Date(order.createdAt).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    if (query.trim()) {
      const normalizedQuery = query.trim().toLowerCase();
      filtered = filtered.filter((order) =>
        [
          order.orderNumber,
          order.status,
          order.garments?.map((g) => g.garmentType).join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      );
    }

    if (selectedYear !== "all") {
      filtered = filtered.filter((order) => {
        const orderYear = new Date(order.createdAt).getFullYear();
        return orderYear.toString() === selectedYear;
      });
    }

    return filtered;
  }, [orders, query, selectedYear]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredOrders.slice(start, end);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const selectedOrder = useMemo(() => {
    return orders.find((order) => order._id === selectedOrderId) || filteredOrders[0] || null;
  }, [filteredOrders, orders, selectedOrderId]);

  const activeStepIndex = Math.max(0, statusSteps.findIndex(step => step.name === selectedOrder?.status));

  const handleDownloadInvoice = (order) => {
    setSelectedOrderForInvoice(order);
    setShowInvoiceModal(true);
  };

  const orderMetrics = useMemo(
    () => [
      { label: "Total Orders", value: orders.length, icon: PackageCheck, color: "bg-[#574848] text-white" },
      { label: "In Progress", value: orders.filter((order) => order.status !== "Delivered").length, icon: Clock3, color: "bg-amber-100 text-amber-700" },
      { label: "Ready for Trial", value: orders.filter((order) => order.status === "Ready for Trial").length, icon: Star, color: "bg-violet-100 text-violet-700" },
      { label: "Delivered", value: orders.filter((order) => order.status === "Delivered").length, icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700" },
    ],
    [orders]
  );

  // Get the first garment with an image for order thumbnail
  const getOrderThumbnail = (order) => {
    const garmentWithImage = order.garments?.find(g => getGarmentImageUrl(g));
    if (garmentWithImage) {
      return getGarmentImageUrl(garmentWithImage);
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#fef9f9] to-[#fcf5f5]">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 pt-28 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[#574848] text-white px-6 py-2 rounded-full mb-4 shadow-lg">
            <PackageCheck size={18} />
            <span className="text-sm font-semibold">Order Tracking</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#574848] mb-3">
            Track Your Orders
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Real-time updates on your boutique orders from stitching to delivery
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-[380px_1fr] gap-6">
          {/* Left Sidebar - Orders List */}
          <div className="rounded-2xl bg-white shadow-xl overflow-hidden">
            {/* Customer Info */}
            {customer && (
              <div className="bg-linear-to-r from-[#574848] to-[#694e4e] p-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <UserRound size={24} />
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Welcome back,</p>
                    <p className="font-semibold text-lg">{customer.name}</p>
                    <p className="text-xs opacity-80">{customer.phone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Search and Filter */}
            <div className="p-5 border-b border-[#eee1e1]">
              <div className="relative mb-3">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by order number..."
                  className="w-full rounded-xl border border-[#e8dede] pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#574848] transition"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-xl border border-[#e8dede] text-[#574848] hover:bg-[#f8f3f4] transition"
              >
                <span className="flex items-center gap-2">
                  <Filter size={16} />
                  Filter by Year
                </span>
                {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              {showFilters && availableYears.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 animate-fadeIn">
                  <button
                    onClick={() => setSelectedYear("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      selectedYear === "all"
                        ? "bg-[#574848] text-white"
                        : "bg-[#f8f3f4] text-[#574848] hover:bg-[#efe5e5]"
                    }`}
                  >
                    All
                  </button>
                  {availableYears.map(year => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year.toString())}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        selectedYear === year.toString()
                          ? "bg-[#574848] text-white"
                          : "bg-[#f8f3f4] text-[#574848] hover:bg-[#efe5e5]"
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Orders List */}
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#574848] border-t-transparent"></div>
                  <p className="mt-3 text-sm text-gray-500">Loading orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <Shirt size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-gray-500">No orders found</p>
                </div>
              ) : (
                <>
                  {paginatedOrders.map((order) => {
                    const isSelected = order._id === selectedOrder?._id;
                    const garments = order.garments?.map((g) => g.garmentType).join(", ") || "Garment";
                    const orderThumbnail = getOrderThumbnail(order);
                    
                    return (
                      <button
                        key={order._id}
                        onClick={() => setSelectedOrderId(order._id)}
                        className={`w-full p-4 text-left border-b border-[#eee1e1] transition-all duration-200 hover:bg-[#fcf9f9] ${
                          isSelected ? "bg-[#fef9f9] border-l-4 border-l-[#574848]" : ""
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Order Thumbnail Image */}
                          <div className="w-14 h-14 rounded-xl bg-[#f8f3f4] overflow-hidden shrink-0 flex items-center justify-center">
                            {orderThumbnail ? (
                              <img
                                src={orderThumbnail}
                                alt={order.orderNumber}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center">
                                <Palette size={24} className="text-[#574848] opacity-50" />
                                <span className="text-[8px] text-gray-400 mt-1">No design</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-mono font-bold text-[#574848] text-sm truncate">{order.orderNumber}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ml-2 shrink-0 ${statusStyles[order.status]}`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-1 truncate">{garments}</p>
                            <div className="flex justify-between text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <CalendarDays size={11} />
                                {formatDate(order.createdAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <IndianRupee size={11} />
                                {formatMoney(order.pricingSummary?.total)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-[#eee1e1] flex justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg border border-[#e8dede] text-xs text-[#574848] disabled:opacity-50 hover:bg-[#f8f3f4] transition"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-xs text-gray-500">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-lg border border-[#e8dede] text-xs text-[#574848] disabled:opacity-50 hover:bg-[#f8f3f4] transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Right Side - Order Details */}
          <div className="rounded-2xl bg-white shadow-xl overflow-hidden">
            {!selectedOrder ? (
              <div className="p-12 text-center">
                <PackageCheck size={64} className="mx-auto mb-4 opacity-30" />
                <p className="text-gray-500">Select an order to view details</p>
              </div>
            ) : (
              <>
                {/* Order Header */}
                <div className="bg-linear-to-r from-[#eedde1] to-white p-6 border-b border-[#eee1e1]">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Order Number</p>
                      <h2 className="text-2xl font-bold text-[#574848]">{selectedOrder.orderNumber}</h2>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownloadInvoice(selectedOrder)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#574848] text-white font-semibold hover:bg-[#463a3a] transition"
                      >
                        <Download size={16} />
                        Invoice
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mt-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${statusStyles[selectedOrder.status]}`}>
                      {selectedOrder.status}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <CalendarDays size={14} />
                      Ordered on {formatDate(selectedOrder.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {/* Design Images Gallery */}
                  {selectedOrder.garments?.some(g => getGarmentImageUrl(g)) && (
                    <div className="bg-[#fef9f9] rounded-2xl p-6">
                      <h3 className="font-semibold text-[#574848] mb-4 flex items-center gap-2">
                        <Image size={18} />
                        Design Gallery
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {selectedOrder.garments.map((garment, idx) => {
                          const imageUrl = getGarmentImageUrl(garment);
                          if (!imageUrl) return null;
                          return (
                            <div
                              key={idx}
                              className="relative group cursor-pointer"
                              onClick={() => {
                                setSelectedImage(imageUrl);
                                setSelectedImageTitle(`${garment.garmentType} Design`);
                              }}
                            >
                              <img
                                src={imageUrl}
                                alt={`${garment.garmentType} design`}
                                className="w-full h-32 object-cover rounded-xl"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-xl flex items-center justify-center">
                                <ZoomIn size={24} className="text-white" />
                              </div>
                              <div className="absolute bottom-2 left-2 right-2">
                                <p className="text-xs text-white bg-black/60 px-2 py-0.5 rounded truncate">
                                  {garment.garmentType}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Progress Timeline */}
                  <div className="bg-[#fef9f9] rounded-2xl p-6">
                    <h3 className="font-semibold text-[#574848] mb-6 flex items-center gap-2">
                      <TrendingUp size={18} />
                      Order Progress
                    </h3>
                    <div className="relative">
                      <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-[#574848] rounded-full transition-all duration-500"
                          style={{ width: `${(activeStepIndex / (statusSteps.length - 1)) * 100}%` }}
                        ></div>
                      </div>
                      <div className="relative flex justify-between">
                        {statusSteps.map((step, index) => {
                          const isDone = index <= activeStepIndex;
                          return (
                            <div key={step.name} className="flex flex-col items-center">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300 ${
                                  isDone
                                    ? "bg-[#574848] text-white shadow-lg transform scale-110"
                                    : "bg-gray-200 text-gray-500"
                                }`}
                              >
                                {step.icon}
                              </div>
                              <p className={`text-xs text-center mt-2 font-medium ${isDone ? "text-[#574848]" : "text-gray-400"}`}>
                                {step.name}
                              </p>
                              <p className="text-xs text-gray-400 text-center hidden sm:block">{step.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="rounded-xl bg-[#fcf9f9] p-4">
                      <p className="text-xs text-gray-500">Delivery Date</p>
                      <p className="mt-1 font-bold text-[#574848] flex items-center gap-2">
                        <Truck size={14} />
                        {formatDate(selectedOrder.deliveryDate)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#fcf9f9] p-4">
                      <p className="text-xs text-gray-500">Total Amount</p>
                      <p className="mt-1 font-bold text-[#574848] flex items-center gap-2">
                        <IndianRupee size={14} />
                        {formatMoney(selectedOrder.pricingSummary?.total)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#fcf9f9] p-4">
                      <p className="text-xs text-gray-500">Balance Due</p>
                      <p className="mt-1 font-bold text-amber-600 flex items-center gap-2">
                        <IndianRupee size={14} />
                        {formatMoney(selectedOrder.pricingSummary?.balance)}
                      </p>
                    </div>
                  </div>

                  {/* Garment Details with Images */}
                  <div>
                    <h3 className="font-semibold text-[#574848] mb-4 flex items-center gap-2">
                      <Shirt size={18} />
                      Garment Details
                    </h3>
                    <div className="space-y-4">
                      {selectedOrder.garments?.map((garment) => {
                        const garmentImageUrl = getGarmentImageUrl(garment);
                        return (
                          <div key={garment._id} className="rounded-2xl border border-[#eee1e1] p-5 hover:shadow-md transition">
                            <div className="flex flex-col md:flex-row gap-4">
                              {/* Garment Image */}
                              <div className="w-full md:w-32 h-32 rounded-xl bg-[#f8f3f4] overflow-hidden shrink-0">
                                {garmentImageUrl ? (
                                  <img
                                    src={garmentImageUrl}
                                    alt={garment.garmentType}
                                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition"
                                    onClick={() => {
                                      setSelectedImage(garmentImageUrl);
                                      setSelectedImageTitle(`${garment.garmentType} - ${garment.designSelection || 'Design'}`);
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center">
                                    <Camera size={32} className="text-[#574848] opacity-40" />
                                    <span className="text-xs text-gray-400 mt-2">No image</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Garment Details */}
                              <div className="flex-1">
                                <div className="flex flex-wrap justify-between gap-3 mb-4">
                                  <div>
                                    <h4 className="font-bold text-[#574848] text-lg">{garment.garmentType}</h4>
                                    <p className="text-sm text-gray-500 mt-1">{garment.designSelection || "Custom stitching"}</p>
                                  </div>
                                  <span className={`px-4 py-1 rounded-full text-xs font-semibold flex items-center justify-center ${statusStyles[garment.status] || "bg-gray-100"}`}>
                                    {garment.status || "Pending"}
                                  </span>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-3">
                                  <div className="flex justify-between text-sm border-b border-[#eee1e1] pb-2">
                                    <span className="text-gray-500">Fabric:</span>
                                    <span className="font-medium text-[#574848]">{garment.fabric || "-"}</span>
                                  </div>
                                  <div className="flex justify-between text-sm border-b border-[#eee1e1] pb-2">
                                    <span className="text-gray-500">Stitching Charge:</span>
                                    <span className="font-medium text-[#574848]">{formatMoney(garment.stitchingCharge)}</span>
                                  </div>
                                  {garment.measurements && Object.keys(garment.measurements).length > 0 && (
                                    <div className="sm:col-span-2">
                                      <p className="text-xs text-gray-500 mb-2">Measurements:</p>
                                      <div className="grid grid-cols-2 gap-2 bg-[#fcf9f9] p-3 rounded-lg">
                                        {Object.entries(garment.measurements).slice(0, 4).map(([key, value]) => (
                                          <div key={key} className="flex justify-between text-xs">
                                            <span className="text-gray-500">{key}:</span>
                                            <span className="font-medium text-[#574848]">{value}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {garment.stitchingNotes && (
                                  <div className="mt-3 bg-amber-50 rounded-lg p-3">
                                    <p className="text-xs text-amber-700">📝 {garment.stitchingNotes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment History */}
                  {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-[#574848] mb-4 flex items-center gap-2">
                        <CreditCard size={18} />
                        Payment History
                      </h3>
                      <div className="space-y-2">
                        {selectedOrder.payments.map((payment, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-[#fcf9f9] rounded-xl">
                            <div>
                              <p className="text-sm font-medium text-[#574848]">{formatDate(payment.date)}</p>
                              <p className="text-xs text-gray-500">{payment.method}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-green-600">{formatMoney(payment.amount)}</p>
                              <p className="text-xs text-gray-500">{payment.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedOrder.notes && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-xs text-blue-700 font-medium mb-1">📝 Order Notes</p>
                      <p className="text-sm text-blue-800">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          title={selectedImageTitle}
          onClose={() => {
            setSelectedImage(null);
            setSelectedImageTitle("");
          }}
        />
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && selectedOrderForInvoice && (
        <InvoiceModal
          order={selectedOrderForInvoice}
          customer={customer}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedOrderForInvoice(null);
          }}
        />
      )}
    </div>
  );
};

export default TrackOrder;