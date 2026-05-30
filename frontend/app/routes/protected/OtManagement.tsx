import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSurgeries,
  createSurgery,
  updateSurgeryStatus,
  updateSurgeryDetails,
  getUsers,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, ShieldCheck, ClipboardList, PlusCircle, Activity, HeartPulse } from "lucide-react";
import { toast } from "sonner";
import { socket } from "@/lib/socket";

export function meta() {
  return [{ title: "OT & Surgery Management | MedFlow AI" }];
}

export default function OtManagement() {
  const queryClient = useQueryClient();
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedSurgery, setSelectedSurgery] = useState<any>(null);

  // Form states
  const [patientId, setPatientId] = useState("");
  const [otRoom, setOtRoom] = useState("");
  const [procedure, setProcedure] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [anesthesiologist, setAnesthesiologist] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");

  // Details Edit States
  const [signIn, setSignIn] = useState(false);
  const [timeOut, setTimeOut] = useState(false);
  const [signOut, setSignOut] = useState(false);
  const [anesthesiaType, setAnesthesiaType] = useState("");
  const [agentUsed, setAgentUsed] = useState("");
  const [dosage, setDosage] = useState("");
  const [implantName, setImplantName] = useState("");
  const [implantSerial, setImplantSerial] = useState("");
  const [bloodLoss, setBloodLoss] = useState("");
  const [postOp, setPostOp] = useState("");

  const { data: surgeries = [], isLoading, refetch } = useQuery({
    queryKey: ["surgeries"],
    queryFn: getSurgeries,
  });

  const { data: patientsData } = useQuery({
    queryKey: ["users", "patient"],
    queryFn: () => getUsers({ role: "patient", limit: 100 }),
  });
  const patients = patientsData?.res || [];

  useEffect(() => {
    socket.on("notify_surgeries_updated", () => refetch());
    return () => {
      socket.off("notify_surgeries_updated");
    };
  }, [refetch]);

  const scheduleMutation = useMutation({
    mutationFn: createSurgery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surgeries"] });
      toast.success("Surgery successfully scheduled!");
      setIsScheduleOpen(false);
      setPatientId("");
      setOtRoom("");
      setProcedure("");
      setDate("");
      setTime("");
      setAnesthesiologist("");
      setChargeAmount("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to schedule"),
  });

  const detailsMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateSurgeryDetails(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surgeries"] });
      toast.success("WHO safety checks and clinical logs updated!");
      setIsDetailsOpen(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to update details"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateSurgeryStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surgeries"] });
      toast.success("Surgery status successfully updated!");
    },
  });

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !otRoom || !procedure || !date || !time) {
      toast.error("Please fill in all scheduling fields");
      return;
    }
    scheduleMutation.mutate({
      patientId,
      otRoom,
      procedure,
      date,
      time,
      anesthesiologistName: anesthesiologist,
      chargeAmount: chargeAmount ? parseFloat(chargeAmount) * 100 : undefined,
    });
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSurgery) return;

    const implants = implantName
      ? [{ name: implantName, serialNumber: implantSerial, manufacturer: "Medtronic" }]
      : [];

    detailsMutation.mutate({
      id: selectedSurgery._id,
      data: {
        checklist: { signIn, timeOut, signOut },
        implants,
        anesthesiaRecord: {
          anesthesiaType,
          agentUsed,
          dosage,
        },
        procedureNotes: {
          bloodLossMl: parseInt(bloodLoss) || 0,
          postOpInstructions: postOp,
        },
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "in-progress":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse";
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
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
            OT & Surgical Command Workspace
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            Schedule surgical operations, monitor OT suites, and verify clinical WHO safety checklists.
          </p>
        </div>

        <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl gap-1.5 shadow-md">
              <PlusCircle size={16} /> Schedule Surgery
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-1.5">
                <Calendar className="text-blue-500" /> Schedule Surgery Suite
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleScheduleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="surgPatient">Patient</Label>
                <Select value={patientId} onValueChange={setPatientId}>
                  <SelectTrigger id="surgPatient">
                    <SelectValue placeholder="Choose patient" />
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
                  <Label htmlFor="otRoom">OT Room / Suite</Label>
                  <Input
                    id="otRoom"
                    placeholder="e.g. Suite A"
                    value={otRoom}
                    onChange={(e) => setOtRoom(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="procedure">Procedure Name</Label>
                  <Input
                    id="procedure"
                    placeholder="e.g. Angioplasty"
                    value={procedure}
                    onChange={(e) => setProcedure(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="surgDate">Date</Label>
                  <Input
                    id="surgDate"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="surgTime">Time</Label>
                  <Input
                    id="surgTime"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="anesthesiologist">Anesthesiologist</Label>
                  <Input
                    id="anesthesiologist"
                    placeholder="Dr. Emily Vance"
                    value={anesthesiologist}
                    onChange={(e) => setAnesthesiologist(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="charge">Surgical Charge ($)</Label>
                  <Input
                    id="charge"
                    type="number"
                    placeholder="e.g. 750"
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(e.target.value)}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
                disabled={scheduleMutation.isPending}
              >
                Confirm Surgical Schedule
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid view of OT list */}
      <Card className="card shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 overflow-hidden rounded-xl">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-850 pb-4">
          <CardTitle className="text-lg">Surgical Schedule & Progress Monitor</CardTitle>
          <CardDescription>Verify safety checklists, log implants, and track anesthesia dosage.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6 font-bold">OT Suite</TableHead>
                <TableHead className="font-bold">Patient</TableHead>
                <TableHead className="font-bold">Surgeon</TableHead>
                <TableHead className="font-bold">Procedure</TableHead>
                <TableHead className="font-bold text-center">Safety Checks</TableHead>
                <TableHead className="font-bold text-center">Status</TableHead>
                <TableHead className="text-right pr-6 font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-zinc-400 italic">
                    Loading surgeries schedule...
                  </TableCell>
                </TableRow>
              ) : surgeries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-zinc-400 italic">
                    No active surgeries scheduled in OT suites.
                  </TableCell>
                </TableRow>
              ) : (
                surgeries.map((surg) => {
                  const checkCount = [surg.checklist?.signIn, surg.checklist?.timeOut, surg.checklist?.signOut].filter(Boolean).length;
                  return (
                    <TableRow key={surg._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30 transition-colors">
                      <TableCell className="pl-6 font-bold text-sm text-blue-600 dark:text-blue-450">
                        {surg.otRoom}
                      </TableCell>
                      <TableCell className="font-semibold text-zinc-800 dark:text-zinc-150">
                        {surg.patient?.name}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {surg.surgeon?.name}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-zinc-900 dark:text-white">{surg.procedure}</span>
                          <span className="text-xs text-zinc-400">
                            {new Date(surg.date).toLocaleDateString()} • {surg.time}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-xs gap-1 ${checkCount === 3 ? "bg-emerald-50 text-emerald-600 border-emerald-300" : "bg-amber-50 text-amber-600 border-amber-300"}`}>
                          <ShieldCheck size={12} /> {checkCount}/3 checks verified
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`border uppercase text-[9px] ${getStatusColor(surg.status)}`}>
                          {surg.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1.5">
                          {surg.status === "scheduled" && (
                            <Button
                              size="sm"
                              onClick={() => statusMutation.mutate({ id: surg._id, status: "in-progress" })}
                              className="bg-blue-600 hover:bg-blue-700 text-xs h-8"
                            >
                              Start
                            </Button>
                          )}
                          {surg.status === "in-progress" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedSurgery(surg);
                                setSignIn(surg.checklist?.signIn || false);
                                setTimeOut(surg.checklist?.timeOut || false);
                                setSignOut(surg.checklist?.signOut || false);
                                setAnesthesiaType(surg.anesthesiaRecord?.anesthesiaType || "");
                                setAgentUsed(surg.anesthesiaRecord?.agentUsed || "");
                                setDosage(surg.anesthesiaRecord?.dosage || "");
                                setImplantName(surg.implants?.[0]?.name || "");
                                setImplantSerial(surg.implants?.[0]?.serialNumber || "");
                                setBloodLoss(surg.procedureNotes?.bloodLossMl?.toString() || "");
                                setPostOp(surg.procedureNotes?.postOpInstructions || "");
                                setIsDetailsOpen(true);
                              }}
                              className="bg-amber-500 hover:bg-amber-650 text-xs h-8"
                            >
                              Log Details
                            </Button>
                          )}
                          {surg.status === "in-progress" && (
                            <Button
                              size="sm"
                              onClick={() => statusMutation.mutate({ id: surg._id, status: "completed" })}
                              className="bg-emerald-600 hover:bg-emerald-700 text-xs h-8"
                            >
                              Complete
                            </Button>
                          )}
                          {surg.status !== "completed" && surg.status !== "cancelled" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => statusMutation.mutate({ id: surg._id, status: "cancelled" })}
                              className="text-rose-500 hover:text-rose-700 text-xs h-8"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Log Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-1.5">
              <ClipboardList className="text-blue-500" /> Log Surgical clinical details
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDetailsSubmit} className="space-y-4 pt-2">
            {/* WHO checklist */}
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-wider text-zinc-400 block">WHO Surgical Checklist</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={signIn} onCheckedChange={(val) => setSignIn(!!val)} />
                  Sign In
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={timeOut} onCheckedChange={(val) => setTimeOut(!!val)} />
                  Time Out
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={signOut} onCheckedChange={(val) => setSignOut(!!val)} />
                  Sign Out
                </label>
              </div>
            </div>

            {/* Anesthesia logs */}
            <div className="space-y-2 border-t border-zinc-150 dark:border-zinc-800 pt-3">
              <Label className="font-bold text-xs uppercase tracking-wider text-zinc-400 block">Anesthesia Record</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="anesType" className="text-xs">Type</Label>
                  <Input id="anesType" placeholder="General" value={anesthesiaType} onChange={(e) => setAnesthesiaType(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="anesAgent" className="text-xs">Agent</Label>
                  <Input id="anesAgent" placeholder="Propofol" value={agentUsed} onChange={(e) => setAgentUsed(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="anesDose" className="text-xs">Dosage</Label>
                  <Input id="anesDose" placeholder="200mg" value={dosage} onChange={(e) => setDosage(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Implant tracking */}
            <div className="space-y-2 border-t border-zinc-150 dark:border-zinc-800 pt-3">
              <Label className="font-bold text-xs uppercase tracking-wider text-zinc-400 block">Implant Tracking</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="impName" className="text-xs">Implant Name</Label>
                  <Input id="impName" placeholder="Stent" value={implantName} onChange={(e) => setImplantName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="impSerial" className="text-xs">Serial Number</Label>
                  <Input id="impSerial" placeholder="SN-89725" value={implantSerial} onChange={(e) => setImplantSerial(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Procedure details */}
            <div className="space-y-2 border-t border-zinc-150 dark:border-zinc-800 pt-3">
              <Label className="font-bold text-xs uppercase tracking-wider text-zinc-400 block">Procedure Summary</Label>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="bloodLoss" className="text-xs">Blood Loss (ml)</Label>
                  <Input id="bloodLoss" type="number" placeholder="50" value={bloodLoss} onChange={(e) => setBloodLoss(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="postOp" className="text-xs">Post-Op Care Instructions</Label>
                  <Textarea id="postOp" placeholder="Monitor SPO2 level closely. Pain management schedule." value={postOp} onChange={(e) => setPostOp(e.target.value)} />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
              disabled={detailsMutation.isPending}
            >
              {detailsMutation.isPending ? "Saving..." : "Save Surgical Logs"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
