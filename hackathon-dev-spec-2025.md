# HACKATHON DEV DOCUMENT – 2025

## 1. Các mục cần đội chơi chuẩn bị

### 1.1 Dockerfile (*)
Tùy thuộc vào ngôn ngữ lập trình mà các team lựa chọn, vui lòng chuẩn bị Dockerfile tương ứng hỗ trợ chạy ngôn ngữ đó.

### 1.2 File `.env`
> **Lưu ý:** Sẽ được sửa bởi BTC khi thi đấu.

```env
SOCKET_SERVER=SOCKET_SERVER:PORT
```

### 1.3 File `docker-compose.yml`

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

**Start BOT**
```bash
docker compose start bot
```

**Stop BOT**
```bash
docker compose stop bot
```

---

## 2. Lưu ý chung

Có 2 loại môi trường:

### 2.1 Môi trường luyện tập
- Kiểu chơi hồi sinh.
- Mỗi trận kéo dài **5 phút**.
- Bot bị hạ gục sẽ **được hồi sinh**.
- Sau 5 phút, map reset về trạng thái ban đầu.

### 2.2 Môi trường thi đấu
- Thể thức **sinh tồn**: bot bị hạ gục **bị loại**, không hồi sinh.
- Bot chỉ bắt đầu thi đấu sau khi nhận **event `start`**.
- Trận kết thúc khi:
  - Hết 5 phút, hoặc
  - Chỉ còn 1 bot duy nhất.
- Bot nhận **event `finish`** khi trận kết thúc.

> **Code nộp cho BTC phải là code của môi trường thi đấu.**

---

## 3. Danh sách sự kiện (Socket Events)

### 3.1 Sự kiện từ BOT gửi lên

#### Đăng nhập
Gửi token xác thực khi kết nối socket.

```js
const auth = { token: YOUR_TOKEN };
const socket = io(SOCKET_SERVER_ADDR, { auth });
```

| Dữ liệu | Mô tả |
|----------|--------|
| `token` | TOKEN được cung cấp bởi BTC |

---

#### Tham gia phòng chơi
- **Event:** `join`
- **Data:**
```json
{}
```

---

#### Di chuyển
- **Event:** `move`
```json
{
  "orient": "UP" // UP, DOWN, LEFT, RIGHT
}
```

| Dữ liệu | Mô tả |
|----------|--------|
| `orient` | Hướng di chuyển của BOT |

---

#### Đặt bom
- **Event:** `place_bomb`
- **Data:** `{}`

---

### 3.2 Sự kiện BOT nhận từ server

#### `user`
Thông tin ban đầu khi bot tham gia phòng.

```json
{
  "map": [["W","C",null], ...],
  "bombers": [{ "x":568, "y":568, "name":"zarenabot", ... }],
  "bombs": [{ "x":599.5, "y":33.5, "uid":"UID", "id":691 }],
  "chests": [{ "x":80, "y":160, "type":"C" }],
  "items": [{ "x":40, "y":160, "type":"SPEED" }]
}
```

---

#### `new_enemy`
Thông tin bot mới tham gia.
```json
{
  "bomber": {...},
  "bombers": [{...}]
}
```

---

### 3.3 Các đối tượng dữ liệu

#### `map`
| Giá trị | Ý nghĩa |
|----------|---------|
| `W` | Tường |
| `C` | Hòm đồ |
| `B` | Item tăng bom |
| `R` | Item tăng phạm vi nổ |
| `S` | Item tăng tốc độ |
| `null` | Ô trống |

---

#### `bomber`
| Trường | Mô tả |
|--------|-------|
| x, y | Tọa độ |
| speed | Tốc độ di chuyển |
| type | Loại bot |
| uid | ID bot |
| orient | Hướng đi |
| isAlive | Trạng thái sống |
| size | Kích thước |
| name | Tên bot |
| movable | Trạng thái di chuyển |
| score | Điểm |
| color | Màu sắc |
| explosionRange | Phạm vi nổ |
| bombCount | Số lượng bom |
| speedCount | Số lượng item tăng tốc |

---

#### `bomb`
| Trường | Mô tả |
|--------|-------|
| x, y | Tọa độ |
| uid | BOT đặt bom |
| lifeTime | Thời gian bom nổ |
| createdAt | Thời gian đặt |
| isExploded | Đã nổ/chưa |
| bomberPassedThrough | BOT đã rời khỏi bom |
| id | ID bom |

---

#### `item`
| Trường | Mô tả |
|--------|-------|
| x, y | Tọa độ |
| type | SPEED, EXPLOSION_RANGE, BOMB_COUNT |
| size | Kích thước |
| isCollected | Đã thu thập hay chưa |

---

## 4. Các sự kiện trong trận đấu

### 4.1 Bắt đầu game (`start`)
```json
{ "start_at": "2025-10-08T06:47:50.731Z" }
```

---

### 4.2 Di chuyển (`player_move`)
```json
{ "x":568, "y":568, "orient":"UP", "name":"zarenabot" }
```

---

### 4.3 Đặt bom (`new_bomb`)
```json
{
  "x":579.5, "y":295.5, "ownerName":"zarenabot", "uid":"xxx", "id":4708
}
```

---

### 4.4 Bom phát nổ
**Event:** `bomb_explode`
```json
{
  "x":160, "y":160, "uid":"xxx", "id":4708,
  "explosionArea":[{"x":120,"y":120},{"x":180,"y":180}]
}
```

**Event:** `map_update`
```json
{
  "chests":[{"x":80,"y":160}],
  "items":[{"x":40,"y":160,"type":"SPEED"}]
}
```

---

### 4.5 Hạ gục đối phương (`user_die_update`, `new_life`)
```json
{
  "killer": { "uid": "..." },
  "killed": { "uid": "..." },
  "bomb": { "id": 9908 },
  "bombers": [{ "uid": "hks6XsCBLoRgqqJSAAAE" }]
}
```

> **new_life** chỉ có trong môi trường luyện tập.

---

### 4.6 Hòm đồ bị phá (`chest_destroyed`)
```json
{
  "x":160, "y":160,
  "item": { "type":"SPEED" }
}
```

---

### 4.7 Nhặt item (`item_collected`)
```json
{
  "bomber": {...},
  "item": { "x":160, "y":160, "type":"SPEED" }
}
```

---

### 4.8 Bot thoát phòng (`user_disconnect`)
```json
{ "uid":"UID", "bomber": {...} }
```

---

### 4.9 Kết thúc game (`finish`)
```json
{}
```

---

## 5. Tổng kết

- **Môi trường dev:** có hồi sinh, game auto reset 5 phút.
- **Môi trường thi đấu:** sinh tồn, không hồi sinh, có `start` & `finish`.
- **Các team phải nộp code môi trường thi đấu.**

---

**ZINZA HACKATHON 2025**
