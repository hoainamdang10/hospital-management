# FHIR Integration Architecture - Supabase + Medplum

**Dự án:** Luận văn tốt nghiệp - Hospital Management System  
**Integration:** Supabase (Operational) + Medplum (Clinical FHIR)  
**Timeline:** Week 5-6 (FHIR Integration Implementation)  
**Ngày tạo:** 2024-12-19

---

## 🎯 **INTEGRATION OVERVIEW**

Dual platform architecture với Supabase cho operational data và Medplum cho FHIR-compliant clinical data. Bidirectional synchronization với conflict resolution và free tier optimization.

---

## 🏗️ **ARCHITECTURE DESIGN**

### **Data Classification Strategy**

#### **Supabase (Operational Data)**

```typescript
// Fast, frequent access data for application operations
const supabaseData = {
  userManagement: {
    tables: ["auth_schema.profiles", "auth_schema.user_sessions"],
    purpose: "Authentication, authorization, user management",
    accessPattern: "High frequency, low latency",
  },

  patientOperational: {
    tables: [
      "patient_schema.patient_profiles",
      "patient_schema.patient_addresses",
    ],
    purpose: "Patient registration, contact info, demographics",
    accessPattern: "Medium frequency, real-time updates",
  },

  doctorOperational: {
    tables: ["doctor_schema.doctor_profiles", "doctor_schema.doctor_schedules"],
    purpose: "Doctor management, scheduling, availability",
    accessPattern: "Medium frequency, real-time updates",
  },

  appointmentOperational: {
    tables: [
      "appointment_schema.appointments",
      "appointment_schema.appointment_queue",
    ],
    purpose: "Appointment booking, queue management, scheduling",
    accessPattern: "High frequency, real-time updates",
  },

  systemOperational: {
    tables: ["payment_schema.payments", "file_schema.documents"],
    purpose: "Payments, file management, system operations",
    accessPattern: "Medium frequency, transactional",
  },
};
```

#### **Medplum (Clinical FHIR Data)**

```typescript
// Clinical data requiring FHIR compliance and interoperability
const medplumData = {
  patientClinical: {
    resources: ["Patient", "RelatedPerson", "Coverage"],
    purpose: "FHIR-compliant patient clinical data",
    accessPattern: "Low frequency, high compliance requirements",
  },

  providerClinical: {
    resources: ["Practitioner", "PractitionerRole", "Organization"],
    purpose: "Healthcare provider clinical data",
    accessPattern: "Low frequency, credential management",
  },

  clinicalEncounters: {
    resources: ["Encounter", "Appointment", "Schedule"],
    purpose: "Clinical encounters and appointments",
    accessPattern: "Medium frequency, clinical workflow",
  },

  medicalRecords: {
    resources: ["Observation", "DiagnosticReport", "Condition", "Procedure"],
    purpose: "Clinical observations, diagnoses, procedures",
    accessPattern: "Low frequency, long-term storage",
  },

  medications: {
    resources: ["Medication", "MedicationRequest", "MedicationStatement"],
    purpose: "Prescription and medication management",
    accessPattern: "Medium frequency, clinical safety",
  },
};
```

---

## 🔄 **FHIR RESOURCE MAPPING**

### **Patient Resource Mapping**

#### **Supabase → FHIR Patient**

