import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getHrRecords,
  updateShifts,
  logAttendance,
  calculatePayrollIncentives,
  processPayroll,
} from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Users, DollarSign, Clock, ShieldCheck, UserCheck, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { socket } from "@/lib/socket";

export function meta() {
  return [{ title: "HR & Roster Management | MedFlow AI" }];
}

export default function HrManagement() {
  const queryClient = useQueryClient();
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [isPayrollOpen, setIsPayrollOpen] = useState(false);
  const [isRosterOpen, setIsRosterOpen] = useState(false);

  // Roster States
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [shiftsRoster, setShiftsRoster] = useState<any[]>([]);

  // Payroll States
  const [payMonth, setPayMonth] = useState("2026-05");
  const [deductions, setDeductions] = useState("0");
  const [incentivesData, setIncentivesData] = useState<any>(null);

  const { data: hrRecords = [], isLoading, refetch } = useQuery({
    queryKey: ["hrRecords"],
    queryFn: getHrRecords,
  });

  useEffect(() => {
    socket.on("notify_hr_updated", () => refetch());
    return () => {
      socket.off("notify_hr_updated");
    };
  }, [refetch]);

  // Mutations
  const rosterMutation = useMutation({
    mutationFn: ({ id, shifts }: { id: string; shifts: any[] }) => updateShifts(id, shifts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrRecords"] });
      toast.success("Weekly shift roster updated!");
      setIsRosterOpen(false);
    },
  });

  const attendanceMutation = useMutation({
    mutationFn: ({ id, checkIn, checkOut, status }: { id: string; checkIn?: string; checkOut?: string; status?: string }) =>
      logAttendance(id, { checkIn, checkOut, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrRecords"] });
      toast.success("Daily attendance logged successfully!");
    },
  });

  const payrollMutation = useMutation({
    mutationFn: ({ id, month, deductions }: { id: string; month: string; deductions: number }) =>
      processPayroll(id, { month, deductions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrRecords"] });
      toast.success("Monthly payroll successfully disbursed and logged!");
      setIsPayrollOpen(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to process payroll"),
  });

  const handleOpenRoster = (rec: any) => {
    setSelectedRecord(rec);
    setShiftsRoster(rec.shifts || []);
    setIsRosterOpen(true);
  };

  const handleShiftChange = (day: string, shiftType: string) => {
    setShiftsRoster((prev) =>
      prev.map((s) => (s.day === day ? { ...s, shiftType } : s))
    );
  };

  const handleRosterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    rosterMutation.mutate({ id: selectedRecord._id, shifts: shiftsRoster });
  };

  const handleOpenPayroll = async (rec: any) => {
    setSelectedRecord(rec);
    try {
      const data = await calculatePayrollIncentives(rec._id);
      setIncentivesData(data);
      setIsPayrollOpen(true);
    } catch (error) {
      toast.error("Failed to calculate incentives");
    }
  };

  const handlePayrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    payrollMutation.mutate({
      id: selectedRecord._id,
      month: payMonth,
      deductions: parseFloat(deductions) * 100 || 0,
    });
  };

  const getShiftColor = (type: string) => {
    switch (type) {
      case "Night":
        return "bg-indigo-50 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400";
      case "On-Call":
        return "bg-amber-50 text-amber-650 dark:bg-amber-950/20 dark:text-amber-400";
      case "Off":
        return "bg-zinc-100 text-zinc-500 dark:bg-zinc-800/40 dark:text-zinc-400";
      default:
        return "bg-blue-50 text-blue-650 dark:bg-blue-950/20 dark:text-blue-400";
    }
  };

  return (
    <div className="space-y-6 mt-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
            HR & Staff Roster Console
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            Configure employee shifts, check attendance logs, calculate doctor incentives, and run payroll cycles.
          </p>
        </div>
      </div>

      {/* Roster Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-3 text-center italic text-zinc-400">Loading staff records...</div>
        ) : hrRecords.length === 0 ? (
          <Card className="col-span-3 border border-dashed p-10 text-center text-zinc-400">No staff registered.</Card>
        ) : (
          hrRecords.map((rec) => (
            <Card key={rec._id} className="glass shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
              <CardHeader className="flex flex-row items-center gap-4 pb-3 border-b border-zinc-100 dark:border-zinc-850">
                <Avatar className="h-12 w-12 border">
                  <AvatarFallback className="font-bold text-md bg-blue-50 text-blue-600">
                    {rec.employee?.name?.split(" ").map((n: string) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-base font-bold text-zinc-850 dark:text-zinc-100">
                    {rec.employee?.name}
                  </CardTitle>
                  <CardDescription className="text-xs uppercase font-semibold text-blue-600 dark:text-blue-400">
                    Role: {rec.employee?.role} • {rec.employee?.specialization || "Operations"}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                {/* Shift Roster preview */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Shift Roster (Mon-Sun)</span>
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {rec.shifts?.slice(0, 5).map((s: any) => (
                      <div key={s.day} className="flex-1 text-center border dark:border-zinc-850 rounded-lg p-1.5 min-w-[50px] bg-zinc-50/50 dark:bg-zinc-900/30">
                        <span className="block text-[8px] font-bold text-zinc-400 uppercase">{s.day.slice(0, 3)}</span>
                        <Badge className={`text-[8px] font-bold mt-1 px-1 py-0 border ${getShiftColor(s.shiftType)}`} variant="outline">
                          {s.shiftType}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Salary details */}
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200/40 rounded-xl">
                  <div>
                    <span className="text-zinc-400 block text-[9px] uppercase">Base Salary</span>
                    <span className="font-bold text-sm text-zinc-800 dark:text-zinc-250">${(rec.baseSalary / 1200).toFixed(2)}/mo</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[9px] uppercase">Incentive Rate</span>
                    <span className="font-bold text-sm text-zinc-800 dark:text-zinc-250">{rec.incentiveRate}%</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 text-[11px] h-8 rounded-lg" onClick={() => handleOpenRoster(rec)}>
                    Update Shifts
                  </Button>
                  <Button variant="outline" className="flex-1 text-[11px] h-8 rounded-lg" onClick={() => handleOpenPayroll(rec)}>
                    Disburse Pay
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] h-8 rounded-lg"
                    onClick={() => attendanceMutation.mutate({ id: rec._id, status: "Present" })}
                  >
                    Clock In
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Roster Update Modal */}
      <Dialog open={isRosterOpen} onOpenChange={setIsRosterOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-1">
              <Calendar className="text-blue-500" /> Weekly Shift Scheduler
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRosterSubmit} className="space-y-4 pt-2">
            {shiftsRoster.map((s) => (
              <div key={s.day} className="flex items-center justify-between">
                <span className="text-sm font-semibold">{s.day}</span>
                <Select value={s.shiftType} onValueChange={(val) => handleShiftChange(s.day, val)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Day">Day</SelectItem>
                    <SelectItem value="Night">Night</SelectItem>
                    <SelectItem value="On-Call">On-Call</SelectItem>
                    <SelectItem value="Off">Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold mt-2">
              Save Weekly Roster
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payroll Modal */}
      <Dialog open={isPayrollOpen} onOpenChange={setIsPayrollOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-1.5">
              <DollarSign className="text-emerald-500" /> Disburse Payroll & Incentives
            </DialogTitle>
          </DialogHeader>
          {incentivesData && (
            <form onSubmit={handlePayrollSubmit} className="space-y-4 pt-2 text-sm">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950/20 border rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Monthly Base Salary</span>
                  <span className="font-semibold">${(incentivesData.baseSalary / 1200).toFixed(2)}</span>
                </div>
                {selectedRecord?.employee?.role === "doctor" && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Incentives ({incentivesData.consultationCount} consults)</span>
                    <span className="font-semibold text-emerald-600">+ ${(incentivesData.calculatedIncentives / 100).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="payMonth">Disbursement Month</Label>
                  <Input id="payMonth" type="month" value={payMonth} onChange={(e) => setPayMonth(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="deduct">Deductions ($)</Label>
                  <Input id="deduct" type="number" value={deductions} onChange={(e) => setDeductions(e.target.value)} required />
                </div>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold">
                Approve & Transact Payout
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
