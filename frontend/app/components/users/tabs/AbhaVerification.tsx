import { useState } from "react";
import type { User as UserType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser } from "@/lib/api";
import { toast } from "sonner";
import { 
  ShieldCheck, 
  Smartphone, 
  Key, 
  Loader2, 
  Download, 
  RefreshCw, 
  QrCode, 
  Fingerprint 
} from "lucide-react";

interface AbhaVerificationProps {
  user: UserType;
}

export default function AbhaVerification({ user }: AbhaVerificationProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"initial" | "otp" | "verifying">("initial");
  const [aadhaar, setAadhaar] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(60);

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      toast.success("ABHA details successfully updated!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setStep("initial");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save ABHA data");
      setStep("initial");
    }
  });

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (aadhaar.replace(/\s/g, "").length !== 12 && mobile.length !== 10) {
      toast.error("Please enter a valid 12-digit Aadhaar or 10-digit mobile number");
      return;
    }
    setStep("otp");
    toast.success("Verification OTP sent successfully!");
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP code");
      return;
    }

    setStep("verifying");
    
    // Simulate API delay
    setTimeout(() => {
      // Generate standard ABDM details
      const firstPart = Math.floor(10 + Math.random() * 90);
      const secondPart = Math.floor(1000 + Math.random() * 9000);
      const thirdPart = Math.floor(1000 + Math.random() * 9000);
      const fourthPart = Math.floor(1000 + Math.random() * 9000);
      const abhaNumber = `${firstPart}-${secondPart}-${thirdPart}-${fourthPart}`;
      
      const cleanName = user.name.toLowerCase().replace(/\s+/g, "");
      const abhaAddress = `${cleanName}${Math.floor(100 + Math.random() * 900)}@abdm`;

      updateMutation.mutate({
        userId: user._id,
        userData: {
          abhaNumber,
          abhaAddress
        }
      });
    }, 1500);
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to unlink this ABHA card?")) {
      updateMutation.mutate({
        userId: user._id,
        userData: {
          abhaNumber: "",
          abhaAddress: ""
        }
      });
    }
  };

  const handleDownload = () => {
    toast.success("Downloading Health ID Card PDF...");
    // Mock downloading flow
  };

  // Render Linked State (Health ID Card)
  if (user.abhaNumber) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <ShieldCheck className="text-emerald-600 h-5 w-5" /> ABHA Linked Profile
          </h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleDownload} className="gap-1 text-xs">
              <Download size={14} /> Download Card
            </Button>
            <Button size="sm" variant="ghost" onClick={handleReset} className="gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20">
              <RefreshCw size={14} /> Reset
            </Button>
          </div>
        </div>

        {/* India Digital Health ID Card Layout */}
        <div className="flex justify-center p-2">
          <div className="relative w-full max-w-md bg-linear-to-br from-teal-500 via-teal-600 to-teal-800 dark:from-teal-800 dark:to-zinc-950 text-white rounded-2xl shadow-xl overflow-hidden border border-teal-400/30">
            {/* Holographic lines/decoration */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-300 via-emerald-200 to-teal-900 pointer-events-none"></div>
            
            {/* Card Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/10 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-white rounded-md shrink-0">
                  <span className="text-[10px] font-bold text-teal-700 leading-none">ABDM</span>
                </div>
                <div className="leading-tight">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-teal-100 leading-none">National Health Authority</h4>
                  <span className="text-[9px] text-teal-200/80 font-medium">Govt. of India</span>
                </div>
              </div>
              <Badge className="bg-emerald-500/30 text-emerald-100 border border-emerald-400/40 text-[9px] px-1.5 py-0.5">
                VERIFIED
              </Badge>
            </div>

            {/* Card Body */}
            <div className="p-5 flex gap-4 items-start relative">
              {/* Photo */}
              <div className="relative shrink-0 w-24 h-24 bg-white/10 rounded-xl border border-white/20 overflow-hidden flex items-center justify-center">
                {user.image ? (
                  <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center font-bold text-2xl text-teal-100">
                    {user.name.split(" ").map(n => n[0]).join("")}
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-emerald-500 text-[8px] font-bold text-center py-0.5 tracking-wider uppercase">
                  ACTIVE
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 space-y-2">
                <div>
                  <h3 className="font-extrabold text-base tracking-wide truncate">{user.name}</h3>
                  <p className="text-[10px] text-teal-100/70 font-semibold uppercase tracking-wider mt-0.5">Health ID Card</p>
                </div>

                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-[9px] text-teal-200/70 uppercase font-medium">ABHA Number</span>
                    <p className="font-mono font-bold tracking-wider text-sm mt-0.5 bg-black/10 px-2 py-0.5 rounded-sm inline-block">
                      {user.abhaNumber}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <span className="text-[8px] text-teal-200/70 uppercase">Gender</span>
                      <p className="font-semibold text-xs">{user.gender || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[8px] text-teal-200/70 uppercase">Date of Birth</span>
                      <p className="font-semibold text-xs">
                        {user.dob ? new Date(user.dob).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="px-5 py-3.5 bg-zinc-950/20 border-t border-white/10 flex justify-between items-center text-[10px] text-teal-100/90 font-medium">
              <div>
                <span className="text-[8px] text-teal-200/50 block">ABHA Address</span>
                <span className="font-semibold font-mono">{user.abhaAddress}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[8px] text-teal-200/50 block">Hospital UHID</span>
                  <span className="font-semibold">{user.uhid || "N/A"}</span>
                </div>
                <div className="p-1 bg-white rounded-md text-zinc-900 shrink-0">
                  <QrCode size={20} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Verification Flow
  return (
    <div className="space-y-6">
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Fingerprint className="text-blue-600 h-5 w-5" /> India ABDM / ABHA Linking
          </CardTitle>
          <CardDescription>
            Verify patient identity with Aadhaar or Mobile OTP to link or generate a 14-digit Ayushman Bharat Health Account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "initial" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                  Verify using Aadhaar (Recommended)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      maxLength={14}
                      value={aadhaar}
                      onChange={(e) => {
                        // Format Aadhaar: XXXX XXXX XXXX
                        const v = e.target.value.replace(/\D/g, "").slice(0, 12);
                        const matches = v.match(/\d{1,4}/g);
                        setAadhaar(matches ? matches.join(" ") : v);
                      }}
                      placeholder="Enter 12-digit Aadhaar (e.g. 5624 8910 2345)"
                      className="pl-8"
                    />
                    <span className="absolute left-2.5 top-2.5 text-zinc-400">
                      <Fingerprint size={16} />
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative py-2 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
                </div>
                <span className="relative px-2 text-xs text-zinc-400 uppercase font-bold bg-white dark:bg-zinc-950">
                  Or
                </span>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                  Verify using Mobile Number
                </label>
                <div className="relative">
                  <Input
                    type="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 10-digit registered mobile number"
                    className="pl-8"
                  />
                  <span className="absolute left-2.5 top-2.5 text-zinc-400">
                    <Smartphone size={16} />
                  </span>
                </div>
              </div>

              <Button type="submit" className="w-full mt-2">
                Generate & Send OTP
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2 text-center p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg">
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center justify-center gap-1.5">
                  <Key size={16} className="animate-bounce" /> OTP Sent Successfully!
                </p>
                <p className="text-xs text-zinc-500">
                  Enter the 6-digit code sent to {aadhaar ? "Aadhaar linked mobile" : `+91 ${mobile}`}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block text-center">
                  Enter Verification Code
                </label>
                <Input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 123456"
                  className="text-center text-lg font-mono tracking-widest"
                />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("initial")}>
                  Back
                </Button>
                <Button type="submit" className="flex-1">
                  Verify & Create ABHA
                </Button>
              </div>
            </form>
          )}

          {step === "verifying" && (
            <div className="flex flex-col justify-center items-center py-8 space-y-3">
              <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Authenticating with ABDM Registry...
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Securing credentials and generating unique ABHA address.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
