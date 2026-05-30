import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAppointments,
  bookAppointment,
  bookWalkIn,
  updateAppointmentStatus,
  logVitals,
  getUsers,
} from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Clock, Plus, Search, HeartPulse, ShieldAlert, Sparkles, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { socket } from "@/lib/socket";

export function meta() {
  return [{ title: "OPD Appointments & Queue | MedFlow AI" }];
}

export default function Appointments() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isVitalsOpen, setIsVitalsOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);

  // Form states
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  
  // Vitals states
  const [bp, setBp] = useState("");
  const [pulse, setPulse] = useState("");
  const [temp, setTemp] = useState("");
  const [spo2, setSpo2] = useState("");

  const { data: appointments = [], isLoading, refetch } = useQuery({
    queryKey: ["appointments"],
    queryFn: getAppointments,
  });

  const { data: patientsData } = useQuery({
    queryKey: ["users", "patient"],
    queryFn: () => getUsers({ role: "patient", limit: 100 }),
  });
  const patients = patientsData?.res || [];

  const { data: doctorsData } = useQuery({
    queryKey: ["users", "doctor"],
    queryFn: () => getUsers({ role: "doctor", limit: 100 }),
  });
  const doctors = doctorsData?.res || [];

  useEffect(() => {
    socket.on("notify_appointment_updated", () => refetch());
    socket.on("notify_appointment_added", () => refetch());
    return () => {
      socket.off("notify_appointment_updated");
      socket.off("notify_appointment_added");
    };
  }, [refetch]);

  const bookMutation = useMutation({
    mutationFn: bookAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment successfully booked!");
      setIsBookOpen(false);
      setPatientId("");
      setDate("");
      setTime("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to book"),
  });

  const vitalsMutation = useMutation({
    mutationFn: ({ id, vitals }: { id: string; vitals: any }) => logVitals(id, vitals),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Vitals logged successfully!");
      setIsVitalsOpen(false);
      setBp("");
      setPulse("");
      setTemp("");
      setSpo2("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to log vitals"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateAppointmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Status updated!");
    },
  });

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !date || !time) {
      toast.error("Please fill in all fields");
      return;
    }
    // Select the first doctor as default for demo simplicity
    const doctorId = doctors[0]?._id;
    if (!doctorId) {
      toast.error("No doctors available to assign");
      return;
    }
    bookMutation.mutate({ patientId, doctorId, date, time });
  };

  const handleVitalsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;
    vitalsMutation.mutate({
      id: selectedAppt._id,
      vitals: {
        bp,
        pulse: parseInt(pulse) || undefined,
        temp: parseFloat(temp) || undefined,
        spo2: parseInt(spo2) || undefined,
      },
    });
  };

  const filtered = appointments.filter((a) => {
    const patName = a.patient?.name?.toLowerCase() || "";
    const docName = a.doctor?.name?.toLowerCase() || "";
    const term = search.toLowerCase();
    return patName.includes(term) || docName.includes(term) || a.tokenNumber?.toLowerCase().includes(term);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "in-progress":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "cancelled":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      default:
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    }
  };

  return (
    <div className="space-y-6 mt-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            OPD Scheduling & Queue
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            Manage consultations, walk-in tokens, and nursing vitals checks.
          </p>
        </div>

        <Dialog open={isBookOpen} onOpenChange={setIsBookOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md rounded-xl font-bold flex items-center gap-1.5 transition-transform hover:scale-[1.02]">
              <Plus size={16} /> Schedule Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-1.5">
                <CalendarDays className="text-blue-500" /> Book Appointment
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleBookSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="patientSelect">Select Patient</Label>
                <Select value={patientId} onValueChange={setPatientId}>
                  <SelectTrigger id="patientSelect">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="time">Time Slot</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
                disabled={bookMutation.isPending}
              >
                {bookMutation.isPending ? "Booking..." : "Confirm Booking"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Queue Today</p>
              <h3 className="text-2xl font-black mt-1 text-zinc-800 dark:text-zinc-100">{appointments.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl">
              <Clock size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Completed</p>
              <h3 className="text-2xl font-black mt-1 text-zinc-800 dark:text-zinc-100">
                {appointments.filter((a) => a.status === "completed").length}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl">
              <UserCheck size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">In Progress</p>
              <h3 className="text-2xl font-black mt-1 text-zinc-800 dark:text-zinc-100">
                {appointments.filter((a) => a.status === "in-progress").length}
              </h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
              <Sparkles size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Awaiting Vitals</p>
              <h3 className="text-2xl font-black mt-1 text-zinc-800 dark:text-zinc-100">
                {appointments.filter((a) => !a.preOpVitals?.bp && a.status === "scheduled").length}
              </h3>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl">
              <HeartPulse size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="card shadow-sm rounded-xl overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-850">
          <div>
            <CardTitle className="text-lg">Daily Appointments Worklist</CardTitle>
            <CardDescription>Real-time queue tracking for attending physicians and triage nurses.</CardDescription>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <Input
              type="text"
              placeholder="Search by patient name, token..."
              className="pl-10 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6 font-bold">Token</TableHead>
                <TableHead className="font-bold">Patient</TableHead>
                <TableHead className="font-bold">Doctor</TableHead>
                <TableHead className="font-bold text-center">Date & Time</TableHead>
                <TableHead className="font-bold">Triage Vitals</TableHead>
                <TableHead className="font-bold text-center">Status</TableHead>
                <TableHead className="text-right pr-6 font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-zinc-400 italic">
                    Loading appointments...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-zinc-400 italic">
                    No active appointments scheduled.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((appt) => (
                  <TableRow key={appt._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <TableCell className="pl-6 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {appt.tokenNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-zinc-150">
                          <AvatarFallback className="font-bold text-xs bg-indigo-50 text-indigo-600">
                            {appt.patient?.name?.split(" ").map((n: string) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            {appt.patient?.name}
                          </span>
                          <span className="text-[10px] text-zinc-450">
                            {appt.patient?.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm text-zinc-700 dark:text-zinc-300">
                      {appt.doctor?.name || "General OPD"}
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium text-zinc-650 dark:text-zinc-400">
                      <span className="block">{new Date(appt.date).toLocaleDateString()}</span>
                      <span className="text-xs text-zinc-400">{appt.time}</span>
                    </TableCell>
                    <TableCell>
                      {appt.preOpVitals?.bp ? (
                        <div className="text-xs space-y-0.5">
                          <p className="font-semibold text-zinc-700 dark:text-zinc-300">BP: {appt.preOpVitals.bp}</p>
                          <p className="text-zinc-500">Pulse: {appt.preOpVitals.pulse} • Spo2: {appt.preOpVitals.spo2}%</p>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAppt(appt);
                            setIsVitalsOpen(true);
                          }}
                          className="h-8 border-rose-200 text-rose-600 hover:bg-rose-50 text-xs rounded-lg flex items-center gap-1"
                        >
                          <HeartPulse size={12} /> Log Triage Vitals
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`border uppercase text-[9px] ${getStatusColor(appt.status)}`}>
                        {appt.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1.5">
                        {appt.status === "scheduled" && (
                          <Button
                            size="sm"
                            onClick={() => statusMutation.mutate({ id: appt._id, status: "in-progress" })}
                            className="bg-blue-600 hover:bg-blue-700 text-xs h-8"
                          >
                            Call Patient
                          </Button>
                        )}
                        {appt.status === "in-progress" && (
                          <Button
                            size="sm"
                            onClick={() => statusMutation.mutate({ id: appt._id, status: "completed" })}
                            className="bg-emerald-600 hover:bg-emerald-700 text-xs h-8"
                          >
                            Complete
                          </Button>
                        )}
                        {appt.status !== "completed" && appt.status !== "cancelled" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => statusMutation.mutate({ id: appt._id, status: "cancelled" })}
                            className="text-rose-500 hover:text-rose-700 text-xs h-8"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Log Vitals Modal */}
      <Dialog open={isVitalsOpen} onOpenChange={setIsVitalsOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-1.5">
              <HeartPulse className="text-rose-500" /> Log Patient Vitals
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleVitalsSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="bp">Blood Pressure</Label>
                <Input
                  id="bp"
                  placeholder="e.g. 120/80"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pulse">Pulse (bpm)</Label>
                <Input
                  id="pulse"
                  type="number"
                  placeholder="e.g. 72"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="temp">Temp (°F)</Label>
                <Input
                  id="temp"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 98.6"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="spo2">Oxygen SpO2 (%)</Label>
                <Input
                  id="spo2"
                  type="number"
                  placeholder="e.g. 98"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-700 font-bold"
              disabled={vitalsMutation.isPending}
            >
              {vitalsMutation.isPending ? "Saving..." : "Save Vitals Check-in"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