```typescript
// Transform Supabase patient data to FHIR Patient resource
interface PatientMapping {
  supabaseSource: "patient_schema.patient_profiles";
  fhirTarget: "Patient";

  mapping: {
    // Identifiers
    id: "identifier[0].value"; // Patient ID: PAT-YYYYMM-XXX
    user_id: "identifier[1].value"; // Internal user ID

    // Demographics
    full_name: "name[0].text";
    email: "telecom[0].value"; // email
    phone: "telecom[1].value"; // phone
    date_of_birth: "birthDate";
    gender: "gender";

    // Address
    patient_addresses: "address[]";

    // Medical info
    blood_type: "extension[blood-type].valueString";
    allergies: "extension[allergies].valueString[]";
    chronic_conditions: "extension[conditions].valueString[]";

    // Emergency contact
    emergency_contact_name: "contact[0].name.text";
    emergency_contact_phone: "contact[0].telecom[0].value";
    emergency_contact_relation: "contact[0].relationship[0].text";
  };
}

// Implementation function
async function createFHIRPatient(supabasePatient: any): Promise<Patient> {
  return {
    resourceType: "Patient",
    id: supabasePatient.patient_id,

    identifier: [
      {
        use: "official",
        system: "http://hospital.local/patient-id",
        value: supabasePatient.patient_id,
      },
      {
        use: "secondary",
        system: "http://hospital.local/user-id",
        value: supabasePatient.user_id,
      },
    ],

    name: [
      {
        use: "official",
        text: supabasePatient.full_name,
        family: supabasePatient.full_name.split(" ").slice(-1)[0],
        given: supabasePatient.full_name.split(" ").slice(0, -1),
      },
    ],

    telecom: [
      {
        system: "email",
        value: supabasePatient.email,
        use: "home",
      },
      {
        system: "phone",
        value: supabasePatient.phone,
        use: "mobile",
      },
    ],

    gender: supabasePatient.gender as "male" | "female" | "other",
    birthDate: supabasePatient.date_of_birth,

    address: [
      {
        use: "home",
        text: `${supabasePatient.patient_addresses?.[0]?.line1}, ${supabasePatient.patient_addresses?.[0]?.city}`,
        city: supabasePatient.patient_addresses?.[0]?.city,
        country: "VN",
      },
    ],

    contact: supabasePatient.emergency_contact_name
      ? [
          {
            relationship: [
              {
                coding: [
                  {
                    system: "http://terminology.hl7.org/CodeSystem/v2-0131",
                    code: "EP",
                    display: "Emergency contact person",
                  },
                ],
                text: supabasePatient.emergency_contact_relation,
              },
            ],
            name: {
              text: supabasePatient.emergency_contact_name,
            },
            telecom: [
              {
                system: "phone",
                value: supabasePatient.emergency_contact_phone,
              },
            ],
          },
        ]
      : [],

    extension: [
      {
        url: "http://hospital.local/fhir/StructureDefinition/blood-type",
        valueString: supabasePatient.blood_type,
      },
      {
        url: "http://hospital.local/fhir/StructureDefinition/allergies",
        valueString: supabasePatient.allergies?.join(", "),
      },
      {
        url: "http://hospital.local/fhir/StructureDefinition/chronic-conditions",
        valueString: supabasePatient.chronic_conditions?.join(", "),
      },
    ].filter((ext) => ext.valueString), // Remove empty extensions
  };
}
```

### **Practitioner Resource Mapping**

#### **Supabase → FHIR Practitioner**

```typescript
// Transform doctor data to FHIR Practitioner
async function createFHIRPractitioner(
  supabaseDoctor: any
): Promise<Practitioner> {
  return {
    resourceType: "Practitioner",
    id: supabaseDoctor.doctor_id,

    identifier: [
      {
        use: "official",
        system: "http://hospital.local/doctor-id",
        value: supabaseDoctor.doctor_id,
      },
      {
        use: "official",
        system: "http://ministry-health.vn/license-number",
        value: supabaseDoctor.license_number,
      },
    ],

    name: [
      {
        use: "official",
        text: supabaseDoctor.full_name,
        family: supabaseDoctor.full_name.split(" ").slice(-1)[0],
        given: supabaseDoctor.full_name.split(" ").slice(0, -1),
        prefix: ["Dr."],
      },
    ],

    telecom: [
      {
        system: "email",
        value: supabaseDoctor.email,
        use: "work",
      },
      {
        system: "phone",
        value: supabaseDoctor.phone,
        use: "work",
      },
    ],

    qualification: [
      {
        identifier: [
          {
            system: "http://ministry-health.vn/license-number",
            value: supabaseDoctor.license_number,
          },
        ],
        code: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v2-0360",
              code: "MD",
              display: "Doctor of Medicine",
            },
          ],
          text: "Medical Doctor",
        },
        issuer: {
          display: "Ministry of Health, Vietnam",
        },
      },
    ],

    extension: [
      {
        url: "http://hospital.local/fhir/StructureDefinition/specialization",
        valueString: supabaseDoctor.specialization,
      },
      {
        url: "http://hospital.local/fhir/StructureDefinition/department",
        valueString: supabaseDoctor.department_name,
      },
      {
        url: "http://hospital.local/fhir/StructureDefinition/years-experience",
        valueInteger: supabaseDoctor.years_of_experience,
      },
      {
        url: "http://hospital.local/fhir/StructureDefinition/consultation-fee",
        valueMoney: {
          value: supabaseDoctor.consultation_fee,
          currency: "VND",
        },
      },
    ],
  };
}
```

