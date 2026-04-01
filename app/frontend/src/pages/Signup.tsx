import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../lib/api";
import FormInput from "../components/FormInput";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormFields {
  schoolName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  schoolName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(fields: FormFields): FormErrors {
  const errors: FormErrors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!fields.schoolName.trim()) {
    errors.schoolName = "School name is required.";
  }

  if (!fields.email.trim()) {
    errors.email = "Email is required.";
  } else if (!emailRegex.test(fields.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!fields.password) {
    errors.password = "Password is required.";
  } else if (fields.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!fields.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (fields.password !== fields.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

// ─── Signup page ──────────────────────────────────────────────────────────────

export default function Signup() {
  const navigate = useNavigate();

  const [fields, setFields] = useState<FormFields>({
    schoolName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tenantCode, setTenantCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    // Clear the field-level error as the user types
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
      const res = await api.post("/auth/register", {
        schoolName: fields.schoolName.trim(),
        email: fields.email.trim().toLowerCase(),
        password: fields.password,
      });

      setTenantCode(res.data?.data?.tenantCode ?? null);
      setSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        const message =
          data?.error?.message ??
          data?.message ??
          "Registration failed. Please try again.";
        setApiError(String(message));
      } else {
        setApiError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── Success state ───────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-[calc(100vh-7rem)] w-full bg-[#234F1E] flex items-center justify-center px-4">
        <div className="bg-[#1a3a15]/60 border border-[#3DED97]/20 rounded-2xl px-8 py-10 max-w-sm w-full text-center shadow-2xl">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-[#3DED97]/20 flex items-center justify-center">
            <svg
              className="h-7 w-7 text-[#3DED97]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#F8F7F2] mb-2">
            Account created!
          </h2>
          {tenantCode && (
            <div className="mt-4 mb-5">
              <p className="text-[#F8F7F2]/60 text-xs mb-2">
                Your school code — save this, you'll need it to log in:
              </p>
              <div className="flex items-center gap-2 bg-[#234F1E] border border-[#3DED97]/30 rounded-lg px-4 py-2">
                <span className="flex-1 font-mono text-[#3DED97] text-sm tracking-widest">
                  {tenantCode}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(tenantCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-[#F8F7F2]/50 hover:text-[#3DED97] transition-colors text-xs"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}
          <button
            onClick={() => navigate("/login")}
            className="mt-2 w-full py-2.5 rounded-xl bg-[#3DED97] text-[#1a3a15] font-semibold text-sm hover:bg-[#3DED97]/90 transition-colors"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  // ─── Form ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-7rem)] w-full bg-[#234F1E] flex items-center justify-center px-4">
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#3DED97]/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#3DED97]/8 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / wordmark */}
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

        {/* Card */}
        <div className="bg-[#1a3a15]/70 backdrop-blur-md border border-[#3DED97]/20 rounded-2xl px-8 py-9 shadow-2xl">
          <h1 className="text-2xl font-bold text-[#F8F7F2] mb-1">
            Create your school
          </h1>
          <p className="text-[#F8F7F2]/60 text-sm mb-7">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#3DED97] hover:text-[#3DED97]/80 font-medium transition-colors"
            >
              Log in
            </Link>
          </p>

          {/* API-level error banner */}
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
              label="School Name"
              name="schoolName"
              type="text"
              autoComplete="organization"
              placeholder="e.g. Greenwood Academy"
              value={fields.schoolName}
              onChange={handleChange}
              error={errors.schoolName}
            />

            <FormInput
              label="Admin Email"
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
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              value={fields.password}
              onChange={handleChange}
              error={errors.password}
            />

            <FormInput
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={fields.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
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
                  Creating account…
                </>
              ) : (
                "Get Started"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-[#F8F7F2]/30">
          By signing up you agree to our{" "}
          <span className="text-[#F8F7F2]/50 cursor-pointer hover:text-[#F8F7F2]/70 transition-colors">
            Terms of Service
          </span>{" "}
          and{" "}
          <span className="text-[#F8F7F2]/50 cursor-pointer hover:text-[#F8F7F2]/70 transition-colors">
            Privacy Policy
          </span>
          .
        </p>
      </div>
    </div>
  );
}
