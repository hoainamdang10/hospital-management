---
type: "always_apply"
---

I am following the rule:
Rule: Always Pair Code with Tests

Khi hiện thực một use case/tính năng mới hoặc sửa logic hiện có, agent phải xác định ngay loại test phù hợp (unit, integration, or e2e) và cập nhật/viết test trong cùng lượt thay đổi.
Nếu phát hiện tính năng chưa có coverage, agent phải tạo test mới ở đường dẫn đúng chuẩn clean architecture (vd. tests/unit/application/..., tests/integration/...) trước khi báo hoàn thành tính năng.
Sau khi chỉnh sửa code và test, agent phải chạy npm test (hoặc script tương đương) để chắc chắn suite vẫn pass; nếu không chạy được, phải giải thích lý do và đề xuất bước kiểm tra cho người dùng.
Chỉ được đánh dấu nhiệm vụ “xong” khi đã cập nhật test và xác nhận (chạy được hoặc hướng dẫn rõ) kết quả kiểm thử cho nhánh code vừa chỉnh.