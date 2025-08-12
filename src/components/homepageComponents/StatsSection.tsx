"use client";

import { motion } from "framer-motion";

export default function StatsSection() {
  const stats = [
    {
      number: "900,000+",
      label: "Leads Processed",
      description: "Successfully imported and managed",
    },
    {
      number: "500+",
      label: "Happy Customers",
      description: "Businesses using our platform",
    },
    {
      number: "99.9%",
      label: "Uptime",
      description: "Reliable service you can count on",
    },
    {
      number: "100%",
      label: "Crypto Payment",
      description: "Secure blockchain transactions",
    },
  ];

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

  const statVariants = {
    hidden: {
      opacity: 0,
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  const numberVariants = {
    hidden: { scale: 0 },
    visible: {
      scale: 1,
    },
  };

  return (
    <section className="py-16 bg-white/20 dark:bg-gray-800/20">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="text-center"
              variants={statVariants}
              transition={{ duration: 0.6, ease: "easeOut" }}
              whileHover={{
                y: -5,
                transition: { duration: 0.3 },
              }}
            >
              <motion.div
                className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2"
                variants={numberVariants}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  delay: 0.3,
                }}
              >
                {stat.number}
              </motion.div>
              <div className="text-lg font-semibold text-indigo-900 dark:text-white mb-1">
                {stat.label}
              </div>
              <div className="text-sm text-indigo-900/70 dark:text-gray-400">
                {stat.description}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
