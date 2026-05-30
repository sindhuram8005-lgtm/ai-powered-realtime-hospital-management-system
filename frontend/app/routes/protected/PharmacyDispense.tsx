import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMedicines,
  getPrescriptions,
  dispenseMedicine,
  getUsers,
  checkDrugInteractions,
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Pill, CheckCircle, Search, ClipboardList, Send, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { socket } from "@/lib/socket";

export function meta() {
  return [{ title: "Pharmacy Dispense Center | MedFlow AI" }];
}

export default function PharmacyDispense() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"prescriptions" | "manual">("prescriptions");
  const [search, setSearch] = useState("");

  // Manual form states
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedMedicineId, setSelectedMedicineId] = useState("");
  const [qty, setQty] = useState("");
  const [manualAlerts, setManualAlerts] = useState<any[]>([]);

  // Fetch data
  const { data: prescriptions = [], refetch: refetchPrescriptions } = useQuery({
    queryKey: ["prescriptions"],
    queryFn: () => getPrescriptions(),
  });

  const { data: medicines = [], refetch: refetchMedicines } = useQuery({
    queryKey: ["medicines"],
    queryFn: getMedicines,
  });

  const { data: patientsData } = useQuery({
    queryKey: ["users", "patient"],
    queryFn: () => getUsers({ role: "patient", limit: 100 }),
  });
  const patients = patientsData?.res || [];

  useEffect(() => {
    socket.on("notify_prescription_added", () => refetchPrescriptions());
    socket.on("notify_prescription_updated", () => refetchPrescriptions());
    socket.on("notify_pharmacy_updated", () => refetchMedicines());
    return () => {
      socket.off("notify_prescription_added");
      socket.off("notify_prescription_updated");
      socket.off("notify_pharmacy_updated");
    };
  }, [refetchPrescriptions, refetchMedicines]);

  // Mutations
  const dispenseMutation = useMutation({
    mutationFn: dispenseMedicine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      toast.success("Medication successfully dispensed and charge added to patient's invoice!");
      setQty("");
      setSelectedMedicineId("");
      setSelectedPatientId("");
      setManualAlerts([]);
    },
    onError: (err: any) => toast.error(err.message || "Failed to dispense medicine"),
  });

  const checkInteractionsMutation = useMutation({
    mutationFn: checkDrugInteractions,
    onSuccess: (data) => {
      if (data.hasInteractions) {
        setManualAlerts(data.alerts);
        toast.warning("Drug-Drug Interaction warning detected!");
      } else {
        setManualAlerts([]);
      }
    },
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedMedicineId || !qty) {
      toast.error("Please fill in all manual dispense fields");
      return;
    }
    dispenseMutation.mutate({
      patientId: selectedPatientId,
      medicineId: selectedMedicineId,
      quantity: parseInt(qty) || 0,
    });
  };

  const handleDispensePrescription = (pres: any) => {
    // Fulfill all medications listed in prescription
    pres.medications.forEach((med: any) => {
      // Find matching medicine ID in database catalog
      const match = medicines.find((m) => m.name.toLowerCase().includes(med.name.toLowerCase()));
      if (match) {
        dispenseMutation.mutate({
          patientId: pres.patient?._id,
          medicineId: match._id,
          quantity: 1, // default unit dose
          prescriptionId: pres._id,
        });
      } else {
        toast.error(`Medication "${med.name}" not in catalogue. Cannot fulfill automatically.`);
      }
    });
  };

  const filteredPrescriptions = prescriptions.filter((p) => {
    const patName = p.patient?.name?.toLowerCase() || "";
    const docName = p.doctor?.name?.toLowerCase() || "";
    const term = search.toLowerCase();
    return patName.includes(term) || docName.includes(term) || p._id.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 mt-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            Pharmacy Dispense Command
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            Fulfill clinician prescriptions, check drug interactions, and log manual dispensations.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-xl border">
          <Button
            size="sm"
            onClick={() => setActiveTab("prescriptions")}
            className={`text-xs font-bold rounded-lg px-4 ${
              activeTab === "prescriptions" ? "bg-white text-zinc-900 shadow-sm" : "bg-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Prescription Queue
          </Button>
          <Button
            size="sm"
            onClick={() => setActiveTab("manual")}
            className={`text-xs font-bold rounded-lg px-4 ${
              activeTab === "manual" ? "bg-white text-zinc-900 shadow-sm" : "bg-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Manual Dispensation
          </Button>
        </div>
      </div>

      {activeTab === "prescriptions" ? (
        <Card className="card shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl overflow-hidden">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-850">
            <div>
              <CardTitle className="text-lg">Clinician Prescriptions Queue</CardTitle>
              <CardDescription>Verify clinical e-prescriptions, execute dispensing, and auto bill invoices.</CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <Input
                type="text"
                placeholder="Search patient or prescriber..."
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
                  <TableHead className="pl-6">Patient</TableHead>
                  <TableHead>Clinician</TableHead>
                  <TableHead>Medications Ordered</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrescriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center text-zinc-400 italic">
                      No prescriptions found in queue.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPrescriptions.map((pres) => (
                    <TableRow key={pres._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30 transition-colors">
                      <TableCell className="pl-6 font-semibold py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-zinc-900 dark:text-zinc-150">{pres.patient?.name}</span>
                          <span className="text-[10px] text-zinc-450 font-mono">UHID: {pres.patient?.uhid || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {pres.doctor?.name} ({pres.doctor?.specialization})
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="space-y-1">
                          {pres.medications.map((m: any, idx: number) => (
                            <div key={idx} className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                              <Pill size={12} className="text-blue-500" />
                              {m.name} <span className="text-[10px] text-zinc-400 font-normal">({m.dosage} • {m.duration})</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`border uppercase text-[9px] ${pres.status === "dispensed" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                          {pres.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {pres.status === "pending" ? (
                          <Button
                            size="sm"
                            onClick={() => handleDispensePrescription(pres)}
                            className="bg-blue-600 hover:bg-blue-700 text-xs h-8"
                          >
                            Dispense & Bill
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" disabled className="text-zinc-400 text-xs h-8">
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 glass border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm rounded-xl">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-850 pb-4">
              <CardTitle className="text-lg flex items-center gap-1.5">
                <Pill className="text-blue-500" /> Manual Dispensation Ledger
              </CardTitle>
              <CardDescription>Manually dispense shelf medications to patients and trigger immediate billing.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {/* Interaction Warning Panel */}
              {manualAlerts.length > 0 && (
                <div className="mb-4 space-y-2 animate-bounce-in">
                  {manualAlerts.map((alert, idx) => (
                    <Alert key={idx} variant="destructive" className="border-rose-350 bg-rose-50 text-rose-900 rounded-xl">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="font-bold flex items-center gap-1">Interaction Alert: {alert.title}</AlertTitle>
                      <AlertDescription className="text-xs">{alert.description}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="manPatient">Choose Patient</Label>
                  <Select value={selectedPatientId} onValueChange={(val) => {
                    setSelectedPatientId(val);
                  }}>
                    <SelectTrigger id="manPatient">
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
                    <Label htmlFor="manMed">Select Medication</Label>
                    <Select value={selectedMedicineId} onValueChange={(val) => {
                      setSelectedMedicineId(val);
                      // Check interactions for selected medicine
                      const chosenMed = medicines.find((m) => m._id === val);
                      if (chosenMed) {
                        checkInteractionsMutation.mutate([chosenMed.name]);
                      }
                    }}>
                      <SelectTrigger id="manMed">
                        <SelectValue placeholder="Choose medicine" />
                      </SelectTrigger>
                      <SelectContent>
                        {medicines.map((m) => (
                          <SelectItem key={m._id} value={m._id}>
                            {m.name} ({m.stock} units left)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="manQty">Quantity (units)</Label>
                    <Input id="manQty" type="number" placeholder="e.g. 15" value={qty} onChange={(e) => setQty(e.target.value)} required />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold gap-1.5 py-6 rounded-xl shadow-sm" disabled={dispenseMutation.isPending}>
                  <Send size={16} /> Dispense shelf stock & log invoice charge
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick stock checklist */}
          <Card className="glass border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm rounded-xl">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-850 pb-4">
              <CardTitle className="text-md font-bold flex items-center gap-1.5">
                <ClipboardList className="text-zinc-400" /> Stock Monitor
              </CardTitle>
              <CardDescription>Live units count inside pharmacy cabinets.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {medicines.slice(0, 5).map((m) => (
                <div key={m._id} className="flex justify-between items-center p-2 border border-zinc-100 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl text-xs">
                  <div>
                    <h4 className="font-bold text-zinc-850 dark:text-zinc-200">{m.name}</h4>
                    <p className="text-[10px] text-zinc-450 uppercase font-semibold">SKU: {m.code}</p>
                  </div>
                  <Badge variant="outline" className={`font-mono text-xs ${m.stock <= m.minStock ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-zinc-50 border-zinc-200"}`}>
                    {m.stock} left
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
