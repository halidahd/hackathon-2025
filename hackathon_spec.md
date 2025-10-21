# ZINZA HACKATHON 2025 - BOT GAME SPEC

## 1. Chuẩn bị môi trường

### Yêu cầu
Các đội cần chuẩn bị 3 file cấu hình:

- **Dockerfile**: tùy theo ngôn ngữ lập trình của đội (Node.js, Python, Go,...)
- **.env**:
  ```env
  SOCKET_SERVER=SOCKET_SERVER:PORT
  ```
- **docker-compose.yml**:
  ```yaml
  version: '3.8'
  services:
    bot:
      build:
        context: .
        dockerfile: Dockerfile
      env_file:
        - .env
      deploy:
        mode: replicated
        replicas: 1
        resources:
          limits:
            cpus: '1'
            memory: 1G
          reservations:
            cpus: '0.25'
            memory: 250M
  ```

**Start bot**: `docker compose start bot`  
**Stop bot**: `docker compose stop bot`

---


## 3. Giao tiếp Socket

### 3.1. Sự kiện gửi từ Bot

#### a. Đăng nhập
```js
const auth = { token: YOUR_TOKEN };
const socket = io(SOCKET_SERVER_ADDR, { auth });
```
| Trường | Mô tả |
|--------|-------|
| token | m6kt9w3d |

#### b. Tham gia phòng
- Event: `join`
- Data: `{}`

#### c. Di chuyển
- Event: `move`
- Data:
  ```json
  { "orient": "UP" }
  ```
  → `orient`: hướng di chuyển `UP | DOWN | LEFT | RIGHT`

#### d. Đặt bom
- Event: `place_bomb`
- Data: `{}`

---

### 3.2. Sự kiện nhận từ Server

#### a. `user`
Thông tin toàn bộ phòng:
- Map 2D (ký hiệu W, C, null, B, R, S)
- Danh sách `bombers`, `bombs`, `chests`, `items`

#### b. `new_enemy`
Bot khác mới tham gia phòng.

#### c. `start`
Bắt đầu trận đấu:
```json
{ "start_at": "2025-10-08T06:47:50.731Z" }
```

#### d. `player_move`
Thông báo khi bot khác di chuyển.

#### e. `new_bomb`
Thông báo khi có bot đặt bom.

#### f. `bomb_explode`
Bom phát nổ sau 5 giây. Trả về `explosionArea` + `map_update` (chests, items).

#### g. `user_die_update` / `new_life`
Thông báo bot bị hạ gục hoặc hồi sinh (chỉ trong luyện tập).

#### h. `chest_destroyed`
Thông báo hòm đồ bị phá, có thể kèm item rơi ra.

#### i. `item_collected`
Bot nhặt item, hoặc item bị phá hủy bởi bom.

#### j. `user_disconnect`
Bot rời phòng (hoặc bị mất kết nối).

#### k. `finish`
Trận đấu kết thúc (chỉ môi trường thi đấu).

---

## 4. Cấu trúc dữ liệu

### 4.1. `map`
| Ký hiệu | Ý nghĩa |
|---------|---------|
| W | Tường |
| C | Hòm đồ (phá được) |
| B | Item +Bom |
| R | Item +Tầm nổ |
| S | Item +Tốc độ |
| null | Ô trống |

### 4.2. `bomber`
| Trường | Mô tả |
|--------|-------|
| x, y | Tọa độ |
| uid | ID duy nhất của bot |
| orient | Hướng di chuyển |
| isAlive | Trạng thái sống |
| name | Tên bot |
| score | Điểm |
| explosionRange | Phạm vi bom |
| bombCount | Số bom đặt được |
| speedCount | Tốc độ hiện tại |

### 4.3. `bomb`
| Trường | Mô tả |
|--------|-------|
| x, y | Tọa độ |
| uid | UID của bot đặt |
| lifeTime | Thời gian nổ |
| createdAt | Thời gian đặt |
| isExploded | Đã nổ chưa |
| id | ID bom |

### 4.4. `item`
| Trường | Mô tả |
|--------|-------|
| x, y | Tọa độ |
| type | Loại: `S` (Speed), `R` (Range), `B` (Bomb) |
| size | Kích thước |
| isCollected | Đã nhặt chưa |

---

## 5. Tổng kết

