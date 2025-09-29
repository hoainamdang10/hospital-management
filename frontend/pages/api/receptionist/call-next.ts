import { NextApiRequest, NextApiResponse } from "next";

// API Gateway configuration
const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:3100";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
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

  const { appointmentId } = req.body;

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

    // Forward call-next request to API Gateway -> Appointment Service
    const response = await fetch(
      `${API_GATEWAY_URL}/api/appointments/${appointmentId}/call-next`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          "Accept-Language": req.headers["accept-language"] || "vi-VN",
        },
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
          (language === "vi" ? "Lỗi gọi bệnh nhân" : "Call patient error"),
        message:
          result.message ||
          (language === "vi"
            ? "Không thể gọi bệnh nhân tiếp theo"
            : "Unable to call next patient"),
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
          ? "Đã gọi bệnh nhân tiếp theo"
          : "Next patient called successfully",
      data: result.data,
    });
  } catch (error) {
    console.error("Call next API error:", error);
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
