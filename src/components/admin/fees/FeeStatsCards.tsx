import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, AlertTriangle } from "lucide-react";

interface Props {
  totalDue: number;
  totalPaid: number;
  zigRate: number;
}

const FeeStatsCards = ({ totalDue, totalPaid, zigRate }: Props) => {
  const outstanding = totalDue - totalPaid;
  const collectionRate = totalDue > 0 ? ((totalPaid / totalDue) * 100) : 0;

  const stats = [
    { label: "Total Billed", usd: totalDue, icon: DollarSign, color: "text-primary" },
    { label: "Collected", usd: totalPaid, icon: TrendingUp, color: "text-green-600" },
    { label: "Outstanding", usd: outstanding, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className={`p-3 rounded-lg bg-muted ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">${s.usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">ZIG {(s.usd * zigRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="p-3 rounded-lg bg-muted text-primary">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">{collectionRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Collection Rate</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeeStatsCards;
