import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Phone, Lock, ArrowRight, CircleAlert, CircleCheckBig } from "lucide-react";
import API_BASE_URL from "../config/api";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    phone: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    type: "",
    message: "",
  });

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setAlert({ type: "", message: "" });

      const res = await axios.post(
        `${API_BASE_URL}/auth/login`,
        formData
      );

      // Save token
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
        message: res.data.message || "Login successful. Redirecting...",
      });

      // Redirect by role
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
        message:
          error.response?.data?.message ||
          "Login failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ECE4EB] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">

        <h2 className="text-3xl font-bold text-[#574848] mb-2 text-center">
          Login
        </h2>

        <p className="text-gray-500 text-center mb-8">
          Sign in to continue
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

        <form onSubmit={handleLogin} className="space-y-5">

          {/* Phone */}
          <div className="relative">
            <Phone
              size={18}
              className="absolute left-4 top-3.5 text-gray-400"
            />

            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
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
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-[#574848]"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#574848] hover:opacity-90 text-white py-3 rounded-xl flex justify-center items-center gap-2"
          >
            {loading ? "Logging in..." : "Login"}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Signup */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don’t have an account?{" "}
          <Link
            to="/signup"
            className="text-[#574848] font-semibold hover:underline"
          >
            Sign Up
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;
