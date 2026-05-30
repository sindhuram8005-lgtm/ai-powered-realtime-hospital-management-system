import type {
  PaginatedResponse,
  Role,
  User,
  LabResult,
  WebPushSubscription,
  ActivityLog,
  invoice,
  appointment,
} from "@/types";

export const API_URL = "http://localhost:5000/api";

export const getUsers = async (params: {
  role: Role;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<User>> => {
  const query = new URLSearchParams({
    role: params.role,
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
  }).toString();

  const res = await fetch(`${API_URL}/users?${query}`, {
    credentials: "include", // Important for Better Auth cookies
  });

  if (!res.ok) throw new Error("Failed");

  return res.json();
};

export const triggerAdmission = async ({
  patientId,
  admissionReason,
}: {
  patientId: string;
  admissionReason: string;
}) => {
  // /:id/admit
  const res = await fetch(`${API_URL}/users/${patientId}/admit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ admissionReason }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to start admission process");
  return res.json();
};

interface UpdateUserParams {
  userId: string;
  userData: Partial<User> & Record<string, any>; // Allow custom fields
}

// /update/:id
export const updateUser = async ({ userId, userData }: UpdateUserParams) => {
  const res = await fetch(`${API_URL}/users/update/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
    credentials: "include", // Important for Better Auth cookies
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to update user");
  }

  return res.json();
};

export const createActityLog = async (data: {
  userId: string;
  action: string;
  details?: string;
}) => {
  const res = await fetch(`${API_URL}/activity-logs/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include", // Important for Better Auth cookies
  });
  if (!res.ok) throw new Error("Failed to create activity log");
  return res.json();
};

export const getPatientLabResults = async (
  patientId: string,
): Promise<LabResult[]> => {
  const res = await fetch(`${API_URL}/lab-results/patient/${patientId}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch lab results");
  return res.json();
};

export const updateLabResult = async ({
  id,
  data,
}: {
  id: string;
  data: { doctorNotes?: string; status?: string };
}) => {
  const res = await fetch(`${API_URL}/lab-results/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to update lab result");
  return res.json();
};

export const createLabResult = async (data: {
  patientId: string;
  testType: string;
  bodyPart: string;
  imageUrl: string;
  aiAnalysis?: string;
}) => {
  const res = await fetch(`${API_URL}/lab-results`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    credentials: "include", // Important for Better Auth cookies
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to create lab result");
  }

  return res.json();
};

export const deleteFile = async ({ file }: { file: string }) => {
  const res = await fetch(`${API_URL}/uploadthing/delete`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileUrl: file }),
    credentials: "include", // Important for Better Auth cookies
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to delete file");
  }

  return res.json();
};

export const getActivityLogs = async (params: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<ActivityLog>> => {
  const query = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
  }).toString();

  const res = await fetch(`${API_URL}/activity-logs?${query}`, {
    credentials: "include", // Important for Better Auth cookies
  });

  if (!res.ok) throw new Error("Failed to fetch activity logs");

  return res.json();
};

export const getUserById = async (userId: string) => {
  const res = await fetch(`${API_URL}/users/profile/${userId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
};

export const getMyActiveInvoice = async () => {
  const res = await fetch(`${API_URL}/invoices/my-active-invoice`, {
    credentials: "include",
  });
  if (!res.ok) {
    if (res.status === 404) return null; // No active invoice
    throw new Error("Failed to fetch invoice");
  }
  return res.json();
};

export const createCheckoutSession = async (invoiceId: string) => {
  const res = await fetch(`${API_URL}/invoices/${invoiceId}/checkout`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to initiate checkout");
  return res.json();
};

export const getBillingHistory = async (userId: string) => {
  const res = await fetch(`${API_URL}/invoices/history/${userId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch billing history");
  return res.json();
};

export const getAllInvoices = async (data?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<invoice>> => {
  const query = data
    ? `?${new URLSearchParams({
        page: (data.page || 1).toString(),
        limit: (data.limit || 10).toString(),
      }).toString()}`
    : "";
  const res = await fetch(`${API_URL}/invoices${query}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch invoices");
  return res.json();
};

export const polarPortalLink = async (userId: string) => {
  const res = await fetch(`${API_URL}/users/polar-portal/${userId}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch polar portal link");
  return res.json();
};

export const fetchNotifications = async () => {
  const res = await fetch(`${API_URL}/notifications`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json(); // Expected response: { notifications:[], unreadCount: 0 }
};

export const markAsRead = async (id: string) => {
  const res = await fetch(`${API_URL}/notifications/${id}/read`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to mark as read");
  return res.json();
};

// --- APPOINTMENTS & QUEUE ---
export const getAppointments = async (): Promise<any[]> => {
  const res = await fetch(`${API_URL}/appointments`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to get appointments");
  return res.json();
};

export const bookAppointment = async (data: any) => {
  const res = await fetch(`${API_URL}/appointments/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to book appointment");
  return res.json();
};

export const bookWalkIn = async (data: any) => {
  const res = await fetch(`${API_URL}/appointments/walk-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to book walk-in");
  return res.json();
};

export const updateAppointmentStatus = async (id: string, status: string) => {
  const res = await fetch(`${API_URL}/appointments/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
};

export const logVitals = async (id: string, vitals: any) => {
  const res = await fetch(`${API_URL}/appointments/${id}/vitals`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vitals }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to log vitals");
  return res.json();
};

// --- OPD CONSULTATION & SOAP NOTES ---
export const getPrescriptions = async (params?: { patientId?: string; doctorId?: string; status?: string }): Promise<any[]> => {
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  const res = await fetch(`${API_URL}/prescriptions${query}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to get prescriptions");
  return res.json();
};

export const createPrescription = async (data: any) => {
  const res = await fetch(`${API_URL}/prescriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to create prescription");
  return res.json();
};

export const dispensePrescription = async (id: string) => {
  const res = await fetch(`${API_URL}/prescriptions/${id}/dispense`, {
    method: "PUT",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to dispense prescription");
  return res.json();
};

// --- IPD INPATIENTS & WARDS ---
export const getWards = async (): Promise<any[]> => {
  const res = await fetch(`${API_URL}/ipd/wards`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to get wards");
  return res.json();
};

export const allocateBed = async (data: { patientId: string; wardId: string; bedNumber: string }) => {
  const res = await fetch(`${API_URL}/ipd/allocate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to allocate bed");
  return res.json();
};

export const transferBed = async (data: { patientId: string; fromWardId: string; fromBedNumber: string; toWardId: string; toBedNumber: string }) => {
  const res = await fetch(`${API_URL}/ipd/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to transfer bed");
  return res.json();
};

export const dischargePatient = async (data: { patientId: string; dischargeSummary: string }) => {
  const res = await fetch(`${API_URL}/ipd/discharge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to discharge patient");
  return res.json();
};

// --- GOVERNMENT & ACCREDITATION COMPLIANCE ---
export const getComplianceStats = async (): Promise<any> => {
  const res = await fetch(`${API_URL}/compliance/stats`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to get compliance stats");
  return res.json();
};

export const logIncident = async (data: { title: string; severity: string; description: string }) => {
  const res = await fetch(`${API_URL}/compliance/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to log incident");
  return res.json();
};

export const archiveRecords = async (recordType: string) => {
  const res = await fetch(`${API_URL}/compliance/archive`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recordType }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to archive records");
  return res.json();
};

// --- PHARMACY & INVENTORY ERP ---
export const getMedicines = async (): Promise<any[]> => {
  const res = await fetch(`${API_URL}/pharmacy/medicines`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to get medicines");
  return res.json();
};

export const createMedicine = async (data: any) => {
  const res = await fetch(`${API_URL}/pharmacy/medicines`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to create medicine");
  return res.json();
};

export const updateMedicineStock = async (id: string, data: any) => {
  const res = await fetch(`${API_URL}/pharmacy/medicines/${id}/stock`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to update stock");
  return res.json();
};

export const dispenseMedicine = async (data: { patientId: string; medicineId: string; quantity: number; prescriptionId?: string }) => {
  const res = await fetch(`${API_URL}/pharmacy/dispense`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to dispense medicine");
  }
  return res.json();
};

export const getVendors = async (): Promise<any[]> => {
  const res = await fetch(`${API_URL}/pharmacy/vendors`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to get vendors");
  return res.json();
};

// --- PROCUREMENT & NURSING INDENTS ---
export const getIndents = async (): Promise<any[]> => {
  const res = await fetch(`${API_URL}/procurement/indents`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to get indents");
  return res.json();
};

export const createIndent = async (data: { fromLocation: string; itemName: string; quantity: number }) => {
  const res = await fetch(`${API_URL}/procurement/indents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to create indent");
  return res.json();
};

export const updateIndentStatus = async (id: string, status: string) => {
  const res = await fetch(`${API_URL}/procurement/indents/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to update indent status");
  return res.json();
};

export const getPurchaseOrders = async (): Promise<any[]> => {
  const res = await fetch(`${API_URL}/procurement/purchase-orders`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to get purchase orders");
  return res.json();
};

export const createPurchaseOrder = async (data: { vendorId: string; items: any[] }) => {
  const res = await fetch(`${API_URL}/procurement/purchase-orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to create PO");
  return res.json();
};

export const updatePurchaseOrderStatus = async (id: string, status: string) => {
  const res = await fetch(`${API_URL}/procurement/purchase-orders/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to update PO status");
  return res.json();
};

// --- SURGERY & OT SCHEDULER ---
export const getSurgeries = async (): Promise<any[]> => {
  const res = await fetch(`${API_URL}/surgeries`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to get surgeries");
  return res.json();
};

export const createSurgery = async (data: any) => {
  const res = await fetch(`${API_URL}/surgeries/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to schedule surgery");
  return res.json();
};

export const updateSurgeryStatus = async (id: string, status: string) => {
  const res = await fetch(`${API_URL}/surgeries/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to update surgery status");
  return res.json();
};

export const updateSurgeryDetails = async (id: string, data: any) => {
  const res = await fetch(`${API_URL}/surgeries/${id}/details`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to update surgery details");
  return res.json();
};

// --- NURSING BEDSIDE CARE ---
export const getNursingRecord = async (patientId: string): Promise<any> => {
  const res = await fetch(`${API_URL}/nursing/record?patientId=${patientId}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to get nursing record");
  return res.json();
};

export const logBedsideVitals = async (id: string, data: { bp?: string; pulse?: number; temp?: number; spo2?: number; respRate?: number; painScore?: number }) => {
  const res = await fetch(`${API_URL}/nursing/${id}/vitals`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to log vitals");
  return res.json();
};

export const logMedicationAdmin = async (id: string, data: { medicineName: string; dosage: string; status: string }) => {
  const res = await fetch(`${API_URL}/nursing/${id}/meds`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to log medication admin");
  return res.json();
};

export const logFluidBalance = async (id: string, data: { type: string; source: string; volumeMl: number }) => {
  const res = await fetch(`${API_URL}/nursing/${id}/fluids`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to log fluid balance");
  return res.json();
};

export const updateCarePlan = async (id: string, data: { nursingAssessment?: any; carePlan?: any }) => {
  const res = await fetch(`${API_URL}/nursing/${id}/careplan`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to update care plan");
  return res.json();
};

// --- HR & STAFF ROSTER ---
export const getHrRecords = async (): Promise<any[]> => {
  const res = await fetch(`${API_URL}/hr/records`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to get HR records");
  return res.json();
};

export const getHrRecordByEmployee = async (employeeId: string): Promise<any> => {
  const res = await fetch(`${API_URL}/hr/employee/${employeeId}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to get employee HR details");
  return res.json();
};

export const updateShifts = async (id: string, shifts: any[]) => {
  const res = await fetch(`${API_URL}/hr/${id}/shifts`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shifts }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to update shifts");
  return res.json();
};

export const logAttendance = async (id: string, data: { checkIn?: string; checkOut?: string; status?: string }) => {
  const res = await fetch(`${API_URL}/hr/${id}/attendance`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to log attendance");
  return res.json();
};

export const calculatePayrollIncentives = async (id: string): Promise<any> => {
  const res = await fetch(`${API_URL}/hr/${id}/incentives`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to calculate incentives");
  return res.json();
};

export const processPayroll = async (id: string, data: { month: string; deductions: number }) => {
  const res = await fetch(`${API_URL}/hr/${id}/payroll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to process payroll");
  return res.json();
};

// --- ANALYTICS & BI DASHBOARD ---
export const getBIMetrics = async (): Promise<any> => {
  const res = await fetch(`${API_URL}/analytics/bi-metrics`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to get BI metrics");
  return res.json();
};

// --- CLINICAL AI SERVICES ---
export const parseVoicePrescription = async (transcript: string): Promise<any> => {
  const res = await fetch(`${API_URL}/ai/voice-prescription`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to parse voice prescription");
  return res.json();
};

export const checkDrugInteractions = async (medications: string[]): Promise<any> => {
  const res = await fetch(`${API_URL}/ai/drug-interactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ medications }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to check drug interactions");
  return res.json();
};

export const performOcrScan = async (fileUrl: string): Promise<any> => {
  const res = await fetch(`${API_URL}/ai/ocr-scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileUrl }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to execute OCR scan");
  return res.json();
};

export const getChatbotResponse = async (message: string, context?: any): Promise<any> => {
  const res = await fetch(`${API_URL}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, context }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to get chatbot response");
  return res.json();
};

export const getPatientFHIR = async (patientId: string): Promise<any> => {
  const res = await fetch(`${API_URL}/users/${patientId}/fhir`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch FHIR bundle");
  return res.json();
};
