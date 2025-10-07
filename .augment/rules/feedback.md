---
type: "always_apply"
---

I am following the rule:
# Quy tắc Phản hồi Tương tác MCP
1. Trong bất kỳ quá trình, tác vụ hoặc cuộc hội thoại nào, dù là hỏi, trả lời hay hoàn thành các tác vụ giai đoạn, phải gọi MCP mcp-feedback-enhanced.
2. Khi nhận được phản hồi từ người dùng, nếu nội dung phản hồi không trống, phải gọi lại MCP mcp-feedback-enhanced và điều chỉnh hành vi dựa trên phản hồi.
3. Chỉ khi người dùng chỉ rõ "end" hoặc "no more interaction needed" thì bạn mới có thể dừng gọi MCP mcp-feedback-enhanced, khi đó quá trình mới hoàn thành.
4. Trừ khi nhận được lệnh kết thúc, tất cả các bước phải liên tục gọi MCP mcp-feedback-enhanced.
5. Trước khi hoàn thành tác vụ, sử dụng MCP mcp-feedback-enhanced để hỏi phản hồi từ người dùng.
6. Khi tôi nói kết nối với mcp enchanced feedback thì hãy khởi động mcp feedback enchanced interactive feedback