"use client";

export default function AboutComponent() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-20">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-6">
          About ZodaShield CRM
        </h1>
        <p className="text-xl text-indigo-900/70 dark:text-gray-300 max-w-3xl mx-auto">
          ZodaShield is a cutting-edge CRM platform engineered to revolutionize
          how businesses interact with and manage their spreadsheet data. It
          offers a comprehensive suite of features, from intelligent Excel/CSV
          data import to advanced analytics, automation, and seamless team
          collaboration. ZodaShield empowers organizations to cultivate robust
          customer relationships and significantly accelerate business growth.
        </p>
      </div>

      {/* Mission Section */}
      <section className="mb-16">
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
      </section>

      {/* What We Do Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-indigo-900 dark:text-white mb-8 text-center">
          What Makes ZodaShield CRM Different?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-400/20 dark:to-purple-400/20 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-indigo-600 dark:text-indigo-300"
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
              Complete Lead & Customer Management
            </h3>
            <p className="text-indigo-900/70 dark:text-gray-300">
              Capture, organize, and nurture leads from multiple sources. Track
              every interaction, manage contacts, and convert prospects into
              loyal customers—all in one CRM platform.
            </p>
          </div>

          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-400/20 dark:to-purple-400/20 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-indigo-600 dark:text-indigo-300"
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
              Sales Pipeline & Automation
            </h3>
            <p className="text-indigo-900/70 dark:text-gray-300">
              Visualize your sales pipeline, automate repetitive tasks, and move
              deals forward with customizable workflows, reminders, and
              follow-ups.
            </p>
          </div>

          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-400/20 dark:to-purple-400/20 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-indigo-600 dark:text-indigo-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
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
          </div>

          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-400/20 dark:to-purple-400/20 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-indigo-600 dark:text-indigo-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
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
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-indigo-900 dark:text-white mb-8 text-center">
          Key CRM Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            "Lead & Contact Management",
            "Sales Pipeline Tracking",
            "Bulk Excel/CSV Import",
            "Automated Workflows",
            "Duplicate Detection",
            "Real-time Analytics",
            "Multi-user Collaboration",
            "Bulk Operations",
            "Data Export (Excel/CSV)",
            "Activity Logging",
            "Custom Status & Tags",
            "Search & Filtering",
            "Mobile Responsive",
            "Data Validation",
            "Lead Assignment",
            "Reminders & Notifications",
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg rounded-xl p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full mb-3"></div>
              <p className="text-indigo-900 dark:text-white font-medium">
                {feature}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="mb-16">
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-indigo-900 dark:text-white mb-6">
            Built with Modern Technology
          </h2>
          <p className="text-lg text-indigo-900/70 dark:text-gray-300 mb-6">
            ZodaShield CRM is built using cutting-edge technologies to ensure
            reliable data processing, security, and performance for your
            business needs.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <div
                key={index}
                className="text-center p-4 bg-white/20 dark:bg-gray-700/20 rounded-lg border-1"
              >
                <p className="font-semibold text-indigo-900 dark:text-white">
                  {tech.name}
                </p>
                <p className="text-sm text-indigo-900/60 dark:text-gray-400">
                  {tech.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Customer Relationships?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of businesses that trust ZodaShield CRM to manage
            leads, automate sales, and grow their customer base.
          </p>
        </div>
      </section>
    </main>
  );
}
