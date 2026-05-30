import mongoose from "mongoose";
import type { Request, Response } from "express";
import { logActivity } from "../lib/activity.ts";
import { inngest } from "../inngest/client.ts";
import { auth, polarClient } from "../lib/auth.ts";
import { fromNodeHeaders } from "better-auth/node";
import Prescription from "../models/prescription.ts";
import NursingRecord from "../models/nursingRecord.ts";
import Appointment from "../models/appointment.ts";

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // to use current user, we need a middleware
    const currentUser = (req as any).user; // Assuming you have a middleware that attaches the user to the request object

    // Check permissions: A user can view their own profile,
    // or Admins/Medical staff can view patient profiles.
    if (currentUser.id !== id && currentUser.role === "patient") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const queryId =
      id?.length === 24 ? new mongoose.Types.ObjectId(id as string) : id;
    const collection = mongoose.connection.collection("user");
    const user = await collection.findOne(
      { _id: queryId as mongoose.Types.ObjectId },
      { projection: { password: 0 } },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, password, ...customFields } = req.body; // Add fields you want to update

    const queryId =
      id?.length === 24 ? new mongoose.Types.ObjectId(id as string) : id;
    const collection = mongoose.connection.collection("user");

    const existingUser = await collection.findOne({
      _id: queryId as mongoose.Types.ObjectId,
    });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatePayload = {
      name,
      email,
      role,
      ...customFields,
    };

    // Remove undefined/null keys
    Object.keys(updatePayload).forEach(
      (key) =>
        (updatePayload[key] === undefined || updatePayload[key] === null) &&
        delete updatePayload[key],
    );

    // Update user
    const result = await collection.updateOne(
      { _id: new mongoose.Types.ObjectId(id as string) }, // Convert string ID to ObjectId
      { $set: updatePayload },
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    // socket notification
    const io = req.app.get("io");
    if (io && result.modifiedCount > 0) {
      io.emit("notify_user_updated");
    }

    // activity log
    await logActivity(
      (req as any).user.id, // you can also use name but id is more reliable
      "Updated User",
      `User updated: ${id}`,
    );
    res.json({
      message: "User updated successfully",
      updatedUser: result,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const fetchAllUsers = async (req: Request, res: Response) => {
  try {
    //  Pagination Params (Default: Page 1, Limit 10)
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const skip = (page - 1) * limit;
    const filter: any = {};
    const role = req.query.role as string;

    // Only add role to filter if it exists and isn't empty/all
    if (role && role !== "all" && role !== "") {
      filter.role = role;
    }

    // collection instance
    const collection = mongoose.connection.collection("user");
    // total count for pagination
    const totalUsers = await collection.countDocuments(filter);
    const users = await collection
      .find(
        filter, // 👈 Just pass the filter directly now
        {
          projection: {
            password: 0,
            headers: 0,
            emailVerified: 0,
          },
        },
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    res.json({
      res: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalData: totalUsers,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//admit
export const admitPatient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { admissionReason } = req.body;

    // trigger inngest
    await inngest.send({
      name: "patient/admitted",
      data: { patientId: id, admissionReason },
    });
    // log who did these
    await logActivity(
      (req as any).user.id,
      "Admitted Patient",
      `Admitted patient ${id}`,
    );
    // when you don't want your api routes or functions to load forever make sure to finish with a response, otherwise the client will keep waiting for a response until it times out
    res.json({ message: "Patient admission requested successfully" });
  } catch (error) {
    console.error("Error admitting patient:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// polar portal
export const getPolarPortalLink = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const result = await polarClient.customerSessions.create({
      externalCustomerId: userId as string, // The internal Polar Customer ID
    });
    res.json({ polarPortalUrl: result.customerPortalUrl });
  } catch (error) {
    console.error("Error fetching Polar portal link:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// FHIR JSON Bundle Exporter
export const getPatientFHIR = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const queryId = id?.length === 24 ? new mongoose.Types.ObjectId(id as string) : id;
    const userCollection = mongoose.connection.collection("user");
    const user = await userCollection.findOne({ _id: queryId as mongoose.Types.ObjectId });

    if (!user) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Retrieve clinical records for compilation
    const prescriptions = await Prescription.find({ patient: user._id }).populate("doctor", "name specialization");
    const nursingRecords = await NursingRecord.find({ patient: user._id });
    const appointments = await Appointment.find({ patient: user._id }).populate("doctor", "name");

    // Construct FHIR Resources
    const fhirEntries: any[] = [];

    // 1. Patient Resource
    const patientResource = {
      resource: {
        resourceType: "Patient",
        id: user._id.toString(),
        active: true,
        name: [{ use: "official", text: user.name }],
        gender: user.gender ? user.gender.toLowerCase() : "unknown",
        birthDate: user.age ? new Date(Date.now() - parseInt(user.age) * 365 * 24 * 3600000).toISOString().split("T")[0] : undefined,
        identifier: [
          { system: "https://ndhm.gov.in/abha", value: user.abhaNumber || "N/A" },
          { system: "http://hospital.com/uhid", value: user.uhid || `UHID-${user._id.toString().slice(-6).toUpperCase()}` }
        ]
      }
    };
    fhirEntries.push(patientResource);

    // 2. Condition Resources (from prescription clinical codes)
    prescriptions.forEach((p) => {
      fhirEntries.push({
        resource: {
          resourceType: "Condition",
          id: p._id.toString(),
          subject: { reference: `Patient/${user._id.toString()}` },
          code: {
            coding: [
              {
                system: "http://hl7.org/fhir/sid/icd-10",
                code: p.icd10Code || "Z00.00",
                display: p.icd10Description || "General Consultation"
              }
            ]
          },
          clinicalStatus: {
            coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }]
          },
          note: [{ text: p.soapNotes }]
        }
      });

      // 3. MedicationRequest Resources (from medications prescribed)
      p.medications.forEach((m: any, idx: number) => {
        fhirEntries.push({
          resource: {
            resourceType: "MedicationRequest",
            id: `${p._id.toString()}-med-${idx}`,
            status: p.status === "dispensed" ? "completed" : "active",
            intent: "order",
            subject: { reference: `Patient/${user._id.toString()}` },
            medicationCodeableConcept: {
              coding: [{ display: m.name }]
            },
            dosageInstruction: [{ text: `${m.dosage} for ${m.duration}` }]
          }
        });
      });
    });

    // 4. Observation Resources (from Bedside Vitals logs)
    nursingRecords.forEach((nr) => {
      nr.vitalsLog.forEach((v: any, idx: number) => {
        if (v.pulse) {
          fhirEntries.push({
            resource: {
              resourceType: "Observation",
              id: `${nr._id.toString()}-pulse-${idx}`,
              status: "final",
              code: {
                coding: [{ system: "http://loinc.org", code: "8867-4", display: "Heart rate" }]
              },
              subject: { reference: `Patient/${user._id.toString()}` },
              valueQuantity: { value: v.pulse, unit: "beats/min" }
            }
          });
        }
        if (v.spo2) {
          fhirEntries.push({
            resource: {
              resourceType: "Observation",
              id: `${nr._id.toString()}-spo2-${idx}`,
              status: "final",
              code: {
                coding: [{ system: "http://loinc.org", code: "2708-6", display: "Oxygen saturation" }]
              },
              subject: { reference: `Patient/${user._id.toString()}` },
              valueQuantity: { value: v.spo2, unit: "%" }
            }
          });
        }
      });
    });

    // FHIR Bundle Envelope
    const fhirBundle = {
      resourceType: "Bundle",
      id: `bundle-${user._id.toString()}`,
      type: "collection",
      timestamp: new Date().toISOString(),
      entry: fhirEntries,
    };

    res.status(200).json(fhirBundle);
  } catch (error) {
    console.error("Error creating HL7/FHIR bundle:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
