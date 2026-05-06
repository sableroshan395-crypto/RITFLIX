"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Bell, User } from "lucide-react";
import { motion, useScroll } from "framer-motion";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    return scrollY.onChange((latest) => {
      setIsScrolled(latest > 50);
    });
  }, [scrollY]);

  return (
    <motion.nav
      className={`fixed top-0 w-full z-[100] flex items-center justify-between px-4 md:px-12 py-4 transition-colors duration-300 ${
        isScrolled ? "bg-[#141414]" : "bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <div className="flex items-center gap-8">
        <Link href="/">
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
        </ul>
      </div>

      <div className="flex items-center gap-6 text-gray-300">
        <Link href="/search">
          <Search className="w-5 h-5 cursor-pointer hover:text-white transition" />
        </Link>
        <Bell className="w-5 h-5 cursor-pointer hover:text-white transition hidden sm:block" />
        <Link href="/admin">
          <div className="w-8 h-8 rounded-md bg-gray-600 flex items-center justify-center cursor-pointer hover:ring-2 ring-white transition">
            <User className="w-5 h-5 text-white" />
          </div>
        </Link>
      </div>
    </motion.nav>
  );
};

export default Navbar;
