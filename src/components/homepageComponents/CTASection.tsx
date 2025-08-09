// components/homepageComponents/CTASection.tsx
"use client";

import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 rounded-3xl p-12 text-white shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Lead Management?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of businesses using ZodaShield to streamline their
            operations, manage subscriptions, and grow their customer base
            efficiently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-white text-indigo-600 rounded-lg hover:bg-gray-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
            >
              Start Free Trial
            </Link>
          </div>
          <p className="text-sm opacity-75 mt-6">
            No credit card required • 3-day free trial • Setup in minutes
          </p>
        </div>
      </div>
    </section>
  );
}
