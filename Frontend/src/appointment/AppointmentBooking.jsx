import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Scissors,
  MessageSquare,
  Star,
  Sparkles,
  Shield,
  ThumbsUp,
  Heart,
  Phone,
  MapPin,
  X,
  RefreshCw,
  Eye,
} from "lucide-react";
import Navbar from "../components/Navbar";
import API_BASE_URL from "../config/api";

const AppointmentBooking = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [bookingDetails, setBookingDetails] = useState(null);
  const [myAppointments, setMyAppointments] = useState([]);
  const [showMyAppointments, setShowMyAppointments] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const [appointment, setAppointment] = useState({
    service: "",
    date: "",
    timeSlot: "",
    notes: "",
  });

  const [services] = useState([
    {
      id: 1,
      name: "New Measurement",
      category: "Tailoring",
      duration: "30 min",
      price: "Free",
      icon: "📏",
      description: "Complete body measurements for new custom outfits",
      popular: true,
    },
    {
      id: 2,
      name: "Stitching Consultation",
      category: "Tailoring",
      duration: "45 min",
      price: "Free",
      icon: "🪡",
      description: "Discuss fabric, design, and stitching requirements",
      popular: true,
    },
    {
      id: 3,
      name: "Wedding Outfit Fitting",
      category: "Special Occasion",
      duration: "60 min",
      price: "Free",
      icon: "💒",
      description: "Bridal/Groom outfit measurements and fittings",
      popular: true,
    },
    {
      id: 4,
      name: "Design Consultation",
      category: "Design",
      duration: "60 min",
      price: "Free",
      icon: "🎨",
      description: "Custom design discussion with expert designers",
      popular: false,
    },
    {
      id: 5,
      name: "Alteration & Repair",
      category: "Alteration",
      duration: "30 min",
      price: "Free",
      icon: "✂️",
      description: "Size adjustments, repairs, and modifications",
      popular: true,
    },
    {
      id: 6,
      name: "Final Trial Session",
      category: "Tailoring",
      duration: "45 min",
      price: "Free",
      icon: "👗",
      description: "Final fitting before outfit delivery",
      popular: false,
    },
    {
      id: 7,
      name: "Ethnic Wear Stitching",
      category: "Traditional",
      duration: "60 min",
      price: "Free",
      icon: "🥻",
      description: "Lehenga, Sherwani, Kurta, Saree stitching",
      popular: true,
    },
    {
      id: 8,
      name: "Western Wear Stitching",
      category: "Modern",
      duration: "45 min",
      price: "Free",
      icon: "👔",
      description: "Suits, Blazers, Dresses, and Casual wear",
      popular: false,
    },
    {
      id: 9,
      name: "Kids Clothing Stitching",
      category: "Kids",
      duration: "30 min",
      price: "Free",
      icon: "🧸",
      description: "School uniforms, party wear, and casuals",
      popular: false,
    },
    {
      id: 10,
      name: "Embroidery Design Session",
      category: "Design",
      duration: "60 min",
      price: "Free",
      icon: "✨",
      description: "Custom embroidery and embellishment planning",
      popular: false,
    },
  ]);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const categories = [
    { id: "all", name: "All Services", icon: "🎯" },
    { id: "Tailoring", name: "Tailoring", icon: "🪡" },
    { id: "Design", name: "Design", icon: "🎨" },
    { id: "Special Occasion", name: "Special Occasion", icon: "💒" },
    { id: "Alteration", name: "Alteration", icon: "✂️" },
    { id: "Traditional", name: "Traditional", icon: "🥻" },
    { id: "Modern", name: "Modern", icon: "👔" },
    { id: "Kids", name: "Kids", icon: "🧸" },
  ];

  // ===============================
  // LOGIN CHECK
  // ===============================
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      navigate("/signup?redirect=book-appointment");
    }
  }, [navigate]);

  // ===============================
  // Fetch My Appointments
  // ===============================
  const fetchMyAppointments = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    try {
      setLoadingAppointments(true);
      const token = localStorage.getItem("token");
      
      const response = await axios.get(`${API_BASE_URL}/appointments/my-appointments/${user?._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMyAppointments(response.data.appointments || []);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
    } finally {
      setLoadingAppointments(false);
    }
  };

  // ===============================
  // Generate Next 30 Days Dates
  // ===============================
  useEffect(() => {
    const dates = [];
    const today = new Date();

    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      if (date.getDay() !== 0) {
        dates.push(date);
      }
    }

    setAvailableDates(dates);
  }, []);

  // ===============================
  // Generate Time Slots
  // ===============================
  useEffect(() => {
    if (selectedDate) {
      const slots = [];

      for (let hour = 10; hour <= 19; hour++) {
        for (let min = 0; min < 60; min += 30) {
          if (hour === 19 && min > 0) continue;
          const time = `${hour.toString().padStart(2, "0")}:${min
            .toString()
            .padStart(2, "0")}`;
          slots.push(time);
        }
      }

      setAvailableTimeSlots(slots);
    }
  }, [selectedDate]);

  const filteredServices = selectedCategory === "all" 
    ? services 
    : services.filter(service => service.category === selectedCategory);

  const nextStep = () => {
    if (step === 1 && !selectedService) {
      setError("Please select a service to continue");
      return;
    }
    setError("");
    setStep(step + 1);
  };

  const prevStep = () => {
    setError("");
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      setError("Please select both date and time for your appointment");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));

      const payload = {
        userID: user?._id,
        service: selectedService.name,
        date: selectedDate,
        timeSlot: selectedTime,
        notes: appointment.notes,
      };

      const response = await axios.post(
        `${API_BASE_URL}/appointments`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setBookingDetails({
          service: selectedService,
          date: selectedDate,
          time: selectedTime,
          notes: appointment.notes,
          bookingId: response.data.bookingId,
        });
        setSuccess(true);
        setStep(3);
        // Refresh appointments list
        fetchMyAppointments();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to book appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    try {
      setCancellingId(appointmentId);
      const token = localStorage.getItem("token");
      
      await axios.put(
        `${API_BASE_URL}/appointments/${appointmentId}/cancel`,
        { cancellationReason: "Cancelled by customer" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh appointments list
      await fetchMyAppointments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel appointment");
    } finally {
      setCancellingId(null);
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
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle size={12} />;
      case "pending":
        return <Clock size={12} />;
      case "cancelled":
        return <X size={12} />;
      case "completed":
        return <CheckCircle size={12} />;
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

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
      daysInMonth: lastDay.getDate(),
      startingDay: firstDay.getDay(),
    };
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const cells = [];

    weekdays.forEach((day) => {
      cells.push(
        <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
          {day}
        </div>
      );
    });

    for (let i = 0; i < startingDay; i++) {
      cells.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const available = availableDates.some(
        (d) => d.toDateString() === date.toDateString()
      );
      const selected = selectedDate?.toDateString() === date.toDateString();

      cells.push(
        <button
          key={day}
          disabled={!available}
          onClick={() => {
            setSelectedDate(date);
            setSelectedTime(null);
          }}
          className={`p-3 rounded-xl text-sm font-medium transition-all duration-200
            ${
              selected
                ? "bg-[#574848] text-white shadow-md transform scale-105"
                : available
                ? "hover:bg-[#f8f3f4] border-2 border-[#efe5e5] hover:border-[#574848]"
                : "opacity-30 cursor-not-allowed bg-gray-50"
            }`}
        >
          {day}
        </button>
      );
    }

    return <div className="grid grid-cols-7 gap-2">{cells}</div>;
  };

  // Appointment Details Modal
  const AppointmentDetailsModal = ({ appointment, onClose }) => {
    if (!appointment) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl">
          <div className="flex justify-between items-center p-4 border-b border-[#efe5e5]">
            <h3 className="text-lg font-bold text-[#574848]">Appointment Details</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[#f8f3f4] transition"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <p className="text-xs text-gray-500">Service</p>
              <p className="font-semibold text-[#574848]">{appointment.service}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Date & Time</p>
              <p className="font-semibold text-[#574848]">
                {formatDate(appointment.date)} at {appointment.timeSlot}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(appointment.status)}`}>
                {getStatusIcon(appointment.status)}
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </span>
            </div>
            {appointment.notes && (
              <div>
                <p className="text-xs text-gray-500">Notes</p>
                <p className="text-sm text-gray-600 bg-[#f8f3f4] p-2 rounded-lg mt-1">
                  {appointment.notes}
                </p>
              </div>
            )}
            {appointment.cancelledAt && (
              <div>
                <p className="text-xs text-gray-500">Cancelled On</p>
                <p className="text-sm text-gray-600">{formatDate(appointment.cancelledAt)}</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-[#efe5e5]">
            <button
              onClick={onClose}
              className="w-full py-2 rounded-xl bg-[#574848] text-white font-semibold hover:bg-[#463a3a] transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Success Screen
  if (success && bookingDetails) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-linear-to-br from-[#fef9f9] to-[#fcf5f5] px-4 py-10 pt-28">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
              <div className="relative">
                <div className="w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
                  <div className="relative w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle size={48} className="text-green-600" />
                  </div>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-[#574848] mb-2">
                Appointment Confirmed! 🎉
              </h2>
              <p className="text-gray-500 mb-6">
                Your appointment has been successfully scheduled
              </p>

              <div className="bg-linear-to-br from-[#f8f3f4] to-[#fef9f9] rounded-2xl p-6 text-left space-y-4 mb-6">
                <div className="flex items-start gap-3 pb-3 border-b border-[#efe5e5]">
                  <div className="w-10 h-10 bg-[#574848] bg-opacity-10 rounded-lg flex items-center justify-center">
                    <Scissors size={20} className="text-[#574848]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium">Service</p>
                    <p className="font-semibold text-[#574848] text-lg">
                      {bookingDetails.service.name}
                    </p>
                    <p className="text-sm text-gray-500">{bookingDetails.service.duration}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pb-3 border-b border-[#efe5e5]">
                  <div className="w-10 h-10 bg-[#574848] bg-opacity-10 rounded-lg flex items-center justify-center">
                    <Calendar size={20} className="text-[#574848]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Date & Time</p>
                    <p className="font-semibold text-[#574848]">
                      {bookingDetails.date.toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-[#574848] mt-1">⏰ {bookingDetails.time}</p>
                  </div>
                </div>

                {bookingDetails.notes && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[#574848] bg-opacity-10 rounded-lg flex items-center justify-center">
                      <MessageSquare size={20} className="text-[#574848]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Notes</p>
                      <p className="text-sm text-gray-600">{bookingDetails.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-amber-800">
                  📍 Dhanshree Tower 1, B-38, Sector 2 Rd, Sector 2, Central Spine, Vidyadhar Nagar, Jaipur, Rajasthan 302039
                </p>
                <p className="text-sm text-amber-800 mt-1">
                  📞 Contact us: +91 9252010850
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSuccess(false);
                    setStep(1);
                    setSelectedService(null);
                    setSelectedDate(null);
                    setSelectedTime(null);
                    setAppointment({ ...appointment, notes: "" });
                  }}
                  className="flex-1 py-3 rounded-xl border-2 border-[#574848] text-[#574848] font-semibold hover:bg-[#f8f3f4] transition"
                >
                  Book Another
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="flex-1 py-3 rounded-xl bg-[#574848] text-white font-semibold hover:bg-[#463a3a] transition"
                >
                  Go to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-linear-to-br from-[#fef9f9] to-[#fcf5f5] px-4 py-8 pt-28">
        <div className="max-w-5xl mx-auto">
          {/* Header with My Appointments Button */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-[#574848] text-white px-6 py-2 rounded-full mb-4 shadow-lg">
              <CalendarDays size={18} />
              <span className="text-sm font-semibold">Book Appointment</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex-1"></div>
              <button
                onClick={() => {
                  setShowMyAppointments(!showMyAppointments);
                  if (!showMyAppointments) {
                    fetchMyAppointments();
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[#574848] text-[#574848] font-semibold hover:bg-[#f8f3f4] transition"
              >
                <Eye size={16} />
                {showMyAppointments ? "Hide My Appointments" : "View My Appointments"}
              </button>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#574848] mb-3">
              Schedule Your Visit
            </h1>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Choose from our wide range of tailoring and stitching services
            </p>
          </div>

          {/* My Appointments Section */}
          {showMyAppointments && (
            <div className="mb-8 bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-[#574848] text-white px-6 py-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar size={18} />
                  My Appointments
                </h3>
              </div>
              <div className="p-4">
                {loadingAppointments ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#574848] border-t-transparent"></div>
                    <p className="mt-2 text-gray-500">Loading appointments...</p>
                  </div>
                ) : myAppointments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar size={48} className="mx-auto mb-3 opacity-30" />
                    <p>No appointments booked yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {myAppointments.map((apt) => (
                      <div
                        key={apt._id}
                        className="border border-[#efe5e5] rounded-xl p-4 hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {/* <span className="text-lg">{apt.service.split(' ')[0]}</span> */}
                              <h4 className="font-semibold text-[#574848]">{apt.service}</h4>
                            </div>
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <Calendar size={12} />
                              {formatDate(apt.date)} at {apt.timeSlot}
                            </p>
                            <div className="mt-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(apt.status)}`}>
                                {getStatusIcon(apt.status)}
                                {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedAppointment(apt)}
                              className="p-2 rounded-lg hover:bg-[#f8f3f4] transition text-[#574848]"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                           
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progress Steps */}
          {!success && step !== 3 && (
            <div className="max-w-md mx-auto mb-10">
              <div className="flex justify-between items-center relative">
                <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
                  <div
                    className="h-full bg-[#574848] transition-all duration-500"
                    style={{ width: step === 1 ? "50%" : "100%" }}
                  ></div>
                </div>
                {[1, 2].map((item) => (
                  <div key={item} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                      ${
                        step >= item
                          ? "bg-[#574848] text-white shadow-lg"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {step > item ? <CheckCircle size={20} /> : item}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {item === 1 ? "Select Service" : "Schedule"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            {!success && step === 1 && (
              <>
                {/* Category Filters */}
                <div className="border-b border-[#efe5e5] p-6">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                          ${
                            selectedCategory === category.id
                              ? "bg-[#574848] text-white shadow-md"
                              : "bg-[#f8f3f4] text-[#574848] hover:bg-[#efe5e5]"
                          }`}
                      >
                        <span className="mr-1">{category.icon}</span>
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Services Grid */}
                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    {filteredServices.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={`relative border-2 rounded-2xl p-5 text-left transition-all duration-200 hover:shadow-md
                          ${
                            selectedService?.id === service.id
                              ? "border-[#574848] bg-linear-to-br from-[#fef9f9] to-[#fcf5f5] shadow-lg"
                              : "border-[#efe5e5] hover:border-[#574848] hover:bg-[#fef9f9]"
                          }`}
                      >
                        {service.popular && (
                          <div className="absolute -top-2 -right-2 bg-linear-to-r from-amber-500 to-amber-600 text-white text-xs px-2 py-1 rounded-full shadow-md">
                            <span className="flex items-center gap-1">
                              <Star size={10} /> Popular
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-start">
                          <div className="flex gap-4">
                            <span className="text-4xl">{service.icon}</span>
                            <div>
                              <h4 className="font-bold text-[#574848] text-lg">
                                {service.name}
                              </h4>
                              <p className="text-sm text-gray-500 mt-1">
                                {service.description}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock size={12} />
                                  {service.duration}
                                </span>
                                <span className="text-xs text-green-600 font-semibold">
                                  {service.price}
                                </span>
                              </div>
                            </div>
                          </div>
                          {selectedService?.id === service.id && (
                            <CheckCircle size={24} className="text-[#574848]" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={nextStep}
                    className="mt-8 w-full bg-[#574848] text-white py-4 rounded-xl font-semibold hover:bg-[#463a3a] transition transform hover:scale-[1.02] shadow-lg"
                  >
                    Continue to Scheduling →
                  </button>
                </div>
              </>
            )}

            {!success && step === 2 && (
              <div className="p-6">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Calendar Section */}
                  <div>
                    <h3 className="font-bold text-[#574848] text-lg mb-4 flex items-center gap-2">
                      <Calendar size={20} />
                      Select Date
                    </h3>
                    <div className="border rounded-2xl p-4 bg-[#fef9f9]">
                      <div className="flex justify-between items-center mb-4">
                        <button
                          onClick={() =>
                            setCurrentMonth(
                              new Date(currentMonth.setMonth(currentMonth.getMonth() - 1))
                            )
                          }
                          className="p-2 hover:bg-[#f8f3f4] rounded-lg transition"
                        >
                          <ChevronLeft size={20} className="text-[#574848]" />
                        </button>
                        <h4 className="font-semibold text-[#574848]">
                          {currentMonth.toLocaleString("default", {
                            month: "long",
                            year: "numeric",
                          })}
                        </h4>
                        <button
                          onClick={() =>
                            setCurrentMonth(
                              new Date(currentMonth.setMonth(currentMonth.getMonth() + 1))
                            )
                          }
                          className="p-2 hover:bg-[#f8f3f4] rounded-lg transition"
                        >
                          <ChevronRight size={20} className="text-[#574848]" />
                        </button>
                      </div>
                      {renderCalendar()}
                      <p className="text-xs text-gray-400 mt-4 text-center">
                        * Appointments available Monday - Saturday
                      </p>
                    </div>
                  </div>

                  {/* Time & Notes Section */}
                  <div>
                    {selectedDate && (
                      <>
                        <h3 className="font-bold text-[#574848] text-lg mb-4 flex items-center gap-2">
                          <Clock size={20} />
                          Select Time Slot
                        </h3>
                        <div className="grid grid-cols-3 gap-2 mb-6">
                          {availableTimeSlots.map((time) => (
                            <button
                              key={time}
                              onClick={() => setSelectedTime(time)}
                              className={`py-3 rounded-xl text-sm font-medium transition-all duration-200
                                ${
                                  selectedTime === time
                                    ? "bg-[#574848] text-white shadow-md transform scale-105"
                                    : "border-2 border-[#efe5e5] text-[#574848] hover:border-[#574848] hover:bg-[#f8f3f4]"
                                }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    <h3 className="font-bold text-[#574848] text-lg mb-4 flex items-center gap-2">
                      <MessageSquare size={20} />
                      Additional Notes (Optional)
                    </h3>
                    <textarea
                      rows="4"
                      placeholder="Tell us about your specific requirements, fabric choices, design preferences, or any questions..."
                      className="w-full mt-1 border-2 border-[#efe5e5] rounded-xl p-3 focus:border-[#574848] focus:outline-none transition resize-none"
                      value={appointment.notes}
                      onChange={(e) =>
                        setAppointment({
                          ...appointment,
                          notes: e.target.value,
                        })
                      }
                    />

                    <div className="bg-[#f8f3f4] rounded-xl p-4 mt-6">
                      <h4 className="font-semibold text-[#574848] text-sm mb-2 flex items-center gap-2">
                        <Shield size={16} />
                        What to expect?
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>✓ Professional consultation with expert tailor</li>
                        <li>✓ Detailed measurement taking process</li>
                        <li>✓ Fabric and design suggestions</li>
                        <li>✓ Transparent pricing and timeline discussion</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={prevStep}
                    className="flex-1 py-3 rounded-xl border-2 border-[#574848] text-[#574848] font-semibold hover:bg-[#f8f3f4] transition"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-[#574848] text-white font-semibold hover:bg-[#463a3a] transition disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Booking...
                      </span>
                    ) : (
                      "Confirm Appointment →"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="m-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 flex gap-2 items-center">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>

          {/* Footer Features */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className="w-10 h-10 bg-[#f8f3f4] rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield size={18} className="text-[#574848]" />
              </div>
              <p className="text-xs text-gray-600">100% Quality Assured</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className="w-10 h-10 bg-[#f8f3f4] rounded-full flex items-center justify-center mx-auto mb-2">
                <ThumbsUp size={18} className="text-[#574848]" />
              </div>
              <p className="text-xs text-gray-600">Expert Tailors</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className="w-10 h-10 bg-[#f8f3f4] rounded-full flex items-center justify-center mx-auto mb-2">
                <Heart size={18} className="text-[#574848]" />
              </div>
              <p className="text-xs text-gray-600">Customer Satisfaction</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className="w-10 h-10 bg-[#f8f3f4] rounded-full flex items-center justify-center mx-auto mb-2">
                <Sparkles size={18} className="text-[#574848]" />
              </div>
              <p className="text-xs text-gray-600">Premium Service</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-6 text-center text-xs text-gray-400">
            <p>📍 Dhanshree Tower 1, B-38, Sector 2 Rd, Sector 2, Central Spine, Vidyadhar Nagar, Jaipur, Rajasthan 302039 | 📞 +91 9252010850 | ✉️ ashokboutique@gmail.com</p>
            <p className="mt-1">© 2026 Ashok Boutique. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </>
  );
};

export default AppointmentBooking;