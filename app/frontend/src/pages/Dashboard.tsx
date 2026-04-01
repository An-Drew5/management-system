import { useEffect, useRef } from "react";
import gsap from "gsap";
import DashboardLayout from "../layout/DashboardLayout";
import Topbar from "../components/dashboard/Topbar";
import StatCard from "../components/dashboard/StatCard";

// ─── JWT decode (no library needed) ─────────────────────────────────────────
function getTokenPayload(): { role?: string } | null {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

// ─── Mock data ──────────────────────────────────────────────────────────────
const studentsAtRisk = [
  {
    id: 1,
    name: "Amara Johnson",
    subject: "Mathematics",
    grade: "6B",
    severity: "critical",
  },
  {
    id: 2,
    name: "Ryan Carter",
    subject: "English",
    grade: "9A",
    severity: "warning",
  },
  {
    id: 3,
    name: "Sofia Mensah",
    subject: "Physics",
    grade: "11C",
    severity: "warning",
  },
  {
    id: 4,
    name: "James Osei",
    subject: "Chemistry",
    grade: "10B",
    severity: "critical",
  },
  {
    id: 5,
    name: "Lily Huang",
    subject: "History",
    grade: "7A",
    severity: "warning",
  },
];

// ─── Stat icons ──────────────────────────────────────────────────────────────
const StudentIcon = (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const AttendanceIcon = (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const PerformanceIcon = (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

// ─── Dashboard ───────────────────────────────────────────────────────────────
export default function Dashboard() {
  const payload = getTokenPayload();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".dash-sidebar", { x: -32, opacity: 0, duration: 0.55 })
        .from(".dash-topbar", { y: -16, opacity: 0, duration: 0.4 }, "-=0.25")
        .from(
          ".dash-statcard",
          { y: 28, opacity: 0, duration: 0.45, stagger: 0.1 },
          "-=0.15",
        )
        .from(".dash-attention", { y: 20, opacity: 0, duration: 0.4 }, "-=0.2");
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="contents">
      <DashboardLayout>
        <Topbar role={payload?.role} />

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto px-8 py-7">
          {/* Page heading */}
          <div className="mb-7">
            <h2 className="text-lg font-semibold text-slate-800">Overview</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Here's what's happening in your school today.
            </p>
          </div>

          {/* ── Stat Cards ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <StatCard
              icon={StudentIcon}
              label="Total Students"
              value="1,248"
              sub="12 enrolled this month"
              iconBg="bg-blue-50"
              iconColor="text-blue-500"
              trend="up"
            />
            <StatCard
              icon={AttendanceIcon}
              label="Attendance Rate"
              value="94.3%"
              sub="0.8% above last week"
              iconBg="bg-emerald-50"
              iconColor="text-emerald-500"
              trend="up"
            />
            <StatCard
              icon={PerformanceIcon}
              label="Avg Performance"
              value="78%"
              sub="2% below last term"
              iconBg="bg-amber-50"
              iconColor="text-amber-500"
              trend="down"
            />
          </div>

          {/* ── Students Needing Attention ──────────────────────────────── */}
          <div className="dash-attention bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Students Needing Attention
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Flagged based on recent assessments
                </p>
              </div>
              <span className="text-xs font-semibold bg-rose-50 text-rose-500 px-2.5 py-1 rounded-full">
                {studentsAtRisk.length} students
              </span>
            </div>

            <div className="divide-y divide-slate-50">
              {/* Table header */}
              <div className="grid grid-cols-12 px-6 py-2.5 bg-slate-50/60">
                <span className="col-span-5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  Student
                </span>
                <span className="col-span-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  Weak Subject
                </span>
                <span className="col-span-2 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  Class
                </span>
                <span className="col-span-2 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  Status
                </span>
              </div>

              {/* Rows */}
              {studentsAtRisk.map((s) => (
                <div
                  key={s.id}
                  className="grid grid-cols-12 px-6 py-3.5 items-center hover:bg-slate-50/60 transition-colors"
                >
                  {/* Avatar + name */}
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-slate-500">
                        {s.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {s.name}
                    </span>
                  </div>

                  {/* Subject */}
                  <span className="col-span-3 text-sm text-slate-500">
                    {s.subject}
                  </span>

                  {/* Class */}
                  <span className="col-span-2 text-sm text-slate-500">
                    {s.grade}
                  </span>

                  {/* Badge */}
                  <div className="col-span-2">
                    {s.severity === "critical" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        Critical
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        At Risk
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </DashboardLayout>
    </div>
  );
}
