import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  FileText,
  Receipt,
  Search,
  X,
} from "lucide-react";

import API_BASE_URL from "../config/api";

const formatDate = (date) => {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatMoney = (value) => `Rs ${Number(value || 0).toFixed(2)}`;

const getOrder = (bill) => bill?.orderId || {};
const getCustomer = (bill) => {
  const order = getOrder(bill);
  return bill?.customerId || order?.customerDetails || {};
};

const getPricing = (bill) => {
  const orderPricing = getOrder(bill)?.pricingSummary || {};
  const billPayment = bill?.paymentDetails || {};

  return {
    subtotal: orderPricing.subtotal ?? billPayment.subtotal,
    gstAmount:
      orderPricing.gstAmount ??
      billPayment.gstAmount ??
      Number(billPayment.subtotal || 0) * 0.05,
    total: bill?.totalAmount ?? orderPricing.total,
    advance: bill?.advance ?? orderPricing.advance,
    balance: bill?.balance ?? orderPricing.balance,
  };
};

const getInvoiceNumber = (bill) => {
  const orderNumber = getOrder(bill)?.orderNumber;

  if (orderNumber) {
    return `INV-${orderNumber}`;
  }

  return String(bill?.billNumber || "INV").replace(/^BILL/i, "INV");
};

const statusStyles = {
  Paid: "bg-emerald-100 text-emerald-700",
  Partial: "bg-amber-100 text-amber-700",
  Unpaid: "bg-rose-100 text-rose-700",
};

const paymentStatusOptions = ["Unpaid", "Partial", "Paid"];

const getAdvanceForStatus = (bill, paymentStatus) => {
  const pricing = getPricing(bill);
  const total = Number(pricing.total || 0);

  if (paymentStatus === "Paid") {
    return total;
  }

  if (paymentStatus === "Unpaid") {
    return 0;
  }

  return null;
};

const drawInvoicePdf = (bill) => {
  const order = getOrder(bill);
  const customer = getCustomer(bill);
  const pricing = getPricing(bill);
  const paidLabel = bill?.paymentStatus === "Partial" ? "Partial Paid:" : "Amount Paid:";
  const invoiceNumber = getInvoiceNumber(bill);
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;
  const primary = [87, 72, 72];
  const muted = [107, 114, 128];
  const soft = [248, 243, 244];
  const border = [239, 229, 229];
  let y = margin;

  const setPrimary = () => doc.setTextColor(...primary);
  const setMuted = () => doc.setTextColor(...muted);
  const line = (lineY) => {
    doc.setDrawColor(...border);
    doc.line(margin, lineY, pageWidth - margin, lineY);
  };
  const ensureSpace = (neededHeight) => {
    if (y + neededHeight <= pageHeight - margin) {
      return;
    }

    doc.addPage();
    y = margin;
  };
  const labelValue = (label, value, x, labelY, width = 220) => {
    setMuted();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(label, x, labelY);
    setPrimary();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(String(value || "-"), width), x, labelY + 15);
  };

  setPrimary();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("Ashok Boutique", pageWidth / 2, y + 8, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setMuted();
  doc.text(
    "Dhanshree Tower 1, B-38, Sector 2 Rd, Vidyadhar Nagar, Jaipur - 302039",
    pageWidth / 2,
    y + 28,
    { align: "center" }
  );
  doc.text(
    "Phone: +91 9252010850 | Email: ashokboutique@gmail.com",
    pageWidth / 2,
    y + 43,
    { align: "center" }
  );
  doc.text(
    "GST No: 08ABCDE1234F1Z | MSME Reg: UDYAM-RJ-02-0012345",
    pageWidth / 2,
    y + 58,
    { align: "center" }
  );
  y += 78;
  line(y);
  y += 24;

  doc.setFillColor(...soft);
  doc.roundedRect(margin, y, contentWidth, 36, 6, 6, "F");
  setPrimary();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("TAX INVOICE", margin + 14, y + 23);
  doc.setFontSize(10);
  doc.text(invoiceNumber, pageWidth - margin - 14, y + 23, { align: "right" });
  y += 56;

  const cardGap = 18;
  const cardWidth = (contentWidth - cardGap) / 2;
  doc.setFillColor(...soft);
  doc.roundedRect(margin, y, cardWidth, 112, 8, 8, "F");
  doc.roundedRect(margin + cardWidth + cardGap, y, cardWidth, 112, 8, 8, "F");

  labelValue("Invoice To", customer?.name || "Customer", margin + 14, y + 20, cardWidth - 28);
  setMuted();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(customer?.phone || "-", margin + 14, y + 55);
  doc.text(customer?.email || "-", margin + 14, y + 70);
  doc.text(
    doc.splitTextToSize(customer?.address || order?.customerDetails?.address || "-", cardWidth - 28),
    margin + 14,
    y + 85
  );

  const detailX = margin + cardWidth + cardGap + 14;
  labelValue("Order No", order?.orderNumber || "-", detailX, y + 20, 120);
  labelValue("Invoice Date", formatDate(bill?.createdAt), detailX + 126, y + 20, 100);
  labelValue("Order Date", formatDate(order?.createdAt), detailX, y + 68, 120);
  labelValue("Place of Supply", "Rajasthan", detailX + 126, y + 68, 100);
  y += 142;

  setPrimary();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Order Items", margin, y);
  y += 14;

  const columns = [
    { title: "Item", x: margin + 12, width: 44 },
    { title: "Garment Type", x: margin + 70, width: 230 },
    { title: "Qty", x: margin + 330, width: 36, align: "right" },
    { title: "Rate", x: margin + 412, width: 64, align: "right" },
    { title: "Amount", x: pageWidth - margin - 12, width: 86, align: "right" },
  ];

  doc.setFillColor(...soft);
  doc.rect(margin, y, contentWidth, 30, "F");
  setPrimary();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  columns.forEach((column) => {
    doc.text(column.title, column.x, y + 19, { align: column.align || "left" });
  });
  y += 30;

  const garments = order?.garments?.length ? order.garments : [];
  garments.forEach((garment, index) => {
    ensureSpace(34);
    doc.setDrawColor(...border);
    doc.line(margin, y + 31, pageWidth - margin, y + 31);
    setPrimary();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(String(index + 1), columns[0].x, y + 20);
    doc.text(
      doc.splitTextToSize(garment.garmentType || "Garment", columns[1].width),
      columns[1].x,
      y + 20
    );
    doc.text("1", columns[2].x, y + 20, { align: "right" });
    doc.text(formatMoney(garment.stitchingCharge), columns[3].x, y + 20, {
      align: "right",
    });
    doc.setFont("helvetica", "bold");
    doc.text(formatMoney(garment.stitchingCharge), columns[4].x, y + 20, {
      align: "right",
    });
    y += 32;
  });

  if (!garments.length) {
    setMuted();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("No order items found", pageWidth / 2, y + 22, { align: "center" });
    y += 38;
  }

  y += 18;
  ensureSpace(140);
  const summaryWidth = 230;
  const summaryX = pageWidth - margin - summaryWidth;
  const summaryRow = (label, value, rowY, bold = false, color = primary) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 11 : 9);
    doc.setTextColor(...muted);
    doc.text(label, summaryX, rowY);
    doc.setTextColor(...color);
    doc.text(value, summaryX + summaryWidth, rowY, { align: "right" });
  };

  summaryRow("Subtotal:", formatMoney(pricing.subtotal), y);
  summaryRow("GST (5%):", formatMoney(pricing.gstAmount), y + 20);
  line(y + 30);
  summaryRow("Total Amount:", formatMoney(pricing.total), y + 48, true);
  summaryRow(paidLabel, formatMoney(pricing.advance), y + 70, false, [22, 163, 74]);
  line(y + 80);
  summaryRow("Balance Due:", formatMoney(pricing.balance), y + 98, true, [217, 119, 6]);
  y += 124;

  ensureSpace(120);
  line(y);
  y += 22;
  setMuted();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Payment Terms", margin, y);
  doc.text("Declaration", margin + contentWidth / 2, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("- Balance payment on delivery", margin, y + 18);
  doc.text(
    doc.splitTextToSize(
      "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.",
      contentWidth / 2 - 12
    ),
    margin + contentWidth / 2,
    y + 18
  );

  setMuted();
  doc.setFontSize(8);
  doc.text(
    "This is a computer generated invoice. No signature required.",
    pageWidth / 2,
    pageHeight - 56,
    { align: "center" }
  );
  doc.text("Thank you for shopping with Ashok Boutique!", pageWidth / 2, pageHeight - 42, {
    align: "center",
  });

  doc.save(`${invoiceNumber}.pdf`);
};

