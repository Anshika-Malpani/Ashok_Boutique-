import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  Search,
  Filter,
  Eye,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  User,
  Phone,
  MapPin,
  Mail,
  AlertCircle,
  TrendingUp,
  Users,
  Scissors,
  DollarSign,
  RefreshCw,
  Check,
  X,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";

import API_BASE_URL from "../config/api";

const ShowAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    today: 0,
    thisWeek: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });

  useEffect(() => {
    fetchAppointments();
    fetchStats();
  }, [currentPage, selectedStatus, dateRange]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchQuery, selectedDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      let url = `${API_BASE_URL}/appointments?page=${currentPage}&limit=10`;
      if (selectedStatus !== "all") {
        url += `&status=${selectedStatus}`;
      }
      if (dateRange.start) {
        url += `&startDate=${dateRange.start}`;
      }
      if (dateRange.end) {
        url += `&endDate=${dateRange.end}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAppointments(response.data.appointments || []);
      setTotalPages(response.data.totalPages || 1);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load appointments");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/appointments/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(response);
      

      setStats(response.data.stats);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];
    
    

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        
        (apt) =>
          apt.userID?.fullName?.toLowerCase().includes(query) ||
          apt.userID?.phone?.includes(query) ||
          apt.service?.toLowerCase().includes(query)
      );
    }

    if (selectedDate) {
      filtered = filtered.filter(
        (apt) => new Date(apt.date).toDateString() === new Date(selectedDate).toDateString()
      );
    }

    setFilteredAppointments(filtered);
  };

  const updateAppointmentStatus = async (id, status) => {
    try {
      setUpdatingStatus(true);
      const token = localStorage.getItem("token");
      
      await axios.put(
        `${API_BASE_URL}/appointments/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchAppointments();
      await fetchStats();
      setShowDetailsModal(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      case "rescheduled":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle size={14} />;
      case "pending":
        return <ClockIcon size={14} />;
      case "cancelled":
        return <XCircle size={14} />;
      case "completed":
        return <CheckCircle size={14} />;
      case "rescheduled":
        return <RefreshCw size={14} />;
      default:
        return null;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeSlot) => {
    return timeSlot;
  };

  const StatusBadge = ({ status }) => (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
        status
      )}`}
    >
      {getStatusIcon(status)}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );

  const AppointmentDetailsModal = ({ appointment, onClose }) => {
    if (!appointment) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-[#efe5e5] px-6 py-4 flex justify-between items-center">
            <h3 className="text-xl font-bold text-[#574848]">Appointment Details</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#f8f3f4] transition"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Customer Info */}
            <div className="bg-linear-to-br from-[#fef9f9] to-[#fcf5f5] rounded-xl p-4">
              <h4 className="font-semibold text-[#574848] mb-3 flex items-center gap-2">
                <User size={18} />
                Customer Information
              </h4>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="font-semibold text-[#574848]">
                    {appointment.userID?.fullName|| "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone Number</p>
                  <p className="font-semibold text-[#574848] flex items-center gap-2">
                    <Phone size={14} />
                    {appointment.userID?.phone || "N/A"}
                  </p>
                </div>
                
               
              </div>
            </div>

            {/* Appointment Info */}
            <div className="bg-linear-to-br from-[#fef9f9] to-[#fcf5f5] rounded-xl p-4">
              <h4 className="font-semibold text-[#574848] mb-3 flex items-center gap-2">
                <Calendar size={18} />
                Appointment Details
              </h4>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Service</p>
                  <p className="font-semibold text-[#574848] flex items-center gap-2">
                    <Scissors size={14} />
                    {appointment.service}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="font-semibold text-[#574848] flex items-center gap-2">
                    <Calendar size={14} />
                    {formatDate(appointment.date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Time Slot</p>
                  <p className="font-semibold text-[#574848] flex items-center gap-2">
                    <Clock size={14} />
                    {appointment.timeSlot}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <StatusBadge status={appointment.status} />
                </div>
                {appointment.notes && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500">Notes</p>
                    <p className="text-sm text-gray-600 mt-1 bg-white rounded-lg p-3">
                      {appointment.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Update Status */}
            <div>
              <h4 className="font-semibold text-[#574848] mb-3">Update Status</h4>
              <div className="flex flex-wrap gap-2">
                {["confirmed", "completed", "cancelled"].map((status) => (
                  <button
                    key={status}
                    onClick={() => updateAppointmentStatus(appointment._id, status)}
                    disabled={updatingStatus || appointment.status === status}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition
                      ${
                        appointment.status === status
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-[#574848] text-white hover:bg-[#463a3a]"
                      }
                    `}
                  >
                    Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#fef9f9] to-[#fcf5f5] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#574848] text-white mb-4">
                <CalendarDays size={18} />
                <span className="text-sm font-semibold">Admin Dashboard</span>
              </div>
              <h1 className="text-3xl font-bold text-[#574848]">Appointments</h1>
              <p className="text-gray-500 mt-1">Manage and track all customer appointments</p>
            </div>
            <button
              onClick={fetchAppointments}
              className="px-4 py-2 rounded-xl bg-[#574848] text-white hover:bg-[#463a3a] transition flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Appointments</p>
                <h3 className="mt-2 text-2xl font-bold text-[#574848]">{stats.total}</h3>
              </div>
              <div className="w-12 h-12 bg-[#f8f3f4] rounded-full flex items-center justify-center">
                <Calendar size={22} className="text-[#574848]" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <h3 className="mt-2 text-2xl font-bold text-yellow-600">{stats.pending}</h3>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center">
                <ClockIcon size={22} className="text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Confirmed</p>
                <h3 className="mt-2 text-2xl font-bold text-green-600">{stats.confirmed}</h3>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle size={22} className="text-green-600" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <h3 className="mt-2 text-2xl font-bold text-blue-600">{stats.completed}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <TrendingUp size={22} className="text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Today's Highlight */}
       

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {["all", "pending", "confirmed", "completed", "cancelled"].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-2 rounded-xl capitalize transition ${
                    selectedStatus === status
                      ? "bg-[#574848] text-white"
                      : "bg-[#f8f3f4] text-[#574848] hover:bg-[#efe5e5]"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or phone"
                  className="pl-10 pr-4 py-2 rounded-xl border border-[#e8dede] outline-none focus:border-[#574848] w-64"
                />
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 rounded-xl border border-[#e8dede] outline-none focus:border-[#574848]"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 mb-6 flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Appointments Table */}
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#574848] border-t-transparent"></div>
            <p className="mt-4 text-gray-500">Loading appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No appointments found</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#f8f3f4] border-b border-[#efe5e5]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#574848]">Customer</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#574848]">Service</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#574848]">Date & Time</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#574848]">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#574848]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#efe5e5]">
                    {filteredAppointments.map((appointment) => (
                      <tr key={appointment._id} className="hover:bg-[#fef9f9] transition">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-[#574848]">
                              {appointment.userID?.fullName || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Phone size={12} />
                              {appointment.userID?.phone || "N/A"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-2">
                            <Scissors size={14} className="text-gray-400" />
                            <span className="text-sm text-[#574848]">{appointment.service}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-[#574848]">
                              {formatDate(appointment.date)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Clock size={12} />
                              {appointment.timeSlot}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={appointment.status} />
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowDetailsModal(true);
                            }}
                            className="p-2 rounded-lg hover:bg-[#f8f3f4] transition text-[#574848]"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl border border-[#e8dede] text-[#574848] hover:bg-[#f8f3f4] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-[#574848]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl border border-[#e8dede] text-[#574848] hover:bg-[#f8f3f4] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <div className="inline-flex flex-wrap justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <CheckCircle size={12} />
              Total Appointments: {stats.total}
            </span>
            <span className="flex items-center gap-1">
              <ClockIcon size={12} />
              Pending: {stats.pending}
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp size={12} />
              Completed: {stats.completed}
            </span>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedAppointment(null);
          }}
        />
      )}
    </div>
  );
};

export default ShowAppointments;