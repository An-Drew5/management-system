import { Link, useLocation } from "react-router-dom";

// Arrow-head SVG shaped like the letter A
function ArrowheadA() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Arrowhead triangle pointing up */}
      <polygon points="14,2 26,26 2,26" fill="#1a1a1a" />
      {/* Crossbar cut-out (the A crossbar) */}
      <rect x="7.5" y="18" width="13" height="2.5" fill="#3DED97" rx="1" />
    </svg>
  );
}

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Sign Up", to: "/signup" },
  { label: "Login", to: "/login" },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full bg-[#1c3e18]/90 backdrop-blur-md border-b border-[#3DED97]/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 select-none group"
          aria-label="Arrow home"
        >
          <ArrowheadA />
          <span className="text-[#F8F7F2] font-extrabold text-lg tracking-tight">
            rrow
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map(({ label, to }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={[
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150",
                  active
                    ? "text-[#3DED97] bg-[#3DED97]/10"
                    : "text-[#F8F7F2]/70 hover:text-[#F8F7F2] hover:bg-[#F8F7F2]/5",
                ].join(" ")}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* CTA */}
        <Link
          to="/signup"
          className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl bg-[#3DED97] hover:bg-[#2fd984] text-[#1a3a15] text-sm font-semibold transition-colors duration-150"
        >
          Get Started
        </Link>

        {/* Mobile hamburger placeholder — links still accessible via page buttons */}
        <div className="sm:hidden flex items-center gap-3">
          <Link
            to="/login"
            className="text-[#F8F7F2]/70 hover:text-[#F8F7F2] text-sm font-medium transition-colors"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-3 py-1.5 rounded-xl bg-[#3DED97] hover:bg-[#2fd984] text-[#1a3a15] text-sm font-semibold transition-colors"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
