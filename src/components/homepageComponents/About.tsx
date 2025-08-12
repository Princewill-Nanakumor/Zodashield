"use client";

import { motion } from "framer-motion";

export default function AboutComponent() {
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
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
  };

  const techVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
    },
    visible: {
      opacity: 1,
      scale: 1,
    },
  };

  return (
    <motion.main
      className="max-w-7xl mx-auto px-6 py-16"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      {/* Hero Section */}
      <motion.div
        className="text-center mb-16"
        variants={sectionVariants}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-6">
          About ZodaShield CRM
        </h2>
        <p className="text-xl text-indigo-900/70 dark:text-gray-300 max-w-3xl mx-auto">
          ZodaShield is a cutting-edge CRM platform engineered to revolutionize
          how businesses interact with and manage their spreadsheet data. It
          offers a comprehensive suite of features, from intelligent Excel/CSV
          data import to advanced analytics, automation, and seamless team
          collaboration. ZodaShield empowers organizations to cultivate robust
          customer relationships and significantly accelerate business growth.
        </p>
      </motion.div>

      {/* Mission Section */}
      <motion.section
        className="mb-16"
        variants={sectionVariants}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-indigo-900 dark:text-white mb-6">
            Our Mission
          </h2>
          <p className="text-lg text-indigo-900/70 dark:text-gray-300 leading-relaxed">
            At ZodaShield, our mission is to help businesses of all sizes build
            lasting customer relationships and maximize sales efficiency. We
            provide a comprehensive CRM solution that streamlines lead capture,
            automates workflows, and delivers actionable insights—so you can
            focus on what matters most: growing your business.
          </p>
        </div>
      </motion.section>

      {/* What We Do Section */}
      <motion.section
        className="mb-16"
        variants={sectionVariants}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold text-indigo-900 dark:text-white mb-8 text-center">
          What Makes ZodaShield CRM Different?
        </h2>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{
            staggerChildren: 0.1,
            delayChildren: 0.2,
          }}
        >
          <motion.div
            className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700"
            variants={cardVariants}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-indigo-900 dark:text-white mb-3">
              Complete Lead & Customer Management
            </h3>
            <p className="text-indigo-900/70 dark:text-gray-300">
              Capture, organize, and nurture leads from multiple sources. Track
              every interaction, manage contacts, and convert prospects into
              loyal customers—all in one CRM platform.
            </p>
          </motion.div>

          <motion.div
            className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700"
            variants={cardVariants}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-indigo-900 dark:text-white mb-3">
              Sales Pipeline & Automation
            </h3>
            <p className="text-indigo-900/70 dark:text-gray-300">
              Visualize your sales pipeline, automate repetitive tasks, and move
              deals forward with customizable workflows, reminders, and
              follow-ups.
            </p>
          </motion.div>

          <motion.div
            className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700"
            variants={cardVariants}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-indigo-900 dark:text-white mb-3">
              Team Collaboration
            </h3>
            <p className="text-indigo-900/70 dark:text-gray-300">
              Collaborate with your team, assign leads, share notes, and track
              activities. ZodaShield CRM keeps everyone on the same page for
              better customer engagement.
            </p>
          </motion.div>

          <motion.div
            className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700"
            variants={cardVariants}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-indigo-900 dark:text-white mb-3">
              Analytics & Insights
            </h3>
            <p className="text-indigo-900/70 dark:text-gray-300">
              Get real-time analytics on your leads, sales, and team
              performance. Make data-driven decisions with visual dashboards and
              detailed reports.
            </p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Technology Stack Section */}
      <motion.section
        className="mb-16"
        variants={sectionVariants}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-indigo-900 dark:text-white mb-6">
            Built with Modern Technology
          </h2>
          <p className="text-lg text-indigo-900/70 dark:text-gray-300 mb-6">
            ZodaShield CRM is built using cutting-edge technologies to ensure
            reliable data processing, security, and performance for your
            business needs.
          </p>
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{
              staggerChildren: 0.1,
              delayChildren: 0.2,
            }}
          >
            {[
              { name: "Next.js", desc: "React Framework" },
              { name: "TypeScript", desc: "Type Safety" },
              { name: "MongoDB", desc: "Database" },
              { name: "Tailwind CSS", desc: "Styling" },
              { name: "NextAuth.js", desc: "Authentication" },
              { name: "React Query", desc: "Data Fetching" },
              { name: "Zustand", desc: "State Management" },
              { name: "Excel/CSV", desc: "Data Processing" },
            ].map((tech, index) => (
              <motion.div
                key={index}
                className="text-center p-4 bg-white/20 dark:bg-gray-700/20 rounded-lg border-1"
                variants={techVariants}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <p className="font-semibold text-indigo-900 dark:text-white">
                  {tech.name}
                </p>
                <p className="text-sm text-indigo-900/60 dark:text-gray-400">
                  {tech.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>
    </motion.main>
  );
}
