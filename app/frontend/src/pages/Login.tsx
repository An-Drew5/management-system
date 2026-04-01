import { Link } from "react-router-dom";
import FormInput from "../components/FormInput";
import { useState, type FormEvent } from "react";
import axios from "axios";
import api from "../lib/api";

interface FormFields {
  tenantCode: string;
  email: string;
  password: string;
}

interface FormErrors {
  tenantCode?: string;
  email?: string;
  password?: string;
}

function validate(fields: FormFields): FormErrors {
  const errors: FormErrors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!fields.tenantCode.trim()) {
    errors.tenantCode = "School code is required.";
  }

  if (!fields.email.trim()) {
    errors.email = "Email is required.";
  } else if (!emailRegex.test(fields.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!fields.password) {
    errors.password = "Password is required.";
  }

  return errors;
}

export default function Login() {
  const [fields, setFields] = useState<FormFields>({
    tenantCode: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setApiError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const fieldErrors = validate(fields);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const res = await api.post("/auth/login", {
        tenantCode: fields.tenantCode.trim().toLowerCase(),
        email: fields.email.trim().toLowerCase(),
        password: fields.password,
      });

      const token: string = res.data?.data?.token ?? res.data?.token;
      if (token) {
        localStorage.setItem("token", token);
      }
      window.location.href = "/dashboard";
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        const message =
          data?.error?.message ??
          data?.message ??
          "Login failed. Check your credentials.";
        setApiError(String(message));
      } else {
        setApiError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-7rem)] w-full bg-[#234F1E] flex items-center justify-center px-4">
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#3DED97]/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#3DED97]/8 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 text-[#F8F7F2] font-bold text-xl">
            <span className="h-8 w-8 rounded-lg bg-[#3DED97] flex items-center justify-center text-sm font-black text-[#1a3a15]">
              A
            </span>
            Arrow
          </span>
          <p className="mt-1 text-[#F8F7F2]/50 text-sm">
            School Management Platform
          </p>
        </div>

        <div className="bg-[#1a3a15]/70 backdrop-blur-md border border-[#3DED97]/20 rounded-2xl px-8 py-9 shadow-2xl">
          <h1 className="text-2xl font-bold text-[#F8F7F2] mb-1">
            Welcome back
          </h1>
          <p className="text-[#F8F7F2]/60 text-sm mb-7">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-[#3DED97] hover:text-[#3DED97]/80 font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>

          {apiError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400"
            >
              <svg
                className="mt-0.5 h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <FormInput
              label="School Code"
              name="tenantCode"
              type="text"
              autoComplete="organization"
              placeholder="e.g. GWA"
              value={fields.tenantCode}
              onChange={handleChange}
              error={errors.tenantCode}
            />
            <FormInput
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="admin@school.edu"
              value={fields.email}
              onChange={handleChange}
              error={errors.email}
            />
            <FormInput
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              value={fields.password}
              onChange={handleChange}
              error={errors.password}
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-[#3DED97] hover:bg-[#2fd984] disabled:opacity-60 disabled:cursor-not-allowed text-[#1a3a15] font-semibold text-sm py-3.5 transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Signing in…
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
