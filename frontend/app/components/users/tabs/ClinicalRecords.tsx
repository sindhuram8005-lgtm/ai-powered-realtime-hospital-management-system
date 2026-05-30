import { useState } from "react";
import type { User as UserType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser } from "@/lib/api";
import { toast } from "sonner";
import { 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Activity, 
  Check, 
  ShieldAlert, 
  FileText, 
  Loader2 
} from "lucide-react";

interface ClinicalRecordsProps {
  user: UserType;
}

export default function ClinicalRecords({ user }: ClinicalRecordsProps) {
  const queryClient = useQueryClient();
  const [newDisease, setNewDisease] = useState("");
  const [newAllergyItem, setNewAllergyItem] = useState("");
  const [newAllergyType, setNewAllergyType] = useState<"drug" | "food" | "environment" | "other">("drug");
  const [newAllergySeverity, setNewAllergySeverity] = useState<"mild" | "moderate" | "severe">("mild");
  
  const [newProcedure, setNewProcedure] = useState("");
  const [newDiagnosis, setNewDiagnosis] = useState("");

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update clinical records");
    }
  });

  const runUpdate = (fields: Partial<UserType>) => {
    updateMutation.mutate({
      userId: user._id,
      userData: fields
    });
  };

  // Add Disease
  const handleAddDisease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisease.trim()) return;
    const current = user.chronicDiseases || [];
    if (current.includes(newDisease.trim())) {
      toast.error("Disease already exists");
      return;
    }
    const updated = [...current, newDisease.trim()];
    runUpdate({ chronicDiseases: updated });
    setNewDisease("");
    toast.success("Chronic disease added!");
  };

  // Remove Disease
  const handleRemoveDisease = (disease: string) => {
    const updated = (user.chronicDiseases || []).filter(d => d !== disease);
    runUpdate({ chronicDiseases: updated });
    toast.success("Chronic disease removed");
  };

  // Add Allergy
  const handleAddAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAllergyItem.trim()) return;
    const current = user.allergies || [];
    if (current.some(a => a.item.toLowerCase() === newAllergyItem.trim().toLowerCase())) {
      toast.error("Allergy already exists");
      return;
    }
    const updated = [
      ...current,
      {
        type: newAllergyType,
        item: newAllergyItem.trim(),
        severity: newAllergySeverity
      }
    ];
    runUpdate({ allergies: updated });
    setNewAllergyItem("");
    toast.success("Allergy recorded successfully!");
  };

  // Remove Allergy
  const handleRemoveAllergy = (item: string) => {
    const updated = (user.allergies || []).filter(a => a.item !== item);
    runUpdate({ allergies: updated });
    toast.success("Allergy record removed");
  };

  // Add Procedure
  const handleAddProcedure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProcedure.trim()) return;
    const current = user.pastProcedures || [];
    const updated = [...current, newProcedure.trim()];
    runUpdate({ pastProcedures: updated });
    setNewProcedure("");
    toast.success("Procedure added to history");
  };

  // Remove Procedure
  const handleRemoveProcedure = (idx: number) => {
    const current = user.pastProcedures || [];
    const updated = current.filter((_, i) => i !== idx);
    runUpdate({ pastProcedures: updated });
    toast.success("Procedure entry removed");
  };

  // Add Diagnosis
  const handleAddDiagnosis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiagnosis.trim()) return;
    const current = user.diagnoses || [];
    const updated = [...current, newDiagnosis.trim()];
    runUpdate({ diagnoses: updated });
    setNewDiagnosis("");
    toast.success("Diagnosis added to history");
  };

  // Remove Diagnosis
  const handleRemoveDiagnosis = (idx: number) => {
    const current = user.diagnoses || [];
    const updated = current.filter((_, i) => i !== idx);
    runUpdate({ diagnoses: updated });
    toast.success("Diagnosis entry removed");
  };

  const isSaving = updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Loading overlay indicator */}
      {isSaving && (
        <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg justify-center">
          <Loader2 size={14} className="animate-spin" /> Saving changes to database...
        </div>
      )}

      {/* 1. Chronic Diseases */}
      <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-3">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
          <Activity className="text-rose-500 h-4 w-4" /> Chronic Diseases / Conditions
        </h3>
        
        {/* Diseases tags */}
        <div className="flex flex-wrap gap-2">
          {(user.chronicDiseases || []).length === 0 ? (
            <p className="text-xs text-zinc-400 italic">No chronic diseases registered.</p>
          ) : (
            user.chronicDiseases?.map((disease) => (
              <Badge key={disease} variant="outline" className="px-2 py-1 gap-1 border-rose-200 bg-rose-50/50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-400">
                {disease}
                <button onClick={() => handleRemoveDisease(disease)} className="hover:text-red-900 ml-1">
                  ✕
                </button>
              </Badge>
            ))
          )}
        </div>

        {/* Add disease input */}
        <form onSubmit={handleAddDisease} className="flex gap-2">
          <Input
            value={newDisease}
            onChange={(e) => setNewDisease(e.target.value)}
            placeholder="Add chronic condition (e.g. Type 2 Diabetes)"
            className="h-8 text-xs flex-1"
          />
          <Button type="submit" size="sm" className="h-8 gap-1 text-xs">
            <Plus size={12} /> Add
          </Button>
        </form>
      </div>

      {/* 2. Allergies */}
      <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-4">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
          <ShieldAlert className="text-amber-500 h-4 w-4" /> Allergies Directory
        </h3>

        {/* Allergies list */}
        <div className="space-y-2">
          {(user.allergies || []).length === 0 ? (
            <p className="text-xs text-zinc-400 italic">No known allergies registered.</p>
          ) : (
            <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 font-bold uppercase border-b border-zinc-100 dark:border-zinc-800">
                  <tr>
                    <th className="p-2.5">Item</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Severity</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {user.allergies?.map((allergy) => (
                    <tr key={allergy.item} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                      <td className="p-2.5 font-bold text-zinc-800 dark:text-zinc-200">{allergy.item}</td>
                      <td className="p-2.5 capitalize">{allergy.type}</td>
                      <td className="p-2.5">
                        <Badge
                          variant="outline"
                          className={
                            allergy.severity === "severe"
                              ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900"
                              : allergy.severity === "moderate"
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900"
                                : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900"
                          }
                        >
                          {allergy.severity}
                        </Badge>
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => handleRemoveAllergy(allergy.item)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-md"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add allergy inline form */}
        <form onSubmit={handleAddAllergy} className="space-y-2 border-t pt-3 mt-1">
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Record New Allergy</h4>
          <div className="grid grid-cols-3 gap-2">
            <Input
              value={newAllergyItem}
              onChange={(e) => setNewAllergyItem(e.target.value)}
              placeholder="e.g. Penicillin / Peanuts"
              className="h-8 text-xs col-span-1"
            />
            <select
              value={newAllergyType}
              onChange={(e) => setNewAllergyType(e.target.value as any)}
              className="h-8 text-xs border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950 px-2"
            >
              <option value="drug">Drug</option>
              <option value="food">Food</option>
              <option value="environment">Environment</option>
              <option value="other">Other</option>
            </select>
            <select
              value={newAllergySeverity}
              onChange={(e) => setNewAllergySeverity(e.target.value as any)}
              className="h-8 text-xs border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950 px-2"
            >
              <option value="mild">Mild Severity</option>
              <option value="moderate">Moderate Severity</option>
              <option value="severe">Severe / Anaphylaxis</option>
            </select>
          </div>
          <Button type="submit" size="sm" className="w-full h-8 gap-1 text-xs">
            <Plus size={12} /> Log Allergy
          </Button>
        </form>
      </div>

      {/* 3. Medical History (Past Procedures & Diagnoses) */}
      <div className="grid grid-cols-2 gap-4">
        {/* Procedures Column */}
        <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-3">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
            <FileText className="text-blue-500 h-4 w-4" /> Past Procedures / Surgeries
          </h3>

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {(user.pastProcedures || []).length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No procedures recorded.</p>
            ) : (
              user.pastProcedures?.map((proc, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-xs">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">{proc}</span>
                  <button onClick={() => handleRemoveProcedure(idx)} className="text-red-500 hover:text-red-700">
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddProcedure} className="flex gap-2 border-t pt-2">
            <Input
              value={newProcedure}
              onChange={(e) => setNewProcedure(e.target.value)}
              placeholder="e.g. Appendectomy (2023)"
              className="h-8 text-xs flex-1"
            />
            <Button type="submit" size="sm" className="h-8 text-xs">
              Add
            </Button>
          </form>
        </div>

        {/* Diagnoses Column */}
        <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-3">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
            <Activity className="text-indigo-500 h-4 w-4" /> Past Diagnoses
          </h3>

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {(user.diagnoses || []).length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No diagnoses recorded.</p>
            ) : (
              user.diagnoses?.map((diag, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-xs">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">{diag}</span>
                  <button onClick={() => handleRemoveDiagnosis(idx)} className="text-red-500 hover:text-red-700">
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddDiagnosis} className="flex gap-2 border-t pt-2">
            <Input
              value={newDiagnosis}
              onChange={(e) => setNewDiagnosis(e.target.value)}
              placeholder="e.g. Hypertension (2020)"
              className="h-8 text-xs flex-1"
            />
            <Button type="submit" size="sm" className="h-8 text-xs">
              Add
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
