import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  FlaskConical,
  Eye,
  FileSpreadsheet,
  BrainCircuit,
  UserCheck,
  Send,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

export function meta() {
  return [{ title: "Lab Results & Imaging | MedFlow AI" }];
}

interface LabResultRecord {
  id: string;
  patient: string;
  testType: string;
  bodyPart?: string;
  resultValue: string;
  aiAnalysis?: string;
  doctorNotes?: string;
  date: string;
  imageUrl?: string;
}

const INITIAL_RESULTS: LabResultRecord[] = [
  {
    id: "RES-001",
    patient: "Jane Smith",
    testType: "Chest X-Ray",
    bodyPart: "Thorax",
    resultValue: "Mild infiltration in left lower lobe",
    aiAnalysis: "AI detected possible early pneumonia in left lower lobe. Probability: 84.5%. Recommendation: Clinical correlation.",
    doctorNotes: "Prescribed Amoxicillin. Return in 7 days for follow up imaging.",
    date: "Today at 10:20 AM",
    imageUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=500&auto=format&fit=crop&q=60",
  },
  {
    id: "RES-002",
    patient: "Michael Johnson",
    testType: "Complete Blood Count (CBC)",
    resultValue: "WBC: 6.8 K/uL, RBC: 4.85 M/uL, Hemoglobin: 14.2 g/dL, Platelets: 245 K/uL",
    aiAnalysis: "AI analysis shows all CBC parameters are within standard reference ranges.",
    doctorNotes: "Routine healthy blood panel results.",
    date: "Yesterday at 3:15 PM",
  },
  {
    id: "RES-003",
    patient: "Emily Davis",
    testType: "Lipid Profile Panel",
    resultValue: "Total Cholesterol: 240 mg/dL, HDL: 45 mg/dL, LDL: 155 mg/dL, Triglycerides: 200 mg/dL",
    aiAnalysis: "AI detected borderline high LDL cholesterol and elevated triglycerides. Suggested dietary intervention.",
    doctorNotes: "Recommended low-fat diet and exercise. Scheduled repeat lipid profile in 3 months.",
    date: "May 28, 2026",
  },
];

export default function LabResults() {
  const [results, setResults] = useState<LabResultRecord[]>(INITIAL_RESULTS);
  const [patient, setPatient] = useState("");
  const [testType, setTestType] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [resultValue, setResultValue] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleAddResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !testType || !resultValue) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const newRecord: LabResultRecord = {
      id: `RES-${Math.floor(100 + Math.random() * 900)}`,
      patient,
      testType,
      bodyPart: bodyPart || undefined,
      resultValue,
      aiAnalysis: aiAnalysis || "AI analysis completed. No critical anomalies noted.",
      date: "Just Now",
      imageUrl: imageUrl || undefined,
    };
    setResults([newRecord, ...results]);
    toast.success(`Successfully uploaded test result for ${patient}!`);
    setPatient("");
    setTestType("");
    setBodyPart("");
    setResultValue("");
    setAiAnalysis("");
    setImageUrl("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 pb-20">
      {/* Upload Form */}
      <Card className="col-span-1 card shadow-sm rounded-xl h-fit">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <FlaskConical className="text-blue-500" /> Enter Lab Results
          </CardTitle>
          <CardDescription>
            Record diagnostic results and upload clinical imagery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddResult} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient">Patient Name / ID</Label>
              <Input
                id="patient"
                placeholder="e.g. Jane Smith (patient@hospital.com)"
                value={patient}
                onChange={(e) => setPatient(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="testType">Test Type</Label>
                <Select value={testType} onValueChange={setTestType}>
                  <SelectTrigger id="testType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chest X-Ray">Chest X-Ray</SelectItem>
                    <SelectItem value="Brain MRI">Brain MRI</SelectItem>
                    <SelectItem value="Complete Blood Count (CBC)">CBC Panel</SelectItem>
                    <SelectItem value="Lipid Profile Panel">Lipid Profile</SelectItem>
                    <SelectItem value="Thyroid Panel">Thyroid Panel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodyPart">Body Part (Imaging)</Label>
                <Input
                  id="bodyPart"
                  placeholder="e.g. Chest, Knee"
                  value={bodyPart}
                  onChange={(e) => setBodyPart(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resultValue">Test Results / Findings</Label>
              <Textarea
                id="resultValue"
                placeholder="WBC: 6.8 K/uL, Hemoglobin: 14.2 g/dL..."
                value={resultValue}
                onChange={(e) => setResultValue(e.target.value)}
                className="min-h-20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aiAnalysis">AI Copilot Analysis (Optional)</Label>
              <Textarea
                id="aiAnalysis"
                placeholder="Enter AI assessment summary or anomaly indicators..."
                value={aiAnalysis}
                onChange={(e) => setAiAnalysis(e.target.value)}
                className="min-h-20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Imaging URL (Optional)</Label>
              <Input
                id="imageUrl"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
              <Send size={16} /> Publish Results
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results View */}
      <div className="col-span-1 lg:col-span-2 space-y-6">
        {results.map((res) => (
          <Card key={res.id} className="card shadow-sm rounded-xl overflow-hidden border-l-4 border-l-cyan-500">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs uppercase bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                      {res.testType}
                    </Badge>
                    {res.bodyPart && (
                      <Badge variant="secondary" className="text-xs">
                        {res.bodyPart}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg font-bold mt-2 text-slate-800 dark:text-white">
                    {res.patient}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    ID: {res.id} • Registered {res.date}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Findings */}
              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  Findings
                </span>
                <p className="text-sm font-medium text-slate-850 dark:text-slate-200">
                  {res.resultValue}
                </p>
              </div>

              {/* Image if available */}
              {res.imageUrl && (
                <div className="border rounded-xl overflow-hidden max-h-60 max-w-sm">
                  <img
                    src={res.imageUrl}
                    alt={`${res.testType} Imaging`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* AI Copilot & Doctor Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                {res.aiAnalysis && (
                  <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl space-y-1">
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5 uppercase tracking-wide">
                      <BrainCircuit size={12} /> AI Diagnosis Insights
                    </span>
                    <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                      {res.aiAnalysis}
                    </p>
                  </div>
                )}
                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl space-y-1">
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                    <UserCheck size={12} /> Doctor's Clinical Review
                  </span>
                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                    {res.doctorNotes || "Awaiting doctor's clinical comments and approval."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
