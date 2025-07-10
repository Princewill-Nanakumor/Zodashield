"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { LoginSchema } from "@/schemas/loginSchema";
import { z } from "zod";
import { FormError } from "./FormError";
import { FormSuccess } from "./FormSucess";

type LoginInput = z.infer<typeof LoginSchema>;

export default function SignInForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { remember: false },
  });

  useEffect(() => {
    if (session) router.push("/dashboard");
  }, [session, router]);

  const onSubmit: SubmitHandler<LoginInput> = async (data) => {
    setFormError("");
    setFormSuccess("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
        remember: data.remember,
      });

      if (result?.error) {
        setFormError(result.error);
      } else {
        setFormSuccess("Signed in successfully! Redirecting...");
        router.push("/dashboard");
      }
    } catch (error: unknown) {
      setFormError(
        error instanceof Error
          ? `An error occurred during sign in: ${error.message}`
          : "An unexpected error occurred during sign in"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
          Welcome Back
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
          Sign in to your account to continue
        </p>
      </div>
      <form
        className="space-y-4 sm:space-y-6"
        onSubmit={handleSubmit(onSubmit)}
      >
        <FormError
          message={
            formError || errors.email?.message || errors.password?.message
          }
        />
        <FormSuccess message={formSuccess} />
        <div className="space-y-3 sm:space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              className="pl-10 sm:pl-10 appearance-none rounded-lg relative block w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Email address"
              disabled={loading}
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              {...register("password")}
              className="pl-10 sm:pl-10 pr-10 appearance-none rounded-lg relative block w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Password"
              disabled={loading}
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center">
          <input
            id="remember"
            type="checkbox"
            {...register("remember")}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            disabled={loading}
          />
          <label
            htmlFor="remember"
            className="ml-2 block text-sm text-gray-900 dark:text-gray-200"
          >
            Remember me
          </label>
        </div>
        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2.5 sm:py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
          >
            {loading ? (
              <span className="flex items-center">
                <Loader2 className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                Signing in...
              </span>
            ) : (
              <span className="flex items-center">
                Sign in
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm space-y-2 sm:space-y-0">
          <Link
            href="/forgot-password"
            className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
          >
            Forgot your password?
          </Link>
          <Link
            href="/signup"
            className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
          >
            Create an account
          </Link>
        </div>
      </form>
    </div>
  );
}
