interface TopbarProps {
  role?: string;
}

//this function returns a greeting based on the current time of day
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getRoleLabel(role?: string): string {
  if (!role) return "Admin";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function Topbar({ role }: TopbarProps) {
  const label = getRoleLabel(role);
  const initials = label.slice(0, 2).toUpperCase();

  return (
    <header className="dash-topbar flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100 shrink-0">
      <div>
        <h1 className="text-base font-semibold text-slate-800">
          {getGreeting()}, <span className="text-[#234F1E]">{label}</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">{formatDate()}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button className="relative p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
        </button>

        {/* Avatar */}
        <div className="h-9 w-9 rounded-xl bg-[#234F1E] flex items-center justify-center">
          <span className="text-[#3DED97] text-xs font-bold">{initials}</span>
        </div>
      </div>
    </header>
  );
}
