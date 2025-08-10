import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";

const Navbar = () => {
  const location = useLocation();
  const navs = [
    { path: "/", label: "แดชบอร์ด" },
    { path: "/rooms", label: "จัดการห้องพัก" },
    { path: "/billing", label: "คิดค่าน้ำค่าไฟ" },
    { path: "/bill-status", label: "สถานะการจ่ายเงิน" },
    { path: "/settings", label: "ตั้งค่าหน่วยน้ำ-ไฟ" },
  ];
  const [open, setOpen] = useState(false);

  // Disable body scroll when drawer open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <nav className="glass-header fixed top-0 left-0 w-full z-20 flex items-center justify-center h-16 shadow-md">
      {/* Desktop nav */}
      <div className="hidden md:flex gap-4 md:gap-8 items-center">
        <div className="flex items-center gap-2 mr-8">
          <img src="/logo.jpg" alt="HMS Logo" className="w-10 h-10 rounded-lg object-cover" />
          <span className="font-bold text-blue-700 text-xl drop-shadow">HMS</span>
        </div>
        {navs.map((nav) => (
          <Link
            key={nav.path}
            to={nav.path}
            className={`px-3 py-1 rounded-xl font-medium transition-colors duration-150 ${location.pathname === nav.path ? "bg-white/60 text-blue-700 shadow" : "text-slate-700 hover:bg-white/30"}`}
          >
            {nav.label}
          </Link>
        ))}
      </div>
      {/* Mobile hamburger */}
      <div className="flex md:hidden w-full justify-between items-center px-4">
        <div className="flex items-center gap-2">
          <img src="/logo.jpg" alt="HMS Logo" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-bold text-blue-700 text-lg drop-shadow">HMS</span>
        </div>
        <button
          className="p-2 rounded-lg bg-white/40 hover:bg-white/70 shadow-md focus:outline-none"
          onClick={() => setOpen((v) => !v)}
          aria-label="เปิดเมนูนำทาง"
        >
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-blue-700">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {/* Mobile menu side drawer with animation */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm md:hidden"
              onClick={() => setOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`fixed top-0 left-0 h-[100dvh] w-72 max-w-[95vw] z-40 bg-blue-800 shadow-2xl border-r border-blue-300 flex flex-col overflow-y-auto overscroll-contain`}
              style={{ willChange: "transform, opacity" }}
              role="dialog"
              aria-modal="true"
              tabIndex={0}
            >
              <div className="flex items-center justify-between px-6 pt-5 pb-2">
                <div className="flex items-center gap-2">
                  <img src="/logo.jpg" alt="HMS Logo" className="w-8 h-8 rounded-lg object-cover" />
                  <span className="font-extrabold text-xl text-white tracking-wide drop-shadow">HMS</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.85, rotate: 90 }}
                  whileHover={{ scale: 1.1 }}
                  className="text-4xl font-bold text-red-500 hover:text-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-300"
                  onClick={() => setOpen(false)}
                  aria-label="ปิดเมนูนำทาง"
                >
                  ×
                </motion.button>
              </div>
              <div className="flex flex-col gap-0 mt-2 px-2 pb-6">
                {navs.map((nav, idx) => (
                  <React.Fragment key={nav.path}>
                    <motion.div
                      initial={{ x: -40, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -40, opacity: 0 }}
                      transition={{ delay: 0.12 + idx * 0.07, duration: 0.3, type: "tween" }}
                    >
                      <Link
                        to={nav.path}
                        className={`block px-6 py-4 text-lg font-bold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-200 ${location.pathname === nav.path ? "bg-white text-blue-800 shadow" : "bg-transparent text-white hover:bg-white hover:text-blue-800 active:scale-95"}`}
                        onClick={() => setOpen(false)}
                      >
                        {nav.label}
                      </Link>
                    </motion.div>
                    {idx < navs.length - 1 && <div className="border-b border-blue-200 mx-6 my-1" />}
                  </React.Fragment>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar; 