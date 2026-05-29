import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Filter,
  Phone,
  Plus,
  Search,
  ShoppingBag,
} from "lucide-react";

import API_BASE_URL from "../config/api";

const statusStyles = {
  Pending: "bg-amber-100 text-amber-700",
  "Measurement Taken": "bg-indigo-100 text-indigo-700",
  Stitching: "bg-sky-100 text-sky-700",
  "Ready for Trial": "bg-violet-100 text-violet-700",
  Delivered: "bg-emerald-100 text-emerald-700",
};

const statusTabs = [
  "All",
  "Pending",
  "Measurement Taken",
  "Stitching",
  "Ready for Trial",
  "Delivered",
];

const formatDate = (date) => {
  if (!date) {
    return "-";
  }

  return new Date(date).toISOString().slice(0, 10);
};

const getPriority = (date) => {
  if (!date) {
    return "Normal";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(date);
  dueDate.setHours(0, 0, 0, 0);

  const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

  if (daysUntilDue < 0) {
    return "High";
  }

  if (daysUntilDue <= 2) {
    return "High";
  }

  return "Normal";
};

const Order = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const response = await axios.get(`${API_BASE_URL}/orders`);
        const mappedOrders = response.data.orders.map((order) => ({
          mongoId: order._id,
          id: order.orderNumber || order._id,
          customer: order.customerDetails?.name || order.customerId?.name || "",
          phone: order.customerDetails?.phone || order.customerId?.phone || "",
          item:
            order.garments?.map((garment) => garment.garmentType).join(" + ") || "",
          dueDate: formatDate(order.deliveryDate),
          status: order.status || "Pending",
          priority: getPriority(order.deliveryDate),
          amount: order.pricingSummary?.total || 0,
          advance: order.pricingSummary?.advance || 0,
        }));

        setOrders(mappedOrders);
      } catch (error) {
        setLoadError(
          error.response?.data?.message ||
            "Unable to load orders. Please check the backend server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const orderMetrics = useMemo(
    () => [
      {
        title: "Total Orders",
        value: orders.length,
        icon: ShoppingBag,
        color: "bg-[#f8f3f4] text-[#574848]",
      },
      {
        title: "Pending",
        value: orders.filter(
          (order) => !["Ready for Trial", "Delivered"].includes(order.status)
        ).length,
        icon: Clock3,
        color: "bg-amber-100 text-amber-700",
      },
      {
        title: "Ready for Trial",
        value: orders.filter((order) => order.status === "Ready for Trial").length,
        icon: CalendarDays,
        color: "bg-violet-100 text-violet-700",
      },
      {
        title: "Delivered",
        value: orders.filter((order) => order.status === "Delivered").length,
        icon: CheckCircle2,
        color: "bg-emerald-100 text-emerald-700",
      },
    ],
    [orders]
  );


  

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus = activeStatus === "All" || order.status === activeStatus;
      const matchesQuery =
        !normalizedQuery ||
        [order.id, order.customer, order.phone, order.item]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [activeStatus, orders, query]);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {orderMetrics.map((metric) => {
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

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="text-xl font-bold text-[#574848]">Orders</h3>
              <p className="text-sm text-gray-500">
                View customer orders, payment balance, due date, and current progress.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex min-h-11 items-center rounded-xl bg-[#f8f3f4] px-3">
                <Search size={18} className="text-gray-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search orders"
                  className="ml-2 w-full bg-transparent text-sm outline-none sm:w-44"
                />
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-[#efe5e5] px-3 text-sm text-[#574848]">
                <Filter size={16} />
                {filteredOrders.length} shown
              </div>
            </div>
          </div>

          {loadError && (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {loadError}
            </div>
          )}

          <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
            {statusTabs.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setActiveStatus(status)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeStatus === status
                    ? "bg-[#574848] text-white"
                    : "bg-[#f8f3f4] text-[#574848] hover:bg-[#efe5e5]"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#efe5e5] text-xs uppercase text-gray-500">
                  <th className="py-3 pr-4 font-semibold">Order</th>
                  <th className="py-3 pr-4 font-semibold">Customer</th>
                  <th className="py-3 pr-4 font-semibold">Item</th>
                  <th className="py-3 pr-4 font-semibold">Due Date</th>
                  <th className="py-3 pr-4 font-semibold">Payment</th>
                  <th className="py-3 pr-4 font-semibold">Status</th>
                  <th className="py-3 font-semibold">Priority</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="py-6 text-center text-gray-500" colSpan="7">
                      Loading orders...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td className="py-6 text-center text-gray-500" colSpan="7">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                  const balance =
                    Number(order.amount || 0) - Number(order.advance || 0);

                  return (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.mongoId}`)}
                      className="cursor-pointer border-b border-[#f4eded] transition hover:bg-[#fcf9f9] last:border-0"
                    >
                      <td className="py-4 pr-4 font-semibold text-[#574848]">
                        {order.id}
                      </td>
                      <td className="py-4 pr-4">
                        <p className="font-medium text-gray-900">{order.customer}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                          <Phone size={12} />
                          {order.phone}
                        </p>
                      </td>
                      <td className="py-4 pr-4 text-gray-700">{order.item}</td>
                      <td className="py-4 pr-4 text-gray-700">{order.dueDate}</td>
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-gray-900">Rs {order.amount}</p>
                        <p className="text-xs text-gray-500">Balance Rs {balance}</p>
                      </td>
                      <td className="py-4 pr-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            statusStyles[order.status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="rounded-full bg-[#f8f3f4] px-3 py-1 text-xs font-semibold text-[#574848]">
                          {order.priority}
                        </span>
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
          <div className="rounded-2xl bg-[#f8f3f4] p-4 text-[#574848]">
            <ShoppingBag size={24} />
          </div>

          <h3 className="mt-5 text-xl font-bold text-[#574848]">Create Order</h3>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Start a new order with customer details, multiple garments, garment-wise
            measurements, design selection, delivery date, stitching notes, and billing.
          </p>

          <Link
            to="/orders/create"
            className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#574848] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#463838]"
          >
            <Plus size={18} />
            Create Order
          </Link>
        </section>
      </div>
    </div>
  );
};

export default Order;
