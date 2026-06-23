import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Props {
  records: any[];
  getStudentName: (id: string) => string;
}

const COLORS = ["hsl(142, 76%, 36%)", "hsl(0, 84%, 60%)", "hsl(221, 83%, 53%)", "hsl(45, 93%, 47%)"];

const FeeCharts = ({ records, getStudentName }: Props) => {
  // Collection by term
  const termData = ["term_1", "term_2", "term_3"].map((t) => {
    const termRecords = records.filter((r) => r.term === t);
    return {
      term: t.replace("_", " ").toUpperCase(),
      billed: termRecords.reduce((s, r) => s + Number(r.amount_due), 0),
      collected: termRecords.reduce((s, r) => s + Number(r.amount_paid), 0),
    };
  });

  // Payment method breakdown
  const methodMap: Record<string, number> = {};
  records.forEach((r) => {
    const m = (r as any).payment_method || "cash";
    methodMap[m] = (methodMap[m] || 0) + Number(r.amount_paid);
  });
  const methodData = Object.entries(methodMap)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.replace("_", " ").toUpperCase(), value: Math.round(value) }));

  // Status breakdown
  const totalPaid = records.filter((r) => Number(r.amount_due) - Number(r.amount_paid) <= 0).length;
  const totalOwing = records.length - totalPaid;
  const statusData = [
    { name: "Fully Paid", value: totalPaid },
    { name: "Owing", value: totalOwing },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">Collection by Term</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={termData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="term" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="billed" fill="hsl(221, 83%, 53%)" name="Billed" />
              <Bar dataKey="collected" fill="hsl(142, 76%, 36%)" name="Collected" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Payment Status</CardTitle></CardHeader>
        <CardContent className="flex justify-center">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                <Cell fill="hsl(142, 76%, 36%)" />
                <Cell fill="hsl(0, 84%, 60%)" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {methodData.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Payment Methods Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={methodData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis type="category" dataKey="name" fontSize={12} width={100} />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Bar dataKey="value" fill="hsl(221, 83%, 53%)" name="Amount ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FeeCharts;
