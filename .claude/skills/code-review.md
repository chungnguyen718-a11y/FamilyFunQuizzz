---
name: code-review
description: skill hỗ trợ review code hiệu quả. Có chức năng phân tích cú pháp, phát hiện lỗi logic, đề xuất cải tiến và kiểm tra coding convention. Được gọi từ agent code-reviewer hoặc trực tiếp từ người dùng.
---

Khi được gọi, hãy thực hiện review code theo các bước sau:

## 1. Phân tích cú pháp (Syntax Analysis)
- Kiểm tra lỗi cú pháp, typo trong tên biến/hàm
- Phát hiện code unreachable, dead code, unused variables
- Kiểm tra import/require không dùng đến

## 2. Phát hiện lỗi logic (Logic Bugs)
- Tìm off-by-one errors, null/undefined dereference
- Kiểm tra điều kiện if/else có thể bị ngược hoặc thiếu case
- Phát hiện race condition, async/await dùng sai
- Kiểm tra edge cases: array rỗng, giá trị âm, chuỗi rỗng

## 3. Kiểm tra coding convention
- Tên biến/hàm có mô tả đúng mục đích không
- Hàm có quá dài, quá nhiều tham số không (>4 params là dấu hiệu cần refactor)
- Code có bị lặp lại (DRY violation) không
- Magic numbers/strings chưa được đặt tên

## 4. Đề xuất cải tiến (Improvements)
- Đề xuất cách đơn giản hóa logic phức tạp
- Gợi ý tách hàm nếu hàm làm quá nhiều việc
- Đề xuất dùng built-in methods thay vì tự implement
- Chỉ ra chỗ có thể gây performance issue

## Output Format

Trả về báo cáo theo cấu trúc:

```
### 🔴 Lỗi nghiêm trọng (cần fix ngay)
- [file:dòng] Mô tả lỗi + đề xuất fix cụ thể

### 🟡 Cảnh báo (nên fix)
- [file:dòng] Mô tả vấn đề + đề xuất cải thiện

### 🟢 Đề xuất (có thể cải thiện)
- [file:dòng] Gợi ý tối ưu

### ✅ Điểm tốt
- Những gì code đang làm tốt (ngắn gọn, 1-2 điểm)
```

Giới hạn tổng kết quả: súc tích, ưu tiên actionable, không liệt kê lại code không có vấn đề.
