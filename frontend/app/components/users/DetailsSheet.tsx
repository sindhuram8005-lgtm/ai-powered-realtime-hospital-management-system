import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { User as UserType } from "@/types";
import Profile from "./tabs/profile";
import Radiology from "./tabs/Radiology";
import ClinicalRecords from "./tabs/ClinicalRecords";
import AbhaVerification from "./tabs/AbhaVerification";
import FamilyLinking from "./tabs/FamilyLinking";
import PatientTimeline from "./tabs/PatientTimeline";
import ConsentManagement from "./tabs/ConsentManagement";
import { getPatientFHIR } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Download, FileCode } from "lucide-react";

interface UserDetailsSheetProps {
  user: UserType | null;
  isOpen: boolean;
  onClose: () => void;
}

function FhirExporter({ patientId }: { patientId: string }) {
  const { data: fhirBundle, isLoading, error } = useQuery({
    queryKey: ["fhirBundle", patientId],
    queryFn: () => getPatientFHIR(patientId),
  });

  const handleDownload = () => {
    if (!fhirBundle) return;
    const blob = new Blob([JSON.stringify(fhirBundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fhir-bundle-${patientId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="text-xs text-zinc-400 italic">Compiling HL7/FHIR resources...</div>;
  if (error) return <div className="text-xs text-red-500">Failed to construct HL7/FHIR bundle.</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/50">
        <div>
          <h4 className="font-bold text-xs uppercase text-zinc-400">HL7 / FHIR v4.0.1 Compliance</h4>
          <p className="text-[10px] text-zinc-500">Includes Patient demographics, Observation telemetry, and Condition SOAPs.</p>
        </div>
        <Button onClick={handleDownload} size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs gap-1.5 rounded-lg">
          <Download size={14} /> Download FHIR JSON
        </Button>
      </div>

      <div className="bg-zinc-900 text-zinc-100 p-4 rounded-xl border font-mono text-[10px] h-96 overflow-auto">
        <pre>{JSON.stringify(fhirBundle, null, 2)}</pre>
      </div>
    </div>
  );
}

export function DetailsSheet({ user, isOpen, onClose }: UserDetailsSheetProps) {
  if (!user) return null;

  const isPatient = user.role === "patient";

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        className="inset-y-4! right-4! h-auto! sm:max-w-2xl rounded-xl border shadow-2xl p-0 overflow-hidden bg-white dark:bg-zinc-950 flex flex-col min-w-[650px]"
        side="right"
      >
        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-b shrink-0">
          <SheetHeader className="flex flex-row items-center gap-4 space-y-0">
            <Avatar className="h-16 w-16 border-2 border-white dark:border-slate-800 shadow-sm">
              <AvatarImage src={user.image || ""} />
              <AvatarFallback className="text-lg font-bold bg-blue-100 text-blue-700">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                {user.name}
                {isPatient && user.uhid && (
                  <span className="text-xs font-mono font-normal text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-sm">
                    {user.uhid}
                  </span>
                )}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="capitalize">
                  {user.role}
                </Badge>
                <Badge
                  className={
                    user.status === "admitted"
                      ? "bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200"
                      : user.status === "active"
                        ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200"
                  }
                  variant="outline"
                >
                  {user.status?.replace("_", " ") || "Active"}
                </Badge>
              </SheetDescription>
            </div>
          </SheetHeader>
        </div>
        <ScrollArea className="min-h-150 flex-1">
          <div className="p-6">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList
                className={`flex flex-wrap w-full gap-1 h-auto p-1 bg-zinc-100 dark:bg-zinc-850 rounded-lg justify-start mb-6`}
              >
                <TabsTrigger value="profile" className="text-xs px-2.5 py-1.5 flex-1 sm:flex-initial">Demographics</TabsTrigger>
                {isPatient && (
                  <>
                    <TabsTrigger value="clinical" className="text-xs px-2.5 py-1.5 flex-1 sm:flex-initial">Clinical Records</TabsTrigger>
                    <TabsTrigger value="abha" className="text-xs px-2.5 py-1.5 flex-1 sm:flex-initial">ABHA Card</TabsTrigger>
                    <TabsTrigger value="family" className="text-xs px-2.5 py-1.5 flex-1 sm:flex-initial">Family Links</TabsTrigger>
                    <TabsTrigger value="timeline" className="text-xs px-2.5 py-1.5 flex-1 sm:flex-initial">Timeline</TabsTrigger>
                    <TabsTrigger value="consent" className="text-xs px-2.5 py-1.5 flex-1 sm:flex-initial">Consents</TabsTrigger>
                    <TabsTrigger value="radiology" className="text-xs px-2.5 py-1.5 flex-1 sm:flex-initial">X-Rays</TabsTrigger>
                    <TabsTrigger value="fhir" className="text-xs px-2.5 py-1.5 flex-1 sm:flex-initial">FHIR Export</TabsTrigger>
                  </>
                )}
              </TabsList>
              
              <TabsContent value="profile">
                <Profile user={user} />
              </TabsContent>
              
              {isPatient && (
                <>
                  <TabsContent value="clinical">
                    <ClinicalRecords user={user} />
                  </TabsContent>
                  <TabsContent value="abha">
                    <AbhaVerification user={user} />
                  </TabsContent>
                  <TabsContent value="family">
                    <FamilyLinking user={user} />
                  </TabsContent>
                  <TabsContent value="timeline">
                    <PatientTimeline user={user} />
                  </TabsContent>
                  <TabsContent value="consent">
                    <ConsentManagement user={user} />
                  </TabsContent>
                  <TabsContent value="radiology">
                    <Radiology patientId={user._id} />
                  </TabsContent>
                  <TabsContent value="fhir">
                    <FhirExporter patientId={user._id} />
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