### **Appointment → Encounter Mapping**

#### **Supabase → FHIR Encounter**

```typescript
// Transform appointment to FHIR Encounter
async function createFHIREncounter(
  supabaseAppointment: any
): Promise<Encounter> {
  return {
    resourceType: "Encounter",
    id: supabaseAppointment.appointment_id,

    identifier: [
      {
        use: "official",
        system: "http://hospital.local/appointment-id",
        value: supabaseAppointment.appointment_id,
      },
    ],

    status: mapAppointmentStatusToEncounter(supabaseAppointment.status),

    class: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: "AMB", // Ambulatory
      display: "ambulatory",
    },

    type: [
      {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: mapAppointmentTypeToSNOMED(
              supabaseAppointment.appointment_type
            ),
            display: supabaseAppointment.appointment_type,
          },
        ],
      },
    ],

    subject: {
      reference: `Patient/${supabaseAppointment.patient_id}`,
      display: supabaseAppointment.patient_name,
    },

    participant: [
      {
        type: [
          {
            coding: [
              {
                system:
                  "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                code: "PPRF",
                display: "primary performer",
              },
            ],
          },
        ],
        individual: {
          reference: `Practitioner/${supabaseAppointment.doctor_id}`,
          display: supabaseAppointment.doctor_name,
        },
      },
    ],

    period: {
      start: `${supabaseAppointment.appointment_date}T${supabaseAppointment.appointment_time}+07:00`,
      end: calculateEndTime(
        supabaseAppointment.appointment_date,
        supabaseAppointment.appointment_time,
        supabaseAppointment.duration_minutes
      ),
    },

    reasonCode: supabaseAppointment.chief_complaint
      ? [
          {
            text: supabaseAppointment.chief_complaint,
          },
        ]
      : [],

    location: supabaseAppointment.room_number
      ? [
          {
            location: {
              display: `Room ${supabaseAppointment.room_number}`,
            },
          },
        ]
      : [],
  };
}

// Status mapping helper
function mapAppointmentStatusToEncounter(
  status: string
): "planned" | "arrived" | "in-progress" | "finished" | "cancelled" {
  const statusMap = {
    scheduled: "planned",
    confirmed: "planned",
    in_progress: "in-progress",
    completed: "finished",
    cancelled: "cancelled",
    no_show: "cancelled",
  };
  return statusMap[status] || "planned";
}
```

---

## 🔄 **BIDIRECTIONAL SYNCHRONIZATION**

### **Sync Rules & Triggers**

#### **Supabase → Medplum Sync**

```typescript
// Real-time sync from Supabase to Medplum
const supabaseToMedplumSync = {
  patientCreated: {
    trigger: "INSERT ON patient_schema.patient_profiles",
    action: async (newPatient: any) => {
      try {
        const fhirPatient = await createFHIRPatient(newPatient);
        const medplumPatient = await medplumClient.createResource(fhirPatient);

        // Update Supabase with FHIR resource ID
        await supabase
          .from("patient_profiles")
          .update({ fhir_resource_id: medplumPatient.id })
          .eq("id", newPatient.id);

        console.log(`Patient synced to FHIR: ${medplumPatient.id}`);
      } catch (error) {
        console.error("Failed to sync patient to FHIR:", error);
        // Queue for retry
        await queueFailedSync(
          "patient",
          "create",
          newPatient.id,
          error.message
        );
      }
    },
  },

  doctorCreated: {
    trigger: "INSERT ON doctor_schema.doctor_profiles",
    action: async (newDoctor: any) => {
      try {
        const fhirPractitioner = await createFHIRPractitioner(newDoctor);
        const medplumPractitioner = await medplumClient.createResource(
          fhirPractitioner
        );

        await supabase
          .from("doctor_profiles")
          .update({ fhir_resource_id: medplumPractitioner.id })
          .eq("id", newDoctor.id);

        console.log(`Doctor synced to FHIR: ${medplumPractitioner.id}`);
      } catch (error) {
        console.error("Failed to sync doctor to FHIR:", error);
        await queueFailedSync("doctor", "create", newDoctor.id, error.message);
      }
    },
  },

  appointmentCompleted: {
    trigger:
      "UPDATE ON appointment_schema.appointments WHERE status = 'completed'",
    action: async (completedAppointment: any) => {
      try {
        const fhirEncounter = await createFHIREncounter(completedAppointment);
        const medplumEncounter = await medplumClient.createResource(
          fhirEncounter
        );

        await supabase
          .from("appointments")
          .update({ fhir_encounter_id: medplumEncounter.id })
          .eq("id", completedAppointment.id);

        console.log(`Encounter synced to FHIR: ${medplumEncounter.id}`);
      } catch (error) {
        console.error("Failed to sync encounter to FHIR:", error);
        await queueFailedSync(
          "encounter",
          "create",
          completedAppointment.id,
          error.message
        );
      }
    },
  },
};
```

