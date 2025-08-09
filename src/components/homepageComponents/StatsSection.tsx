// components/homepageComponents/StatsSection.tsx
"use client";

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

  return (
    <section className="py-16 bg-white/20 dark:bg-gray-800/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                {stat.number}
              </div>
              <div className="text-lg font-semibold text-indigo-900 dark:text-white mb-1">
                {stat.label}
              </div>
              <div className="text-sm text-indigo-900/70 dark:text-gray-400">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
