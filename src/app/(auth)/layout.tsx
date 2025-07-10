import { Inter } from "next/font/google";
import { Shield } from "lucide-react";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 ${inter.className}`}
    >
      <div className="w-full max-w-lg px-4">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-md">
              <Shield size={35} className="text-white" />
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              ZodaShield
            </div>
          </Link>
        </div>

        {children}
      </div>
    </div>
  );
}
