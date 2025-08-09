// components/homepageComponents/FeaturesSection.tsx
"use client";

export default function FeaturesSection() {
  const features = [
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
        />
      ),
      title: "Smart Import System",
      description:
        "Import Excel/CSV files with intelligent field mapping and validation. Handle thousands of records with ease.",
      features: [
        "Bulk Import",
        "Field Validation",
        "Duplicate Detection",
        "Error Reporting",
      ],
    },
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      ),
      title: "Admin & Team Management",
      description:
        "Complete admin dashboard with team management, subscription handling, and real-time analytics.",
      features: ["Usage Tracking", "Team Collaboration", "Admin Dashboard"],
    },
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      ),
      title: "Subscription & Billing",
      description:
        "Flexible subscription plans with integrated payment processing and usage-based billing.",
      features: [
        "Multiple Plans",
        "Cryptocurrenct Payment",
        "Usage Limits",
        "Auto-billing",
      ],
    },
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      ),
      title: "Status Management",
      description: "Track and manage lead statuses",
      features: [
        "Custom Status Labels",
        "Status Automation",
        "Progress Monitoring",
      ],
    },
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      ),
      title: "Security & Compliance",
      description:
        "Enterprise-grade security with data encryption, secure authentication, and compliance standards.",
      features: ["Data Encryption", "Secure Auth", "Access Control"],
    },
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      ),
      title: "High Performance",
      description:
        "Built with modern technologies for speed, reliability, and scalability to handle your growing business.",
      features: [
        "Fast Loading",
        "Real-time Updates",
        "Scalable Architecture",
        "99.9% Uptime",
      ],
    },
  ];

  return (
    <section className="py-20 bg-white/30 dark:bg-gray-800/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-6">
            Powerful Features for Modern Business
          </h2>
          <p className="text-xl text-indigo-900/70 dark:text-gray-300 max-w-3xl mx-auto">
            Everything you need to manage leads, handle subscriptions, and grow
            your business efficiently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-gray-700 group"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-400/20 dark:to-purple-400/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-7 h-7 text-indigo-600 dark:text-indigo-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {feature.icon}
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-indigo-900 dark:text-white mb-4">
                {feature.title}
              </h3>
              <p className="text-indigo-900/70 dark:text-gray-400 mb-6">
                {feature.description}
              </p>
              <ul className="space-y-2">
                {feature.features.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className="flex items-center text-sm text-indigo-900/80 dark:text-gray-300"
                  >
                    <div className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full mr-3"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
