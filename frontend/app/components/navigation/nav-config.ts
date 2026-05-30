import type { Role } from "@/types";
import {
  LayoutDashboard,
  Users,
  ClipboardPlus,
  Stethoscope,
  Pill,
  FlaskConical,
  FileText,
  Settings2,
  LifeBuoy,
  Send,
  ReceiptCent,
  ShieldCheck,
  CalendarDays,
  Activity,
  HeartPulse,
  Syringe,
  BarChart3,
} from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon?: any;
  allowedRoles: Role[];
  items?: {
    title: string;
    url: string;
    allowedRoles?: Role[];
  }[];
}

export const navConfig: {
  navMain: NavItem[];
  navAdmin: NavItem[];
  navSecondary: NavItem[];
} = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      allowedRoles: ["admin", "doctor", "nurse", "pharmacist", "lab_tech"],
      items: [
        { title: "Overview", url: "/dashboard" },
        { title: "Activities Log", url: "/activities-log" },
      ],
    },
    {
      title: "Administrators",
      url: "/admins",
      icon: Users,
      allowedRoles: ["admin"],
      items: [
        { title: "All Administrators", url: "/admins" },
      ],
    },
    {
      title: "Staff Members",
      url: "/hr-management",
      icon: Users,
      allowedRoles: ["admin", "doctor", "nurse"],
      items: [
        { title: "HR & Roster Console", url: "/hr-management" },
        { title: "Doctors Registry", url: "/doctors" },
        { title: "Nurses Registry", url: "/nurses" },
      ],
    },
    {
      title: "Patients Hub",
      url: "/patients",
      icon: Users,
      allowedRoles: ["admin", "doctor", "nurse"],
      items: [
        { title: "All Patients", url: "/patients" },
      ],
    },
    {
      title: "Scheduling",
      url: "/appointments",
      icon: CalendarDays,
      allowedRoles: ["admin", "doctor", "nurse", "patient"],
      items: [
        { title: "OPD Appointments", url: "/appointments" },
        { title: "Telemedicine Workspace", url: "/telemedicine" },
      ],
    },
    {
      title: "Clinical Station",
      url: "/opd-consultation",
      icon: Stethoscope,
      allowedRoles: ["admin", "doctor", "nurse"],
      items: [
        { title: "OPD Soap Room", url: "/opd-consultation" },
        { title: "Inpatient Wards (IPD)", url: "/ipd-management" },
        { title: "Operating Theatre (OT)", url: "/ot-management" },
        { title: "Nursing station", url: "/nursing-station" },
      ],
    },
    {
      title: "Pharmacy ERP",
      url: "/pharmacy/dispense",
      icon: Pill,
      allowedRoles: ["admin", "pharmacist", "doctor"],
      items: [
        { title: "Medication Dispense", url: "/pharmacy/dispense" },
        { title: "Inventory Ledger", url: "/pharmacy/inventory" },
      ],
    },
    {
      title: "Laboratory LIS",
      url: "/lab/requests",
      icon: FlaskConical,
      allowedRoles: ["admin", "lab_tech", "doctor"],
      items: [
        { title: "Diagnostic Worklist", url: "/lab/requests" },
      ],
    },
    {
      title: "Financials & Billing",
      url: "/financial-history",
      icon: ReceiptCent,
      allowedRoles: ["admin", "doctor"],
      items: [
        { title: "Billing Console", url: "/financial-history" },
      ],
    },
    {
      title: "Intelligence & BI",
      url: "/analytics-bi",
      icon: BarChart3,
      allowedRoles: ["admin", "doctor"],
      items: [
        { title: "Operational BI", url: "/analytics-bi" },
      ],
    },
    {
      title: "Governance & NABH",
      url: "/compliance",
      icon: ShieldCheck,
      allowedRoles: ["admin", "doctor"],
      items: [
        { title: "Accreditation Hub", url: "/compliance" },
      ],
    },
  ],
  navAdmin: [
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      allowedRoles: ["admin"],
      items: [
        { title: "General", url: "/settings/general" },
        { title: "Roles & Permissions", url: "/settings/roles" },
        { title: "Billing", url: "/settings/billing" },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support Helpdesk",
      url: "/support",
      icon: LifeBuoy,
      allowedRoles: ["admin", "doctor", "nurse", "pharmacist", "lab_tech"],
    },
    {
      title: "Submit Feedback",
      url: "/feedback",
      icon: Send,
      allowedRoles: ["admin", "doctor", "nurse", "pharmacist", "lab_tech"],
    },
  ],
};

export function getRouteConfig(path: string, items: NavItem[]): NavItem | null {
  for (const item of items) {
    if (item.url === path) return item;
    if (item.items) {
      const found = item.items.find((sub) => sub.url === path);
      if (found)
        return {
          ...found,
          allowedRoles: found.allowedRoles || item.allowedRoles,
        } as NavItem;
    }
  }
  return null;
}
