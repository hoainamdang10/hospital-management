import { NextApiRequest, NextApiResponse } from "next";

// API Gateway configuration
const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:3100";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    // Vietnamese error handling
    const language = req.headers["accept-language"]?.includes("en")
      ? "en"
      : "vi";
    return res.status(405).json({
      success: false,
      error:
        language === "vi"
          ? "Phương thức không được phép"
          : "Method not allowed",
      message:
        language === "vi"
          ? "Chỉ hỗ trợ phương thức POST"
          : "Only POST method is supported",
    });
  }

  const {
    appointmentId,
    receptionistId,
    insuranceVerified = false,
    notes = "",
  } = req.body;

  if (!appointmentId) {
    const language = req.headers["accept-language"]?.includes("en")
      ? "en"
      : "vi";
    return res.status(400).json({
      success: false,
      error:
        language === "vi"
          ? "Thiếu thông tin bắt buộc"
          : "Missing required information",
      message:
        language === "vi"
          ? "ID cuộc hẹn là bắt buộc"
          : "Appointment ID is required",
    });
  }

  try {
    // Get authentication token from request
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      const language = req.headers["accept-language"]?.includes("en")
        ? "en"
        : "vi";
      return res.status(401).json({
        success: false,
        error: language === "vi" ? "Không có quyền truy cập" : "Unauthorized",
        message:
          language === "vi"
            ? "Vui lòng đăng nhập để tiếp tục"
            : "Please login to continue",
      });
    }

    // Forward check-in request to API Gateway -> Appointment Service
    const response = await fetch(
      `${API_GATEWAY_URL}/api/appointments/${appointmentId}/check-in`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          "Accept-Language": req.headers["accept-language"] || "vi-VN",
        },
        body: JSON.stringify({
          receptionistId,
          insuranceVerified,
          notes,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      const language = req.headers["accept-language"]?.includes("en")
        ? "en"
        : "vi";
      return res.status(response.status).json({
        success: false,
        error:
          result.error ||
          (language === "vi" ? "Lỗi check-in" : "Check-in error"),
        message:
          result.message ||
          (language === "vi"
            ? "Không thể thực hiện check-in"
            : "Unable to perform check-in"),
      });
    }

    // Return successful response with Vietnamese language support
    const language = req.headers["accept-language"]?.includes("en")
      ? "en"
      : "vi";

    res.status(200).json({
      success: true,
      message:
        language === "vi"
          ? "Check-in thành công"
          : "Patient checked in successfully",
      data: result.data,
    });
  } catch (error) {
    console.error("Check-in API error:", error);
    const language = req.headers["accept-language"]?.includes("en")
      ? "en"
      : "vi";

    res.status(500).json({
      success: false,
      error:
        language === "vi" ? "Lỗi hệ thống nội bộ" : "Internal server error",
      message:
        language === "vi"
          ? "Đã xảy ra lỗi, vui lòng thử lại"
          : "Something went wrong, please try again",
    });
  }
}
