import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/Login.tsx"),
  // you can use index or layout for nested routes
  layout("routes/protected/layout.tsx", [
    route("dashboard", "routes/protected/Dashboard.tsx"),
    route("admins", "routes/protected/Admins.tsx"),
    route("doctors", "routes/protected/Doctors.tsx"),
    route("nurses", "routes/protected/Nurses.tsx"),
    route("patients", "routes/protected/Patients.tsx"),
    route("activities-log", "routes/protected/ActivitiesLog.tsx"),
    route("profile/:id", "routes/protected/Profile.tsx"),
    route("financial-history", "routes/protected/FinancialHistory.tsx"),
    route("pharmacy/dispense", "routes/protected/PharmacyDispense.tsx"),
    route("pharmacy/inventory", "routes/protected/PharmacyInventory.tsx"),
    route("lab/requests", "routes/protected/LabRequests.tsx"),
    route("telemedicine", "routes/protected/Telemedicine.tsx"),
    route("settings/general", "routes/protected/SettingsGeneral.tsx"),
    route("settings/roles", "routes/protected/SettingsRoles.tsx"),
    route("settings/billing", "routes/protected/SettingsBilling.tsx"),
    route("appointments", "routes/protected/Appointments.tsx"),
    route("opd-consultation", "routes/protected/OpdConsultation.tsx"),
    route("ipd-management", "routes/protected/IpdManagement.tsx"),
    route("ot-management", "routes/protected/OtManagement.tsx"),
    route("nursing-station", "routes/protected/NursingStation.tsx"),
    route("hr-management", "routes/protected/HrManagement.tsx"),
    route("analytics-bi", "routes/protected/AnalyticsBi.tsx"),
    route("compliance", "routes/protected/ComplianceConsole.tsx"),
  ]),
] satisfies RouteConfig;
