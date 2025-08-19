// components/homepageComponents/FeaturesSection.tsx
"use client";

import { motion } from "framer-motion";
import { memo } from "react";

// Define the Feature interface
interface Feature {
  icon: string;
  title: string;
  description: string;
  features: string[];
  color: string;
}

// Define the features array with proper typing
const features: Feature[] = [
  {
    icon: "📊",
    title: "Smart Import System",
    description:
      "Import Excel/CSV files with intelligent field mapping and validation. Handle thousands of records with ease.",
    features: [
      "Bulk Import",
      "Field Validation",
      "Duplicate Detection",
      "Error Reporting",
    ],
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: "👥",
    title: "Admin & Team Management",
    description:
      "Complete admin dashboard with team management, subscription handling, and real-time analytics.",
    features: ["Usage Tracking", "Team Collaboration", "Admin Dashboard"],
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: "💳",
    title: "Subscription & Billing",
    description:
      "Flexible subscription plans with integrated payment processing and usage-based billing.",
    features: [
      "Multiple Plans",
      "Cryptocurrency Payment",
      "Usage Limits",
      "Auto-billing",
    ],
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: "📈",
    title: "Status Management",
    description: "Track and manage lead statuses",
    features: [
      "Custom Status Labels",
      "Status Automation",
      "Progress Monitoring",
    ],
    color: "from-orange-500 to-red-500",
  },
  {
    icon: "🔒",
    title: "Security & Compliance",
    description:
      "Enterprise-grade security with data encryption, secure authentication, and compliance standards.",
    features: ["Data Encryption", "Secure Auth", "Access Control"],
    color: "from-indigo-500 to-blue-500",
  },
  {
    icon: "⚡",
    title: "High Performance",
    description:
      "Built with modern technologies for speed, reliability, and scalability to handle your growing business.",
    features: [
      "Fast Loading",
      "Real-time Updates",
      "Scalable Architecture",
      "99.9% Uptime",
    ],
    color: "from-teal-500 to-green-500",
  },
];

// Animation variants with proper typing
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
} as const;

const iconVariants = {
  hidden: { scale: 0, rotate: -90 },
  visible: { scale: 1, rotate: 0 },
} as const;

// Props interface for FeatureCard
interface FeatureCardProps {
  feature: Feature;
  index: number;
}

// Memoized feature card with proper typing
const FeatureCard = memo<FeatureCardProps>(({ feature, index }) => (
  <motion.div
    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 will-change-transform"
    variants={cardVariants}
    transition={{ duration: 0.5, ease: "easeOut" }}
    whileHover={{ y: -8, transition: { duration: 0.3 } }}
  >
    <motion.div
      className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6`}
      variants={iconVariants}
      transition={{
        type: "spring",
        stiffness: 300,
        delay: 0.2,
      }}
    >
      <span className="text-2xl" role="img" aria-label={feature.title}>
        {feature.icon}
      </span>
    </motion.div>
    <h3 className="text-xl font-semibold text-indigo-900 dark:text-white mb-4">
      {feature.title}
    </h3>
    <p className="text-indigo-900/70 dark:text-gray-400 mb-6">
      {feature.description}
    </p>
    <ul className="space-y-2">
      {feature.features.map((item, itemIndex) => (
        <motion.li
          key={`${feature.title}-feature-${itemIndex}`}
          className="flex items-center text-sm text-indigo-900/80 dark:text-gray-300"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.05 + itemIndex * 0.03 }}
        >
          <div className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full mr-3" />
          {item}
        </motion.li>
      ))}
    </ul>
  </motion.div>
));

FeatureCard.displayName = "FeatureCard";

export default memo(function FeaturesSection() {
  return (
    <section className="py-20 bg-white/30 dark:bg-gray-800/30">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-6">
            Powerful Features for Modern Business
          </h2>
          <p className="text-xl text-indigo-900/70 dark:text-gray-300 max-w-3xl mx-auto">
            Everything you need to manage leads, handle subscriptions, and grow
            your business efficiently.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
            <FeatureCard
              key={`feature-${feature.title}-${index}`}
              feature={feature}
              index={index}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
});
