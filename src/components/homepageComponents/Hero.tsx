"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import FloatingElement from "../ui/FloatingElements";
import { FileSpreadsheet, BarChart3, Users } from "lucide-react";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    />
  );
}

// Animation variants
const heroVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      staggerChildren: 0.2,
    },
  },
};

const textVariants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

const buttonVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
  },
  hover: {
    scale: 1.05,
  },
  tap: {
    scale: 0.95,
  },
};

const featureCardVariants = {
  hidden: {
    opacity: 0,
    y: 50,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

export default function Hero() {
  const { data: session, status } = useSession();

  return (
    <motion.main
      className="max-w-7xl mx-auto px-6 py-20 relative overflow-hidden"
      variants={heroVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Design 1: Basic Floating */}
      <FloatingElement
        className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-xl"
        duration={8}
        delay={0}
        y={30}
      >
        <div className="w-full h-full bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full"></div>
      </FloatingElement>

      {/* Design 2: Rotating + Floating */}
      <motion.div
        className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl"
        animate={{
          y: [0, -25, 0],
          rotate: [0, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 6,
          delay: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-full h-full bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full"></div>
      </motion.div>

      {/* Design 3: Bouncing */}
      <motion.div
        className="absolute bottom-40 left-20 w-24 h-24 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-xl"
        animate={{
          y: [0, -40, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 4,
          delay: 1,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.5, 1],
        }}
      >
        <div className="w-full h-full bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full"></div>
      </motion.div>

      {/* Design 4: Wave Motion */}
      <motion.div
        className="absolute bottom-20 right-10 w-12 h-12 bg-gradient-to-r from-pink-400/20 to-indigo-400/20 rounded-full blur-xl"
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 7,
          delay: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-full h-full bg-gradient-to-r from-pink-400/20 to-indigo-400/20 rounded-full"></div>
      </motion.div>

      <div className="text-center relative z-10">
        <motion.h1
          className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-6"
          variants={textVariants}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          Transform Your Excel & CSV Data into Actionable Leads
        </motion.h1>

        <motion.p
          className="text-xl text-indigo-900/70 dark:text-gray-300 mb-12 max-w-2xl mx-auto"
          variants={textVariants}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          Streamline your data processing, import Excel and CSV files
          seamlessly, and manage leads efficiently with ZodaShield CRM. Turn
          your spreadsheet data into powerful customer relationships.
        </motion.p>

        <motion.div
          className="flex justify-center space-x-6 h-12"
          variants={textVariants}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {status === "loading" ? (
            <>
              <Skeleton className="h-full w-40 rounded-lg" />
              <Skeleton className="h-full w-32 rounded-lg" />
            </>
          ) : session ? (
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Link
                href="/dashboard"
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-600 dark:hover:to-purple-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
              >
                Go to Dashboard
              </Link>
            </motion.div>
          ) : (
            <>
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <Link
                  href="/signup"
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-600 dark:hover:to-purple-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                >
                  Sign up
                </Link>
              </motion.div>
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <Link
                  href="/signin"
                  className="px-8 py-3 border-2 border-indigo-600/20 dark:border-indigo-400/20 text-indigo-600 dark:text-indigo-300 rounded-lg hover:border-indigo-600/40 dark:hover:border-indigo-400/40 hover:bg-indigo-50 dark:hover:bg-gray-800 transition-all duration-200 font-medium"
                >
                  Sign In
                </Link>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>

      {/* Features Section */}
      <motion.div
        className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10"
        initial="hidden"
        animate="visible"
        transition={{
          delay: 0.8,
          staggerChildren: 0.2,
        }}
      >
        {[
          {
            icon: FileSpreadsheet,
            title: "Excel & CSV Import",
            description:
              "Import your spreadsheet data with intelligent field mapping and validation",
            color: "from-blue-500 to-cyan-500",
          },
          {
            icon: BarChart3,
            title: "Data Analytics",
            description:
              "Get insights into your imported data and sales performance",
            color: "from-green-500 to-emerald-500",
          },
          {
            icon: Users,
            title: "Team Management",
            description:
              "Collaborate with your team to process and manage imported leads",
            color: "from-purple-500 to-pink-500",
          },
        ].map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <motion.div
              key={index}
              className="text-center p-6 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              variants={featureCardVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div
                className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mx-auto mb-6 shadow-md`}
              >
                <IconComponent size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold text-indigo-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-indigo-900/70 dark:text-gray-400">
                {feature.description}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.main>
  );
}
