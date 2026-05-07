# FamilyFunQuizzz — Kế hoạch nâng cấp gameplay

> Mục tiêu: Làm game thú vị, hồi hộp và có lý do để quay lại chơi lại.
> Ưu tiên: Impact lớn trước, ít phá vỡ code hiện tại.

---

## Phase 1 — Quick Wins (ít code, tác động ngay)

### 1.1 Difficulty Filter trên Home Screen
**Trạng thái:** Data đã có `difficulty: 1/2/3` — chỉ cần expose UI.

- Thêm toggle 3 nút trên `homeScreen`: Dễ / Trung bình / Khó / Tất cả
- Khi fetch `/api/questions/batch`, truyền thêm param `difficulty`
- Server filter câu hỏi theo difficulty trước khi trả về
- Default: "Tất cả" (giữ nguyên behavior hiện tại)

**Files cần sửa:**
- `frontend/index.html` — thêm UI + truyền param vào `fetchBatchQuestions()`
- `server/index.js` — filter theo `difficulty` trong `/api/questions/batch`

---

### 1.2 Streak Bonus
**Mô tả:** Trả lời đúng liên tiếp N câu → bonus điểm. Tạo drama "đang streak".

| Streak | Bonus |
|--------|-------|
| 3 câu liên tiếp | +30đ bonus (hiện badge "🔥 x3") |
| 5 câu liên tiếp | +60đ bonus (hiện badge "🔥🔥 x5") |
| Sai / Timeout | Reset streak về 0 |

- Thêm biến `streak` vào state (Normal mode: per-player; Split mode: per-player trong `sp`)
- Hiện floating toast `+30đ 🔥` khi đạt streak milestone
- Streak counter hiện nhỏ dưới progress dots

**Files cần sửa:**
- `frontend/index.html` — state `streak[]`, logic trong `pick()` / `pickRace()`, UI badge

---

## Phase 2 — Split Mode Enhancement (gameplay mới)

### 2.1 Steal Mechanic
**Mô tả:** Khi player đang trả lời timeout, các player khác có 3 giây để buzz in và cướp câu. Mechanic kinh điển của game show TV.

**Flow:**
```
Player A timeout
  → Hiện "Cướp câu! 3...2...1" 
  → Tất cả player khác thấy nút buzz (tên mình)
  → Ai nhấn đầu tiên → được trả lời (10 giây mới)
  → Đúng: cộng điểm bình thường + bonus +20đ steal
  → Sai: -20đ penalty (khuyến khích không buzz liều)
  → Không ai buzz: câu bỏ qua như timeout thường
```

- Thêm state `stealPhase: bool` vào `sp`
- Timer steal: 3 giây, countdown hiển thị
- Chỉ áp dụng trong Split mode

**Files cần sửa:**
- `frontend/index.html` — `raceTimeOut()` → trigger steal phase, UI steal buttons, `pickSteal()`

---

### 2.2 Pre-question Betting (Split mode)
**Mô tả:** Trước khi câu hỏi hiện ra, player hiện tại cược một phần điểm. Đúng x2, sai mất cược. Thêm tầng chiến thuật.

**Flow:**
```
Hiện tên category + emoji của câu sắp hỏi (hint nhẹ)
  → Player chọn mức cược: Bỏ qua / +10đ / +30đ / ALL-IN
  → Câu hỏi hiện ra, timer bắt đầu
  → Kết quả tính theo mức cược đã chọn
```

- Bet screen hiện 2 giây để chọn, sau đó auto-skip nếu không chọn
- Chỉ cho phép cược nếu player có ≥ mức cược tối thiểu
- "ALL-IN" = 50% điểm hiện tại

**Files cần sửa:**
- `frontend/index.html` — màn hình bet nhỏ (overlay) trước `loadRaceQ()`, tích hợp vào scoring

---

## Phase 3 — Game Feel (âm thanh & hiệu ứng)

### 3.1 Tension Music & Sound Polish
**Mô tả:** Âm thanh tốt hơn tạo cảm giác hồi hộp thực sự.

| Tình huống | Âm thanh |
|------------|----------|
| Câu hỏi mới | Short drum roll (0.3s) |
| Timer còn 3 giây | Tick-tock tăng dần nhịp độ |
| Đúng | Ting + trill ngắn |
| Sai | Buzz (giữ nguyên) |
| Streak milestone | Fanfare ngắn |
| Steal thành công | "Whoosh" + ting |
| Kết quả / Podium | Victory fanfare 3s |

