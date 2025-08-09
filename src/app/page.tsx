// src/app/page.tsx
"use client";

import AboutComponent from "@/components/homepageComponents/About";
import Hero from "@/components/homepageComponents/Hero";
import Navbar from "@/components/homepageComponents/Navabar";
import StatsSection from "@/components/homepageComponents/StatsSection";
import FeaturesSection from "@/components/homepageComponents/FeaturesSection";
import PricingSection from "@/components/homepageComponents/PricingSection";
import TestimonialsSection from "@/components/homepageComponents/TestimonialsSection";
import CTASection from "@/components/homepageComponents/CTASection";
import Footer from "@/components/homepageComponents/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />
      <Hero />
      <StatsSection />
      <FeaturesSection />
      <PricingSection />
      <AboutComponent />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
