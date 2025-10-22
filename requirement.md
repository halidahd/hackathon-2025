### 1. Luật chơi cụ thể: không Có gì khác biệt so với Bomberman cổ điển 
- Bom nổ sau 5 giây
- Có thể đặt bao nhiêu bom cùng lúc cũng được, nhưng ban đầu thì chỉ có 1 bom và cần đi nhặt vật phẩm để tăng số bom đặt được
- Có vật phẩm tăng tầm nổ bom, tăng số bom đặt được, và tăng tốc độ di chuyển
- Có các box (chest) có thể phá được để lấy vật phẩm

### 2. Chiến thuật mong muốn của bot:
- Bot nên ưu tiên né bom, thu thập vật phẩm, sau đó là tiêu diệt đối thủ
- Nên đặt bom một cách tối ưu để có thể phá nhiều rương (chest) nhất có thể, đồng thời có thể tiêu diệt đối thủ nếu có cơ hội
- Nên truy đuổi đối thủ khi có thể, nhưng nên chú ý tránh bị dồn vào góc

### 3. Thông tin kỹ thuật:
- Bot sẽ chạy trong môi Node.js, trình duyệt, server socket.io
- Đã có sẵn server, và bạn chỉ cần phát triển bot để kết nối và chơi

### 4. Dữ liệu đầu vào bot nhận được mỗi lượt:
- Sau khi join vào phòng, bot sẽ nhận được thông tin bản đồ, vị trí của tất cả bot, vị trí bom, và các vật phẩm trên bản đồ
- có thể call lên server liên tục để gọi các event để di chuyển hoặc đặt bo 17ms mỗi lần 

### 5. Bạn muốn bot hoạt động như thế nào:
- Tự động di chuyển mỗi lượt
- Tự động đặt bom khi có cơ hội
- Có cần học máy (AI)

### 6. Thông tin server:
- Server sử dụng socket.io, 
```
SOCKET_SERVER_ADDR=https://zarena-dev1.zinza.com.vn
TOKEN=m6kt9w3d
BOT_NAME=VuaMin
```
### 6.1. Đăng nhập:
```js
const auth = { token: YOUR_TOKEN };
const socket = io(SOCKET_SERVER_ADDR, { auth });
```

### 6. Các sự kiện:
### 6.1. Sự kiện gửi từ Bot
#### Tham gia phòng
- Event: `join`
- Data: `{}`

#### Di chuyển
- Event: `move`
- Data:
  ```json
  { "orient": "UP" }
  ```
  → `orient`: hướng di chuyển `UP | DOWN | LEFT | RIGHT`
  
#### Đặt bom
- Event: `place_bomb`
- Data: `{}`

### 6.2. Sự kiện nhận từ Server
#### Event name `user`:
Sau khi join vào phòng, bot sẽ nhận được event `user` chứa thông tin toàn bộ phòng như:
- Map 2D (ký hiệu W, C, null, B, R, S)
- Danh sách `bombers`, `bombs`, `chests`, `items`

Response:
```json
{
  "map": [
    [
        "W", // wall
        "C", // chest
        null, // free space
    ],
    [
        "W", // wall
        "C", // chest
        null, // free space
    ],
    [
        "W", // wall
        "C", // chest
        null, // free space
    ],
    ...
  ],
  "bombers": [
    {
        "x": 568,
        "y": 568,
        "speed": 1,
        "type": 1,
        "uid": "1sEo7KS7efpHtJViAAAB",
        "orient": "UP",
        "isAlive": true,
        "size": 35,
        "name": "zarenabot",
        "movable": true,
        "score": 0,
        "color": 1,
        "explosionRange": 2,
        "bombCount": 1,
        "speedCount": 0
    },
    ...
  ],
  "bombs": [
    {
        "x": 600,
        "y": 41,
        "orient": "RIGHT",
        "speed": 1,
        "type": 1,
        "size": 8,
        "uid": "UID",
        "id": 691
    },
    ...
  ],
  "chests": [
    {
        "x": 80,
        "y": 160,
        "size": 40,
        "type": "C",
        "isDestroyed": false
    },
    ...
  ],
  "items": [
    {
        "x": 40,
        "y": 160,
        "type": "SPEED",
        "size": 8,
        "isCollected": false
    },
  ...
  ]
}
```
Và các bot còn lại trong phòng nhận được message:
- Event name: `new_enemy`
- Response data:

```json
{
  bomber: {
    x: 40,
    y: 40,
    speed: 1,
    type: 1,
    uid: 'Hdfk_7H0etJn9IXnAApI',
    orient: 'DOWN',
    isAlive: true,
    size: 35,
    name: '843&390',
    movable: true,
    protectCooldown: 0,
    score: 0,
    color: 2,
    explosionRange: 2,
    bombCount: 1,
    speedCount: 0
  },
  bombers: [
    {
      x: 40,
      y: 520,
      speed: 3,
      type: 1,
      uid: 'x5_rNi2bpE1CYuoWAAnl',
      orient: 'UP',
      isAlive: true,
      size: 35,
      name: 'TNT',
      movable: true,
      protectCooldown: 0,
      score: 0,
      color: 0,
      explosionRange: 2,
      bombCount: 1,
      speedCount: 0
    },
    {
      x: 565,
      y: 40,
      speed: 1,
      type: 1,
      uid: 'r58-zMkiAX-83hgJAApG',
      orient: 'DOWN',
      isAlive: true,
      size: 35,
      name: 'VuaMin',
      movable: true,
      protectCooldown: 0,
      score: 0,
      color: 1,
      explosionRange: 2,
      bombCount: 1,
      speedCount: 0
    },
    {
      x: 40,
      y: 40,
      speed: 1,
      type: 1,
      uid: 'Hdfk_7H0etJn9IXnAApI',
      orient: 'DOWN',
      isAlive: true,
      size: 35,
      name: '843&390',
      movable: true,
      protectCooldown: 0,
      score: 0,
      color: 2,
      explosionRange: 2,
      bombCount: 1,
      speedCount: 0
    }
  ]
}
```

