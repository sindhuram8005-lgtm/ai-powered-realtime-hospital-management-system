import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, Save, KeyRound, UserCheck } from "lucide-react";
import { toast } from "sonner";

export function meta() {
  return [{ title: "Roles & Permissions | MedFlow AI" }];
}

interface PermissionRow {
  resource: string;
  admin: boolean;
  doctor: boolean;
  nurse: boolean;
  pharmacist: boolean;
  labTech: boolean;
  patient: boolean;
}

const INITIAL_PERMISSIONS: PermissionRow[] = [
  { resource: "Patient Identity Records", admin: true, doctor: true, nurse: true, pharmacist: false, labTech: false, patient: true },
  { resource: "Clinical Diagnostics / X-Rays", admin: true, doctor: true, nurse: true, pharmacist: false, labTech: true, patient: true },
  { resource: "Prescription Formulation", admin: true, doctor: true, nurse: false, pharmacist: true, labTech: false, patient: false },
  { resource: "Pharmacy Stock Ledger", admin: true, doctor: true, nurse: false, pharmacist: true, labTech: false, patient: false },
  { resource: "Financial Ledger / Invoices", admin: true, doctor: false, nurse: false, pharmacist: false, labTech: false, patient: true },
  { resource: "Global System Settings", admin: true, doctor: false, nurse: false, pharmacist: false, labTech: false, patient: false },
];

export default function SettingsRoles() {
  const [permissions, setPermissions] = useState<PermissionRow[]>(INITIAL_PERMISSIONS);

  const handleToggle = (index: number, role: keyof Omit<PermissionRow, "resource">) => {
    setPermissions((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, [role]: !row[role] } : row
      )
    );
  };

  const handleSave = () => {
    toast.success("RBAC Permissions matrix saved successfully!");
  };

  return (
    <div className="max-w-4xl space-y-6 mt-6 pb-20">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Access Control
        </h1>
        <p className="text-slate-500 font-medium">
          Define Role-Based Access Control (RBAC) levels and configure operational boundaries.
        </p>
      </div>

      <Card className="card shadow-sm rounded-xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <KeyRound className="text-blue-500" /> Permissions Matrix
          </CardTitle>
          <CardDescription>
            Grant or restrict resource visibility for each system role.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 border-t">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6 font-bold w-1/3">Resource Name</TableHead>
                <TableHead className="font-bold text-center">Admin</TableHead>
                <TableHead className="font-bold text-center">Doctor</TableHead>
                <TableHead className="font-bold text-center">Nurse</TableHead>
                <TableHead className="font-bold text-center">Pharmacist</TableHead>
                <TableHead className="font-bold text-center">Lab Tech</TableHead>
                <TableHead className="font-bold text-center">Patient</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((row, i) => (
                <TableRow key={row.resource} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <TableCell className="pl-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                    {row.resource}
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={row.admin}
                      onCheckedChange={() => handleToggle(i, "admin")}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={row.doctor}
                      onCheckedChange={() => handleToggle(i, "doctor")}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={row.nurse}
                      onCheckedChange={() => handleToggle(i, "nurse")}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={row.pharmacist}
                      onCheckedChange={() => handleToggle(i, "pharmacist")}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={row.labTech}
                      onCheckedChange={() => handleToggle(i, "labTech")}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={row.patient}
                      onCheckedChange={() => handleToggle(i, "patient")}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Save size={16} /> Save Permissions Matrix
        </Button>
      </div>
    </div>
  );
}
