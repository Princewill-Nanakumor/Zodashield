"use client";

import { motion } from "framer-motion";
import {
  Users,
  FileSpreadsheet,
  Zap,
  Search,
  BarChart3,
  UserPlus,
  RotateCcw,
  Download,
  FileText,
  Tag,
  Filter,
  CheckCircle,
  UserCheck,
  Bell,
} from "lucide-react";

export default function KeyFeatures() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const featureVariants = {
    hidden: {
      opacity: 0,
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  const features = [
    {
      name: "Lead & Contact Management",
      icon: Users,
      color: "from-blue-500 to-cyan-500",
    },
    {
      name: "Bulk Excel/CSV Import",
      icon: FileSpreadsheet,
      color: "from-green-500 to-emerald-500",
    },
    {
      name: "Automated Workflows",
      icon: Zap,
      color: "from-yellow-500 to-orange-500",
    },
    {
      name: "Duplicate Detection",
      icon: Search,
      color: "from-purple-500 to-pink-500",
    },
    {
      name: "Real-time Analytics",
      icon: BarChart3,
      color: "from-indigo-500 to-blue-500",
    },
    {
      name: "Multi-user Collaboration",
      icon: UserPlus,
      color: "from-teal-500 to-green-500",
    },
    {
      name: "Bulk Operations",
      icon: RotateCcw,
      color: "from-red-500 to-pink-500",
    },
    {
      name: "Data Export (Excel/CSV)",
      icon: Download,
      color: "from-blue-500 to-indigo-500",
    },
    {
      name: "Activity Logging",
      icon: FileText,
      color: "from-gray-500 to-slate-500",
    },
    {
      name: "Custom Status",
      icon: Tag,
      color: "from-purple-500 to-violet-500",
    },
    {
      name: "Search & Filtering",
      icon: Filter,
      color: "from-cyan-500 to-blue-500",
    },
    {
      name: "Data Validation",
      icon: CheckCircle,
      color: "from-green-500 to-teal-500",
    },
    {
      name: "Lead Assignment",
      icon: UserCheck,
      color: "from-indigo-500 to-purple-500",
    },
    {
      name: "Reminders & Notifications",
      icon: Bell,
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <section className="py-20 bg-white/30 dark:bg-gray-800/30">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-6">
            Key CRM Features
          </h2>
          <p className="text-lg text-indigo-900/70 dark:text-gray-300 max-w-2xl mx-auto">
            Discover the essential features that make ZodaShield CRM the perfect
            solution for your business needs.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={index}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300"
                variants={featureVariants}
                transition={{ duration: 0.4, ease: "easeOut" }}
                whileHover={{
                  y: -5,
                  scale: 1.02,
                  transition: { duration: 0.3 },
                }}
              >
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mr-4 shadow-md`}
                  >
                    <IconComponent size={20} className="text-white" />
                  </div>
                  <p className="text-indigo-900 dark:text-white font-medium">
                    {feature.name}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
