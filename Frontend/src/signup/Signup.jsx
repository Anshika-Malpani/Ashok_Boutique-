import React from 'react'
import Navbar from '../components/Navbar'
import { User, Lock, Phone, ArrowRight, CircleAlert, CircleCheckBig } from "lucide-react";
import { useNavigate,NavLink } from "react-router-dom";
import axios from "axios";
import { useState } from "react";
import API_BASE_URL from "../config/api";

const  Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    password: "",
    role: "customer",
  });
  const [alert, setAlert] = useState({
    type: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setAlert({ type: "", message: "" });

      const res = await axios.post(
          `${API_BASE_URL}/auth/signup`,
        form
      );

      localStorage.setItem("token", res.data.token);

      // Save user
      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );

      if (res.data.user?.customerId) {
        localStorage.setItem("customerId", res.data.user.customerId);
      }

      setAlert({
        type: "success",
        message: res.data.message || "Signup successful. Redirecting...",
      });

      setForm({
        fullName: "",
        phone: "",
        password: "",
        role: "customer",
      });

      setTimeout(() => {
        if(res.data.user.role === "admin"){
          navigate("/admin-dashboard");
         }else{
          navigate("/");
         }
      }, 1500);
    } catch (error) {
      setAlert({
        type: "error",
        message: error.response?.data?.message || "Signup failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-[#ECE4EB] flex items-center justify-center px-4 pt-10">
      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Left Section */}
        <div className="hidden md:flex flex-col justify-center p-10 bg-[#574848] text-white">
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Welcome to <br /> Boutique Studio
          </h1>

          <p className="text-sm md:text-base text-gray-200 leading-7">
            Create your account to explore elegant designs,
            book appointments, track orders, and enjoy a smooth boutique experience.
          </p>

          <div className="mt-8 space-y-4">
            <div className="bg-white/10 p-4 rounded-xl">
              ✨ Premium Designs
            </div>

            <div className="bg-white/10 p-4 rounded-xl">
              📅 Easy Appointments
            </div>

            <div className="bg-white/10 p-4 rounded-xl">
              🧾 Order Tracking
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="p-6 sm:p-10 bg-white">
          <div className="max-w-md mx-auto">

            <h2 className="text-3xl font-bold text-[#574848] mb-2">
              Create Account
            </h2>

            <p className="text-gray-500 mb-8">
              Sign up to continue your fashion journey
            </p>

            {alert.message && (
              <div
                className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                  alert.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {alert.type === "success" ? (
                  <CircleCheckBig size={18} className="mt-0.5 shrink-0" />
                ) : (
                  <CircleAlert size={18} className="mt-0.5 shrink-0" />
                )}
                <p>{alert.message}</p>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-5">

              {/* Full Name */}
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-4 top-3.5 text-gray-400"
                />

                <input
                  type="text"
                  placeholder="Full Name"
                  value={form.fullName}
                  onChange={(e)=>setForm({...form, fullName:e.target.value})}
                  required
                  className="w-full border border-gray-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-[#574848]"
                  
                />
              </div>

              {/* Phone */}
              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-4 top-3.5 text-gray-400"
                />

                <input
                  type="text"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={(e)=>setForm({...form, phone:e.target.value})}
                  required
                  className="w-full border border-gray-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-[#574848]"
                  
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-3.5 text-gray-400"
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e)=>setForm({...form, password:e.target.value})}
                  required
                  className="w-full border border-gray-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-[#574848]"
                />
              </div>

              {/* Confirm Password */}
            

              {/* Signup Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#574848] hover:opacity-90 transition text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Signing up..." : "Sign Up"} <ArrowRight size={18} />
              </button>

            </form>

            {/* Login Redirect */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{" "}
              <NavLink
                to="/login"
                className="text-[#574848] font-semibold hover:underline"
              >
                Login
              </NavLink>
            </p>

          </div>
        </div>

      </div>
    </div>
    </>
  )
}

export default Signup
