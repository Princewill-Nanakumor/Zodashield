// src/components/optimized/OptimizedHomePage.tsx - FIXED VERSION
"use client";

import { memo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
// CRITICAL: Load these immediately (no lazy loading)
import Navbar from "@/components/homepageComponents/Navabar";
import Hero from "@/components/homepageComponents/Hero";
import StatsSection from "@/components/homepageComponents/StatsSection";

// ONLY lazy load below-the-fold components that users don't see immediately
const FeaturesSection = dynamic(
  () => import("@/components/homepageComponents/FeaturesSection"),
  {
    loading: () => null, // No loading placeholder to avoid layout shift
    ssr: true, // Keep SSR for SEO
  }
);

const PricingSection = dynamic(
  () => import("@/components/homepageComponents/PricingSection"),
  {
    loading: () => null,
    ssr: true,
  }
);

const AboutComponent = dynamic(
  () => import("@/components/homepageComponents/About"),
  {
    loading: () => null,
    ssr: true,
  }
);

const KeyFeatures = dynamic(
  () => import("@/components/homepageComponents/KeyFeatures"),
  {
    loading: () => null,
    ssr: true,
  }
);

const TestimonialsSection = dynamic(
  () => import("@/components/homepageComponents/TestimonialsSection"),
  {
    loading: () => null,
    ssr: true,
  }
);

const CTASection = dynamic(
  () => import("@/components/homepageComponents/CTASection"),
  {
    loading: () => null,
    ssr: true,
  }
);

const Footer = dynamic(() => import("@/components/homepageComponents/Footer"), {
  loading: () => null,
  ssr: true,
});

// FASTER animation variants
const fasterContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02, // Much faster
      delayChildren: 0, // No delay
    },
  },
};

const fasterSectionVariants = {
  hidden: { opacity: 0, y: 10 }, // Minimal movement
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.15 }, // Much faster
  },
};

const OptimizedHomePage = memo(function OptimizedHomePage() {
  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
      variants={fasterContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* CRITICAL: Above-the-fold loads immediately */}
      <motion.div variants={fasterSectionVariants}>
        <Navbar />
      </motion.div>

      <motion.div variants={fasterSectionVariants}>
        <Hero />
      </motion.div>

      <motion.div variants={fasterSectionVariants}>
        <StatsSection />
      </motion.div>

      {/* Below-the-fold: Lazy loaded WITHOUT loading placeholders */}
      <motion.div variants={fasterSectionVariants}>
        <FeaturesSection />
      </motion.div>

      <motion.div variants={fasterSectionVariants}>
        <PricingSection />
      </motion.div>

      <motion.div variants={fasterSectionVariants}>
        <AboutComponent />
      </motion.div>

      <motion.div variants={fasterSectionVariants}>
        <KeyFeatures />
      </motion.div>

      <motion.div variants={fasterSectionVariants}>
        <TestimonialsSection />
      </motion.div>

      <motion.div variants={fasterSectionVariants}>
        <CTASection />
      </motion.div>

      <motion.div variants={fasterSectionVariants}>
        <Footer />
      </motion.div>
    </motion.div>
  );
});

export default OptimizedHomePage;
