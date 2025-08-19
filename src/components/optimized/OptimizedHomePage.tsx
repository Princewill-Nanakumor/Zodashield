// src/components/optimized/OptimizedHomePage.tsx
"use client";

import { Suspense, memo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Navbar from "@/components/homepageComponents/Navabar";
import Hero from "@/components/homepageComponents/Hero";

// Critical: Load above-the-fold immediately
const StatsSection = dynamic(
  () => import("@/components/homepageComponents/StatsSection"),
  {
    loading: () => (
      <div className="h-32 bg-gray-100/50 dark:bg-gray-800/50 animate-pulse rounded-lg mx-6" />
    ),
  }
);

// Lazy load below-the-fold components
const FeaturesSection = dynamic(
  () => import("@/components/homepageComponents/FeaturesSection"),
  {
    loading: () => (
      <div className="h-96 bg-gray-100/50 dark:bg-gray-800/50 animate-pulse rounded-lg mx-6" />
    ),
    ssr: false,
  }
);

const PricingSection = dynamic(
  () => import("@/components/homepageComponents/PricingSection"),
  {
    loading: () => (
      <div className="h-96 bg-gray-100/50 dark:bg-gray-800/50 animate-pulse rounded-lg mx-6" />
    ),
    ssr: false,
  }
);

const AboutComponent = dynamic(
  () => import("@/components/homepageComponents/About"),
  {
    loading: () => (
      <div className="h-64 bg-gray-100/50 dark:bg-gray-800/50 animate-pulse rounded-lg mx-6" />
    ),
    ssr: false,
  }
);

const KeyFeatures = dynamic(
  () => import("@/components/homepageComponents/KeyFeatures"),
  {
    loading: () => (
      <div className="h-96 bg-gray-100/50 dark:bg-gray-800/50 animate-pulse rounded-lg mx-6" />
    ),
    ssr: false,
  }
);

const TestimonialsSection = dynamic(
  () => import("@/components/homepageComponents/TestimonialsSection"),
  {
    loading: () => (
      <div className="h-64 bg-gray-100/50 dark:bg-gray-800/50 animate-pulse rounded-lg mx-6" />
    ),
    ssr: false,
  }
);

const CTASection = dynamic(
  () => import("@/components/homepageComponents/CTASection"),
  {
    loading: () => (
      <div className="h-32 bg-gray-100/50 dark:bg-gray-800/50 animate-pulse rounded-lg mx-6" />
    ),
    ssr: false,
  }
);

const Footer = dynamic(() => import("@/components/homepageComponents/Footer"), {
  loading: () => (
    <div className="h-48 bg-gray-100/50 dark:bg-gray-800/50 animate-pulse rounded-lg mx-6" />
  ),
  ssr: false,
});

// Optimized animation variants - reduced complexity
const optimizedContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // Reduced from 0.1
      delayChildren: 0.1, // Reduced from 0.2
    },
  },
};

const optimizedSectionVariants = {
  hidden: { opacity: 0, y: 20 }, // Reduced from y: 50
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }, // Reduced from 0.6
  },
};

// Memoized performance-optimized component
const OptimizedHomePage = memo(function OptimizedHomePage() {
  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 performance-optimized"
      variants={optimizedContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Critical: Above-the-fold content loads immediately */}
      <motion.div variants={optimizedSectionVariants}>
        <Navbar />
      </motion.div>

      <motion.div variants={optimizedSectionVariants}>
        <Hero />
      </motion.div>

      <motion.div variants={optimizedSectionVariants}>
        <Suspense
          fallback={
            <div className="h-32 animate-pulse bg-gray-100/50 dark:bg-gray-800/50 rounded-lg mx-6" />
          }
        >
          <StatsSection />
        </Suspense>
      </motion.div>

      {/* Below-the-fold: Lazy loaded with Suspense */}
      <motion.div variants={optimizedSectionVariants}>
        <Suspense
          fallback={
            <div className="h-96 animate-pulse bg-gray-100/50 dark:bg-gray-800/50 rounded-lg mx-6" />
          }
        >
          <FeaturesSection />
        </Suspense>
      </motion.div>

      <motion.div variants={optimizedSectionVariants}>
        <Suspense
          fallback={
            <div className="h-96 animate-pulse bg-gray-100/50 dark:bg-gray-800/50 rounded-lg mx-6" />
          }
        >
          <PricingSection />
        </Suspense>
      </motion.div>

      <motion.div variants={optimizedSectionVariants}>
        <Suspense
          fallback={
            <div className="h-64 animate-pulse bg-gray-100/50 dark:bg-gray-800/50 rounded-lg mx-6" />
          }
        >
          <AboutComponent />
        </Suspense>
      </motion.div>

      <motion.div variants={optimizedSectionVariants}>
        <Suspense
          fallback={
            <div className="h-96 animate-pulse bg-gray-100/50 dark:bg-gray-800/50 rounded-lg mx-6" />
          }
        >
          <KeyFeatures />
        </Suspense>
      </motion.div>

      <motion.div variants={optimizedSectionVariants}>
        <Suspense
          fallback={
            <div className="h-64 animate-pulse bg-gray-100/50 dark:bg-gray-800/50 rounded-lg mx-6" />
          }
        >
          <TestimonialsSection />
        </Suspense>
      </motion.div>

      <motion.div variants={optimizedSectionVariants}>
        <Suspense
          fallback={
            <div className="h-32 animate-pulse bg-gray-100/50 dark:bg-gray-800/50 rounded-lg mx-6" />
          }
        >
          <CTASection />
        </Suspense>
      </motion.div>

      <motion.div variants={optimizedSectionVariants}>
        <Suspense
          fallback={
            <div className="h-48 animate-pulse bg-gray-100/50 dark:bg-gray-800/50 rounded-lg mx-6" />
          }
        >
          <Footer />
        </Suspense>
      </motion.div>
    </motion.div>
  );
});

export default OptimizedHomePage;
