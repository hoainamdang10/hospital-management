# Hospital Management System — Cập nhật trạng thái dự án (2025-09-01)

## 1) Trạng thái triển khai microservices

- Đã build + deploy và container đang chạy:

  - api-gateway (3100)
  - graphql-gateway (3200)
  - patient-service (3003)
  - department-service (3005)
  - receptionist-service (3006)
  - medical-records-service (3007)
  - notification-service (3011)
  - payment-service (3009)
  - file-service (3107)
  - Hạ tầng: redis, rabbitmq

- Dịch vụ cần kiểm tra thêm (đã chỉnh code, cần xác minh sau rebuild no-cache):

  - payment-service: trước đây /health qua API Gateway trả 503 do gộp readiness vào health; đã tách bạch health/readiness trong code.
  - file-service: tương tự; đã tách bạch health/readiness.

- Endpoints sức khỏe & giám sát (sau thay đổi gần nhất):
  - payment-service:
    - /health: liveness (200 nếu tiến trình sống)
    - /readiness: kiểm tra PAYOS creds + Supabase (200/503)
    - /metrics: Prometheus metrics (đã bật qua shared middleware)
  - file-service:
    - /health: liveness (200)
    - /health/detailed: readiness (DB + Storage Bucket) (200/503)
    - /metrics: Prometheus metrics
  - notification-service:
    - /health qua API Gateway đã xác nhận 200 OK
  - department-service:
    - /health qua API Gateway đã xác nhận 200 OK

### Bảng tóm tắt trạng thái (Skim-friendly)

| Service                 | Port | /health (liveness)          | /readiness (hoặc /health/detailed)                                    | /metrics    |
| ----------------------- | ---- | --------------------------- | --------------------------------------------------------------------- | ----------- |
| api-gateway             | 3100 | 200 (Gateway up)            | N/A                                                                   | Có          |
| graphql-gateway         | 3200 | 200 (Service up)            | N/A                                                                   | Có          |
| patient-service         | 3003 | 200 (chưa xác minh UI)      | Chưa áp dụng tách bạch                                                | Cần rà soát |
| department-service      | 3005 | 200 (đã xác minh qua proxy) | Chưa áp dụng tách bạch                                                | Cần rà soát |
| receptionist-service    | 3006 | 200 (chưa xác minh UI)      | Chưa áp dụng tách bạch                                                | Cần rà soát |
| medical-records-service | 3007 | 200 (chưa xác minh UI)      | Đã giữ JSON summary riêng (/metrics-summary), readiness cần chuẩn hoá | Cần rà soát |
| payment-service         | 3009 | 200 (đã tách liveness)      | /readiness kiểm PAYOS + Supabase (200/503)                            | Có          |
| notification-service    | 3011 | 200 (đã xác minh qua proxy) | Chưa áp dụng tách bạch                                                | Cần rà soát |
| file-service            | 3107 | 200 (đã tách liveness)      | /health/detailed kiểm DB + Storage (200/503)                          | Có          |
| auth-service            | 3001 | Chưa xác minh               | Chưa xác minh                                                         | Cần rà soát |
| doctor-service          | 3002 | Chưa xác minh               | Chưa xác minh                                                         | Cần rà soát |
| appointment-service     | 3004 | Chưa xác minh               | Chưa xác minh                                                         | Cần rà soát |

Ghi chú:

- “Chưa xác minh” nghĩa là chưa kiểm tra thực tế ở lần chạy gần nhất; endpoint có thể đã tồn tại.
- Cột /metrics “Có/Cần rà soát” phản ánh việc đã chuẩn hoá với shared middleware hay chưa.

- API Gateway public health proxies (no auth):
  - /api/payments/health → payment-service:/health
  - /api/notifications/health → notification-service:/health
  - /api/files/health → file-service:/health
  - /api/departments/health → department-service:/health
  - (tuỳ chọn) /api/graphql-gateway/health → graphql-gateway:/health

## 2) Monitoring & Observability

- Prometheus scrape configuration: đã cấu hình để scrape 13 microservices (bao gồm cả hạ tầng). Cần xác minh trên UI.
  - Prometheus Targets: http://localhost:9090/targets (kiểm tra UP/DOWN)