- Dùng Web Audio API (giữ `audioCtx` pattern hiện có)
- Không dùng file âm thanh ngoài — tất cả synthesized

**Files cần sửa:**
- `frontend/index.html` — mở rộng `beep()` thành `playSound(type)` với nhiều preset

---

### 3.2 Micro-animations
- Timer bar đổi màu mượt hơn: xanh → vàng → đỏ với glow effect khi < 3s
- Số điểm tăng lên với counter animation (không nhảy ngay)
- Podium reveal: hạng 3 → hạng 2 → hạng 1 với delay + animation

**Files cần sửa:**
- `frontend/index.html` — CSS keyframes mới, JS counter animation utility

---

## Phase 4 — Lifelines (chiến thuật)

### 4.1 Lifelines System
**Mô tả:** Mỗi player có 2 lifeline dùng trong suốt ván. Thêm tầng chiến lược.

| Lifeline | Tác dụng | Giới hạn |
|----------|----------|----------|
| 50/50 | Loại 2 đáp án sai | 1 lần/player/ván |
| +5 giây | Thêm 5 giây cho câu hiện tại | 1 lần/player/ván |

**UI:**
- 2 icon nhỏ dưới câu hỏi (Normal mode: hiện khi đến lượt player)
- Dùng rồi → icon greyed out
- Trong Split mode: chỉ player đang trả lời thấy lifeline của mình

**Files cần sửa:**
- `frontend/index.html` — `lifelines[]` array per player, `usLifeline(type)`, UI buttons, tích hợp vào `pick()` / `loadQ()`

---

## Phase 5 — Retention (lý do quay lại)

### 5.1 Player Profiles (localStorage)
**Mô tả:** Ghi nhớ tên + avatar player qua các phiên chơi. Lần sau không cần nhập lại.

- Lưu `players[]` (name + emoji) vào `localStorage` sau mỗi ván
- Khi load homeScreen, pre-fill các ô input từ localStorage
- Nút nhỏ "Xóa" bên cạnh nếu muốn đặt lại

**Files cần sửa:**
- `frontend/index.html` — `savePlayerProfiles()` / `loadPlayerProfiles()`, gọi trong `buildHome()` và `showResult()`

---

### 5.2 Per-session Stats & Achievements
**Mô tả:** Hiện achievement badges ở resultScreen sau mỗi ván. Không cần lưu lịch sử — chỉ tính trong phiên hiện tại.

| Badge | Điều kiện |
|-------|-----------|
| 🎯 Perfectionist | 10/10 câu đúng |
| ⚡ Speed Demon | Trả lời trong < 2 giây ít nhất 5 câu |
| 🔥 On Fire | Streak 5+ câu liên tiếp |
| 👑 Comeback King | Thua ≥ 150đ ở giữa ván rồi vượt |
| 🎭 Gambler | Dùng ALL-IN bet và thắng |
| 🦅 Eagle Eye | Dùng 50/50 và vẫn chọn đúng ngay |

- Tính toán dựa trên `playerHistory[][]` đã có
- Hiện dưới leaderboard với animation pop-in

**Files cần sửa:**
- `frontend/index.html` — `calcAchievements(playerIdx)`, UI badge section trong `showResult()`

---

## Thứ tự triển khai đề xuất

```
Phase 1.1 (Difficulty)  → không phụ thuộc gì, độc lập hoàn toàn
Phase 1.2 (Streak)      → độc lập, thêm vào pick() và pickRace()
Phase 3.1 (Sound)       → độc lập, cải thiện ngay game feel
Phase 2.1 (Steal)       → phụ thuộc Split mode hiểu rõ
Phase 4.1 (Lifelines)   → phụ thuộc loadQ() / pick() ổn định
Phase 2.2 (Betting)     → phụ thuộc Split mode + Lifelines hoàn chỉnh
Phase 5.1 (Profiles)    → độc lập hoàn toàn
Phase 5.2 (Achievements)→ phụ thuộc Streak + Betting data
Phase 3.2 (Animations)  → polish, làm sau cùng
```

---

## Ghi chú kỹ thuật

- Tất cả thay đổi chỉ trong `frontend/index.html` (trừ Phase 1.1 cần sửa `server/index.js`)
- Không thêm dependencies mới — giữ nguyên zero-build-step
- Web Audio API đủ cho mọi âm thanh — không cần file MP3/WAV
- localStorage key convention: `ffq_players`, `ffq_settings`
- Tất cả text UI dùng tiếng Việt (nhất quán với game hiện tại)
