import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBIMetrics } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Bed,
  Users,
  BrainCircuit,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
} from "lucide-react";
import { socket } from "@/lib/socket";

export function meta() {
  return [{ title: "Analytics & Operational BI | MedFlow AI" }];
}

const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899"];

export default function AnalyticsBi() {
  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ["biMetrics"],
    queryFn: getBIMetrics,
  });

  useEffect(() => {
    socket.on("notify_invoice_added", () => refetch());
    socket.on("notify_ward_updated", () => refetch());
    socket.on("notify_prescription_added", () => refetch());
    return () => {
      socket.off("notify_invoice_added");
      socket.off("notify_ward_updated");
      socket.off("notify_prescription_added");
    };
  }, [refetch]);

  if (isLoading || !metrics) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] italic text-zinc-400">
        Loading BI dashboard telemetry...
      </div>
    );
  }

  const { revenueStats, bedOccupancy, doctorProductivity, diseaseTrends, aiSummary } = metrics;

  return (
    <div className="space-y-6 mt-6 pb-20">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          Operations BI & Analytics
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">
          Predictive hospital metrics, financial performance, and clinical flow diagnostics.
        </p>
      </div>

      {/* AI Operational Insights */}
      <Card className="glass border border-indigo-200/50 dark:border-indigo-900/40 shadow-md relative overflow-hidden bg-gradient-to-br from-indigo-50/30 to-blue-50/20 dark:from-indigo-950/10 dark:to-blue-950/10 rounded-2xl">
        <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="p-3 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-sm">
            <BrainCircuit size={28} className="animate-pulse" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1">
                <Sparkles size={10} /> AI Clinical Copilot Analysis
              </Badge>
              <span className="text-[10px] text-indigo-450 font-bold uppercase tracking-wider">Live Telemetry Report</span>
            </div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-250 leading-relaxed">
              {aiSummary}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Realized Revenue</p>
              <h3 className="text-2xl font-black mt-1 text-zinc-800 dark:text-zinc-100">
                ${(revenueStats.totalPaid / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5 mt-1">
                <TrendingUp size={12} /> +12.4% vs last month
              </span>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl">
              <DollarSign size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Outstanding Invoices</p>
              <h3 className="text-2xl font-black mt-1 text-zinc-800 dark:text-zinc-100">
                ${(revenueStats.totalPending / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
              <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5 mt-1">
                <TrendingDown size={12} /> Needs reconciliation
              </span>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-650 rounded-2xl">
              <DollarSign size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Bed Occupancy Rate</p>
              <h3 className="text-2xl font-black mt-1 text-zinc-800 dark:text-zinc-100">
                {bedOccupancy.occupancyRate}%
              </h3>
              <span className="text-[10px] text-zinc-450 mt-1 block">
                {bedOccupancy.occupiedBeds} of {bedOccupancy.totalBeds} beds active
              </span>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl">
              <Bed size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Clinicians On Shift</p>
              <h3 className="text-2xl font-black mt-1 text-zinc-800 dark:text-zinc-100">
                {doctorProductivity.length}
              </h3>
              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5 mt-1">
                <ArrowUpRight size={12} /> Full roster covered
              </span>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl">
              <Users size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recharts Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card className="card shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl overflow-hidden">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-850 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <BarChart3 className="text-blue-500" /> Revenue Growth Trend
            </CardTitle>
            <CardDescription>Monthly aggregated OPD consults & IPD ward receipts.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueStats.monthlyRevenue}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} />
                  <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bed occupancy per ward */}
        <Card className="card shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl overflow-hidden">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-850 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <Bed className="text-rose-500" /> Ward-Wise Bed Occupancy
            </CardTitle>
            <CardDescription>Distribution of active inpatient beds against total layout capacity.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bedOccupancy.wardOccupancy}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="total" name="Total Beds" fill="#e4e4e7" radius={[4, 4, 0, 0]} className="dark:fill-zinc-800" />
                  <Bar dataKey="occupied" name="Occupied Beds" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Doctor productivity */}
        <Card className="card shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl overflow-hidden">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-850 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <Users className="text-indigo-500" /> Clinician Consultation Volume
            </CardTitle>
            <CardDescription>Consultations completed by attending medical specialists.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={doctorProductivity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                  <XAxis type="number" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={10} width={100} tickLine={false} />
                  <Tooltip formatter={(value) => [value, "Completed SOAP Consults"]} />
                  <Bar dataKey="consultations" name="Consultations" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Disease ICD-10 breakdown */}
        <Card className="card shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl overflow-hidden">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-850 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <TrendingUp className="text-amber-500" /> Top Diagnostic Diseases ICD-10
            </CardTitle>
            <CardDescription>Epidemiological mapping based on active prescription records.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-72 flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={diseaseTrends}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {diseaseTrends.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, "Cases"]} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
