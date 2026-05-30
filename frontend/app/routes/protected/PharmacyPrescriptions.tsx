import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";

export function meta() {
  return [{ title: "Pharmacy Prescriptions | MedFlow AI" }];
}

interface Prescription {
  id: string;
  patientName: string;
  patientEmail: string;
  patientAvatar?: string;
  doctorName: string;
  medicine: string;
  dosage: string;
  duration: string;
  date: string;
  status: "pending" | "dispensed";
}

const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: "PR-001",
    patientName: "Jane Smith",
    patientEmail: "patient@hospital.com",
    doctorName: "Dr. John Doe",
    medicine: "Amoxicillin 500mg",
    dosage: "1 capsule three times a day",
    duration: "7 days",
    date: "2026-05-30",
    status: "pending",
  },
  {
    id: "PR-002",
    patientName: "Michael Johnson",
    patientEmail: "michael.j@gmail.com",
    doctorName: "Dr. Sarah Jenkins",
    medicine: "Atorvastatin 20mg",
    dosage: "1 tablet daily at night",
    duration: "30 days",
    date: "2026-05-29",
    status: "dispensed",
  },
  {
    id: "PR-003",
    patientName: "Emily Davis",
    patientEmail: "emily.davis@yahoo.com",
    doctorName: "Dr. Robert Chen",
    medicine: "Ibuprofen 400mg",
    dosage: "1 tablet every 6 hours as needed for pain",
    duration: "5 days",
    date: "2026-05-29",
    status: "pending",
  },
  {
    id: "PR-004",
    patientName: "William Brown",
    patientEmail: "will.brown@outlook.com",
    doctorName: "Dr. John Doe",
    medicine: "Metformin 850mg",
    dosage: "1 tablet twice daily with meals",
    duration: "90 days",
    date: "2026-05-28",
    status: "dispensed",
  },
];

export default function PharmacyPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(INITIAL_PRESCRIPTIONS);
  const [search, setSearch] = useState("");

  const filtered = prescriptions.filter(
    (p) =>
      p.patientName.toLowerCase().includes(search.toLowerCase()) ||
      p.medicine.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleDispense = (id: string) => {
    setPrescriptions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "dispensed" } : p))
    );
    toast.success(`Prescription ${id} successfully dispensed!`);
  };

  const getStatusBadge = (status: Prescription["status"]) => {
    if (status === "dispensed") {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
          <CheckCircle2 size={12} className="mr-1 inline" /> Dispensed
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
        <Clock size={12} className="mr-1 inline" /> Pending
      </Badge>
    );
  };

  return (
    <div className="space-y-6 mt-6 pb-20">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Prescriptions Queue
        </h1>
        <p className="text-slate-500 font-medium">
          View and fulfill medical prescriptions submitted by attending physicians.
        </p>
      </div>

      <Card className="card shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-lg">Recent Requests</CardTitle>
            <CardDescription>
              Fulfill pending prescriptions or review medication logs.
            </CardDescription>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              type="text"
              placeholder="Search by patient, medicine or ID..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6 font-bold">Patient</TableHead>
                <TableHead className="font-bold text-center">Prescribed By</TableHead>
                <TableHead className="font-bold">Medication & Dosage</TableHead>
                <TableHead className="font-bold text-center">Duration</TableHead>
                <TableHead className="font-bold text-center">Date</TableHead>
                <TableHead className="font-bold text-center">Status</TableHead>
                <TableHead className="text-right pr-6 font-bold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-slate-400 italic">
                    No prescription requests found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-slate-100">
                          <AvatarImage src={p.patientAvatar} />
                          <AvatarFallback className="font-bold text-xs bg-purple-50 text-purple-600">
                            {p.patientName.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {p.patientName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {p.id}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium text-slate-700 dark:text-slate-300">
                      {p.doctorName}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <FileText size={14} className="text-blue-500" />
                          {p.medicine}
                        </span>
                        <span className="text-xs text-slate-500">
                          {p.dosage}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm text-slate-600 dark:text-slate-400">
                      {p.duration}
                    </TableCell>
                    <TableCell className="text-center text-sm text-slate-500">
                      {p.date}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(p.status)}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      {p.status === "pending" ? (
                        <Button
                          size="sm"
                          onClick={() => handleDispense(p.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-xs h-8"
                        >
                          Dispense
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled
                          className="text-xs h-8 text-slate-400"
                        >
                          Fulfilled
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