#### Event name `player_move`
- Thông báo khi bot khác di chuyển.
- Response data:
```json
{
  x: 565,
  y: 520,
  speed: 3,
  type: 1,
  uid: 'x5_rNi2bpE1CYuoWAAnl',
  orient: 'UP',
  isAlive: true,
  size: 35,
  name: 'TNT',
  movable: true,
  protectCooldown: 0,
  score: 0,
  color: 0,
  explosionRange: 2,
  bombCount: 1,
  speedCount: 0
}
```

#### Event name `new_bomb`
- Thông báo khi có bot đặt bom
- Reponse data:
```json
{
  "x": 579.5,
  "y": 295.5,
  "ownerName":"zarenabot",
  "uid": "xxx",
  "id": 4708
}
```

#### Event name `bomb_exploded`, `map_update`
Sau 5 giây kể từ khi được đặt, bom sẽ phát nổ, các bot nhận được 2 sự kiện bao gồm “bom_explode” 
và “map_update” (do việc bom nổ có thể khiến map thay đổi, map update sẽ trả về thông tin danh sách chests và items hiện tại còn active)

- Response data `bomb_exploded`:
```json
{
  x: 160,
  y: 160,
  "uid": "xxx",
  "id": 4708,
  "explosionArea": [{x:120,y:120},{x:180,y:180}]
}
```

- Response data `map_update`:
```json
{
  "chests": [
    {
      "x": 80,
      "y": 160,
      "size": 40,
    },
    ...
  ],
  "items": [
    {
      "x": 40,
      "y": 160,
      "type": "SPEED"
    },
    ...
  ],
}
```

#### Event name `user_die_update`
- Thông báo có bot bị hạ gục.
- Response data:
```json
{
  "killer": {
    x: 568,
    y: 568,
    speed: 1,
    type: 1,
    uid: '1sEo7KS7efpHtJViAAAB',
    orient: 'UP',
    isAlive: true,
    size: 35,
    name: 'zarenabot',
    movable: true,
    score: 0,
    color: 1,
    explosionRange: 2,
    bombCount: 1,
    speedCount: 0
  },
  "killed": {
    x: 568,
    y: 568,
    speed: 1,
    type: 1,
    uid: '1sEo7KS7efpHtJViAAAB',
    orient: 'UP',
    isAlive: true,
    size: 35,
    name: 'VUAMIN',
    movable: true,
    score: 0,
    color: 1,
    explosionRange: 2,
    bombCount: 1,
    speedCount: 0
  }
}
```

#### Event name `chest_destroyed`
- Mỗi khi hòm đồ bị bom phá huỷ, các bot trong phòng sẽ nhận được thông tin cập nhật qua event. Nếu hòm đồ có vật phẩm bên trong, thông tin vật phẩm được trả về ở trường item, nếu không có vật phẩm thì trường này là null.
- Response data:
```json
{
  x: 160,
  y: 160,
  item: {
    x: 160,
    y: 160,
    type: SPEED
  }
}
```
#### Event name `item_collected`
- Mỗi khi có bot nhặt vật phẩm, các bot trong phòng sẽ nhận được thông tin cập nhật qua event.
- Response data:
```json
{
  bomber: {//thong tin bomber},  // lưu ý tình huống bị destroy bởi bom nổ thì chỗ này là null
  item: {
    x: 160,
    y: 160,
    type: SPEED
  }
}
```
#### Event name `finish`
- Trận đấu kết thúc




### 7. Lưu ý:
- Bản đồ có kích thước 640x640 (px), được chia làm 16 ô mỗi ô trong bản đồ có kích thước 40x40
- Gốc tọa độ (0,0) nằm ở góc trên bên trái bản đồ
- Vị trí của bot, bom, box, vật phẩm được biểu diễn bằng tọa độ x, y (px). Tọa độ sẽ tính là góc trên bên trái của đối tượng đó 
- Bot di chuyển với tốc độ nhất định (speed), mỗi lượt bot call event move sẽ di chuyển được một khoảng cách bằng với speed theo hướng orient đơn vị px. VD Speed của bot là 3, mỗi lượt call move bot sẽ di chuyển được 3px theo hướng orient
- Bot chỉ có thể di chuyển trong các ô trống (null) hoặc ô có vật phẩm (S, B, R). Không thể di chuyển vào ô tường (W) hoặc ô có chest (C)
- Khi đặt bom, bom sẽ được đặt ở chính giữa ô mà bot đứng. VD bot đứng ở tọa độ (45, 85) thì bom sẽ được đặt ở tọa độ (40, 80)

### Yêu cầu:
1. Sau khi join vào phòng, bot cần tự động lập bản đồ và tìm đường đi trên bản đồ
2. Sử dụng một thuật toán tìm đường hiệu quả để bot có thể di chuyển đến vị trí mong muốn trên bản đồ mà không bị vướng bởi tường hoặc chest
3. Bot cần tự động né bom khi phát hiện bom được đặt trên bản đồ, chú ý đến tầm nổ của bom và thời gian nổ còn lại để tránh bom hiệu quả
4. Bot cần tự động thu thập vật phẩm trên bản đồ để tăng sức mạnh, sau khi thu thập vật phẩm, bot cần cập nhật lại bản đồ và tìm đường đi mới nếu cần thiết