#### **Medplum → Supabase Sync**

```typescript
// Sync clinical data back to Supabase for operational use
const medplumToSupabaseSync = {
  observationCreated: {
    trigger: "FHIR Observation created",
    action: async (fhirObservation: Observation) => {
      try {
        // Extract patient and doctor references
        const patientRef = fhirObservation.subject?.reference;
        const performerRef = fhirObservation.performer?.[0]?.reference;

        if (!patientRef || !performerRef) {
          throw new Error("Missing patient or performer reference");
        }

        // Create medical record in Supabase
        const medicalRecord = {
          record_id: generateMedicalRecordId(),
          patient_id: extractIdFromReference(patientRef),
          doctor_id: extractIdFromReference(performerRef),
          fhir_resource_id: fhirObservation.id,
          fhir_resource_type: "Observation",
          diagnosis:
            fhirObservation.valueString ||
            fhirObservation.component?.[0]?.valueString,
          created_at:
            fhirObservation.effectiveDateTime || new Date().toISOString(),
        };

        await supabase.from("medical_records").insert(medicalRecord);

        console.log(
          `Medical record synced from FHIR: ${medicalRecord.record_id}`
        );
      } catch (error) {
        console.error("Failed to sync observation from FHIR:", error);
        await queueFailedSync(
          "medical_record",
          "create_from_fhir",
          fhirObservation.id,
          error.message
        );
      }
    },
  },
};
```

---

## 💰 **FREE TIER OPTIMIZATION**

### **Medplum Free Tier Management**

```typescript
// Rate limiting and quota management for Medplum free tier
class MedplumQuotaManager {
  private requestCount = 0;
  private fhirPoints = 0;
  private resetTime = new Date();

  // Free tier limits
  private readonly limits = {
    requestsPerMinute: 5000, // Stay under 6000 limit
    fhirPointsPerMonth: 45000, // Stay under 50000 limit
    storageGB: 0.8, // Stay under 1GB limit
  };

  async executeWithQuotaCheck<T>(
    operation: () => Promise<T>,
    points: number
  ): Promise<T> {
    // Check if we're approaching limits
    if (this.fhirPoints + points > this.limits.fhirPointsPerMonth * 0.9) {
      throw new Error("Approaching monthly FHIR quota limit");
    }

    if (this.requestCount > this.limits.requestsPerMinute * 0.9) {
      // Wait until next minute
      await this.waitForRateReset();
    }

    try {
      const result = await operation();
      this.fhirPoints += points;
      this.requestCount++;
      return result;
    } catch (error) {
      if (error.message.includes("rate limit")) {
        await this.waitForRateReset();
        return this.executeWithQuotaCheck(operation, points);
      }
      throw error;
    }
  }

  private async waitForRateReset(): Promise<void> {
    const waitTime = 60000 - (Date.now() % 60000); // Wait until next minute
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    this.requestCount = 0;
  }
}

// Batch operations to reduce API calls
class BatchSyncManager {
  private patientQueue: any[] = [];
  private doctorQueue: any[] = [];
  private encounterQueue: any[] = [];

  async queuePatientSync(patient: any): Promise<void> {
    this.patientQueue.push(patient);

    // Process batch when queue reaches threshold or after timeout
    if (this.patientQueue.length >= 10) {
      await this.processBatchPatients();
    }
  }

  private async processBatchPatients(): Promise<void> {
    const batch = this.patientQueue.splice(0, 10); // Process 10 at a time

    try {
      // Create FHIR Bundle for batch operation
      const bundle: Bundle = {
        resourceType: "Bundle",
        type: "batch",
        entry: batch.map((patient) => ({
          request: {
            method: "POST",
            url: "Patient",
          },
          resource: createFHIRPatient(patient),
        })),
      };

      const result = await quotaManager.executeWithQuotaCheck(
        () => medplumClient.executeBatch(bundle),
        100 * batch.length // 100 points per create operation
      );

      // Update Supabase with FHIR resource IDs
      for (let i = 0; i < batch.length; i++) {
        const fhirId = result.entry[i].response?.location?.split("/").pop();
        if (fhirId) {
          await supabase
            .from("patient_profiles")
            .update({ fhir_resource_id: fhirId })
            .eq("id", batch[i].id);
        }
      }

      console.log(`Batch synced ${batch.length} patients to FHIR`);
    } catch (error) {
      console.error("Batch patient sync failed:", error);
      // Re-queue failed items for individual retry
      batch.forEach((patient) => this.queuePatientSync(patient));
    }
  }
}
```

