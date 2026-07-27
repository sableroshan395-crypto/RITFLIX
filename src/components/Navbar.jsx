"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Bell, User, Menu, X } from "lucide-react";
import { motion, useScroll, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    return scrollY.onChange((latest) => {
      setIsScrolled(latest > 50);
    });
  }, [scrollY]);

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <motion.nav
        className={`fixed top-0 w-full z-[100] flex items-center justify-between px-4 md:px-12 py-4 transition-colors duration-300 ${
          isScrolled || isMobileMenuOpen ? "bg-[#141414]" : "bg-gradient-to-b from-black/80 to-transparent"
        }`}
      >
        <div className="flex items-center gap-4 md:gap-8">
          <div 
            className="md:hidden cursor-pointer text-white" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </div>
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
            <h1 className="text-primary text-2xl md:text-3xl font-bold cursor-pointer tracking-wider">
              RITFLIX
            </h1>
          </Link>
          <ul className="hidden md:flex items-center gap-6 text-sm text-gray-300">
            <li className="hover:text-white cursor-pointer transition">
              <Link href="/">Home</Link>
            </li>
            <li className="hover:text-white cursor-pointer transition">
              <Link href="/series">Series</Link>
            </li>
            <li className="hover:text-white cursor-pointer transition">
              <Link href="/movies">Movies</Link>
            </li>
            <li className="hover:text-white cursor-pointer transition">
              <Link href="/anime">Anime</Link>
            </li>
            <li className="hover:text-white cursor-pointer transition">
              <Link href="/my-list">My List</Link>
            </li>
            <li className="cursor-pointer transition">
              <Link href="/marvel" className="flex items-center gap-1.5 bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white font-extrabold px-3 py-1 rounded-md text-xs tracking-wider uppercase shadow-[0_0_12px_rgba(230,36,41,0.5)] border border-red-500/50 hover:scale-105 hover:shadow-[0_0_18px_rgba(230,36,41,0.8)] transition-all">
                <span className="bg-white text-red-700 px-1 rounded text-[10px] font-black">MARVEL</span>
              </Link>
            </li>
          </ul>
        </div>

        <div className="flex items-center gap-4 md:gap-6 text-gray-300">
          <Link href="/marvel" className="md:hidden flex items-center gap-1 bg-red-700 text-white text-xs font-black px-2 py-0.5 rounded border border-red-500">
            MARVEL
          </Link>
          <Link href="/search" onClick={() => setIsMobileMenuOpen(false)}>
            <Search className="w-5 h-5 cursor-pointer hover:text-white transition" />
          </Link>
          <Bell className="w-5 h-5 cursor-pointer hover:text-white transition hidden sm:block" />
          <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="w-8 h-8 rounded-md bg-gray-600 flex items-center justify-center cursor-pointer hover:ring-2 ring-white transition">
              <User className="w-5 h-5 text-white" />
            </div>
          </Link>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[60px] left-0 w-full bg-[#141414] z-[90] border-t border-gray-800 shadow-2xl md:hidden"
          >
            <ul className="flex flex-col py-4 px-6 text-gray-300 font-semibold text-lg gap-4">
              <li className="hover:text-white cursor-pointer transition pb-2 border-b border-gray-800">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
              </li>
              <li className="hover:text-white cursor-pointer transition pb-2 border-b border-gray-800">
                <Link href="/marvel" onClick={() => setIsMobileMenuOpen(false)} className="text-red-500 font-bold flex items-center gap-2">
                  <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded font-black">MARVEL</span>
                  Marvel Universe
                </Link>
              </li>
              <li className="hover:text-white cursor-pointer transition pb-2 border-b border-gray-800">
                <Link href="/series" onClick={() => setIsMobileMenuOpen(false)}>Series</Link>
              </li>
              <li className="hover:text-white cursor-pointer transition pb-2 border-b border-gray-800">
                <Link href="/movies" onClick={() => setIsMobileMenuOpen(false)}>Movies</Link>
              </li>
              <li className="hover:text-white cursor-pointer transition pb-2 border-b border-gray-800">
                <Link href="/anime" onClick={() => setIsMobileMenuOpen(false)}>Anime</Link>
              </li>
              <li className="hover:text-white cursor-pointer transition pb-2">
                <Link href="/my-list" onClick={() => setIsMobileMenuOpen(false)}>My List</Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
