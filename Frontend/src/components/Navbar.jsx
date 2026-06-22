import React, { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LayoutDashboard, LogIn, LogOut, ChevronRight, Menu, X } from "lucide-react";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  return (
    <>
      <nav className={`site-navbar ${isMobileMenuOpen ? "site-navbar--open" : ""}`}>
        <div className="site-navbar__container">
          <NavLink
            to="/"
            className="site-navbar__logo"
            aria-label="Ashok Boutique home"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsMenuOpen(false);
            }}
          >
            <img src="/home_images/logo-transparent-png.webp" alt="Ashok Boutique Logo" />
          </NavLink>

          <button
            type="button"
            className="site-navbar__toggle"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="primary-navigation"
            onClick={() => {
              setIsMobileMenuOpen((prev) => !prev);
              setIsMenuOpen(false);
            }}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>

          <ul id="primary-navigation" className="site-navbar__links">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsMenuOpen(false);
                  }}
                  className={({ isActive }) =>
                    `site-navbar__link${isActive ? " site-navbar__link--active" : ""}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="site-navbar__auth">
            {currentUser ? (
              <div ref={menuRef} className="site-navbar__account">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  className="site-navbar__account-button"
                  aria-label="Open account menu"
                  aria-expanded={isMenuOpen}
                >
                  <div className="site-navbar__avatar">
                    {initials}
                  </div>
                  <ChevronDown size={18} strokeWidth={3} className={`site-navbar__chevron ${isMenuOpen ? "site-navbar__chevron--open" : ""}`} />
                </button>

                {isMenuOpen && (
                  <div className="site-navbar__dropdown">
                    <div className="flex items-center gap-3 border-b border-[#f0e6e6] pb-3">
                      <div className="site-navbar__avatar">
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
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsMobileMenuOpen(false);
                          navigate("/admin-dashboard");
                        }}
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
              <NavLink
                to="/signup"
                className="site-navbar__signup"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsMenuOpen(false);
                }}
              >
                <span>Signup</span>
                <LogIn size={20} strokeWidth={4} />
              </NavLink>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}

export default Navbar
