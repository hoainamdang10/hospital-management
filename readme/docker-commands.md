# Docker Compose Commands (Hospital Management V2)

> Chạy tất cả lệnh từ root repo (`D:\hospital-management-V2`). Dùng file cấu hình `backend/services-v2/docker-compose.v2.yml` và đảm bảo Docker Desktop đang chạy.

## Khởi động service / profile
- `docker compose -f backend/services-v2/docker-compose.v2.yml --profile infrastructure up -d` – bật Redis (`redis-v2`) và RabbitMQ (`rabbitmq-v2`).
- `docker compose -f backend/services-v2/docker-compose.v2.yml --profile core up -d` – chạy nhóm core: identity, patient, provider.
- `docker compose -f backend/services-v2/docker-compose.v2.yml --profile business up -d` – chạy appointments, clinical, billing.
- `docker compose -f backend/services-v2/docker-compose.v2.yml --profile supporting up -d` – chạy notifications, scheduler, department.
- `docker compose -f backend/services-v2/docker-compose.v2.yml --profile gateway up -d` – chỉ khởi động api-gateway.
- `docker compose -f backend/services-v2/docker-compose.v2.yml --profile full up -d` – toàn bộ stack production-like.
- `docker compose -f backend/services-v2/docker-compose.v2.yml --profile dev up -d` – toàn bộ stack chế độ dev (mở health-check và cổng local).
- `docker compose -f backend/services-v2/docker-compose.v2.yml up -d identity-service patient-registry-service` – khởi động danh sách service cụ thể.

## Tạm dừng / dừng container
- `docker compose -f backend/services-v2/docker-compose.v2.yml stop identity-service` – dừng container nhưng giữ dữ liệu.
- `docker compose -f backend/services-v2/docker-compose.v2.yml pause identity-service` – tạm dừng process khi cần giữ trạng thái.
- `docker compose -f backend/services-v2/docker-compose.v2.yml unpause identity-service` – tiếp tục container đã pause.
- `docker compose -f backend/services-v2/docker-compose.v2.yml restart api-gateway` – restart nhanh 1 service sau khi đổi env.
- `docker compose -f backend/services-v2/docker-compose.v2.yml down` – tắt toàn bộ stack và remove container.
- `docker compose -f backend/services-v2/docker-compose.v2.yml down -v` – tắt stack và xóa volumes (dọn sạch dữ liệu Redis/RabbitMQ, Supabase cache).
- `docker compose -f backend/services-v2/docker-compose.v2.yml rm -sf identity-service` – xóa container đã stop để tránh xung đột tên.

## Build / rebuild image
- `docker compose -f backend/services-v2/docker-compose.v2.yml build identity-service` – build image mới cho identity-service.
- `docker compose -f backend/services-v2/docker-compose.v2.yml build api-gateway notifications-service` – build nhiều service cùng lúc.
- `docker compose -f backend/services-v2/docker-compose.v2.yml up -d identity-service --build` – rebuild và khởi động lại 1 service (dùng cache).
- `docker compose -f backend/services-v2/docker-compose.v2.yml build --no-cache appointments-service` – build không dùng cache khi Dockerfile thay đổi nhiều.
- `docker compose -f backend/services-v2/docker-compose.v2.yml build --pull billing-service` – rebuild sau khi kéo base image mới nhất.
- `docker compose -f backend/services-v2/docker-compose.v2.yml pull identity-service` – kéo image đã publish sẵn (CI build) trước khi up.
- `docker compose -f backend/services-v2/docker-compose.v2.yml images` – liệt kê image hiện tại của stack để theo dõi tag/size.

## Giám sát / debug nhanh
- `docker compose -f backend/services-v2/docker-compose.v2.yml ps` – xem trạng thái container (Up/Exited, cổng).
- `docker compose -f backend/services-v2/docker-compose.v2.yml logs -f identity-service` – tail log realtime của 1 service.
- `docker compose -f backend/services-v2/docker-compose.v2.yml logs --since 10m api-gateway` – xem log 10 phút gần nhất.
- `docker compose -f backend/services-v2/docker-compose.v2.yml top patient-registry-service` – xem process đang chạy bên trong container.
- `docker exec -it hospital-identity-service-v2 sh` – shell trực tiếp vào container (dùng tên container trong compose).
