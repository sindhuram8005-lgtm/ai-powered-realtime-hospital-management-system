import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWards,
  allocateBed,
  transferBed,
  dischargePatient,
  getUsers,
} from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bed, ArrowLeftRight, LogOut, CheckCircle, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { socket } from "@/lib/socket";

export function meta() {
  return [{ title: "IPD Wards & Beds Management | MedFlow AI" }];
}

export default function IpdManagement() {
  const queryClient = useQueryClient();
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isDischargeOpen, setIsDischargeOpen] = useState(false);

  // Active operations selections
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedWardId, setSelectedWardId] = useState("");
  const [selectedBedNumber, setSelectedBedNumber] = useState("");

  // Transfer states
  const [transferFromWardId, setTransferFromWardId] = useState("");
  const [transferFromBed, setTransferFromBed] = useState("");
  const [transferToWardId, setTransferToWardId] = useState("");
  const [transferToBed, setTransferToBed] = useState("");

  // Discharge states
  const [dischargeSummary, setDischargeSummary] = useState("");

  const { data: wards = [], isLoading, refetch } = useQuery({
    queryKey: ["wards"],
    queryFn: getWards,
  });

  const { data: patientsData } = useQuery({
    queryKey: ["users", "patient"],
    queryFn: () => getUsers({ role: "patient", limit: 100 }),
  });
  const patients = patientsData?.res || [];

  // Filter patients that need bed allocation (admitted but no bed allocated yet)
  const patientsNeedAllocation = patients.filter(
    (p) => p.status === "admitted" && !p.allocatedBed
  );

  // Filter patients currently occupied in beds
  const admittedPatients = patients.filter((p) => p.status === "admitted" && p.allocatedBed);

  useEffect(() => {
    socket.on("notify_ward_updated", () => refetch());
    socket.on("notify_user_updated", () => refetch());
    return () => {
      socket.off("notify_ward_updated");
      socket.off("notify_user_updated");
    };
  }, [refetch]);

  const allocateMutation = useMutation({
    mutationFn: allocateBed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wards"] });
      queryClient.invalidateQueries({ queryKey: ["users", "patient"] });
      toast.success("Patient successfully allocated to bed!");
      setIsAllocateOpen(false);
      setSelectedPatientId("");
      setSelectedWardId("");
      setSelectedBedNumber("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to allocate bed"),
  });

  const transferMutation = useMutation({
    mutationFn: transferBed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wards"] });
      queryClient.invalidateQueries({ queryKey: ["users", "patient"] });
      toast.success("Bed transfer completed successfully!");
      setIsTransferOpen(false);
      setSelectedPatientId("");
      setTransferFromWardId("");
      setTransferFromBed("");
      setTransferToWardId("");
      setTransferToBed("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to transfer bed"),
  });

  const dischargeMutation = useMutation({
    mutationFn: dischargePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wards"] });
      queryClient.invalidateQueries({ queryKey: ["users", "patient"] });
      toast.success("Patient successfully discharged. Pending draft invoice finalized.");
      setIsDischargeOpen(false);
      setSelectedPatientId("");
      setDischargeSummary("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to discharge"),
  });

  const handleAllocateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedWardId || !selectedBedNumber) {
      toast.error("Please fill in all allocation fields");
      return;
    }
    allocateMutation.mutate({
      patientId: selectedPatientId,
      wardId: selectedWardId,
      bedNumber: selectedBedNumber,
    });
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !transferFromWardId || !transferFromBed || !transferToWardId || !transferToBed) {
      toast.error("Please fill in all transfer fields");
      return;
    }
    transferMutation.mutate({
      patientId: selectedPatientId,
      fromWardId: transferFromWardId,
      fromBedNumber: transferFromBed,
      toWardId: transferToWardId,
      toBedNumber: transferToBed,
    });
  };

  const handleDischargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !dischargeSummary) {
      toast.error("Please provide a clinical discharge summary");
      return;
    }
    dischargeMutation.mutate({
      patientId: selectedPatientId,
      dischargeSummary,
    });
  };

  // Find available beds for a selected ward
  const activeWardObj = wards.find((w) => w._id === selectedWardId);
  const availableBeds = activeWardObj?.beds.filter((b: any) => b.status === "available") || [];

  const transferToWardObj = wards.find((w) => w._id === transferToWardId);
  const transferToAvailableBeds = transferToWardObj?.beds.filter((b: any) => b.status === "available") || [];

  // Get occupying user name
  const getUserName = (id?: string) => {
    if (!id) return "Unknown";
    const found = patients.find((p) => p._id === id);
    return found ? found.name : "Occupied";
  };

  return (
    <div className="space-y-6 mt-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
            IPD Inpatient Wards Console
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            Monitor bed occupancy rates, allocate wards, and trigger patient transfers or discharges.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Allocate dialog */}
          <Dialog open={isAllocateOpen} onOpenChange={setIsAllocateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl gap-1.5 shadow-sm">
                <Bed size={16} /> Allocate Bed
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-1.5">
                  <Bed className="text-blue-500" /> Allocate Bed
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAllocateSubmit} className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label htmlFor="allocPatient">Patient awaiting allocation</Label>
                  <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                    <SelectTrigger id="allocPatient">
                      <SelectValue placeholder="Choose admitted patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patientsNeedAllocation.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="allocWard">Target Ward</Label>
                    <Select value={selectedWardId} onValueChange={setSelectedWardId}>
                      <SelectTrigger id="allocWard">
                        <SelectValue placeholder="Choose ward" />
                      </SelectTrigger>
                      <SelectContent>
                        {wards.map((w) => (
                          <SelectItem key={w._id} value={w._id}>
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="allocBed">Available Bed</Label>
                    <Select value={selectedBedNumber} onValueChange={setSelectedBedNumber} disabled={!selectedWardId}>
                      <SelectTrigger id="allocBed">
                        <SelectValue placeholder="Choose bed" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBeds.map((b: any) => (
                          <SelectItem key={b.bedNumber} value={b.bedNumber}>
                            {b.bedNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
                  disabled={allocateMutation.isPending}
                >
                  Confirm Bed Allocation
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Transfer Dialog */}
          <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 font-bold rounded-xl gap-1.5 shadow-sm">
                <ArrowLeftRight size={16} /> Transfer Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-1.5">
                  <ArrowLeftRight className="text-blue-500" /> Transfer Patient Bed
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleTransferSubmit} className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label htmlFor="transPatient">Select Occupying Patient</Label>
                  <Select
                    value={selectedPatientId}
                    onValueChange={(val) => {
                      setSelectedPatientId(val);
                      const pat = patients.find((p) => p._id === val);
                      if (pat) {
                        setTransferFromBed(pat.allocatedBed);
                        // Find ward ID from ward name
                        const wd = wards.find((w) => w.name === pat.allocatedWard);
                        if (wd) setTransferFromWardId(wd._id);
                      }
                    }}
                  >
                    <SelectTrigger id="transPatient">
                      <SelectValue placeholder="Choose patient in bed" />
                    </SelectTrigger>
                    <SelectContent>
                      {admittedPatients.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.name} ({p.allocatedWard} - {p.allocatedBed})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>From Ward</Label>
                    <Input value={wards.find((w) => w._id === transferFromWardId)?.name || "Current Ward"} disabled />
                  </div>
                  <div className="space-y-1">
                    <Label>From Bed</Label>
                    <Input value={transferFromBed} disabled />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="transToWard">Destination Ward</Label>
                    <Select value={transferToWardId} onValueChange={setTransferToWardId}>
                      <SelectTrigger id="transToWard">
                        <SelectValue placeholder="Choose ward" />
                      </SelectTrigger>
                      <SelectContent>
                        {wards.map((w) => (
                          <SelectItem key={w._id} value={w._id}>
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="transToBed">Available Bed</Label>
                    <Select value={transferToBed} onValueChange={setTransferToBed} disabled={!transferToWardId}>
                      <SelectTrigger id="transToBed">
                        <SelectValue placeholder="Choose bed" />
                      </SelectTrigger>
                      <SelectContent>
                        {transferToAvailableBeds.map((b: any) => (
                          <SelectItem key={b.bedNumber} value={b.bedNumber}>
                            {b.bedNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
                  disabled={transferMutation.isPending}
                >
                  Process Ward Bed Transfer
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Discharge Dialog */}
          <Dialog open={isDischargeOpen} onOpenChange={setIsDischargeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl gap-1.5 shadow-sm">
                <LogOut size={16} /> Discharge Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-1.5 text-rose-600">
                  <LogOut /> Discharge Inpatient
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleDischargeSubmit} className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label htmlFor="disPatient">Select Patient to Discharge</Label>
                  <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                    <SelectTrigger id="disPatient">
                      <SelectValue placeholder="Choose patient in bed" />
                    </SelectTrigger>
                    <SelectContent>
                      {admittedPatients.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.name} ({p.allocatedBed})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="disSummary">Clinical Discharge Summary</Label>
                  <Textarea
                    id="disSummary"
                    placeholder="Patient recovered, vitals stable, prescribed follow-up medications..."
                    value={dischargeSummary}
                    onChange={(e) => setDischargeSummary(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-rose-650 hover:bg-rose-700 font-bold text-white"
                  disabled={dischargeMutation.isPending}
                >
                  Finalize Discharge & Release Bed
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Ward Occupancy Map (Grids) */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center italic text-zinc-400">Loading wards status...</div>
        ) : (
          wards.map((ward) => {
            const occupied = ward.beds.filter((b: any) => b.status === "occupied").length;
            const rate = Math.round((occupied / ward.beds.length) * 100);

            return (
              <Card key={ward._id} className="card shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-850 pb-4">
                  <div>
                    <CardTitle className="text-lg font-black text-zinc-800 dark:text-zinc-150">
                      {ward.name}
                    </CardTitle>
                    <CardDescription className="text-xs uppercase font-semibold text-zinc-400">
                      Category: {ward.type} WARD
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs bg-zinc-50 border-zinc-250/30">
                      Occupancy: {occupied} / {ward.beds.length} beds ({rate}%)
                    </Badge>
                    <div className="w-24 bg-zinc-150 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${rate > 80 ? "bg-rose-500" : rate > 40 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Bed occupancy grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
                    {ward.beds.map((bed: any) => (
                      <div
                        key={bed.bedNumber}
                        className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center min-h-[100px] ${
                          bed.status === "occupied"
                            ? "bg-rose-50 border-rose-200 text-rose-950 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-450"
                            : "bg-emerald-50 border-emerald-250 text-emerald-950 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-450"
                        }`}
                      >
                        <Bed size={22} className={bed.status === "occupied" ? "text-rose-500" : "text-emerald-500"} />
                        <span className="text-sm font-bold block mt-1">{bed.bedNumber}</span>
                        <span className="text-[10px] font-medium block opacity-70 mt-0.5 truncate max-w-full">
                          {bed.status === "occupied" ? getUserName(bed.occupiedBy) : "Available"}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
