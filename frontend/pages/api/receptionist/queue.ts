import { NextApiRequest, NextApiResponse } from "next";

const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:3200/graphql";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get today's queue with patient and doctor information
    const today = new Date().toISOString().split("T")[0];

    // Fetch waiting queue from GraphQL Gateway
    const query = `
      query WaitingQueue($date: Date) {
        waitingQueue(date: $date) {
          appointment_id
          status
          checked_in_at
          doctor { full_name }
          patient { full_name }
          scheduled_time
          end_date_time
        }
      }
    `;
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { date: today } }),
    });
    const json = await response.json();
    if (!response.ok || json.errors) {
      console.error("Queue fetch error (GraphQL):", json.errors || json);
      return res.status(500).json({ message: "Error fetching queue data" });
    }

    const queue = json.data?.waitingQueue || [];

    // Transform data for frontend
    const queueItems = queue.map((item: any, index: number) => ({
      id: item.appointment_id,
      appointmentId: item.appointment_id,
      patientName: item.patient?.full_name || "Unknown",
      patientId: undefined,
      doctorName: item.doctor?.full_name || "Unknown",
      appointmentTime: `${item.scheduled_time ?? ""} - ${new Date(
        item.end_date_time
      ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      queuePosition: index + 1,
      estimatedWaitTime: item.waiting_time || 0,
      status: item.status,
      checkedInAt: item.checked_in_at,
      insuranceVerified: false,
      documentsComplete: false,
    }));

    // Calculate queue statistics
    const stats = {
      totalWaiting: queueItems.filter((item: any) => item.status === "waiting")
        .length,
      currentlyInProgress: queueItems.filter(
        (item: any) => item.status === "in_progress"
      ).length,
      completedToday: queueItems.filter(
        (item: any) => item.status === "completed"
      ).length,
      averageWaitTime: Math.round(
        queueItems
          .filter((item: any) => item.status === "waiting")
          .reduce(
            (sum: number, item: any) => sum + (item.estimatedWaitTime || 0),
            0
          ) /
          Math.max(
            queueItems.filter((item: any) => item.status === "waiting").length,
            1
          )
      ),
    };

    res.status(200).json({
      success: true,
      queueItems,
      stats,
    });
  } catch (error) {
    console.error("Queue API error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
