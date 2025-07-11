"use client";

import AboutComponent from "@/components/homepageComponents/About";
import Hero from "@/components/homepageComponents/Hero";
import ComingSoon from "@/components/homepageComponents/ComingSoon";
import Navbar from "@/components/homepageComponents/Navabar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}

      <Navbar />

      <Hero />
      <AboutComponent />
      <ComingSoon />
    </div>
  );
}
