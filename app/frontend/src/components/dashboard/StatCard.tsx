import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  sub: string;
  iconBg: string;
  iconColor: string;
  trend?: "up" | "down" | "neutral";
}

export default function StatCard({
  icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
  trend = "neutral",
}: StatCardProps) {
  const trendColor =
    trend === "up"
      ? "text-emerald-600"
      : trend === "down"
        ? "text-rose-500"
        : "text-slate-400";

  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";

  return (
    <div className="dash-statcard bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-default">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`h-11 w-11 rounded-xl ${iconBg} flex items-center justify-center`}
        >
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800 mb-1">{value}</p>
      <p className="text-sm font-medium text-slate-500 mb-2">{label}</p>
      <p className={`text-xs font-medium ${trendColor}`}>
        {trendIcon} {sub}
      </p>
    </div>
  );
}
