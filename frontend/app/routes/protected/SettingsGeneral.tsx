import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Save, ShieldAlert, Globe } from "lucide-react";
import { toast } from "sonner";

export function meta() {
  return [{ title: "General Settings | MedFlow AI" }];
}

export default function SettingsGeneral() {
  const [hospName, setHospName] = useState("MedFlow AI Memorial Hospital");
  const [hospEmail, setHospEmail] = useState("contact@medflow.org");
  const [timezone, setTimezone] = useState("EST");
  const [enableAI, setEnableAI] = useState(true);
  const [enablePush, setEnablePush] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("General settings successfully saved!");
  };

  return (
    <div className="max-w-3xl space-y-6 mt-6 pb-20">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          System Configuration
        </h1>
        <p className="text-slate-500 font-medium">
          Modify global parameters, regional settings, and backend operational thresholds.
        </p>
      </div>

      <Card className="card shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Settings className="text-blue-500" /> Hospital Identity Settings
          </CardTitle>
          <CardDescription>
            Specify the metadata related to this clinic entity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hospName">Hospital / Clinic Name</Label>
                <Input
                  id="hospName"
                  value={hospName}
                  onChange={(e) => setHospName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospEmail">Contact Support Email</Label>
                <Input
                  id="hospEmail"
                  type="email"
                  value={hospEmail}
                  onChange={(e) => setHospEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Operational Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Choose timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EST">Eastern Standard Time (EST)</SelectItem>
                    <SelectItem value="GMT">Greenwich Mean Time (GMT)</SelectItem>
                    <SelectItem value="IST">Indian Standard Time (IST)</SelectItem>
                    <SelectItem value="PST">Pacific Standard Time (PST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lang">Primary Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger id="lang">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English (US)</SelectItem>
                    <SelectItem value="es">Spanish (Español)</SelectItem>
                    <SelectItem value="fr">French (Français)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* --- TOGGLES SECTION --- */}
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <ShieldAlert size={16} className="text-amber-500" /> Operational Features & Flags
              </h3>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="aiCheck"
                  checked={enableAI}
                  onCheckedChange={(checked) => setEnableAI(checked === true)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="aiCheck" className="font-bold">
                    Enable AI Auto-Analysis for Radiology
                  </Label>
                  <p className="text-xs text-slate-500">
                    Automatically trigger diagnostic analysis using the Gemini API upon uploading X-rays.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="pushCheck"
                  checked={enablePush}
                  onCheckedChange={(checked) => setEnablePush(checked === true)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="pushCheck" className="font-bold">
                    Enable Web Push Notification Broadcasts
                  </Label>
                  <p className="text-xs text-slate-500">
                    Send realtime notifications to doctors and nurses on patient status transitions.
                  </p>
                </div>
              </div>
            </div>

            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Save size={16} /> Save Configurations
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
