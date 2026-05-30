import {
  User,
  Mail,
  Calendar,
  Droplets,
  Activity,
  Phone,
  MapPin,
  Heart,
  Shield,
  Fingerprint,
  type LucideIcon,
} from "lucide-react";
import type { User as UserType } from "@/types";

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg shadow-xs border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 truncate">
      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md shrink-0">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
}

export default function Profile({ user }: { user: UserType }) {
  const isPatient = user.role === "patient";

  return (
    <div className="space-y-6">
      {/* Grid of basic demographics */}
      <div className="grid grid-cols-2 gap-4">
        <InfoItem icon={Mail} label="Email Address" value={user.email} />
        {isPatient && (
          <InfoItem icon={Phone} label="Phone Number" value={user.phoneNumber} />
        )}
        <InfoItem
          icon={Calendar}
          label="Registration Date"
          value={new Date(user.createdAt).toLocaleDateString()}
        />

        {isPatient ? (
          <>
            <InfoItem
              icon={Calendar}
              label="Date of Birth"
              value={user.dob ? new Date(user.dob).toLocaleDateString() : "N/A"}
            />
            <InfoItem icon={User} label="Age" value={user.age} />
            <InfoItem icon={User} label="Gender" value={user.gender} />
            <InfoItem
              icon={Droplets}
              label="Blood Group"
              value={user.bloodgroup}
            />
            <InfoItem
              icon={Fingerprint}
              label="UHID (Hospital ID)"
              value={user.uhid}
            />
          </>
        ) : (
          <>
            <InfoItem
              icon={Activity}
              label="Department"
              value={user.department}
            />
            {user.role === "doctor" && (
              <InfoItem
                icon={Activity}
                label="Specialization"
                value={user.specialization}
              />
            )}
          </>
        )}
      </div>

      {isPatient && (
        <div className="space-y-4">
          {/* Address */}
          <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-xs flex items-start gap-3">
            <div className="p-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md shrink-0">
              <MapPin size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Permanent Address</h4>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">
                {user.address || "No permanent address recorded."}
              </p>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="p-4 rounded-xl border border-red-100 dark:border-red-950/20 bg-red-50/30 dark:bg-red-950/5 shadow-xs flex items-start gap-3">
            <div className="p-2 bg-red-100/50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md shrink-0">
              <Heart size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-red-600/80 uppercase tracking-wider">Emergency Contact Details</h4>
              {user.emergencyContact?.name ? (
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <div>
                    <span className="text-xs text-muted-foreground">Name:</span>
                    <p className="font-semibold">{user.emergencyContact.name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Relationship:</span>
                    <p className="font-semibold">{user.emergencyContact.relationship}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground">Phone Number:</span>
                    <p className="font-semibold">{user.emergencyContact.phone}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-500 mt-1">No emergency contact information registered.</p>
              )}
            </div>
          </div>

          {/* ABHA Link Card */}
          <div className="p-4 rounded-xl border border-teal-100 dark:border-teal-950/20 bg-teal-50/30 dark:bg-teal-950/5 shadow-xs flex items-start gap-3">
            <div className="p-2 bg-teal-100/50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-md shrink-0">
              <Shield size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-teal-600/80 uppercase tracking-wider">Ayushman Bharat Health Account (ABHA)</h4>
              {user.abhaNumber ? (
                <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
                  <p>
                    <span className="text-xs text-muted-foreground">ABHA Number:</span>{" "}
                    <span className="font-mono font-bold tracking-wider">{user.abhaNumber}</span>
                  </p>
                  <p>
                    <span className="text-xs text-muted-foreground">ABHA Address:</span>{" "}
                    <span className="font-semibold">{user.abhaAddress}</span>
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-bold mt-1">
                    ✓ ABDM Linked & Verified
                  </span>
                </div>
              ) : (
                <p className="text-sm text-zinc-500 mt-1">
                  ABHA account is not linked yet. You can link or create an ABHA card in the ABHA Verification tab.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
