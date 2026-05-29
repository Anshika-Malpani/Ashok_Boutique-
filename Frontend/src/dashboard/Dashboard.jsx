import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Scissors,
  CalendarDays,
  CreditCard,
  Image,
  Menu,
  Bell,
  Search,
  ArrowRight,
  AlertTriangle,
  Clock3,
  Receipt,
  UserPlus,
  FilePlus2,
  Sparkles,
  LogOut,
} from "lucide-react";

import API_BASE_URL from "../config/api";

const formatMoney = (value) => `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

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

const isSameDay = (date, compareDate) => {
  if (!date) {
    return false;
  }

  const current = new Date(date);
  return (
    current.getFullYear() === compareDate.getFullYear() &&
    current.getMonth() === compareDate.getMonth() &&
    current.getDate() === compareDate.getDate()
  );
};

const startOfWeek = (date) => {
  const current = new Date(date);
  current.setHours(0, 0, 0, 0);
  current.setDate(current.getDate() - current.getDay());
  return current;
};

const getRelativeTime = (date) => {
  if (!date) {
    return "-";
  }

  const diffMs = Date.now() - new Date(date).getTime();
  const diffMinutes = Math.max(Math.floor(diffMs / 60000), 0);

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
};

const Dashboard = ({ children, title = "Dashboard" }) => {
  const navigate = useNavigate();
  const hasCustomContent = Boolean(children);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    orders: [],
    bills: [],
    appointments: [],
    customers: [],
  });
  const [dashboardLoading, setDashboardLoading] = useState(!hasCustomContent);
  const [dashboardError, setDashboardError] = useState("");

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, to: "/admin-dashboard" },
    { name: "Orders", icon: ShoppingBag, to: "/orders" },
    { name: "Customers", icon: Users, to: "/customers" },
    { name: "Measurements", icon: Scissors, to: "/measurements" },
    { name: "Appointments", icon: CalendarDays, to: "/show-appointments" },
    { name: "Billing", icon: CreditCard, to: "/billing" },
    { name: "Designs", icon: Image, to: "/admin-designs" },
  ];

  const quickActions = [
    { title: "New Order", icon: FilePlus2, tone: "bg-white text-[#574848]", to: "/orders/create" },
    { title: "Add Customer", icon: UserPlus, tone: "bg-white text-[#574848]", to: "/customers" },
    { title: "Appointments", icon: CalendarDays, tone: "bg-white text-[#574848]", to: "/show-appointments" },
    { title: "Create Bill", icon: Receipt, tone: "bg-white text-[#574848]", to: "/billing" },
  ];

  useEffect(() => {
    const syncUser = () => {
      try {
        const savedUser = localStorage.getItem("user");
        setCurrentUser(savedUser ? JSON.parse(savedUser) : null);
      } catch {
        setCurrentUser(null);
      }
    };

    syncUser();
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  useEffect(() => {
    if (hasCustomContent) {
      return;
    }

    let isActive = true;

    const fetchDashboardData = async () => {
      try {
        setDashboardError("");

        const [ordersResponse, billsResponse, appointmentsResponse, customersResponse] =
          await Promise.all([
            axios.get(`${API_BASE_URL}/orders`),
            axios.get(`${API_BASE_URL}/bills`),
            axios.get(`${API_BASE_URL}/appointments`),
            axios.get(`${API_BASE_URL}/customers`),
          ]);

        if (!isActive) {
          return;
        }

        setDashboardData({
          orders: ordersResponse.data.orders || [],
          bills: billsResponse.data.bills || [],
          appointments: appointmentsResponse.data.appointments || [],
          customers: customersResponse.data.customers || [],
        });
      } catch (error) {
        if (isActive) {
          setDashboardError(
            error.response?.data?.message ||
              "Unable to load live dashboard data. Please check the backend server."
          );
        }
      } finally {
        if (isActive) {
          setDashboardLoading(false);
        }
      }
    };

    fetchDashboardData();
    const refreshTimer = window.setInterval(fetchDashboardData, 30000);

    return () => {
      isActive = false;
      window.clearInterval(refreshTimer);
    };
  }, [hasCustomContent]);

  const adminName = currentUser?.fullName || currentUser?.name || "Admin User";
  const adminRole = currentUser?.role || "admin";
  const { orders, bills, appointments } = dashboardData;

  const liveDashboard = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = startOfWeek(today);
    const activeOrders = orders.filter((order) => order.status !== "Delivered");
    const pendingOrders = orders.filter((order) =>
      ["Pending", "Measurement Taken", "Stitching"].includes(order.status)
    );
    const todayAppointments = appointments.filter((appointment) =>
      isSameDay(appointment.date, today)
    );
    const paidRevenue = bills.reduce((total, bill) => total + Number(bill.advance || 0), 0);
    const todayCollections = bills
      .filter((bill) => isSameDay(bill.createdAt, today))
      .reduce((total, bill) => total + Number(bill.advance || 0), 0);
    const weekCollections = bills
      .filter((bill) => new Date(bill.createdAt) >= weekStart)
      .reduce((total, bill) => total + Number(bill.advance || 0), 0);
    const pendingPayments = bills.reduce(
      (total, bill) => total + Number(bill.balance || 0),
      0
    );

    const stats = [
      { title: "Total Orders", value: orders.length },
      { title: "Pending Orders", value: pendingOrders.length },
      { title: "Today Appointments", value: todayAppointments.length },
      { title: "Revenue Collected", value: formatMoney(paidRevenue) },
    ];

    const statusConfigs = [
      { label: "Pending", color: "bg-amber-100 text-amber-700" },
      { label: "Measurement Taken", color: "bg-indigo-100 text-indigo-700" },
      { label: "Stitching", color: "bg-sky-100 text-sky-700" },
      { label: "Ready for Trial", color: "bg-violet-100 text-violet-700" },
      { label: "Delivered", color: "bg-emerald-100 text-emerald-700" },
    ];

    const orderStatuses = statusConfigs.map((status) => ({
      ...status,
      count: orders.filter((order) => order.status === status.label).length,
    }));

    const overdueOrders = orders.filter((order) => {
      if (!order.deliveryDate || order.status === "Delivered") {
        return false;
      }

      const deliveryDate = new Date(order.deliveryDate);
      deliveryDate.setHours(0, 0, 0, 0);
      return deliveryDate < today;
    });
    const dueTodayOrders = activeOrders.filter((order) =>
      isSameDay(order.deliveryDate, today)
    );
    const unpaidBills = bills.filter((bill) => Number(bill.balance || 0) > 0);

    const urgentAlerts = [
      {
        title: "Overdue Deliveries",
        note: `${overdueOrders.length} order${overdueOrders.length === 1 ? "" : "s"} past delivery date`,
        icon: AlertTriangle,
      },
      {
        title: "Due Today",
        note: `${dueTodayOrders.length} order${dueTodayOrders.length === 1 ? "" : "s"} need delivery today`,
        icon: Scissors,
      },
      {
        title: "Pending Payments",
        note: `${unpaidBills.length} invoice${unpaidBills.length === 1 ? "" : "s"} awaiting payment`,
        icon: CreditCard,
      },
    ];

    const billingSummary = [
      { title: "Today", value: formatMoney(todayCollections) },
      { title: "This Week", value: formatMoney(weekCollections) },
      { title: "Pending Payments", value: formatMoney(pendingPayments) },
    ];

    const recentOrders = orders.slice(0, 3).map((order) => ({
      id: order._id,
      customer: order.customerDetails?.name || order.customerId?.name || "Customer",
      item: order.garments?.map((garment) => garment.garmentType).join(" + ") || "Order",
      status: order.status || "Pending",
    }));

    const upcomingAppointments = appointments
      .filter((appointment) => {
        const date = new Date(appointment.date);
        date.setHours(0, 0, 0, 0);
        return date >= today && appointment.status !== "cancelled";
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3)
      .map((appointment) => ({
        id: appointment._id,
        customer:
          appointment.userID?.fullName ||
          appointment.userID?.name ||
          appointment.userID?.phone ||
          "Customer",
        service: appointment.service,
        time: `${formatDate(appointment.date)} | ${appointment.timeSlot}`,
      }));

    const recentActivity = [
      ...orders.slice(0, 4).map((order) => ({
        title: `${order.orderNumber || "Order"} created for ${
          order.customerDetails?.name || order.customerId?.name || "Customer"
        }`,
        time: getRelativeTime(order.createdAt),
        date: order.createdAt,
      })),
      ...bills.slice(0, 4).map((bill) => ({
        title: `${bill.billNumber || "Invoice"} ${bill.paymentStatus || "created"}`,
        time: getRelativeTime(bill.updatedAt || bill.createdAt),
        date: bill.updatedAt || bill.createdAt,
      })),
      ...appointments.slice(0, 4).map((appointment) => ({
        title: `${appointment.service} appointment booked`,
        time: getRelativeTime(appointment.createdAt),
        date: appointment.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    return {
      stats,
      orderStatuses,
      urgentAlerts,
      billingSummary,
      recentOrders,
      upcomingAppointments,
      recentActivity,
    };
  }, [appointments, bills, orders]);

  const initials = useMemo(() => {
    if (!adminName.trim()) {
      return "A";
    }

    return adminName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [adminName]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <>
      <div className="h-screen w-full overflow-hidden bg-[#ECE4EB]">
        <div className="flex h-full w-full overflow-hidden">
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <aside
            className={`fixed left-0 top-0 z-50 flex h-screen w-72 shrink-0 flex-col bg-[#574848] text-white transition-transform duration-300 lg:static lg:translate-x-0 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="border-b border-white/10 p-6">
              

              <div className="mt-5">
                <h1 className="text-2xl font-bold">Boutique Admin</h1>
                <p className="mt-1 text-sm text-gray-300">Manage your boutique</p>
              </div>
            </div>

            <nav className="flex-1 space-y-2 overflow-hidden p-4 ">
              {menuItems.map((item) => {
                const Icon = item.icon; 

                return (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                        isActive ? "bg-white/15" : "hover:bg-white/10"
                      }`
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={18} />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>

            <div className="border-t border-white/10 p-4">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="mt-1 truncate text-base font-semibold">{adminName}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-gray-300">
                  {adminRole}
                </p>
              </div>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <header className="sticky top-0 z-30 flex w-full shrink-0 items-center justify-between border-b border-[#eee2e2] bg-white px-4 py-4 shadow-sm md:px-8">
              <div className="flex items-center gap-3">
                <button className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                  <Menu size={24} className="text-[#574848]" />
                </button>

                <h2 className="text-xl font-bold text-[#574848] md:text-2xl">
                  {title}
                </h2>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden items-center rounded-xl bg-[#ECE4EB] px-4 py-2 md:flex md:min-w-[280px]">
                  <Search size={18} className="text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="ml-2 w-full bg-transparent text-sm outline-none"
                  />
                </div>

                <Bell className="text-[#574848]" />

                
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#574848] text-sm font-bold text-white">
                    {initials}
                  </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl border border-[#e8dede] px-3 py-2 text-sm font-medium text-[#574848] transition hover:bg-[#f8f3f4]"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-8">
              {children || (
                <>
              {dashboardError && (
                <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
                  {dashboardError}
                </div>
              )}

              <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {liveDashboard.stats.map((item) => (
                  <div key={item.title} className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">{item.title}</p>

                    <h3 className="mt-2 text-2xl font-bold text-[#574848]">
                      {dashboardLoading ? "..." : item.value}
                    </h3>
                  </div>
                ))}
              </div>

              <div className="mb-8 grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
                <section className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-[#574848]">
                        Quick Actions
                      </h3>
                      <p className="text-sm text-gray-500">
                        Keep daily admin work moving.
                      </p>
                    </div>
                    <Sparkles size={18} className="text-[#574848]" />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {quickActions.map((action) => {
                      const ActionIcon = action.icon;

                      return (
                        <button
                          key={action.title}
                          type="button"
                          onClick={() => navigate(action.to)}
                          className={`flex min-h-28 flex-col items-start justify-between rounded-2xl border border-[#efe5e5] p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${action.tone}`}>

                          <ActionIcon size={20} />
                          <div>
                            <p className="font-semibold pt-2">{action.title}</p>
                            <div className="mt-2 flex items-center gap-2 text-sm opacity-80">
                              Open
                              <ArrowRight size={15} />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="mb-5">
                    <h3 className="text-xl font-bold text-[#574848]">
                      Urgent Alerts
                    </h3>
                    <p className="text-sm text-gray-500">
                      Things that need attention first.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {liveDashboard.urgentAlerts.map((alert) => {
                      const AlertIcon = alert.icon;

                      return (
                        <div
                          key={alert.title}
                          className="flex items-start gap-3 rounded-2xl border border-[#f1e8e8] bg-[#fcf9f9] p-4"
                        >
                          <div className="rounded-full bg-[#f4e6e6] p-2 text-[#574848]">
                            <AlertIcon size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-[#574848]">
                              {alert.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {dashboardLoading ? "Loading..." : alert.note}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              <div className="mb-8 grid gap-6 xl:grid-cols-[1.1fr_1.1fr_0.8fr]">
                <section className="rounded-2xl bg-white p-6 shadow-sm xl:col-span-2">
                  <div className="mb-5">
                    <h3 className="text-xl font-bold text-[#574848]">
                      Order Status Overview
                    </h3>
                    <p className="text-sm text-gray-500">
                      Track your stitching pipeline at a glance.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    {liveDashboard.orderStatuses.map((status) => (
                      <div
                        key={status.label}
                        className="rounded-2xl border border-[#f0e6e6] p-4"
                      >
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}
                        >
                          {status.label}
                        </span>
                        <p className="mt-4 text-3xl font-bold text-[#574848]">
                          {dashboardLoading ? "..." : status.count}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="mb-5">
                    <h3 className="text-xl font-bold text-[#574848]">
                      Billing Snapshot
                    </h3>
                    <p className="text-sm text-gray-500">
                      Revenue and collections summary.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {liveDashboard.billingSummary.map((item) => (
                      <div
                        key={item.title}
                        className="flex items-center justify-between rounded-2xl bg-[#f8f3f4] px-4 py-4"
                      >
                        <p className="text-sm font-medium text-gray-600">
                          {item.title}
                        </p>
                        <p className="text-lg font-bold text-[#574848]">
                          {dashboardLoading ? "..." : item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1fr_1fr_0.9fr]">
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-xl font-bold text-[#574848]">
                    Recent Orders
                  </h3>

                  <div className="space-y-4">
                    {dashboardLoading ? (
                      <p className="text-sm text-gray-500">Loading recent orders...</p>
                    ) : liveDashboard.recentOrders.length === 0 ? (
                      <p className="text-sm text-gray-500">No orders yet.</p>
                    ) : (
                      liveDashboard.recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between border-b pb-3"
                      >
                        <div>
                          <p className="font-medium">{order.customer}</p>
                          <p className="text-sm text-gray-500">{order.item}</p>
                        </div>

                        <span className="rounded-full bg-[#ECE4EB] px-3 py-1 text-sm text-[#574848]">
                          {order.status}
                        </span>
                      </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-xl font-bold text-[#574848]">
                    Upcoming Appointments
                  </h3>

                  <div className="space-y-4">
                    {dashboardLoading ? (
                      <p className="text-sm text-gray-500">Loading appointments...</p>
                    ) : liveDashboard.upcomingAppointments.length === 0 ? (
                      <p className="text-sm text-gray-500">No upcoming appointments.</p>
                    ) : (
                      liveDashboard.upcomingAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between border-b pb-3"
                      >
                        <div>
                          <p className="font-medium">{appointment.customer}</p>
                          <p className="text-sm text-gray-500">
                            {appointment.service}
                          </p>
                        </div>

                        <span className="text-sm font-semibold text-[#574848]">
                          {appointment.time}
                        </span>
                      </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-[#574848]">
                      Recent Activity
                    </h3>
                    <Clock3 size={18} className="text-[#574848]" />
                  </div>

                  <div className="space-y-4">
                    {dashboardLoading ? (
                      <p className="text-sm text-gray-500">Loading activity...</p>
                    ) : liveDashboard.recentActivity.length === 0 ? (
                      <p className="text-sm text-gray-500">No recent activity yet.</p>
                    ) : (
                      liveDashboard.recentActivity.map((item) => (
                      <div
                        key={item.title}
                        className="border-b border-[#f0e6e6] pb-3 last:border-b-0 last:pb-0"
                      >
                        <p className="font-medium text-[#574848]">{item.title}</p>
                        <p className="mt-1 text-sm text-gray-500">{item.time}</p>
                      </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
