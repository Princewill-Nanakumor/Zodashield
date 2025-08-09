// components/homepageComponents/TestimonialsSection.tsx
"use client";

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Sales Director",
      company: "TechStart Inc",
      image: "SJ",
      content:
        "ZodaShield transformed how we handle our lead data. The import feature saved us countless hours, and the analytics help us make better decisions.",
    },
    {
      name: "Michael Chen",
      role: "Operations Manager",
      company: "Growth Solutions",
      image: "MC",
      content:
        "The subscription management and team features are exactly what we needed. Our productivity has increased by 40% since switching to ZodaShield.",
    },
    {
      name: "Emily Rodriguez",
      role: "Marketing Lead",
      company: "Digital Ventures",
      image: "ER",
      content:
        "Excellent platform with outstanding support. The bulk import functionality handles our large datasets perfectly, and the interface is intuitive.",
    },
  ];

  return (
    <section className="py-10 bg-white/30 dark:bg-gray-800/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-6">
            What Our Customers Say
          </h2>
          <p className="text-xl text-indigo-900/70 dark:text-gray-300 max-w-2xl mx-auto">
            Don&ldquo;t just take our word for it. Here&ldquo;s what businesses
            say about ZodaShield.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-4">
                  {testimonial.image}
                </div>
                <div>
                  <div className="font-semibold text-indigo-900 dark:text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-indigo-900/70 dark:text-gray-400">
                    {testimonial.role}
                  </div>
                  <div className="text-sm text-indigo-600 dark:text-indigo-400">
                    {testimonial.company}
                  </div>
                </div>
              </div>
              <blockquote className="text-indigo-900/80 dark:text-gray-300 italic">
                &ldquo;{testimonial.content}&ldquo;
              </blockquote>
              <div className="flex text-yellow-400 mt-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
