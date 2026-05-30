import { useState } from "react";
import type { User as UserType, LabResult, invoice as InvoiceType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPatientLabResults, getBillingHistory, updateUser } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { 
  History, 
  UserPlus, 
  Stethoscope, 
  FlaskConical, 
  DollarSign, 
  FileText, 
  Plus, 
  Loader2,
  CalendarCheck,
  CheckCircle2
} from "lucide-react";

interface PatientTimelineProps {
  user: UserType;
}

interface TimelineEvent {
  id: string;
  date: Date;
  title: string;
  details: string;
  type: "registration" | "admission" | "lab_result" | "invoice" | "clinical_note";
  author?: string;
}

export default function PatientTimeline({ user }: PatientTimelineProps) {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const [newNote, setNewNote] = useState("");

  const isStaff = ["admin", "doctor", "nurse"].includes(session?.user?.role || "");

  // 1. Fetch Lab Results
  const { data: labResults, isLoading: isLoadingLabs } = useQuery<LabResult[]>({
    queryKey: ["patient-lab-results-timeline", user._id],
    queryFn: () => getPatientLabResults(user._id),
  });

  // 2. Fetch Invoices
  const { data: invoices, isLoading: isLoadingInvoices } = useQuery<InvoiceType[]>({
    queryKey: ["patient-invoices-timeline", user._id],
    queryFn: () => getBillingHistory(user._id),
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      toast.success("Clinical note logged successfully!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setNewNote("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log clinical note");
    }
  });

  // Add custom clinical note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const currentNotes = user.timelineNotes || [];
    const updatedNotes = [
      ...currentNotes,
      {
        note: newNote.trim(),
        authorName: session?.user?.name || "Medical Staff",
        authorRole: session?.user?.role || "staff",
        date: new Date().toISOString()
      }
    ];

    updateMutation.mutate({
      userId: user._id,
      userData: {
        timelineNotes: updatedNotes
      }
    });
  };

  // Compile all timeline events
  const events: TimelineEvent[] = [];

  // A. Account Registration Event
  events.push({
    id: "reg-" + user.createdAt,
    date: new Date(user.createdAt),
    title: "Patient Registered",
    details: `Account established for ${user.name} with Hospital ID: ${user.uhid || "Pending"}`,
    type: "registration"
  });

  // B. Admission Event
  if (user.status === "admitted" || user.triageReasoning) {
    events.push({
      id: "adm-" + user.createdAt,
      date: new Date(user.createdAt),
      title: "Patient Admitted",
      details: user.triageReasoning || user.medicalHistory || "General Admission requested",
      type: "admission"
    });
  }

  // C. Lab Results Events
  if (labResults) {
    labResults.forEach((lab) => {
      events.push({
        id: "lab-" + lab._id,
        date: new Date(lab.createdAt),
        title: `Lab Test Ordered: ${lab.testType}`,
        details: `Body Part: ${lab.bodyPart} | Status: ${lab.status.toUpperCase()} ${
          lab.aiAnalysis ? `| AI Analysis Completed` : ""
        }`,
        type: "lab_result"
      });
    });
  }

  // D. Invoice Events
  if (invoices) {
    invoices.forEach((inv) => {
      events.push({
        id: "inv-" + inv._id,
        date: new Date(inv.createdAt),
        title: `Hospital Invoice Generated`,
        details: `Invoice Status: ${inv.status.toUpperCase()} | Total Amount: $${(inv.totalAmount / 100).toFixed(2)}`,
        type: "invoice"
      });
    });
  }

  // E. Custom Clinical Notes Events
  if (user.timelineNotes) {
    user.timelineNotes.forEach((note, idx) => {
      events.push({
        id: `note-${idx}-${note.date}`,
        date: new Date(note.date),
        title: "Clinical Note Added",
        details: note.note,
        type: "clinical_note",
        author: `${note.authorName} (${note.authorRole.toUpperCase()})`
      });
    });
  }

  // Sort: Latest events first
  const sortedEvents = events.sort((a, b) => b.date.getTime() - a.date.getTime());

  const isLoading = isLoadingLabs || isLoadingInvoices || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Clinician's quick logger */}
      {isStaff && (
        <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-3">
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Clinical Log / Timeline Note Entry
          </h4>
          <form onSubmit={handleAddNote} className="flex gap-2">
            <Input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Record vitals, status checks, procedures performed..."
              className="text-xs h-9 flex-1"
            />
            <Button type="submit" size="sm" className="h-9 gap-1 text-xs" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              Log Event
            </Button>
          </form>
        </div>
      )}

      {/* Vertical Timeline */}
      <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-4">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
          <History className="text-blue-600 h-4 w-4" /> Comprehensive Patient Journey
        </h3>

        {isLoading && events.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
          </div>
        ) : (
          <div className="relative border-l border-zinc-200 dark:border-zinc-800 ml-4 pl-6 space-y-6 py-2">
            {sortedEvents.map((evt) => {
              // Icon mapping
              let Icon = Stethoscope;
              let iconColor = "bg-blue-500 text-white";
              if (evt.type === "registration") {
                Icon = UserPlus;
                iconColor = "bg-purple-500 text-white";
              } else if (evt.type === "admission") {
                Icon = CalendarCheck;
                iconColor = "bg-orange-500 text-white";
              } else if (evt.type === "lab_result") {
                Icon = FlaskConical;
                iconColor = "bg-teal-500 text-white";
              } else if (evt.type === "invoice") {
                Icon = DollarSign;
                iconColor = "bg-emerald-500 text-white";
              }

              return (
                <div key={evt.id} className="relative group">
                  {/* Timeline bullet/icon */}
                  <span className={`absolute -left-10 top-0.5 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-md ${iconColor}`}>
                    <Icon size={14} />
                  </span>

                  {/* Content card */}
                  <div className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 group-hover:shadow-xs transition-shadow">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                        {evt.title}
                      </h4>
                      <span className="text-[10px] font-semibold text-zinc-400">
                        {evt.date.toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                      {evt.details}
                    </p>

                    {evt.author && (
                      <div className="mt-2 text-[9px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 size={10} className="text-emerald-500" /> Logged By: {evt.author}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