### **Caching Strategy**

```typescript
// Multi-level caching to reduce API calls
class FHIRCacheManager {
  private redis: Redis;
  private localCache = new Map<string, any>();

  async getFHIRResource(resourceType: string, id: string): Promise<any> {
    const cacheKey = `fhir:${resourceType}:${id}`;

    // Level 1: Local memory cache (fastest)
    if (this.localCache.has(cacheKey)) {
      return this.localCache.get(cacheKey);
    }

    // Level 2: Redis cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const resource = JSON.parse(cached);
      this.localCache.set(cacheKey, resource);
      return resource;
    }

    // Level 3: Fetch from Medplum (with quota check)
    const resource = await quotaManager.executeWithQuotaCheck(
      () => medplumClient.readResource(resourceType, id),
      1 // 1 point for read operation
    );

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(resource));
    this.localCache.set(cacheKey, resource);

    return resource;
  }

  async invalidateCache(resourceType: string, id: string): Promise<void> {
    const cacheKey = `fhir:${resourceType}:${id}`;
    this.localCache.delete(cacheKey);
    await this.redis.del(cacheKey);
  }
}
```

## ⚡ **CONFLICT RESOLUTION**

### **Conflict Detection & Resolution**

```typescript
// Handle conflicts between Supabase and Medplum data
interface ConflictResolution {
  conflictType: "data_mismatch" | "sync_failure" | "version_conflict";
  resolution: "supabase_wins" | "medplum_wins" | "manual_review" | "merge";
  priority: "high" | "medium" | "low";
}

class ConflictResolver {
  async detectConflicts(): Promise<ConflictResolution[]> {
    const conflicts: ConflictResolution[] = [];

    // Check for data mismatches
    const patients = await supabase
      .from("patient_profiles")
      .select("*")
      .not("fhir_resource_id", "is", null);

    for (const patient of patients.data || []) {
      try {
        const fhirPatient = await cacheManager.getFHIRResource(
          "Patient",
          patient.fhir_resource_id
        );

        // Compare key fields
        if (patient.full_name !== fhirPatient.name[0].text) {
          conflicts.push({
            conflictType: "data_mismatch",
            resolution: "supabase_wins", // Operational data is source of truth
            priority: "medium",
          });

          // Auto-resolve: Update FHIR with Supabase data
          await this.resolveNameConflict(patient, fhirPatient);
        }
      } catch (error) {
        conflicts.push({
          conflictType: "sync_failure",
          resolution: "manual_review",
          priority: "high",
        });
      }
    }

    return conflicts;
  }

  private async resolveNameConflict(
    supabasePatient: any,
    fhirPatient: Patient
  ): Promise<void> {
    // Update FHIR resource with Supabase data (operational data wins)
    fhirPatient.name[0].text = supabasePatient.full_name;

    await quotaManager.executeWithQuotaCheck(
      () => medplumClient.updateResource(fhirPatient),
      100 // 100 points for update operation
    );

    console.log(
      `Resolved name conflict for patient ${supabasePatient.patient_id}`
    );
  }
}
```

### **Sync Failure Recovery**

