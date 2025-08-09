// components/homepageComponents/Footer.tsx
"use client";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-indigo-900 dark:bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Company Info */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              ZodaShield CRM
            </h3>
            <p className="text-indigo-200 max-w-md leading-relaxed">
              Transform your Excel and CSV data into actionable leads. The
              complete CRM solution for modern businesses.
            </p>
          </div>

          {/* Right Column - Contact Info */}
          <div className="space-y-8 md:text-right">
            {/* Contact Email */}
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Get in Touch</h4>
              <div className="flex items-center space-x-1 text-indigo-200 md:justify-end">
                <div className="w-5 h-5 flex-shrink-0">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <a
                  href="mailto:support@zodashield.com"
                  className="hover:text-white transition-colors"
                >
                  info@zodashield.com
                </a>
              </div>
            </div>

            {/* Support Hours */}
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Support Hours</h4>
              <div className="text-indigo-200 text-sm space-y-1">
                <p>Mon-Fri: 9AM-6PM UTC</p>
                <p>Weekend: On-demand</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-indigo-800 dark:border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-indigo-200 text-sm">
              © {currentYear} ZodaShield CRM. All rights reserved.
            </p>
            <div className="flex items-center">
              <span className="text-indigo-200 text-sm">
                Built with ❤️ for modern businesses
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
