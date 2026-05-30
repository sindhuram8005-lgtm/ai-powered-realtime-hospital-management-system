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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, Save, DollarSign, Activity, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function meta() {
  return [{ title: "Billing Settings | MedFlow AI" }];
}

interface FeeItem {
  id: string;
  name: string;
  price: number;
}

const INITIAL_FEES: FeeItem[] = [
  { id: "F-01", name: "General Consultation", price: 50.00 },
  { id: "F-02", name: "Specialist Consultation", price: 120.00 },
  { id: "F-03", name: "In-patient Admission Daily Fee", price: 300.00 },
  { id: "F-04", name: "Complete Blood Count (CBC) Lab", price: 25.00 },
  { id: "F-05", name: "Chest X-Ray Diagnostics", price: 150.00 },
];

export default function SettingsBilling() {
  const [fees, setFees] = useState<FeeItem[]>(INITIAL_FEES);
  const [tax, setTax] = useState("8.5");
  const [currency, setCurrency] = useState("USD");

  const handlePriceChange = (id: string, priceStr: string) => {
    const val = parseFloat(priceStr) || 0;
    setFees((prev) =>
      prev.map((fee) => (fee.id === id ? { ...fee, price: val } : fee))
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Billing and standard fee schedules saved successfully!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 pb-20">
      {/* LEFT COLUMN: Pricing Matrix */}
      <Card className="col-span-1 lg:col-span-2 card shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <DollarSign className="text-blue-500" /> Standard Service Fees
          </CardTitle>
          <CardDescription>
            Configure default unit prices charged to patient invoices during hospital events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="divide-y space-y-4">
              {fees.map((fee, idx) => (
                <div key={fee.id} className="flex items-center justify-between pt-4 first:pt-0">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {fee.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Code: {fee.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 w-32">
                    <span className="text-sm font-medium text-slate-400">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={fee.price}
                      onChange={(e) => handlePriceChange(fee.id, e.target.value)}
                      className="text-right text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-6 flex justify-end">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Save size={16} /> Save Fee Matrix
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* RIGHT COLUMN: Polar Integration */}
      <div className="col-span-1 space-y-6">
        <Card className="card shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CreditCard className="text-blue-500" size={16} /> Polar Integration
            </CardTitle>
            <CardDescription className="text-xs">
              Checkout & Subscription infrastructure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-350">Integration Link</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 uppercase text-[9px]">
                  Connected
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Active patient checkouts are routed through Polar checkout overlays in sandbox mode.
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Webhook Status
              </Label>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-ping" />
                <span className="font-semibold text-[11px]">Listening on: `/api/auth/polar/webhook`</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="tax" className="text-[10px] uppercase font-bold text-slate-400">
                    Tax Rate (%)
                  </Label>
                  <Input
                    id="tax"
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="currency" className="text-[10px] uppercase font-bold text-slate-400">
                    Currency
                  </Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency" className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