```typescript
// Queue and retry failed sync operations
interface FailedSync {
  id: string;
  resourceType: "patient" | "doctor" | "encounter" | "medical_record";
  operation: "create" | "update" | "delete" | "create_from_fhir";
  resourceId: string;
  error: string;
  retryCount: number;
  nextRetry: Date;
  created_at: Date;
}

class SyncFailureManager {
  async queueFailedSync(
    resourceType: FailedSync["resourceType"],
    operation: FailedSync["operation"],
    resourceId: string,
    error: string
  ): Promise<void> {
    const failedSync: FailedSync = {
      id: uuid(),
      resourceType,
      operation,
      resourceId,
      error,
      retryCount: 0,
      nextRetry: new Date(Date.now() + 60000), // Retry in 1 minute
      created_at: new Date(),
    };

    await supabase.from("sync_failures").insert(failedSync);
  }

  async processFailedSyncs(): Promise<void> {
    const { data: failedSyncs } = await supabase
      .from("sync_failures")
      .select("*")
      .lte("next_retry", new Date().toISOString())
      .lt("retry_count", 5) // Max 5 retries
      .order("created_at");

    for (const sync of failedSyncs || []) {
      try {
        await this.retrySync(sync);

        // Remove from queue on success
        await supabase.from("sync_failures").delete().eq("id", sync.id);
      } catch (error) {
        // Update retry count and next retry time
        const nextRetry = new Date(
          Date.now() + Math.pow(2, sync.retryCount) * 60000
        ); // Exponential backoff

        await supabase
          .from("sync_failures")
          .update({
            retry_count: sync.retryCount + 1,
            next_retry: nextRetry.toISOString(),
            error: error.message,
          })
          .eq("id", sync.id);
      }
    }
  }

  private async retrySync(sync: FailedSync): Promise<void> {
    switch (sync.resourceType) {
      case "patient":
        const patient = await supabase
          .from("patient_profiles")
          .select("*")
          .eq("id", sync.resourceId)
          .single();

        if (patient.data) {
          await supabaseToMedplumSync.patientCreated.action(patient.data);
        }
        break;

      case "doctor":
        const doctor = await supabase
          .from("doctor_profiles")
          .select("*")
          .eq("id", sync.resourceId)
          .single();

        if (doctor.data) {
          await supabaseToMedplumSync.doctorCreated.action(doctor.data);
        }
        break;

      // Add other resource types as needed
    }
  }
}
```

## 🇻🇳 **VIETNAMESE HEALTHCARE EXTENSIONS**

### **Custom FHIR Extensions for Vietnam**

```typescript
// Vietnamese-specific FHIR extensions
const vietnameseExtensions = {
  nationalId: {
    url: "http://hospital.local/fhir/StructureDefinition/vn-national-id",
    valueString: "citizen_id_number", // CCCD/CMND
  },

  ethnicGroup: {
    url: "http://hospital.local/fhir/StructureDefinition/vn-ethnic-group",
    valueCodeableConcept: {
      coding: [
        {
          system: "http://ministry-health.vn/ethnic-groups",
          code: "kinh",
          display: "Kinh",
        },
      ],
    },
  },

  socialInsurance: {
    url: "http://hospital.local/fhir/StructureDefinition/vn-social-insurance",
    valueIdentifier: {
      system: "http://vss.gov.vn/insurance-number",
      value: "social_insurance_number",
    },
  },

  vietnameseAddress: {
    url: "http://hospital.local/fhir/StructureDefinition/vn-address",
    extension: [
      {
        url: "ward",
        valueString: "ward_name",
      },
      {
        url: "district",
        valueString: "district_name",
      },
      {
        url: "province",
        valueString: "province_name",
      },
    ],
  },
};

// Apply Vietnamese extensions to FHIR resources
function addVietnameseExtensions(
  resource: Patient,
  supabaseData: any
): Patient {
  resource.extension = resource.extension || [];

  // Add national ID if available
  if (supabaseData.national_id) {
    resource.extension.push({
      url: vietnameseExtensions.nationalId.url,
      valueString: supabaseData.national_id,
    });
  }

  // Add social insurance if available
  if (supabaseData.social_insurance_number) {
    resource.extension.push({
      url: vietnameseExtensions.socialInsurance.url,
      valueIdentifier: {
        system: vietnameseExtensions.socialInsurance.valueIdentifier.system,
        value: supabaseData.social_insurance_number,
      },
    });
  }

  return resource;
}
```

---

**Status:** ✅ FHIR Integration Architecture Complete
**Next:** 8-Week Implementation Roadmap
