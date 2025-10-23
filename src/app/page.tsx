"use client";

import { motion } from "framer-motion";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/dashboardComponents/Theme-Provider";
import AboutComponent from "@/components/homepageComponents/About";
import Hero from "@/components/homepageComponents/Hero";
import Navbar from "@/components/homepageComponents/Navabar";
import StatsSection from "@/components/homepageComponents/StatsSection";
import FeaturesSection from "@/components/homepageComponents/FeaturesSection";
import PricingSection from "@/components/homepageComponents/PricingSection";
import TestimonialsSection from "@/components/homepageComponents/TestimonialsSection";
import CTASection from "@/components/homepageComponents/CTASection";
import Footer from "@/components/homepageComponents/Footer";
import KeyFeatures from "@/components/homepageComponents/KeyFeatures";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const sectionVariants = {
  hidden: {
    opacity: 0,
    y: 50,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

export default function HomePage() {
  return (
    <SessionProvider>
      <ThemeProvider>
        <motion.div
          className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={sectionVariants}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Navbar />
          </motion.div>

          <motion.div
            variants={sectionVariants}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Hero />
          </motion.div>

          <motion.div
            variants={sectionVariants}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <StatsSection />
          </motion.div>

          <motion.div
            variants={sectionVariants}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <FeaturesSection />
          </motion.div>

          <motion.div
            variants={sectionVariants}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <PricingSection />
          </motion.div>

          <motion.div
            variants={sectionVariants}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <AboutComponent />
          </motion.div>
          <motion.div
            variants={sectionVariants}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <KeyFeatures />
          </motion.div>

          <motion.div
            variants={sectionVariants}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <TestimonialsSection />
          </motion.div>

          <motion.div
            variants={sectionVariants}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <CTASection />
          </motion.div>

          <motion.div
            variants={sectionVariants}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Footer />
          </motion.div>
        </motion.div>
      </ThemeProvider>
    </SessionProvider>
  );
}
