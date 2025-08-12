"use client";

import { motion } from "framer-motion";

export default function Footer() {
  const currentYear = new Date().getFullYear();

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

  const itemVariants = {
    hidden: {
      opacity: 0,
      x: -20,
    },
    visible: {
      opacity: 1,
      x: 0,
    },
  };

  const bottomVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <motion.footer
      className="bg-indigo-900 dark:bg-gray-900 text-white py-16"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Footer Content */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
          variants={sectionVariants}
          transition={{ duration: 0.6 }}
        >
          {/* Left Column - Company Info */}
          <motion.div
            className="space-y-4"
            variants={sectionVariants}
            transition={{ duration: 0.6 }}
          >
            <motion.h3
              className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent"
              variants={itemVariants}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              ZodaShield CRM
            </motion.h3>
            <motion.p
              className="text-indigo-200 max-w-md leading-relaxed"
              variants={itemVariants}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            >
              Transform your Excel and CSV data into actionable leads. The
              complete CRM solution for modern businesses.
            </motion.p>
          </motion.div>

          {/* Right Column - Contact Info */}
          <motion.div
            className="space-y-8 md:text-right"
            variants={sectionVariants}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Contact Email */}
            <motion.div
              className="space-y-4"
              variants={itemVariants}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <h4 className="font-semibold text-white">Get in Touch</h4>
              <motion.div
                className="flex items-center space-x-1 text-indigo-200 md:justify-end"
                whileHover={{
                  x: 5,
                  transition: { duration: 0.3 },
                }}
              >
                <motion.div
                  className="w-5 h-5 flex-shrink-0"
                  whileHover={{
                    rotate: 360,
                    transition: { duration: 0.6 },
                  }}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </motion.div>
                <a
                  href="mailto:support@zodashield.com"
                  className="hover:text-white transition-colors"
                >
                  support@zodashield.com
                </a>
              </motion.div>
            </motion.div>

            {/* Support Hours */}
            <motion.div
              className="space-y-4"
              variants={itemVariants}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            >
              <h4 className="font-semibold text-white">Support Hours</h4>
              <motion.div
                className="text-indigo-200 text-sm space-y-1"
                variants={itemVariants}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              >
                <p>Mon-Fri: 9AM-6PM UTC</p>
                <p>Weekend: On-demand</p>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          className="border-t border-indigo-800 dark:border-gray-800 pt-8"
          variants={bottomVariants}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <motion.p
              className="text-indigo-200 text-sm"
              variants={itemVariants}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              © {currentYear} ZodaShield CRM. All rights reserved.
            </motion.p>
            <motion.div
              className="flex items-center"
              variants={itemVariants}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            >
              <span className="text-indigo-200 text-sm">
                Built with ❤️ for modern businesses
              </span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
}
