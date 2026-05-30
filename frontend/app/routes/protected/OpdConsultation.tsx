import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAppointments,
  getMedicines,
  createPrescription,
  updateAppointmentStatus,
  parseVoicePrescription,
  checkDrugInteractions,
} from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Mic,
  MicOff,
  Stethoscope,
  Sparkles,
  Signature,
  Activity,
  AlertTriangle,
  Send,
  Trash2,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import { socket } from "@/lib/socket";

export function meta() {
  return [{ title: "OPD Consultation SOAP | MedFlow AI" }];
}

interface MedicationPrescribed {
  name: string;
  dosage: string;
  duration: string;
}

export default function OpdConsultation() {
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Consulting patient states
  const [selectedApptId, setSelectedApptId] = useState("");
  const [soapNotes, setSoapNotes] = useState("");
  const [icd10Code, setIcd10Code] = useState("");
  const [icd10Description, setIcd10Description] = useState("");
  
  // Medications prescribed
  const [medsList, setMedsList] = useState<MedicationPrescribed[]>([]);
  const [currentMedName, setCurrentMedName] = useState("");
  const [currentDosage, setCurrentDosage] = useState("");
  const [currentDuration, setCurrentDuration] = useState("");

  // AI Alerts & states
  const [isListening, setIsListening] = useState(false);
  const [transcriptInput, setTranscriptInput] = useState("");
  const [drugAlerts, setDrugAlerts] = useState<any[]>([]);

  // Fetch appointments and medicines list
  const { data: appointments = [], refetch: refetchAppts } = useQuery({
    queryKey: ["appointments"],
    queryFn: getAppointments,
  });

  const { data: medicines = [] } = useQuery({
    queryKey: ["medicines"],
    queryFn: getMedicines,
  });

  const activeAppts = appointments.filter((a) => a.status === "in-progress");

  useEffect(() => {
    socket.on("notify_appointment_updated", () => refetchAppts());
    return () => {
      socket.off("notify_appointment_updated");
    };
  }, [refetchAppts]);

  // Selected appointment object
  const activeAppt = appointments.find((a) => a._id === selectedApptId);

  // Check drug interactions mutation
  const checkInteractionsMutation = useMutation({
    mutationFn: checkDrugInteractions,
    onSuccess: (data) => {
      if (data.hasInteractions) {
        setDrugAlerts(data.alerts);
        toast.warning("Clinical Alert: High-risk drug interactions detected!");
      } else {
        setDrugAlerts([]);
        toast.success("No drug interactions found. Safe to prescribe.");
      }
    },
  });

  // Voice AI prescription parser mutation
  const voiceAiMutation = useMutation({
    mutationFn: parseVoicePrescription,
    onSuccess: (data) => {
      setSoapNotes(data.soapNotes);
      setIcd10Code(data.icd10Code);
      setIcd10Description(data.icd10Description);
      setMedsList(data.medications);
      toast.success("Prescription details auto-extracted successfully by AI Copilot!");
      
      // Auto trigger interaction check
      const medNames = data.medications.map((m: any) => m.name);
      checkInteractionsMutation.mutate(medNames);
    },
    onError: (err: any) => toast.error(err.message || "Failed to analyze speech"),
  });

  // Submit prescription mutation
  const prescriptionMutation = useMutation({
    mutationFn: createPrescription,
    onSuccess: async () => {
      if (selectedApptId) {
        await updateAppointmentStatus(selectedApptId, "completed");
      }
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Consultation SOAP saved & Patient billed!");
      
      // Reset form
      setSelectedApptId("");
      setSoapNotes("");
      setIcd10Code("");
      setIcd10Description("");
      setMedsList([]);
      setDrugAlerts([]);
      clearSignature();
    },
    onError: (err: any) => toast.error(err.message || "Failed to submit consultation"),
  });

  // Canvas Signature pad handlers
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#1d4ed8"; // blue-700
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
      }
    }
  }, [selectedApptId]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Add medication to active list
  const handleAddMed = () => {
    if (!currentMedName) {
      toast.error("Please enter a medicine name");
      return;
    }
    const newMeds = [...medsList, { name: currentMedName, dosage: currentDosage || "As directed", duration: currentDuration || "3 days" }];
    setMedsList(newMeds);
    
    // Check interactions
    const medNames = newMeds.map((m) => m.name);
    checkInteractionsMutation.mutate(medNames);

    setCurrentMedName("");
    setCurrentDosage("");
    setCurrentDuration("");
  };

  const handleRemoveMed = (index: number) => {
    const newMeds = medsList.filter((_, i) => i !== index);
    setMedsList(newMeds);
    if (newMeds.length > 0) {
      checkInteractionsMutation.mutate(newMeds.map((m) => m.name));
    } else {
      setDrugAlerts([]);
    }
  };

  // Simulated Voice dictation trigger
  const handleVoiceTrigger = () => {
    if (isListening) {
      setIsListening(false);
      // Send simulated transcript
      const mockSpeech = "Patient reports high fever since last evening and severe throat pain. Prescribe Amoxicillin 500mg three times a day for 7 days, and Ibuprofen for pain relief.";
      voiceAiMutation.mutate(mockSpeech);
    } else {
      setIsListening(true);
      toast.info("Listening... Dictate symptoms and medication rules.");
    }
  };

  const handleSubmitConsult = () => {
    if (!selectedApptId) {
      toast.error("Please select a patient in consultation");
      return;
    }
    if (!soapNotes || !icd10Code) {
      toast.error("Please fill in SOAP Notes and ICD-10 classification code");
      return;
    }

    const canvas = canvasRef.current;
    const signatureData = canvas ? canvas.toDataURL() : "signed_digitally";

    prescriptionMutation.mutate({
      patientId: activeAppt?.patient?._id,
      appointmentId: selectedApptId,
      soapNotes,
      icd10Code,
      icd10Description: icd10Description || "OPD Assessment",
      medications: medsList,
      doctorSignature: signatureData,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 pb-20">
      {/* Patient Queue selection Panel */}
      <Card className="col-span-1 glass shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 h-fit">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-850">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="text-blue-500 animate-pulse" /> Active OPD Queue
          </CardTitle>
          <CardDescription>Select a checked-in patient to open the SOAP record room.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activePatient">Choose Active Consult Patient</Label>
            <Select value={selectedApptId} onValueChange={setSelectedApptId}>
              <SelectTrigger id="activePatient">
                <SelectValue placeholder="Choose active patient" />
              </SelectTrigger>
              <SelectContent>
                {activeAppts.map((a) => (
                  <SelectItem key={a._id} value={a._id}>
                    Token {a.tokenNumber} - {a.patient?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {activeAppt && (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/50 space-y-3">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">Patient Triage Briefing</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-zinc-400">Blood Pressure</p>
                  <p className="font-bold text-zinc-700 dark:text-zinc-350">{activeAppt.preOpVitals?.bp || "N/A"}</p>
                </div>
                <div>
                  <p className="text-zinc-400">Heart Rate / Pulse</p>
                  <p className="font-bold text-zinc-700 dark:text-zinc-350">
                    {activeAppt.preOpVitals?.pulse ? `${activeAppt.preOpVitals.pulse} bpm` : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-400">Temperature</p>
                  <p className="font-bold text-zinc-700 dark:text-zinc-350">
                    {activeAppt.preOpVitals?.temp ? `${activeAppt.preOpVitals.temp} °F` : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-400">Oxygen Sat (SpO2)</p>
                  <p className="font-bold text-zinc-700 dark:text-zinc-350">
                    {activeAppt.preOpVitals?.spo2 ? `${activeAppt.preOpVitals.spo2} %` : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main SOAP Room */}
      <Card className="col-span-1 lg:col-span-2 glass shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <Stethoscope className="text-blue-600" /> Clinical SOAP Workspace
            </CardTitle>
            <CardDescription>Record Subjective, Objective, Assessment, and Plans.</CardDescription>
          </div>

          <Button
            onClick={handleVoiceTrigger}
            variant="outline"
            className={`rounded-xl font-bold flex items-center gap-1.5 transition-colors ${
              isListening
                ? "bg-rose-50 border-rose-350 text-rose-600 dark:bg-rose-900/30"
                : "border-blue-200 text-blue-600 hover:bg-blue-50"
            }`}
            disabled={!selectedApptId}
          >
            {isListening ? (
              <>
                <MicOff size={16} /> Stop Recording
              </>
            ) : (
              <>
                <Mic size={16} /> Voice AI Dictate
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Clinical SOAP textarea */}
          <div className="space-y-2">
            <Label htmlFor="soapNotes">Clinical Findings & SOAP Notes</Label>
            <Textarea
              id="soapNotes"
              placeholder="Record patient symptoms, physical exam notes, assessment, and plans..."
              value={soapNotes}
              onChange={(e) => setSoapNotes(e.target.value)}
              className="min-h-32 rounded-xl"
              disabled={!selectedApptId}
            />
          </div>

          {/* ICD Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="icdCode">ICD-10 Diagnostic Code</Label>
              <Input
                id="icdCode"
                placeholder="e.g. J06.9, E11.9"
                value={icd10Code}
                onChange={(e) => setIcd10Code(e.target.value)}
                disabled={!selectedApptId}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="icdDesc">Diagnostic Term Description</Label>
              <Input
                id="icdDesc"
                placeholder="e.g. Acute upper respiratory infection"
                value={icd10Description}
                onChange={(e) => setIcd10Description(e.target.value)}
                disabled={!selectedApptId}
              />
            </div>
          </div>

          {/* Prescribe Medications Section */}
          <div className="space-y-4 pt-4 border-t border-zinc-150 dark:border-zinc-800">
            <h3 className="text-md font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
              Prescribe Medications
            </h3>

            {/* Drug interaction Warnings */}
            {drugAlerts.length > 0 && (
              <div className="space-y-2">
                {drugAlerts.map((alert, idx) => (
                  <Alert key={idx} variant="destructive" className="border-rose-300 bg-rose-50/60 text-rose-900 rounded-xl">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="font-bold flex items-center gap-1">Clinical warning: {alert.title}</AlertTitle>
                    <AlertDescription className="text-xs">{alert.description}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="space-y-1">
                <Label htmlFor="medName">Select Medicine</Label>
                <Select value={currentMedName} onValueChange={setCurrentMedName}>
                  <SelectTrigger id="medName" disabled={!selectedApptId}>
                    <SelectValue placeholder="Choose medication" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicines.map((m) => (
                      <SelectItem key={m._id} value={m.name}>
                        {m.name} ({m.stock} left)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="dosage">Dosage Instructions</Label>
                <Input
                  id="dosage"
                  placeholder="e.g. 1 cap thrice daily"
                  value={currentDosage}
                  onChange={(e) => setCurrentDosage(e.target.value)}
                  disabled={!selectedApptId}
                />
              </div>
              <div className="space-y-1 flex gap-2">
                <div className="w-full">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    placeholder="e.g. 7 days"
                    value={currentDuration}
                    onChange={(e) => setCurrentDuration(e.target.value)}
                    disabled={!selectedApptId}
                  />
                </div>
                <Button
                  onClick={handleAddMed}
                  className="bg-blue-600 hover:bg-blue-700 self-end"
                  disabled={!selectedApptId}
                >
                  <PlusCircle size={16} />
                </Button>
              </div>
            </div>

            {/* Prescribed Medications table */}
            {medsList.length > 0 && (
              <div className="border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medication Name</TableHead>
                      <TableHead>Dosage</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medsList.map((m, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold text-zinc-900 dark:text-zinc-150">{m.name}</TableCell>
                        <TableCell>{m.dosage}</TableCell>
                        <TableCell>{m.duration}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            onClick={() => handleRemoveMed(idx)}
                            className="text-rose-500 hover:text-rose-700 h-8 p-1"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Signature canvas */}
          <div className="space-y-2 pt-4 border-t border-zinc-150 dark:border-zinc-800">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-1">
                <Signature size={14} /> Doctor E-Signature
              </Label>
              <Button
                variant="ghost"
                onClick={clearSignature}
                className="text-xs text-zinc-400 h-8"
                disabled={!selectedApptId}
              >
                Clear signature
              </Button>
            </div>
            <div className="border border-dashed border-zinc-350 dark:border-zinc-700 rounded-xl overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/20 max-w-sm">
              <canvas
                ref={canvasRef}
                width={380}
                height={120}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="cursor-crosshair w-full h-[120px]"
              />
            </div>
          </div>

          <Button
            onClick={handleSubmitConsult}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold gap-2 py-6 rounded-xl text-md mt-4 shadow-md"
            disabled={prescriptionMutation.isPending || !selectedApptId}
          >
            <Send size={18} /> Submit SOAP & Fulfill Consultation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
