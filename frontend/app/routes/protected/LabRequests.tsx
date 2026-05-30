import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUsers,
  createLabResult,
  getPatientLabResults,
  updateLabResult,
} from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FlaskConical, ClipboardList, CheckCircle2, AlertCircle, Send, Upload, Eye, BrainCircuit } from "lucide-react";
import { toast } from "sonner";
import { socket } from "@/lib/socket";

export function meta() {
  return [{ title: "Lab & RIS Operations | MedFlow AI" }];
}

export default function LabRequests() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"queue" | "published">("queue");
  const [isRecordOpen, setIsRecordOpen] = useState(false);

  // Patient selected for viewing published results
  const [activePatientId, setActivePatientId] = useState("");

  // Record findings states
  const [patientId, setPatientId] = useState("");
  const [testType, setTestType] = useState("Complete Blood Count (CBC)");
  const [bodyPart, setBodyPart] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [findings, setFindings] = useState("");
  const [aiAnalysisText, setAiAnalysisText] = useState("");

  const { data: patientsData } = useQuery({
    queryKey: ["users", "patient"],
    queryFn: () => getUsers({ role: "patient", limit: 100 }),
  });
  const patients = patientsData?.res || [];

  // Query patient lab results dynamically
  const { data: labResults = [], refetch: refetchResults } = useQuery({
    queryKey: ["labResults", activePatientId],
    queryFn: () => getPatientLabResults(activePatientId),
    enabled: !!activePatientId,
  });

  useEffect(() => {
    socket.on("lab_result_added", () => {
      if (activePatientId) refetchResults();
    });
    socket.on("lab_result_updated", () => {
      if (activePatientId) refetchResults();
    });
    return () => {
      socket.off("lab_result_added");
      socket.off("lab_result_updated");
    };
  }, [activePatientId, refetchResults]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createLabResult,
    onSuccess: () => {
      if (activePatientId === patientId) refetchResults();
      toast.success("Lab report findings published successfully!");
      setIsRecordOpen(false);
      // Reset form
      setPatientId("");
      setBodyPart("");
      setImageUrl("");
      setFindings("");
      setAiAnalysisText("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to publish report"),
  });

  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !testType || !findings) {
      toast.error("Please fill in required fields");
      return;
    }
    createMutation.mutate({
      patientId,
      testType,
      bodyPart,
      imageUrl,
      aiAnalysis: aiAnalysisText,
    });
  };

  return (
    <div className="space-y-6 mt-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            Lab & Imaging Center
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            Publish clinical diagnostic reports, monitor PACS/DICOM scans, and check pathology findings.
          </p>
        </div>

        <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-850 p-1 rounded-xl border border-zinc-200/50">
          <Button
            size="sm"
            onClick={() => setActiveTab("queue")}
            className={`text-xs font-bold rounded-lg px-4 ${
              activeTab === "queue" ? "bg-white text-zinc-900 shadow-sm" : "bg-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Diagnostics Hub
          </Button>
          <Button
            size="sm"
            onClick={() => setActiveTab("published")}
            className={`text-xs font-bold rounded-lg px-4 ${
              activeTab === "published" ? "bg-white text-zinc-900 shadow-sm" : "bg-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Published Reports
          </Button>
        </div>
      </div>

      {activeTab === "queue" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 glass border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm rounded-xl">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-850 pb-4">
              <CardTitle className="text-lg flex items-center gap-1.5">
                <FlaskConical className="text-blue-500" /> Enter Diagnostic Lab Results
              </CardTitle>
              <CardDescription>Record chemistry panel ranges or attach imaging folder links (DICOM PACS).</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handlePublishSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="labPatient">Choose Inpatient/Outpatient</Label>
                  <Select value={patientId} onValueChange={setPatientId}>
                    <SelectTrigger id="labPatient">
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
                    <Label htmlFor="labTest">Test Type</Label>
                    <Select value={testType} onValueChange={setTestType}>
                      <SelectTrigger id="labTest">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</SelectItem>
                        <SelectItem value="Lipid Profile Panel">Lipid Profile Panel</SelectItem>
                        <SelectItem value="Thyroid Panel">Thyroid Panel</SelectItem>
                        <SelectItem value="X-Ray">Chest X-Ray Imaging</SelectItem>
                        <SelectItem value="Brain MRI">Brain MRI Scan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="bodyPart">Body Part (RIS Scanning)</Label>
                    <Input id="bodyPart" placeholder="e.g. Chest, Knee" value={bodyPart} onChange={(e) => setBodyPart(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="findings">Clinical Findings</Label>
                  <Textarea id="findings" placeholder="Enter blood panel indices or radiologist notes..." value={findings} onChange={(e) => setFindings(e.target.value)} required />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="imageUrl">Scan Image URL (PACS / DICOM)</Label>
                  <Input id="imageUrl" placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="aiNotes">AI Copilot assessment notes (Optional)</Label>
                  <Textarea id="aiNotes" placeholder="Extracted abnormal parameters..." value={aiAnalysisText} onChange={(e) => setAiAnalysisText(e.target.value)} />
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold gap-1.5 py-6 rounded-xl shadow-sm" disabled={createMutation.isPending}>
                  <Send size={16} /> Publish and Transact charges
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="glass border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm rounded-xl">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-850 pb-4">
              <CardTitle className="text-md font-bold flex items-center gap-1.5">
                <ClipboardList className="text-zinc-400" /> Pathology Quality Checklist
              </CardTitle>
              <CardDescription>Pathologists credentials checks & barcode validation.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950/20 border rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200">NABL Accreditation Pathway</h4>
                  <p className="text-[10px] text-zinc-450 mt-0.5">Validation stamps active</p>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">VERIFIED</Badge>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950/20 border rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200">HL7/FHIR Diagnostic Reports</h4>
                  <p className="text-[10px] text-zinc-450 mt-0.5">Auto-bundle compiler</p>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">ACTIVE</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Patient select panel */}
          <Card className="col-span-1 glass border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm rounded-xl h-fit">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-850 pb-4">
              <CardTitle className="text-md font-bold">Select Patient Registry</CardTitle>
              <CardDescription>Retrieve clinical reports.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1">
                <Label>Patient Name</Label>
                <Select value={activePatientId} onValueChange={setActivePatientId}>
                  <SelectTrigger>
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
            </CardContent>
          </Card>

          {/* Results list panel */}
          <div className="lg:col-span-3 space-y-6">
            {!activePatientId ? (
              <Card className="border border-dashed p-12 text-center text-zinc-400 rounded-xl">
                Choose a patient to retrieve all published clinical diagnostic and radiologic reports.
              </Card>
            ) : labResults.length === 0 ? (
              <Card className="border border-dashed p-12 text-center text-zinc-400 rounded-xl">
                No diagnostic reports published for this patient.
              </Card>
            ) : (
              labResults.map((res: any) => (
                <Card key={res._id} className="card border-l-4 border-l-blue-500 shadow-sm rounded-xl overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge className="bg-blue-50 text-blue-650 border border-blue-200 text-xs">{res.testType}</Badge>
                        <CardTitle className="text-lg font-bold mt-2 text-zinc-800 dark:text-zinc-100">
                          Diagnostic Findings
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Published on {new Date(res.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    {/* Findings */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Report Findings</span>
                      <p className="font-semibold text-zinc-850 dark:text-zinc-205">{res.aiAnalysis || res.status}</p>
                    </div>

                    {/* Image */}
                    {res.imageUrl && (
                      <div className="border border-zinc-150 rounded-xl overflow-hidden max-w-sm max-h-60 bg-zinc-50">
                        <img src={res.imageUrl} alt="Clinical diagnostic scan" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
