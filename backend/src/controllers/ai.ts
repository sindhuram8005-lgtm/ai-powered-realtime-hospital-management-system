import type { Request, Response } from "express";
import { logActivity } from "../lib/activity.ts";

export const parseVoicePrescription = async (req: Request, res: Response) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ message: "Transcript text is required" });
    }

    const tLower = transcript.toLowerCase();
    
    // Heuristics-based clinical entity extraction
    let soapNotes = "Patient presented for clinical evaluation.";
    let icd10Code = "Z00.00";
    let icd10Description = "General medical examination";
    const medications: any[] = [];

    // Parse SOAP notes
    if (tLower.includes("fever") || tLower.includes("cough")) {
      soapNotes = "Patient presents with persistent fever and dry cough. Lungs clear to auscultation.";
      icd10Code = "J06.9";
      icd10Description = "Acute upper respiratory infection, unspecified";
    } else if (tLower.includes("chest pain") || tLower.includes("heart")) {
      soapNotes = "Patient reports mild retrosternal chest pain. Heart rate regular, normal ECG profile.";
      icd10Code = "I20.9";
      icd10Description = "Angina pectoris, unspecified";
    }

    // Parse Medications
    if (tLower.includes("amoxicillin") || tLower.includes("antibiotic")) {
      medications.push({
        name: "Amoxicillin 500mg",
        dosage: "1 capsule three times a day",
        duration: "7 days",
      });
    }
    if (tLower.includes("ibuprofen") || tLower.includes("pain killer")) {
      medications.push({
        name: "Ibuprofen 400mg",
        dosage: "1 tablet every 6 hours as needed",
        duration: "5 days",
      });
    }
    if (tLower.includes("metformin") || tLower.includes("sugar")) {
      medications.push({
        name: "Metformin 850mg",
        dosage: "1 tablet twice daily with meals",
        duration: "30 days",
      });
    }

    // Fallback if no medications matched
    if (medications.length === 0) {
      medications.push({
        name: "Paracetamol 650mg",
        dosage: "1 tablet thrice daily after food",
        duration: "3 days",
      });
    }

    res.status(200).json({
      soapNotes,
      icd10Code,
      icd10Description,
      medications,
    });
  } catch (error) {
    console.error("Error parsing voice prescription:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkDrugInteractions = async (req: Request, res: Response) => {
  try {
    const { medications } = req.body; // array of strings
    if (!medications || !Array.isArray(medications)) {
      return res.status(400).json({ message: "Medications array is required" });
    }

    const alerts: any[] = [];
    const medsLower = medications.map((m) => m.toLowerCase());

    // Check interaction rule: Amoxicillin + Methotrexate
    const hasAmox = medsLower.some((m) => m.includes("amoxicillin"));
    const hasMetho = medsLower.some((m) => m.includes("methotrexate"));
    if (hasAmox && hasMetho) {
      alerts.push({
        severity: "High",
        title: "Drug-Drug Interaction Detected",
        description: "Amoxicillin may decrease the renal clearance of Methotrexate, leading to increased risk of toxicity.",
      });
    }

    // Check interaction rule: Ibuprofen + Aspirin
    const hasIbu = medsLower.some((m) => m.includes("ibuprofen"));
    const hasAsp = medsLower.some((m) => m.includes("aspirin"));
    if (hasIbu && hasAsp) {
      alerts.push({
        severity: "Medium",
        title: "Increased Bleeding Risk",
        description: "Co-administration of Ibuprofen and Aspirin may increase the risk of gastrointestinal bleeding.",
      });
    }

    res.status(200).json({
      hasInteractions: alerts.length > 0,
      alerts,
    });
  } catch (error) {
    console.error("Error checking drug interactions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const performOcrScan = async (req: Request, res: Response) => {
  try {
    const { fileUrl } = req.body;
    if (!fileUrl) {
      return res.status(400).json({ message: "File URL is required" });
    }

    // Simulate OCR scanning process delay
    const parsedData = {
      patientName: "Jane Smith",
      uhid: "UHID-98725",
      documentType: "Lab Report Findings",
      extractedMetrics: [
        { name: "Hemoglobin", value: "11.2 g/dL", status: "Low (Normal: 12-16)" },
        { name: "White Blood Cells", value: "12.4 K/uL", status: "High (Normal: 4-11)" },
        { name: "Platelet Count", value: "245 K/uL", status: "Normal" },
      ],
      aiDiagnosticSummary: "Extracted blood counts indicate mild anemia and slight leukocytosis, commonly associated with a mild bacterial infection.",
    };

    res.status(200).json(parsedData);
  } catch (error) {
    console.error("Error executing OCR scan:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getChatbotResponse = async (req: Request, res: Response) => {
  try {
    const { message, context } = req.body;
    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const mLower = message.toLowerCase();
    let reply = "I am MedFlow's clinical AI assistant. How can I assist you with clinical checklists, ICD search, or drug profiles today?";

    if (mLower.includes("hi") || mLower.includes("hello")) {
      reply = "Hello! I am MedFlow AI, your clinical copilot. I can help search ICD-10 medical codes, check drug interactions, analyze lab reports, or review NABH compliance standards. What would you like to do?";
    } else if (mLower.includes("icd") || mLower.includes("code")) {
      reply = "For ICD-10 clinical coding: use 'I20.9' for Angina, 'J06.9' for Respiratory Infection, 'E11.9' for Type 2 Diabetes, and 'I10' for Essential Hypertension.";
    } else if (mLower.includes("interaction") || mLower.includes("amoxicillin")) {
      reply = "Safety notice: Amoxicillin interacts with Methotrexate (High severity). Ibuprofen interacts with Aspirin or Warfarin, increasing GI bleed risks. Always review the patient's active medication list.";
    } else if (mLower.includes("nabh") || mLower.includes("compliance")) {
      reply = "Our NABH quality rate is currently 92%. To maintain accreditation, ensure patient consent rates are above 90% and nurses maintain shift checks on time.";
    }

    res.status(200).json({ reply });
  } catch (error) {
    console.error("Error fetching chatbot response:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
