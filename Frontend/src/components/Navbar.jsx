import React, { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LayoutDashboard, LogIn, LogOut, ChevronRight } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const initials = useMemo(() => {
    const displayName = currentUser?.fullName || currentUser?.name || "";

    if (!displayName.trim()) {
      return "U";
    }

    return displayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [currentUser?.fullName, currentUser?.name]);

  const navItems = useMemo(() => {

    return [
      { to: "/", label: "Home" },
      { to: "/designs", label: "Designs" },
      { to: "/appointment", label: "Book Appointment" },
      { to: "/track-order", label: "Track Order" },
      { to: "/contact", label: "Contact" },
    ];
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("customerId");
    setCurrentUser(null);
    setIsMenuOpen(false);
    navigate("/");
  };

  return (
    <>
      <nav className="navbar h-nav">
        <div className="container">
          <div id="logo" className="logo-nav">
            <img src={" home_images/logo-transparent-png.webp"} alt="Ashok Boutique Logo" />
          </div>
          <ul className="list v-class">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className="nav-link">
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="login v-class">
            {currentUser ? (
              <div ref={menuRef} className="relative gap-2">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 cursor-pointer "
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#574848] text-sm font-bold text-white">
                    {initials}
                  </div>
                  <ChevronDown size={18} strokeWidth={3} className={`transition-transform  ${isMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-14 z-120 min-w-[220px] rounded-xl border border-[#e7dede] bg-white p-3 text-left shadow-xl">
                    <div className="flex items-center gap-3 border-b border-[#f0e6e6] pb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#574848] text-sm font-bold text-white">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#574848]">
                          {currentUser?.fullName || currentUser?.name || "User"}
                        </p>
                        <p className="text-xs text-gray-500">Signed in</p>
                      </div>
                    </div>

                    <div className='flex flex-col gap-2'>
                    {currentUser?.role === "admin" && (
                      <button
                        onClick={() => navigate("/admin-dashboard")}
                        className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg border border-[#574848]/20 bg-white hover:bg-[#574848] hover:text-white transition-all duration-200 group"
                      >
                        <LayoutDashboard size={16} className="text-[#574848] group-hover:text-white transition" />
                        <span className="text-sm font-medium text-[#574848] group-hover:text-white transition whitespace-nowrap">Admin Dashboard</span>
                        <div className="ml-auto w-6 h-6 rounded-full bg-[#f8f3f4] group-hover:bg-white/20 flex items-center justify-center transition">
                          <ChevronRight size={12} className="text-[#574848] group-hover:text-white" />
                        </div>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg border border-[#574848]/20 bg-white hover:bg-[#574848]  transition-all duration-200 group"
                    >
                      <LogOut size={16} className="text-[#574848] group-hover:text-white transition" />
                      <span className="text-sm font-medium text-[#574848] group-hover:text-white transition whitespace-nowrap">Logout</span>
                      <div className="ml-auto w-6 h-6 rounded-full bg-[#f8f3f4] group-hover:bg-white/20 flex items-center justify-center transition">
                          <ChevronRight size={12} className="text-[#574848] group-hover:text-white" />
                        </div>
                    </button>
                    </div>

                  </div>
                )}
              </div>
            ) : (
              <NavLink to="/signup" className="nav-link">
                <div className="nav-right">
                  <button className="btn-lg">Signup</button>
                  <LogIn size={20} strokeWidth={4} className='text-white' />
                </div>
              </NavLink>
            )}
          </div>
          <div className="hamburger">
            <i className="ri-menu-line"></i>
          </div>
        </div>
      </nav>
    </>
  )
}

export default Navbar