- Server hoạt động qua Socket.IO.
- Các event chia 2 nhóm: gửi từ Bot và trả từ Server.
- Mỗi đội cần xử lý event hợp lý để di chuyển, đặt bom, tránh nổ, thu thập item.
- Môi trường thi đấu là **sinh tồn**, không hồi sinh, bot chết bị loại.  
- Dockerized bot để đảm bảo môi trường thống nhất.

---

### Chú ý quan trọng
1. Gốc tọa độ là góc trên bên trái, x tăng sang phải, y tăng xuống dưới.
2. Tốc độ di chuyển của bot ảnh hưởng bởi item thu thập.
3. Phạm vi nổ của bom ảnh hưởng bởi item thu thập.
4. Mỗi bot có số lượng bom đặt tối đa, có thể tăng bằng item.
5. Trận đấu kết thúc khi chỉ còn 1 bot sống sót hoặc hết thời gian.
6. Bot cần xử lý logic để sinh tồn, tránh bom, thu thập item và hạ gục đối thủ.
7. Mỗi item đều có kích thước và vị trí cụ thể trên bản đồ. VD: tường W có kích thước 40x40, đường đi cũng có kich thước 40x40.
8. Bot sẽ có kích thước 35x35. Các item cũng có kích thước 40x40. Mỗi ô cũng sẽ có kich thước 40x40.
9. Gốc tọa độ của item cung là góc trên bên trái của item đó tương ứng vỡi mỗi ô.
10. Có thể nối bom để tạo chuỗi nổ dài hơn.
11. Chú ý thời gian delay giữa các sự kiện từ server gửi về.
12. Chú ý thời gian bom nổ là 5 giây kể từ khi đặt bom đ tránh bom một cách hợp lý.
13. Thời gian xử lý trên server là 17ms cho mỗi tick.
14. Mỗi bot có thể di chuyển liên tục không ngừng nghỉ.
15. Bot có thể đặt bom liên tục nếu có đủ số lượng bom.
16. Bot có thể di chuyển qua bom ngay sau khi đặt bom (bomberPassedThrough).
17. Bot không thể di chuyển qua tường và hòm đồ.
19. Khi bot thu thập item, trạng thái của bot sẽ được cập nhật ngay lập tức.
20. Khi hòm đồ bị phá, nếu có item rơi ra, item đó sẽ xuất hiện ngay lập tức trên bản đồ.
21. Khi bom nổ, nếu có hòm đồ trong phạm vi nổ, hòm đồ đó sẽ bị phá ngay lập tức.
22. Khi bom nổ, nếu có bot trong phạm vi nổ, bot đó sẽ bị hạ gục ngay lập tức.
23. Khi bot bị hạ gục, bot đó sẽ không thể di chuyển hoặc thực hiện bất kỳ hành động nào nữa.
24. Khi bot bị hạ gục, bot đó sẽ không thể tham gia lại trận đấu.
25. Trận đấu sẽ kết thúc khi chỉ còn một bot sống sót hoặc hết thời gian thi đấu.
26. Khi trận đấu kết thúc, server sẽ gửi sự kiện `finish` cho tất cả các bot trong phòng.
27. Bot cần xử lý sự kiện `finish` để biết khi nào trận đấu kết thúc
28. Bot cần tối ưu chiến thuật để sinh tồn lâu nhất có thể và hạ gục đối thủ.
29. Bot cần xử lý logic để tránh bị kẹt giữa các bom hoặc tường
30. Bot cần xử lý logic để ưu tiên thu thập item quan trọng như tăng phạm vi nổ và số lượng bom.
31. Bot cần xử lý logic để tấn công đối thủ khi có cơ hội thuận lợi.
32. Bot cần xử lý logic để tránh bị đối thủ tấn công.
33. Bot cần xử lý logic để tận dụng địa hình bản đồ như tường và hòm đồ để che chắn và tạo lợi thế chiến thuật.
34. Bot cần xử lý logic để di chuyển linh hoạt và không bị lộ vị trí quá dễ dàng.
35. Bot cần xử lý logic để phối hợp với đồng đội (nếu có) trong trường hợp chơi đội.
36. Bot cần xử lý logic để thích nghi với các chiến thuật khác nhau của đối thủ.
37. Bot cần xử lý logic để tận dụng thời gian trống giữa các sự kiện từ server để tối ưu hành động.
38. Bot cần xử lý logic để tránh bị lừa bởi các chiêu trò của đối thủ như giả vờ di chuyển hoặc đặt bom không hiệu quả.
39. Bot cần xử lý logic để duy trì trạng thái tốt nhất có thể trong suốt trận đấu.