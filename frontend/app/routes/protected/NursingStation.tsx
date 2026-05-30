import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWards,
  getNursingRecord,
  logBedsideVitals,
  logMedicationAdmin,
  logFluidBalance,
  updateCarePlan,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, Pill, Droplet, ClipboardCheck, Syringe, HeartPulse, User } from "lucide-react";
import { toast } from "sonner";
import { socket } from "@/lib/socket";

export function meta() {
  return [{ title: "Nursing Bedside Station | MedFlow AI" }];
}

export default function NursingStation() {
  const queryClient = useQueryClient();
  const [selectedPatientId, setSelectedPatientId] = useState("");

  // Input states for logs
  const [bp, setBp] = useState("");
  const [pulse, setPulse] = useState("");
  const [temp, setTemp] = useState("");
  const [spo2, setSpo2] = useState("");

  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");
  const [medStatus, setMedStatus] = useState("given");

  const [fluidType, setFluidType] = useState("intake");
  const [fluidSource, setFluidSource] = useState("");
  const [fluidVolume, setFluidVolume] = useState("");

  const [assessmentNotes, setAssessmentNotes] = useState("");
  const [careGoals, setCareGoals] = useState("");

  const { data: wards = [] } = useQuery({
    queryKey: ["wards"],
    queryFn: getWards,
  });

  const { data: patientsData } = useQuery({
    queryKey: ["users", "patient"],
    queryFn: () => getUsers({ role: "patient", limit: 100 }),
  });
  const patients = patientsData?.res || [];

  // Extract admitted patients from occupied beds
  const admittedPatients: any[] = [];
  wards.forEach((w) => {
    w.beds.forEach((b: any) => {
      if (b.status === "occupied" && b.occupiedBy) {
        const pObj = patients.find((p) => p._id === b.occupiedBy);
        if (pObj) {
          admittedPatients.push({ ...pObj, bedNumber: b.bedNumber, wardName: w.name });
        }
      }
    });
  });

  // Query patient's active nursing record
  const { data: record, refetch: refetchRecord, isLoading: isRecordLoading } = useQuery({
    queryKey: ["nursingRecord", selectedPatientId],
    queryFn: () => getNursingRecord(selectedPatientId),
    enabled: !!selectedPatientId,
  });

  useEffect(() => {
    socket.on("notify_nursing_updated", () => {
      if (selectedPatientId) refetchRecord();
    });
    return () => {
      socket.off("notify_nursing_updated");
    };
  }, [selectedPatientId, refetchRecord]);

  // Mutations
  const vitalsMutation = useMutation({
    mutationFn: (data: any) => logBedsideVitals(record._id, data),
    onSuccess: () => {
      refetchRecord();
      toast.success("Bedside vitals logged!");
      setBp(""); setPulse(""); setTemp(""); setSpo2("");
    },
  });

  const medMutation = useMutation({
    mutationFn: (data: any) => logMedicationAdmin(record._id, data),
    onSuccess: () => {
      refetchRecord();
      toast.success("Medication administration recorded!");
      setMedName(""); setMedDosage("");
    },
  });

  const fluidMutation = useMutation({
    mutationFn: (data: any) => logFluidBalance(record._id, data),
    onSuccess: () => {
      refetchRecord();
      toast.success("Fluid ledger updated!");
      setFluidSource(""); setFluidVolume("");
    },
  });

  const careMutation = useMutation({
    mutationFn: (data: any) => updateCarePlan(record._id, data),
    onSuccess: () => {
      refetchRecord();
      toast.success("Bedside assessment updated!");
    },
  });

  const handleVitalsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;
    vitalsMutation.mutate({ bp, pulse, temp, spo2 });
  };

  const handleMedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!record || !medName || !medDosage) return;
    medMutation.mutate({ medicineName: medName, dosage: medDosage, status: medStatus });
  };

  const handleFluidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!record || !fluidSource || !fluidVolume) return;
    fluidMutation.mutate({ type: fluidType, source: fluidSource, volumeMl: fluidVolume });
  };

  const handleCareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;
    careMutation.mutate({
      nursingAssessment: { physicalNotes: assessmentNotes },
      carePlan: { goals: careGoals },
    });
  };

  const activePat = admittedPatients.find((p) => p._id === selectedPatientId);

  // Compute total fluids balance
  const totalIntake = record?.intakeLog.reduce((s: number, entry: any) => s + entry.volumeMl, 0) || 0;
  const totalOutput = record?.outputLog.reduce((s: number, entry: any) => s + entry.volumeMl, 0) || 0;
  const fluidNet = totalIntake - totalOutput;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6 pb-20">
      {/* Patient Selector */}
      <Card className="col-span-1 glass shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 h-fit">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-850">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="text-blue-500" /> Ward Inpatients
          </CardTitle>
          <CardDescription>Select an active bed patient to update clinical records.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activeInpatient">Admitted Bed Patient</Label>
            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
              <SelectTrigger id="activeInpatient">
                <SelectValue placeholder="Choose inpatient" />
              </SelectTrigger>
              <SelectContent>
                {admittedPatients.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.name} ({p.bedNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {activePat && (
            <div className="text-xs space-y-2 p-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200/40 rounded-xl">
              <p><span className="text-zinc-400 font-bold uppercase block">Admitted Ward</span> {activePat.wardName}</p>
              <p><span className="text-zinc-400 font-bold uppercase block">Bed Number</span> {activePat.bedNumber}</p>
              <p><span className="text-zinc-400 font-bold uppercase block">Age / Gender</span> {activePat.age || "N/A"} / {activePat.gender || "N/A"}</p>
              <p><span className="text-zinc-400 font-bold uppercase block">Blood Group</span> {activePat.bloodgroup || "N/A"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main clinical Forms */}
      <div className="col-span-1 lg:col-span-3 space-y-6">
        {!selectedPatientId ? (
          <Card className="glass shadow-sm border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center text-zinc-400">
            Select a patient from the ward registry to open the Bedside clinical station.
          </Card>
        ) : isRecordLoading ? (
          <div className="text-center italic text-zinc-400">Loading patient bedside records...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vitals Log Card */}
            <Card className="glass shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-850">
                <CardTitle className="text-md font-bold flex items-center gap-1.5">
                  <HeartPulse className="text-rose-500" /> Bedside Vitals Logging
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <form onSubmit={handleVitalsSubmit} className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Blood Pressure</Label>
                    <Input placeholder="120/80" value={bp} onChange={(e) => setBp(e.target.value)} required />
                  </div>
                  <div>
                    <Label className="text-xs">Pulse (bpm)</Label>
                    <Input placeholder="72" type="number" value={pulse} onChange={(e) => setPulse(e.target.value)} required />
                  </div>
                  <div>
                    <Label className="text-xs">Temp (°F)</Label>
                    <Input placeholder="98.6" type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} required />
                  </div>
                  <div>
                    <Label className="text-xs">Oxygen SpO2 (%)</Label>
                    <Input placeholder="98" type="number" value={spo2} onChange={(e) => setSpo2(e.target.value)} required />
                  </div>
                  <Button type="submit" className="col-span-2 bg-rose-600 hover:bg-rose-700 text-xs font-bold rounded-lg mt-2">
                    Record vitals
                  </Button>
                </form>

                {/* Vitals History */}
                {record?.vitalsLog.length > 0 && (
                  <div className="border border-zinc-150 rounded-xl overflow-hidden text-xs">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>BP</TableHead>
                          <TableHead>Pulse</TableHead>
                          <TableHead>Temp</TableHead>
                          <TableHead>SPO2</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {record.vitalsLog.slice(-3).reverse().map((v: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-semibold text-zinc-400">{v.time}</TableCell>
                            <TableCell>{v.bp}</TableCell>
                            <TableCell>{v.pulse} bpm</TableCell>
                            <TableCell>{v.temp} °F</TableCell>
                            <TableCell>{v.spo2}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Meds Administration Card */}
            <Card className="glass shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-850">
                <CardTitle className="text-md font-bold flex items-center gap-1.5">
                  <Pill className="text-blue-500" /> Bedside Medication Administration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <form onSubmit={handleMedSubmit} className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Medicine Name</Label>
                      <Input placeholder="Paracetamol" value={medName} onChange={(e) => setMedName(e.target.value)} required />
                    </div>
                    <div>
                      <Label className="text-xs">Dosage</Label>
                      <Input placeholder="650mg" value={medDosage} onChange={(e) => setMedDosage(e.target.value)} required />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select value={medStatus} onValueChange={setMedStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="given">Administered (Given)</SelectItem>
                        <SelectItem value="held">Held (Delayed)</SelectItem>
                        <SelectItem value="refused">Refused by Patient</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-xs font-bold rounded-lg mt-1">
                    Log Medication
                  </Button>
                </form>

                {record?.medicationsAdministered.length > 0 && (
                  <div className="space-y-1.5 text-xs max-h-36 overflow-y-auto">
                    {record.medicationsAdministered.slice(-3).reverse().map((med: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2 border border-zinc-100 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-lg">
                        <div>
                          <p className="font-bold text-zinc-800 dark:text-zinc-150">{med.medicineName} {med.dosage}</p>
                          <p className="text-[10px] text-zinc-400">{med.time} • By {med.administeredBy}</p>
                        </div>
                        <Badge className={`text-[9px] ${med.status === "given" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200"}`} variant="outline">
                          {med.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fluid Intake & Output Ledger */}
            <Card className="glass shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-850">
                <CardTitle className="text-md font-bold flex items-center gap-1.5">
                  <Droplet className="text-indigo-500" /> Intake / Output Fluid Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <form onSubmit={handleFluidSubmit} className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Flow type</Label>
                      <Select value={fluidType} onValueChange={setFluidType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="intake">Intake (+)</SelectItem>
                          <SelectItem value="output">Output (-)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Source</Label>
                      <Input placeholder="Oral/IV/Urine" value={fluidSource} onChange={(e) => setFluidSource(e.target.value)} required />
                    </div>
                    <div>
                      <Label className="text-xs">Volume (ml)</Label>
                      <Input placeholder="200" type="number" value={fluidVolume} onChange={(e) => setFluidVolume(e.target.value)} required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs font-bold rounded-lg">
                    Add Fluid Record
                  </Button>
                </form>

                {/* Net balance summary */}
                <div className="flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-950/20 p-3 border border-indigo-100/40 rounded-xl text-xs font-bold">
                  <div>
                    <span className="text-zinc-400 block font-normal uppercase text-[10px]">Net Balance</span>
                    <span className={fluidNet >= 0 ? "text-emerald-600" : "text-rose-650"}>{fluidNet} ml</span>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-400 block font-normal uppercase text-[10px]">Intake / Output</span>
                    <span>{totalIntake} ml / {totalOutput} ml</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bedside Care plans Card */}
            <Card className="glass shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-850">
                <CardTitle className="text-md font-bold flex items-center gap-1.5">
                  <ClipboardCheck className="text-emerald-500" /> Nursing Assessment & Care Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <form onSubmit={handleCareSubmit} className="space-y-3">
                  <div>
                    <Label className="text-xs">Physical Assessment Notes</Label>
                    <Textarea
                      placeholder="e.g. Skin integrity intact, patient resting comfortably..."
                      value={assessmentNotes}
                      onChange={(e) => setAssessmentNotes(e.target.value)}
                      className="min-h-16 text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Care Plan & Clinical Goals</Label>
                    <Textarea
                      placeholder="e.g. Mobilize three times daily, monitor pain level post-op..."
                      value={careGoals}
                      onChange={(e) => setCareGoals(e.target.value)}
                      className="min-h-16 text-xs rounded-xl"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-emerald-650 hover:bg-emerald-700 text-xs font-bold rounded-lg">
                    Save Assessment
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