- Metrics endpoints standardization: đã chuẩn hoá ở payment-service và file-service (/metrics). Các service còn lại sẽ rà soát và chuẩn hoá tương tự nếu thiếu.
- Logging: morgan + logger cho payment-service; file-service có logger. Cần chuẩn hoá mức log và mask nhạy cảm ở toàn hệ thống.

## 3) Các vấn đề đã giải quyết

- TypeScript build issues:
  - Sửa build đối với shared library trong payment-service, file-service
  - Sửa Supabase generic type trong graphql-gateway để đảm bảo compile
  - Thêm stub type cho compression (graphql-gateway)
- GraphQL Gateway:
  - Build no-cache OK, container đã khởi động, có /metrics
- Docker build:
  - Đã rebuild no-cache cho các service trọng yếu để đảm bảo image chứa code mới nhất

## 4) Công việc còn lại (Next steps)

Ưu tiên 1 – Ổn định giao dịch & Health/Monitoring

- Payment webhook idempotency dùng Redis:
  - Thay Map tạm bằng Redis key `idempotency:{eventId|orderCode}` với TTL 5–10 phút
- Rate limit riêng cho endpoint webhook (ví dụ 30 rpm) để tránh spam
- Rebuild no‑cache payment-service và file-service; xác minh lại Gateway health:
  - `docker-compose build --no-cache payment-service file-service && docker-compose up -d payment-service file-service`
  - Test: GET http://localhost:3100/api/payments/health → 200; GET http://localhost:3100/api/files/health → 200
- Xác minh Prometheus Targets:
  - Mở http://localhost:9090/targets, bảo đảm các job đều UP (hoặc nêu rõ nguyên nhân khi DOWN)

Ưu tiên 2 – Bảo mật & Quyền truy cập File Service

- ACL theo vai trò (upload/download/delete) dựa trên hồ sơ người dùng
- Signed URL TTL hợp lý (5–15 phút), thu hồi quyền truy cập
- Audit log đầy đủ (userId, fileId, hành động)
- (Optional) Virus scan theo feature flag, chặn tải khi chưa pass

Ưu tiên 3 – Chuẩn hoá hệ thống

- Áp dụng liveness (/health) và readiness (/readiness hoặc /health/detailed) cho mọi service còn lại để đồng nhất
- Rà soát và chuẩn hoá /metrics cho toàn bộ services
- I18n thông điệp lỗi tiếng Việt (dịch vụ, gateway, hook) theo tiêu chuẩn dự án

Ưu tiên 4 – Kiểm thử & Hiệu năng

- E2E test thanh toán (PayOS), hành trình bệnh nhân, bảo mật (RBAC)
- Benchmark với 1–50 concurrent users, mục tiêu <200ms response
- Kiểm tra tỷ lệ cache Redis (>85% hit) nếu có sử dụng

## 5) Kiến trúc & Best Practices đã áp dụng

- Pure API Gateway Communication: frontend chỉ giao tiếp qua API Gateway
- Liveness vs Readiness tách bạch: sẵn sàng cho Kubernetes/Autoscaling
- Webhook security & idempotency: xác minh chữ ký (HMAC), idempotency skeleton → sẽ chuyển Redis
- Prometheus-first monitoring: thống nhất /metrics, bổ sung counter/histogram qua shared middleware

## 6) Rủi ro & Lưu ý

- Thiếu PAYOS*\* hoặc SUPABASE*\* có thể khiến readiness 503 nhưng liveness vẫn 200
- Health proxy ở API Gateway phản ánh liveness; readiness dùng cho vận hành nội bộ
- Một số metrics endpoints có thể không truy cập từ host nếu không publish port; Prometheus vẫn scrape nội bộ qua network

## 7) Checklist xác minh nhanh (sau khi hoàn tất bước Ưu tiên 1)

- [ ] /api/payments/health → 200
- [ ] /api/files/health → 200
- [ ] Prometheus Targets: đa số job ở trạng thái UP
- [ ] Webhook payment có idempotency Redis hoạt động (log duplicate bị bỏ qua)
- [ ] Rate limit riêng cho webhook có hiệu lực

---

Tài liệu này phản ánh trạng thái sau lần build no‑cache và deploy gần nhất. Khi hoàn tất từng hạng mục ở mục “Công việc còn lại”, vui lòng cập nhật lại mục 7 (Checklist) và đánh dấu hoàn thành.
