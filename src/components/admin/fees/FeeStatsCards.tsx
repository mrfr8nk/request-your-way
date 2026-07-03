import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, AlertTriangle, Percent } from "lucide-react";

interface Props {
  totalDue: number;
  totalPaid: number;
  zigRate: number;
}

const FeeStatsCards = ({ totalDue, totalPaid, zigRate }: Props) => {
  const outstanding = totalDue - totalPaid;
  const collectionRate = totalDue > 0 ? ((totalPaid / totalDue) * 100) : 0;

  const stats = [
    {
      label: "Total Billed",
      usd: totalDue,
      icon: DollarSign,
      grad: "from-slate-900 via-slate-800 to-slate-900",
      accent: "text-amber-300",
      ring: "ring-amber-300/20",
    },
    {
      label: "Collected",
      usd: totalPaid,
      icon: TrendingUp,
      grad: "from-emerald-900 via-emerald-800 to-emerald-950",
      accent: "text-emerald-200",
      ring: "ring-emerald-300/20",
    },
    {
      label: "Outstanding",
      usd: outstanding,
      icon: AlertTriangle,
      grad: "from-rose-900 via-rose-800 to-rose-950",
      accent: "text-rose-200",
      ring: "ring-rose-300/20",
    },
  ];

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card
          key={s.label}
          className={`relative overflow-hidden border-0 text-white bg-gradient-to-br ${s.grad} shadow-lg ring-1 ${s.ring} transition-transform hover:-translate-y-0.5 hover:shadow-xl`}
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute right-4 top-4 opacity-10">
            <s.icon className="w-20 h-20" />
          </div>
          <CardContent className="relative p-5">
            <div className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] font-semibold ${s.accent}`}>
              <s.icon className="w-3.5 h-3.5" /> {s.label}
            </div>
            <p className="text-3xl font-bold mt-3 font-display tracking-tight">${fmt(s.usd)}</p>
            <p className="text-xs text-white/60 mt-1">
              ZIG {(s.usd * zigRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
      ))}
      <Card className="relative overflow-hidden border-0 text-white bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 shadow-lg ring-1 ring-indigo-300/20 transition-transform hover:-translate-y-0.5 hover:shadow-xl">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute right-4 top-4 opacity-10"><Percent className="w-20 h-20" /></div>
        <CardContent className="relative p-5">
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] font-semibold text-indigo-200">
            <Percent className="w-3.5 h-3.5" /> Collection Rate
          </div>
          <p className="text-3xl font-bold mt-3 font-display tracking-tight">{collectionRate.toFixed(1)}%</p>
          <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-300 to-emerald-300 transition-all"
              style={{ width: `${Math.min(100, collectionRate)}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeeStatsCards;
