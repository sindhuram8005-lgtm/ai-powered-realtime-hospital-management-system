import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getComplianceStats, logIncident, archiveRecords } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ShieldCheck, Landmark, ClipboardList, RefreshCw, AlertOctagon, Archive, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { socket } from "@/lib/socket";

export function meta() {
  return [{ title: "Governance & NABH Compliance | MedFlow AI" }];
}

export default function ComplianceConsole() {
  const queryClient = useQueryClient();
  const [isIncidentOpen, setIsIncidentOpen] = useState(false);

  // Form states
  const [incTitle, setIncTitle] = useState("");
  const [incSeverity, setIncSeverity] = useState("Low");
  const [incDesc, setIncDesc] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["complianceStats"],
    queryFn: getComplianceStats,
  });

  useEffect(() => {
    socket.on("notify_compliance_updated", () => refetch());
    return () => {
      socket.off("notify_compliance_updated");
    };
  }, [refetch]);

  const incidentMutation = useMutation({
    mutationFn: logIncident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complianceStats"] });
      toast.success("Incident logged successfully into Quality Register.");
      setIsIncidentOpen(false);
      setIncTitle("");
      setIncDesc("");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: archiveRecords,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["complianceStats"] });
      toast.success(data.message || "Records archived successfully!");
    },
  });

  const handleIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incTitle || !incDesc) {
      toast.error("Please fill in title and description");
      return;
    }
    incidentMutation.mutate({
      title: incTitle,
      severity: incSeverity,
      description: incDesc,
    });
  };

  const handleArchiveTrigger = (recordType: string) => {
    toast.loading("Compiling clinical document packets...");
    archiveMutation.mutate(recordType);
  };

  if (isLoading || !data) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] italic text-zinc-400">
        Loading governance data...
      </div>
    );
  }

  const { compliance, liveMetrics } = data;

  return (
    <div className="space-y-6 mt-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            Accreditation & Governance Console
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            Monitor ABDM registry connections, track NABL pathologists, audit hygiene logs, and enforce retention archival policies.
          </p>
        </div>

        <Dialog open={isIncidentOpen} onOpenChange={setIsIncidentOpen}>
          <DialogTrigger asChild>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl gap-1.5 shadow-sm">
              <AlertOctagon size={16} /> Log Quality Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-1.5 text-rose-600">
                <AlertOctagon /> Report Operational Incident
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleIncidentSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="incTitle">Incident Subject</Label>
                <Input id="incTitle" placeholder="e.g. Temperature storage failure" value={incTitle} onChange={(e) => setIncTitle(e.target.value)} required />
              </div>

              <div className="space-y-1">
                <Label htmlFor="incSeverity">Severity</Label>
                <Select value={incSeverity} onValueChange={setIncSeverity}>
                  <SelectTrigger id="incSeverity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low (Administrative)</SelectItem>
                    <SelectItem value="Medium">Medium (Operational Check)</SelectItem>
                    <SelectItem value="High">High (Clinical Action)</SelectItem>
                    <SelectItem value="Critical">Critical (Immediate Audit)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="incDesc">Detailed Description</Label>
                <Textarea id="incDesc" placeholder="Explain the root cause and initial corrective measures..." value={incDesc} onChange={(e) => setIncDesc(e.target.value)} required />
              </div>

              <Button type="submit" className="w-full bg-rose-650 hover:bg-rose-700 font-bold" disabled={incidentMutation.isPending}>
                Record Incident Entry
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid status cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass border border-emerald-200/50 dark:border-emerald-950/20 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">NABH Quality Score</p>
              <h3 className="text-2xl font-black mt-1 text-zinc-800 dark:text-zinc-100">{compliance?.nabhScore}%</h3>
              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5 mt-1">
                <CheckCircle size={10} /> Certified Active
              </span>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl">
              <ShieldCheck size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Consent Signed Rate</p>
              <h3 className="text-2xl font-black mt-1 text-zinc-800 dark:text-zinc-100">{liveMetrics.consentRate}%</h3>
              <span className="text-[10px] text-zinc-450 mt-1 block">Legal consents verified</span>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl">
              <ClipboardList size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">ABDM Linkage Rate</p>
              <h3 className="text-2xl font-black mt-1 text-zinc-800 dark:text-zinc-100">{liveMetrics.abdmLinkageRate}%</h3>
              <span className="text-[10px] text-zinc-450 mt-1 block">Ayushman ABHA accounts</span>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-650 rounded-2xl">
              <Landmark size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Hygiene Audit Rate</p>
              <h3 className="text-2xl font-black mt-1 text-zinc-800 dark:text-zinc-100">{compliance?.hygieneRate}%</h3>
              <span className="text-[10px] text-zinc-450 mt-1 block">Ward inspection checklists</span>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-650 rounded-2xl">
              <ShieldCheck size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quality Incidents Register */}
        <Card className="lg:col-span-2 card shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl overflow-hidden">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-850 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <Landmark className="text-blue-500" /> Quality & Safety Audit Register
            </CardTitle>
            <CardDescription>NABH quality audit log register for clinical discrepancy reports.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Date</TableHead>
                  <TableHead>Subject Incident</TableHead>
                  <TableHead className="text-center">Severity</TableHead>
                  <TableHead className="pr-6">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compliance?.incidentsLogged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center italic text-zinc-400 h-24">No quality deviations logged.</TableCell>
                  </TableRow>
                ) : (
                  compliance.incidentsLogged.map((inc: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-6 font-mono text-zinc-400 text-xs">{new Date(inc.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-bold text-sm text-zinc-800 dark:text-zinc-150">{inc.title}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-[9px] uppercase px-2 ${inc.severity === "Critical" ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-zinc-50 border-zinc-200"}`}>
                          {inc.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-xs text-zinc-500">{inc.description}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Data Retention Archival */}
        <Card className="card shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl overflow-hidden h-fit">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-850 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <Archive className="text-indigo-500" /> Data Retention Policies
            </CardTitle>
            <CardDescription>Archive clinical folders complying with governmental records regulations.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-3">
              {compliance?.retentionPolicies.map((p: any) => (
                <div key={p.recordType} className="flex justify-between items-center p-3 border border-zinc-100 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl">
                  <div>
                    <h4 className="font-bold text-sm text-zinc-850 dark:text-zinc-200">{p.recordType} Archives</h4>
                    <p className="text-[10px] text-zinc-450 mt-0.5">Retention rule: {p.retentionYears} years • {p.archivedRecordsCount} packets archived</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleArchiveTrigger(p.recordType)}
                    className="text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg h-8 px-2 flex items-center gap-1"
                  >
                    <Archive size={12} /> Pack & Archive
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
