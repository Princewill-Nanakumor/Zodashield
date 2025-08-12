"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function CTASection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
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
    hidden: { opacity: 0, scale: 0.8 },
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

  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 rounded-3xl p-12 text-white shadow-2xl"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-6"
            variants={itemVariants}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            Ready to Transform Your Lead Management?
          </motion.h2>

          <motion.p
            className="text-xl mb-8 opacity-90 max-w-2xl mx-auto"
            variants={itemVariants}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            Join thousands of businesses using ZodaShield to streamline their
            operations, manage subscriptions, and grow their customer base
            efficiently.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            variants={itemVariants}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Link
                href="/signup"
                className="px-8 py-4 bg-white text-indigo-600 rounded-lg hover:bg-gray-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                Start Free Trial
              </Link>
            </motion.div>
          </motion.div>

          <motion.p
            className="text-sm opacity-75 mt-6"
            variants={itemVariants}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            No credit card required • 3-day free trial • Setup in minutes
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
