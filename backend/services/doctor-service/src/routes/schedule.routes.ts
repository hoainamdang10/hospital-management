import express from "express";
import { supabase } from "../config/database.config";
import { authenticateToken, requireRole } from "../middleware/auth.middleware";
import { parameterMappingMiddleware } from "../middleware/parameter-mapping.middleware";

const router = express.Router();

// Apply parameter mapping middleware to all routes
router.use(parameterMappingMiddleware);

// Get doctor's work schedule
router.get("/:doctor-id/schedule", authenticateToken, async (req, res) => {
  try {
    const { doctor_id } = req.params as any;

    // Verify doctor exists and user has permission
    if (
      !req.user ||
      (req.user.role !== "admin" && req.user.doctor_id !== doctor_id)
    ) {
      return res.status(403).json({
        success: false,
        error: { message: "Không có quyền truy cập thông tin này" },
      });
    }

    const { data: schedules, error } = await supabase
      .from("doctor_work_schedules")
      .select("*")
      .eq("doctor_id", doctor_id)
      .eq("is_active", true)
      .order("day_of_week");

    if (error) {
      console.error("❌ [Schedule] Database error:", error);
      return res.status(500).json({
        success: false,
        error: { message: "Lỗi khi truy vấn lịch làm việc" },
      });
    }

    res.json({
      success: true,
      data: schedules || [],
    });
  } catch (error) {
    console.error("❌ [Schedule] Error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Lỗi server khi lấy lịch làm việc" },
    });
  }
});

// Update doctor's work schedule
router.put(
  "/:doctor-id/schedule",
  authenticateToken,
  requireRole(["doctor", "admin"]),
  async (req, res) => {
    try {
      const { doctor_id } = req.params as any;
      const { schedules } = req.body;

      // Verify doctor exists and user has permission
      if (
        !req.user ||
        (req.user.role !== "admin" && req.user.doctor_id !== doctor_id)
      ) {
        return res.status(403).json({
          success: false,
          error: { message: "Không có quyền cập nhật thông tin này" },
        });
      }

      if (!schedules || !Array.isArray(schedules)) {
        return res.status(400).json({
          success: false,
          error: { message: "Dữ liệu lịch làm việc không hợp lệ" },
        });
      }

      // Validate schedule data
      for (const schedule of schedules) {
        if (
          !schedule.day_of_week ||
          schedule.day_of_week < 0 ||
          schedule.day_of_week > 6
        ) {
          return res.status(400).json({
            success: false,
            error: { message: "Ngày trong tuần không hợp lệ" },
          });
        }
        if (!schedule.start_time || !schedule.end_time) {
          return res.status(400).json({
            success: false,
            error: { message: "Giờ làm việc không được để trống" },
          });
        }
      }

      // Delete existing schedules
      const { error: deleteError } = await supabase
        .from("doctor_work_schedules")
        .delete()
        .eq("doctor_id", doctor_id);

      if (deleteError) {
        console.error("❌ [Schedule] Delete error:", deleteError);
        return res.status(500).json({
          success: false,
          error: { message: "Lỗi khi xóa lịch cũ" },
        });
      }

      // Insert new schedules
      const scheduleData = schedules.map((schedule) => ({
        doctor_id: doctor_id,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        lunch_start_time: schedule.lunch_start_time || null,
        lunch_end_time: schedule.lunch_end_time || null,
        max_patients_per_day: schedule.max_patients_per_day || 20,
        is_active: schedule.is_active !== false,
      }));

      const { data: newSchedules, error: insertError } = await supabase
        .from("doctor_work_schedules")
        .insert(scheduleData)
        .select();

      if (insertError) {
        console.error("❌ [Schedule] Insert error:", insertError);
        return res.status(500).json({
          success: false,
          error: { message: "Lỗi khi lưu lịch mới" },
        });
      }

      res.json({
        success: true,
        data: newSchedules,
        message: "Cập nhật lịch làm việc thành công",
      });
    } catch (error) {
      console.error("❌ [Schedule] Error:", error);
      res.status(500).json({
        success: false,
        error: { message: "Lỗi server khi cập nhật lịch làm việc" },
      });
    }
  }
);

// Get today's schedule - Development mode (no auth required)
router.get("/:doctor-id/schedule/today", async (req, res) => {
  try {
    const { doctor_id } = req.params as any;
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

    // Skip authentication in development mode
    console.log("🔍 [TodaySchedule] Getting schedule for doctor:", doctor_id);

    const { data: schedule, error } = await supabase
      .from("doctor_work_schedules")
      .select("*")
      .eq("doctor_id", doctor_id)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("❌ [TodaySchedule] Database error:", error);
      return res.status(500).json({
        success: false,
        error: { message: "Lỗi khi truy vấn lịch hôm nay" },
      });
    }

    // Get today's statistics
    const todayStr = today.toISOString().split("T")[0];
    const { data: stats, error: statsError } = await supabase
      .from("doctor_statistics")
      .select("*")
      .eq("doctor_id", doctor_id)
      .eq("stat_date", todayStr)
      .single();

    if (statsError && statsError.code !== "PGRST116") {
      console.error("❌ [TodaySchedule] Stats error:", statsError);
    }

    res.json({
      success: true,
      data: {
        schedule: schedule || null,
        statistics: stats || null,
        current_time: today.toISOString(),
        day_of_week: dayOfWeek,
      },
    });
  } catch (error) {
    console.error("❌ [TodaySchedule] Error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Lỗi server khi lấy lịch hôm nay" },
    });
  }
});

// Get doctor's appointment statistics
router.get(
  "/:doctor-id/appointments/stats",
  authenticateToken,
  async (req, res) => {
    try {
      const { doctor_id } = req.params as any;
      const { period = "month" } = req.query; // day, week, month, year

      // Verify doctor exists and user has permission
      if (
        !req.user ||
        (req.user.role !== "admin" && req.user.doctor_id !== doctor_id)
      ) {
        return res.status(403).json({
          success: false,
          error: { message: "Không có quyền truy cập thông tin này" },
        });
      }

      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case "day":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "week":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - 7
          );
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default: // month
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Get appointment statistics from appointment service
      const { data: appointments, error } = await supabase
        .from("appointments")
        .select("appointment_id, status, appointment_date, appointment_time")
        .eq("doctor_id", doctor_id)
        .gte("appointment_date", startDate.toISOString().split("T")[0])
        .lte("appointment_date", now.toISOString().split("T")[0]);

      if (error) {
        console.error("❌ [AppointmentStats] Database error:", error);
        return res.status(500).json({
          success: false,
          error: { message: "Lỗi khi truy vấn thống kê cuộc hẹn" },
        });
      }

      // Calculate statistics
      const stats = {
        total_appointments: appointments?.length || 0,
        completed_appointments:
          appointments?.filter((a) => a.status === "completed").length || 0,
        pending_appointments:
          appointments?.filter((a) => a.status === "scheduled").length || 0,
        cancelled_appointments:
          appointments?.filter((a) => a.status === "cancelled").length || 0,
        no_show_appointments:
          appointments?.filter((a) => a.status === "no_show").length || 0,
        period,
        start_date: startDate.toISOString().split("T")[0],
        end_date: now.toISOString().split("T")[0],
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("❌ [AppointmentStats] Error:", error);
      res.status(500).json({
        success: false,
        error: { message: "Lỗi server khi lấy thống kê cuộc hẹn" },
      });
    }
  }
);

export default router;
