const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const localEnvPath = path.resolve(process.cwd(), ".env");
const sharedEnvPath = path.resolve(process.cwd(), "../.env");
const envPath = fs.existsSync(localEnvPath) ? localEnvPath : sharedEnvPath;

require("dotenv").config({ path: envPath });

const {
  createHttpServer,
} = require("../dist/presentation/http/servers/express-server");

async function run() {
  const app = createHttpServer();
  const server = app.listen(0);

  const closeServer = () =>
    new Promise((resolve) => {
      server.close(resolve);
    });

  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const results = [];

  const doctorUser = {
    userId: randomUUID(),
    role: "doctor",
  };

  const patientUser = {
    userId: randomUUID(),
    role: "patient",
    patientId: randomUUID(),
  };

  function buildHeaders(user) {
    const headers = {
      "x-user-id": user.userId,
      "x-user-role": user.role,
    };
    if (user.patientId) {
      headers["x-patient-id"] = user.patientId;
    }
    return headers;
  }

  async function request(method, path, { headers = {}, body } = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "content-type": body ? "application/json" : undefined,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let json;
    try {
      json = text ? JSON.parse(text) : undefined;
    } catch (error) {
      json = { parseError: error.message, raw: text };
    }
    return { status: response.status, data: json };
  }

  try {
    const health = await request("GET", "/health");
    results.push({ name: "health", ...health });

    const listEmpty = await request(
      "GET",
      "/api/v2/clinical-emr/medical-records",
      {
        headers: buildHeaders(doctorUser),
      },
    );
    results.push({ name: "list-medical-records", ...listEmpty });

    const newRecordPayload = {
      patientId: patientUser.patientId,
      doctorId: doctorUser.userId,
      encounterType: "inpatient",
      encounterDate: new Date().toISOString(),
      diagnosis: {
        primary: "Smoke Test Condition",
        secondary: ["allergy"],
      },
      treatmentSummary: "Smoke test record creation",
      vitalSigns: {
        temperature: 37.2,
        heartRate: 80,
      },
    };

    const createRecord = await request(
      "POST",
      "/api/v2/clinical-emr/medical-records",
      {
        headers: buildHeaders(doctorUser),
        body: newRecordPayload,
      },
    );
    results.push({ name: "create-medical-record", ...createRecord });

    const createdRecordId = createRecord.data?.data?.id;
    if (!createdRecordId) {
      console.error("Create medical record response:", createRecord);
      throw new Error("Failed to create medical record");
    }

    const getRecord = await request(
      "GET",
      `/api/v2/clinical-emr/medical-records/${createdRecordId}`,
      {
        headers: buildHeaders(doctorUser),
      },
    );
    results.push({ name: "get-medical-record-doctor", ...getRecord });

    const getRecordPatient = await request(
      "GET",
      `/api/v2/clinical-emr/medical-records/${createdRecordId}`,
      {
        headers: buildHeaders(patientUser),
      },
    );
    results.push({ name: "get-medical-record-patient", ...getRecordPatient });

    const wrongPatient = {
      ...patientUser,
      patientId: randomUUID(),
    };

    const getRecordForbidden = await request(
      "GET",
      `/api/v2/clinical-emr/medical-records/${createdRecordId}`,
      {
        headers: buildHeaders(wrongPatient),
      },
    );
    results.push({
      name: "get-medical-record-patient-forbidden",
      ...getRecordForbidden,
    });

    const createNote = await request(
      "POST",
      `/api/v2/clinical-emr/medical-records/${createdRecordId}/notes`,
      {
        headers: buildHeaders(doctorUser),
        body: {
          recordId: createdRecordId,
          authorId: doctorUser.userId,
          type: "soap",
          content: {
            subjective: "Patient feels better",
            objective: "Vitals stable",
            assessment: "Recovery proceeding",
            plan: "Continue monitoring",
          },
        },
      },
    );
    results.push({ name: "create-clinical-note", ...createNote });

    const noteId = createNote.data?.data?.id;

    const listNotes = await request(
      "GET",
      `/api/v2/clinical-emr/medical-records/${createdRecordId}/notes`,
      {
        headers: buildHeaders(doctorUser),
      },
    );
    results.push({ name: "list-clinical-notes", ...listNotes });

    if (noteId) {
      const deleteNote = await request(
        "DELETE",
        `/api/v2/clinical-emr/medical-records/${createdRecordId}/notes/${noteId}`,
        { headers: buildHeaders(doctorUser) },
      );
      results.push({ name: "delete-clinical-note", ...deleteNote });
    }

    console.log("Clinical EMR smoke test results:");
    for (const result of results) {
      console.log(
        `- ${result.name}: ${result.status}`,
        result.data?.success === false
          ? `error=${JSON.stringify(result.data)}`
          : "",
      );
    }
  } catch (error) {
    console.error("Smoke test failed:", error);
    process.exitCode = 1;
  } finally {
    await closeServer();
  }
}

run();