const InvoiceDocument = ({ bill }) => {
  const order = getOrder(bill);
  const customer = getCustomer(bill);
  const pricing = getPricing(bill);
  const paidLabel = bill?.paymentStatus === "Partial" ? "Partial Paid:" : "Amount Paid:";

  return (
    <div className="mx-auto w-full max-w-4xl rounded-2xl border border-[#efe5e5] bg-white p-5 text-[#574848] shadow-sm md:p-8">
      <div className="border-b border-[#efe5e5] pb-6 text-center">
        <h1 className="text-3xl font-bold text-[#574848]">Ashok Boutique</h1>
        <p className="mt-1 text-sm text-gray-500">
          Dhanshree Tower 1, B-38, Sector 2 Rd, Vidyadhar Nagar, Jaipur - 302039
        </p>
        <p className="text-sm text-gray-500">
          Phone: +91 9252010850 | Email: ashokboutique@gmail.com
        </p>
        <p className="text-sm text-gray-500">
          GST No: 08ABCDE1234F1Z | MSME Reg: UDYAM-RJ-02-0012345
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-xl bg-[#f8f3f4] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-gray-500">Tax Invoice</p>
          <p className="mt-1 text-lg font-bold text-[#574848]">
            {getInvoiceNumber(bill)}
          </p>
        </div>
        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
            statusStyles[bill?.paymentStatus] || "bg-gray-100 text-gray-700"
          }`}
        >
          {bill?.paymentStatus || "Invoice"}
        </span>
      </div>

      {bill?.paymentStatus === "Partial" && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          Partial payment received: {formatMoney(pricing.advance)}. Balance due:{" "}
          {formatMoney(pricing.balance)}.
        </div>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-gray-500">Invoice To</p>
          <div className="mt-2 rounded-lg bg-[#f8f3f4] p-3">
            <p className="font-semibold text-[#574848]">
              {customer?.name || "Customer"}
            </p>
            <p className="text-sm text-gray-600">{customer?.phone || "-"}</p>
            <p className="text-sm text-gray-600">{customer?.email || "-"}</p>
            {(customer?.address || order?.customerDetails?.address) && (
              <p className="mt-1 text-sm text-gray-600">
                {customer?.address || order?.customerDetails?.address}
              </p>
            )}
          </div>
        </div>
        <div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-gray-500">Invoice No</p>
              <p className="text-sm font-semibold text-[#574848]">
                {getInvoiceNumber(bill)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Order No</p>
              <p className="text-sm font-semibold text-[#574848]">
                {order?.orderNumber || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Invoice Date</p>
              <p className="text-sm text-[#574848]">{formatDate(bill?.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Order Date</p>
              <p className="text-sm text-[#574848]">{formatDate(order?.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">GSTIN</p>
              <p className="text-sm text-[#574848]">08ABCDE1234F1Z</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Place of Supply</p>
              <p className="text-sm text-[#574848]">Rajasthan</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto">
        <h4 className="mb-3 font-semibold text-[#574848]">Order Items</h4>
        <table className="w-full min-w-[620px] border-collapse">
          <thead>
            <tr className="border-b border-[#efe5e5] bg-[#f8f3f4]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#574848]">
                Item
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#574848]">
                Garment Type
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[#574848]">
                Qty
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[#574848]">
                Rate
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[#574848]">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {order?.garments?.length ? (
              order.garments.map((garment, idx) => (
                <tr key={garment._id || idx} className="border-b border-[#efe5e5]">
                  <td className="px-4 py-3 text-sm text-[#574848]">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm text-[#574848]">
                    {garment.garmentType || "Garment"}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">1</td>
                  <td className="px-4 py-3 text-right text-sm">
                    {formatMoney(garment.stitchingCharge)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold">
                    {formatMoney(garment.stitchingCharge)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan="5">
                  No order items found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <div className="w-80">
          <div className="flex justify-between py-2">
            <span className="text-sm text-gray-600">Subtotal:</span>
            <span className="text-sm font-medium">{formatMoney(pricing.subtotal)}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-gray-600">GST (5%):</span>
            <span className="text-sm font-medium">{formatMoney(pricing.gstAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-[#efe5e5] py-2">
            <span className="text-sm font-bold text-[#574848]">Total Amount:</span>
            <span className="text-lg font-bold text-[#574848]">
              {formatMoney(pricing.total)}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-gray-600">{paidLabel}</span>
            <span className="text-sm font-medium text-green-600">
              {formatMoney(pricing.advance)}
            </span>
          </div>
          <div className="flex justify-between border-t border-[#efe5e5] py-2">
            <span className="text-sm font-bold text-[#574848]">Balance Due:</span>
            <span className="text-md font-bold text-amber-600">
              {formatMoney(pricing.balance)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-[#efe5e5] pt-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-gray-500">Payment Terms</p>
            <p className="text-sm text-gray-600">- Balance payment on delivery</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Declaration</p>
            <p className="mt-1 text-sm text-gray-600">
              We declare that this invoice shows the actual price of the goods
              described and that all particulars are true and correct.
            </p>
          </div>
        </div>
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            This is a computer generated invoice. No signature required.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Thank you for shopping with Ashok Boutique!
          </p>
        </div>
      </div>
    </div>
  );
};

const Billing = () => {
  const [bills, setBills] = useState([]);
  const [selectedBillId, setSelectedBillId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [savingStatusId, setSavingStatusId] = useState("");
  const [partialPaymentBill, setPartialPaymentBill] = useState(null);
  const [partialPaymentAmount, setPartialPaymentAmount] = useState("");
  const [partialPaymentError, setPartialPaymentError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const response = await axios.get(`${API_BASE_URL}/bills`);
        const loadedBills = response.data.bills || [];
        setBills(loadedBills);
      } catch (error) {
        setLoadError(
          error.response?.data?.message ||
            "Unable to load invoices. Please check the backend server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  const selectedBill = useMemo(
    () => bills.find((bill) => bill._id === selectedBillId) || null,
    [bills, selectedBillId]
  );
  const partialPaymentPricing = useMemo(
    () => (partialPaymentBill ? getPricing(partialPaymentBill) : null),
    [partialPaymentBill]
  );
  const partialPaymentTotal = Number(partialPaymentPricing?.total || 0);
  const partialPaymentValue = Number(partialPaymentAmount || 0);
  const partialPaymentBalance = Math.max(partialPaymentTotal - partialPaymentValue, 0);

  useEffect(() => {
    if (!selectedBillId) {
      return;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedBillId("");
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectedBillId]);

  const filteredBills = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return bills;
    }

    return bills.filter((bill) => {
      const order = getOrder(bill);
      const customer = getCustomer(bill);

      return [
        getInvoiceNumber(bill),
        bill.billNumber,
        order.orderNumber,
        customer.name,
        customer.phone,
        bill.paymentStatus,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [bills, query]);

  const metrics = useMemo(() => {
    const totalAmount = bills.reduce(
      (sum, bill) => sum + Number(getPricing(bill).total || 0),
      0
    );
    const balanceDue = bills.reduce(
      (sum, bill) => sum + Number(getPricing(bill).balance || 0),
      0
    );
    const paidInvoices = bills.filter((bill) => bill.paymentStatus === "Paid").length;

    return [
      {
        title: "Total Invoices",
        value: bills.length,
        icon: Receipt,
        color: "bg-[#f8f3f4] text-[#574848]",
      },
      {
        title: "Invoice Value",
        value: formatMoney(totalAmount),
        icon: FileText,
        color: "bg-sky-100 text-sky-700",
      },
      {
        title: "Balance Due",
        value: formatMoney(balanceDue),
        icon: CreditCard,
        color: "bg-amber-100 text-amber-700",
      },
      {
        title: "Paid",
        value: paidInvoices,
        icon: CheckCircle2,
        color: "bg-emerald-100 text-emerald-700",
      },
    ];
  }, [bills]);

  const downloadSelectedInvoice = async () => {
    if (!selectedBill) {
      return;
    }

    try {
      setDownloading(true);
      drawInvoicePdf(selectedBill);
    } catch {
      setLoadError("Unable to download invoice PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const savePaymentStatus = async (bill, paymentStatus, advance) => {
    try {
      setSavingStatusId(bill._id);
      setLoadError("");
      setSuccessMessage("");

      const response = await axios.patch(`${API_BASE_URL}/bills/${bill._id}/status`, {
        paymentStatus,
        advance,
      });
      const updatedBill = response.data.bill;

      setBills((currentBills) =>
        currentBills.map((bill) => (bill._id === updatedBill._id ? updatedBill : bill))
      );
      setSuccessMessage(response.data.message || "Bill status updated successfully.");
      return true;
    } catch (error) {
      setLoadError(
        error.response?.data?.message ||
          "Unable to update bill status. Please try again."
      );
      return false;
    } finally {
      setSavingStatusId("");
    }
  };

  const handlePaymentStatusChange = (bill, paymentStatus) => {
    if (paymentStatus === "Partial") {
      const pricing = getPricing(bill);
      const currentAdvance = Number(pricing.advance || 0);
      const total = Number(pricing.total || 0);

      setPartialPaymentBill(bill);
      setPartialPaymentAmount(
        currentAdvance > 0 && currentAdvance < total ? String(currentAdvance) : ""
      );
      setPartialPaymentError("");
      return;
    }

    const advance = getAdvanceForStatus(bill, paymentStatus);
    savePaymentStatus(bill, paymentStatus, advance);
  };

  const closePartialPaymentModal = () => {
    setPartialPaymentBill(null);
    setPartialPaymentAmount("");
    setPartialPaymentError("");
  };

  const submitPartialPayment = async () => {
    if (!partialPaymentBill) {
      return;
    }

    const pricing = getPricing(partialPaymentBill);
    const total = Number(pricing.total || 0);
    const amount = Number(partialPaymentAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setPartialPaymentError("Enter an amount greater than 0.");
      return;
    }

    if (amount >= total) {
      setPartialPaymentError("For partial payment, amount must be less than total.");
      return;
    }

    const saved = await savePaymentStatus(partialPaymentBill, "Partial", amount);

    if (saved) {
      closePartialPaymentModal();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const MetricIcon = metric.icon;

          return (
            <div key={metric.title} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">{metric.title}</p>
                  <h3 className="mt-2 text-2xl font-bold text-[#574848]">
                    {metric.value}
                  </h3>
                </div>
                <div className={`rounded-2xl p-3 ${metric.color}`}>
                  <MetricIcon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loadError && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
          <AlertCircle size={18} />
          {loadError}
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
          <CheckCircle2 size={18} />
          {successMessage}
        </div>
      )}

      <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-bold text-[#574848]">Invoices</h3>
              <p className="text-sm text-gray-500">
                Click an invoice to open its detail preview and download the PDF.
              </p>
            </div>

            <div className="flex min-h-11 items-center rounded-xl bg-[#f8f3f4] px-3">
              <Search size={18} className="text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search invoices"
                className="ml-2 w-full bg-transparent text-sm outline-none sm:w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#efe5e5] text-xs uppercase text-gray-500">
                  <th className="py-3 pr-4 font-semibold">Invoice</th>
                  <th className="py-3 pr-4 font-semibold">Customer</th>
                  <th className="py-3 pr-4 font-semibold">Date</th>
                  <th className="py-3 pr-4 font-semibold">Total</th>
                  <th className="py-3 pr-4 font-semibold">Paid</th>
                  <th className="py-3 pr-4 font-semibold">Balance</th>
                  <th className="py-3 pr-4 font-semibold">Status</th>
                  <th className="py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="py-6 text-center text-gray-500" colSpan="8">
                      Loading invoices...
                    </td>
                  </tr>
                ) : filteredBills.length === 0 ? (
                  <tr>
                    <td className="py-6 text-center text-gray-500" colSpan="8">
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((bill) => {
                    const customer = getCustomer(bill);
                    const pricing = getPricing(bill);

                    return (
                      <tr
                        key={bill._id}
                        onClick={() => setSelectedBillId(bill._id)}
                        className="cursor-pointer border-b border-[#f4eded] transition last:border-0 hover:bg-[#fcf9f9]"
                      >
                        <td className="py-4 pr-4">
                          <p className="font-semibold text-[#574848]">
                            {getInvoiceNumber(bill)}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {getOrder(bill)?.orderNumber || "-"}
                          </p>
                        </td>
                        <td className="py-4 pr-4">
                          <p className="font-medium text-gray-900">
                            {customer?.name || "Customer"}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {customer?.phone || "-"}
                          </p>
                        </td>
                        <td className="py-4 pr-4 text-gray-700">
                          {formatDate(bill.createdAt)}
                        </td>
                        <td className="py-4 pr-4 font-semibold text-gray-900">
                          {formatMoney(pricing.total)}
                        </td>
                        <td className="py-4 pr-4 font-semibold text-emerald-700">
                          {formatMoney(pricing.advance)}
                        </td>
                        <td className="py-4 pr-4 font-semibold text-amber-600">
                          {formatMoney(pricing.balance)}
                        </td>
                        <td className="py-4 pr-4">
                          <select
                            value={bill.paymentStatus || "Unpaid"}
                            disabled={savingStatusId === bill._id}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) =>
                              handlePaymentStatusChange(bill, event.target.value)
                            }
                            className={`rounded-full border-0 px-3 py-1 text-xs font-semibold outline-none transition disabled:cursor-not-allowed disabled:opacity-70 ${
                              statusStyles[bill.paymentStatus] ||
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {paymentStatusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-4">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedBillId(bill._id);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-[#e8dede] px-3 py-2 text-xs font-semibold text-[#574848] transition hover:bg-[#f8f3f4]"
                          >
                            <Eye size={14} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setSelectedBillId("")}
            aria-label="Close invoice details"
          />

          <section className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#fcf9f9] shadow-2xl">
            <div className="flex flex-col gap-4 border-b border-[#efe5e5] bg-white p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#f8f3f4] p-3 text-[#574848]">
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#574848]">
                    Invoice Details
                  </h3>
                  <p className="text-sm text-gray-500">
                    {getInvoiceNumber(selectedBill)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={selectedBill.paymentStatus || "Unpaid"}
                  disabled={savingStatusId === selectedBill._id}
                  onChange={(event) =>
                    handlePaymentStatusChange(selectedBill, event.target.value)
                  }
                  className={`min-h-11 rounded-xl border border-[#e8dede] px-4 py-3 text-sm font-semibold outline-none transition disabled:cursor-not-allowed disabled:opacity-70 ${
                    statusStyles[selectedBill.paymentStatus] ||
                    "bg-gray-100 text-gray-700"
                  }`}
                >
                  {paymentStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={downloadSelectedInvoice}
                  disabled={downloading}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#574848] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#463838] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Download size={16} />
                  {downloading ? "Downloading..." : "Download PDF"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBillId("")}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#e8dede] bg-white px-4 py-3 text-sm font-semibold text-[#574848] transition hover:bg-[#f8f3f4]"
                >
                  <X size={16} />
                  Close
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-4 md:p-6">
              <InvoiceDocument bill={selectedBill} />
            </div>
          </section>
        </div>
      )}

      {partialPaymentBill && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0"
            onClick={closePartialPaymentModal}
            aria-label="Close partial payment"
          />

          <section className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-[#efe5e5] bg-[#fcf9f9] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Partial Payment
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-[#574848]">
                    {getInvoiceNumber(partialPaymentBill)}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {getCustomer(partialPaymentBill)?.name || "Customer"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closePartialPaymentModal}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e8dede] bg-white text-[#574848] transition hover:bg-[#f8f3f4]"
                  aria-label="Close partial payment"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#f8f3f4] px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">Total</p>
                  <p className="mt-1 text-lg font-bold text-[#574848]">
                    {formatMoney(partialPaymentTotal)}
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-amber-700">
                    Balance
                  </p>
                  <p className="mt-1 text-lg font-bold text-amber-700">
                    {formatMoney(partialPaymentBalance)}
                  </p>
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#574848]">
                  Amount Paid
                </span>
                <div className="flex min-h-12 items-center rounded-xl border border-[#e8dede] bg-white px-4 transition focus-within:border-[#574848]">
                  <span className="text-sm font-semibold text-gray-500">Rs</span>
                  <input
                    type="number"
                    min="1"
                    max={Math.max(partialPaymentTotal - 1, 1)}
                    step="0.01"
                    value={partialPaymentAmount}
                    onChange={(event) => {
                      setPartialPaymentAmount(event.target.value);
                      setPartialPaymentError("");
                    }}
                    placeholder="Enter paid amount"
                    className="ml-2 w-full bg-transparent text-sm font-semibold text-[#574848] outline-none"
                    autoFocus
                  />
                </div>
              </label>

              {partialPaymentError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {partialPaymentError}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={submitPartialPayment}
                  disabled={savingStatusId === partialPaymentBill._id}
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-[#574848] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#463838] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingStatusId === partialPaymentBill._id ? "Saving..." : "Save Partial Payment"}
                </button>
                <button
                  type="button"
                  onClick={closePartialPaymentModal}
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-[#e8dede] px-4 py-3 text-sm font-semibold text-[#574848] transition hover:bg-[#f8f3f4]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Billing;
