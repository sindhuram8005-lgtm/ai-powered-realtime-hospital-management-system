import { useState } from "react";
import type { User as UserType } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUsers, updateUser } from "@/lib/api";
import { toast } from "sonner";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Loader2, 
  Search, 
  Link2 
} from "lucide-react";

interface FamilyLinkingProps {
  user: UserType;
}

const RELATIONSHIP_OPTIONS = [
  { label: "Spouse", value: "Spouse" },
  { label: "Child", value: "Child" },
  { label: "Parent", value: "Parent" },
  { label: "Sibling", value: "Sibling" },
  { label: "Guardian", value: "Guardian" },
  { label: "Other", value: "Other" },
];

export default function FamilyLinking({ user }: FamilyLinkingProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRelativeId, setSelectedRelativeId] = useState("");
  const [relationship, setRelationship] = useState("Spouse");

  // Fetch all patients for selection list
  const { data: patientsData, isLoading: isLoadingPatients } = useQuery({
    queryKey: ["patients-list-for-linking"],
    queryFn: () => getUsers({ role: "patient", page: 1, limit: 100 }),
  });

  const allPatients = patientsData?.res || [];
  
  // Filter out the current patient and any already linked family members
  const linkedIds = (user.familyMembers || []).map(m => m.relativeId);
  const eligiblePatients = allPatients.filter(
    p => p._id !== user._id && !linkedIds.includes(p._id)
  );

  // Search filtered patients
  const searchedPatients = eligiblePatients.filter(
    p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
         p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      toast.success("Family links updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setSelectedRelativeId("");
      setSearchQuery("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update family link");
    }
  });

  const runUpdate = (fields: Partial<UserType>) => {
    updateMutation.mutate({
      userId: user._id,
      userData: fields
    });
  };

  // Add Family Link
  const handleLinkMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRelativeId) {
      toast.error("Please select a patient to link");
      return;
    }

    const relative = allPatients.find(p => p._id === selectedRelativeId);
    if (!relative) return;

    const currentLinks = user.familyMembers || [];
    const updatedLinks = [
      ...currentLinks,
      {
        relativeId: relative._id,
        relativeName: relative.name,
        relationship: relationship
      }
    ];

    // 1. Update Current Patient
    runUpdate({ familyMembers: updatedLinks });

    // 2. Proactively update the relative to establish bi-directional link
    const oppositeRelationshipMap: Record<string, string> = {
      "Spouse": "Spouse",
      "Child": "Parent",
      "Parent": "Child",
      "Sibling": "Sibling",
      "Guardian": "Dependent",
      "Other": "Other"
    };

    const oppRelation = oppositeRelationshipMap[relationship] || "Other";
    const relativeLinks = relative.familyMembers || [];
    const updatedRelativeLinks = [
      ...relativeLinks,
      {
        relativeId: user._id,
        relativeName: user.name,
        relationship: oppRelation
      }
    ];

    updateMutation.mutate({
      userId: relative._id,
      userData: {
        familyMembers: updatedRelativeLinks
      }
    });
  };

  // Remove Family Link (Bi-directional)
  const handleUnlinkMember = (relativeId: string) => {
    if (!confirm("Are you sure you want to remove this family link?")) return;

    // 1. Remove from current patient
    const updatedLinks = (user.familyMembers || []).filter(m => m.relativeId !== relativeId);
    runUpdate({ familyMembers: updatedLinks });

    // 2. Remove from relative profile
    const relative = allPatients.find(p => p._id === relativeId);
    if (relative) {
      const updatedRelativeLinks = (relative.familyMembers || []).filter(m => m.relativeId !== user._id);
      updateMutation.mutate({
        userId: relativeId,
        userData: {
          familyMembers: updatedRelativeLinks
        }
      });
    }
  };

  const isSaving = updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* List of currently linked family members */}
      <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-4">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
          <Users className="text-teal-600 h-4 w-4" /> Linked Family Members
        </h3>

        {isSaving && (
          <div className="flex items-center gap-2 text-xs text-teal-600 font-semibold bg-teal-50 dark:bg-teal-900/20 p-2 rounded-lg justify-center">
            <Loader2 size={14} className="animate-spin" /> Saving changes to database...
          </div>
        )}

        <div className="space-y-2">
          {(user.familyMembers || []).length === 0 ? (
            <div className="text-center py-6 border border-dashed rounded-lg text-zinc-400 dark:text-zinc-600 text-xs">
              No family members linked to this patient.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {user.familyMembers?.map((member) => (
                <div 
                  key={member.relativeId} 
                  className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 shadow-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200 truncate">{member.relativeName}</p>
                    <Badge variant="secondary" className="mt-1 text-[10px] uppercase font-bold tracking-wider">
                      {member.relationship}
                    </Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleUnlinkMember(member.relativeId)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0 h-8 w-8 p-0"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Link new member form */}
      <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-4">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
          <UserPlus className="text-blue-600 h-4 w-4" /> Link New Family Member
        </h3>

        <form onSubmit={handleLinkMember} className="space-y-4">
          {/* Search patients */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
              Search Patient Directory
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient by name or email..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Patient Selector List */}
          {searchQuery && (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg max-h-40 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 text-xs bg-white dark:bg-zinc-950">
              {isLoadingPatients ? (
                <div className="p-4 text-center text-zinc-400">Loading directory...</div>
              ) : searchedPatients.length === 0 ? (
                <div className="p-4 text-center text-zinc-400">No matching patients found.</div>
              ) : (
                searchedPatients.map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => {
                      setSelectedRelativeId(p._id);
                      setSearchQuery(p.name);
                    }}
                    className={`w-full text-left p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 flex justify-between items-center ${
                      selectedRelativeId === p._id ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-zinc-800 dark:text-zinc-200">{p.name}</p>
                      <p className="text-[10px] text-zinc-400">{p.email}</p>
                    </div>
                    {selectedRelativeId === p._id && (
                      <span className="text-[10px] text-blue-600 font-bold">Selected</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Relationship Selector */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                Relationship
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full text-xs border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950 p-2.5 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                {RELATIONSHIP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button 
                type="submit" 
                disabled={!selectedRelativeId || isSaving}
                className="w-full gap-2 text-xs h-[38px]"
              >
                <Link2 size={14} /> Establish Link
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
