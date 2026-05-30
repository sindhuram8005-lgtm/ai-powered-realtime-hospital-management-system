import { useState, useRef, useEffect } from "react";
import type { User as UserType } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { 
  FileSignature, 
  Check, 
  X, 
  Clock, 
  Loader2, 
  ShieldCheck, 
  FileText,
  Signature
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConsentManagementProps {
  user: UserType;
}

const CONSENT_TEMPLATES = [
  {
    key: "general",
    title: "General Medical Treatment Consent",
    description: "Authorizes the hospital medical staff to perform routine diagnostic examinations, clinical tests, and basic medical therapies."
  },
  {
    key: "data_sharing",
    title: "ABDM Information Sharing Consent",
    description: "Permits the hospital to share digital health records with other registered ABDM healthcare providers for integrated patient care."
  },
  {
    key: "surgical",
    title: "Surgical & Anesthesia Consent",
    description: "Consent for major diagnostic/surgical procedures under local or general anesthesia after risks and alternatives are explained."
  },
  {
    key: "telehealth",
    title: "Telehealth Consultation Consent",
    description: "Consent to receive clinical care and diagnostics remotely via audio, video, or digital telemedicine interfaces."
  }
];

export default function ConsentManagement({ user }: ConsentManagementProps) {
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSignOpen, setIsSignOpen] = useState(false);
  const [activeTmpl, setActiveTmpl] = useState<any>(null);

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsSignOpen(false);
      clearSignature();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update consent status");
    }
  });

  // Setup Canvas brush
  useEffect(() => {
    if (isSignOpen && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#1d4ed8";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
      }
    }
  }, [isSignOpen]);

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

  const stopDrawing = () => setIsDrawing(false);
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleToggleConsent = (formTitle: string, currentStatus: "active" | "revoked" | undefined) => {
    if (currentStatus === "active") {
      // Revoke directly
      const currentConsents = user.consents || [];
      const updated = currentConsents.map((c) =>
        c.formName === formTitle ? { ...c, status: "revoked" as const } : c
      );
      updateMutation.mutate({
        userId: user._id,
        userData: { consents: updated, consentSigned: false }
      });
      toast.success(`Consent for "${formTitle}" revoked successfully!`);
    } else {
      // Open signature modal
      const tmpl = CONSENT_TEMPLATES.find((t) => t.title === formTitle);
      setActiveTmpl(tmpl);
      setIsSignOpen(true);
    }
  };

  const handleApproveSignature = () => {
    if (!activeTmpl) return;
    const canvas = canvasRef.current;
    const sigData = canvas ? canvas.toDataURL() : "signed";

    const currentConsents = user.consents || [];
    const filtered = currentConsents.filter((c) => c.formName !== activeTmpl.title);
    const updated = [
      ...filtered,
      {
        formName: activeTmpl.title,
        status: "active" as const,
        signedAt: new Date().toISOString(),
        signature: sigData,
      }
    ];

    updateMutation.mutate({
      userId: user._id,
      userData: {
        consents: updated,
        consentSigned: true, // flag for compliance module
      }
    });

    toast.success(`Consent for "${activeTmpl.title}" signed successfully!`);
  };

  const isSaving = updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-2 border-b">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 text-sm">
          <FileSignature className="text-blue-600 h-4 w-4" /> Legal & Clinical Consent Forms
        </h3>
        {isSaving && (
          <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold">
            <Loader2 size={12} className="animate-spin" /> Saving...
          </div>
        )}
      </div>

      <div className="space-y-4">
        {CONSENT_TEMPLATES.map((tmpl) => {
          const userConsent = user.consents?.find(c => c.formName === tmpl.title);
          const isActive = userConsent?.status === "active";

          return (
            <div 
              key={tmpl.key} 
              className={`p-4 rounded-xl border transition-all ${
                isActive 
                  ? "border-emerald-100 bg-emerald-50/20 dark:border-emerald-950/20 dark:bg-emerald-950/5" 
                  : "border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className={isActive ? "text-emerald-600" : "text-zinc-400"} />
                    <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                      {tmpl.title}
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed max-w-xl">
                    {tmpl.description}
                  </p>
                  
                  {userConsent && (
                    <div className="flex items-center gap-4 text-[10px] text-zinc-400 font-bold uppercase tracking-wider pt-1">
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> Last updated: {new Date(userConsent.signedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2">
                  {isActive ? (
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900 text-[10px] uppercase font-bold tracking-wider gap-1">
                      <ShieldCheck size={11} /> Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900 text-[10px] uppercase font-bold tracking-wider gap-1">
                      <X size={11} /> Required
                    </Badge>
                  )}

                  <Button
                    size="sm"
                    variant={isActive ? "outline" : "default"}
                    onClick={() => handleToggleConsent(tmpl.title, userConsent?.status)}
                    disabled={isSaving}
                    className="h-8 text-xs font-semibold"
                  >
                    {isActive ? "Revoke Consent" : "Sign Consent"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Signature Modal */}
      <Dialog open={isSignOpen} onOpenChange={setIsSignOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-1">
              <Signature className="text-blue-500" /> Draw Legal Signature
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-xs text-zinc-500 leading-relaxed">
              Please sign inside the frame below to authorize <strong>{activeTmpl?.title}</strong> for this medical profile.
            </p>

            <div className="border border-dashed border-zinc-350 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/20">
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

            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" className="text-xs text-zinc-400 h-8" onClick={clearSignature}>
                Clear
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs h-8" onClick={handleApproveSignature} disabled={isSaving}>
                {isSaving ? "Saving..." : "Approve & E-Sign"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
