# Electricity Bill Backend Demo

Backend demo cho app hóa đơn tiền điện + SMS Worker.

## Tech Stack
- Node.js + Express
- MySQL/MariaDB
- JWT Authentication

## Setup

### 1. Clone và cài dependencies
```bash
git clone https://github.com/chienvn102/electricity_bill_backend.git
cd electricity_bill_backend
npm install
```

### 2. Cấu hình database
```bash
# Copy file config
cp .env.example .env

# Sửa .env với credentials của bạn
nano .env
```

### 3. Import database
```bash
mysql -u root -p < database/schema.sql
```

### 4. Cấp quyền MySQL
```sql
CREATE USER 'electricity_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON electricity_db.* TO 'electricity_user'@'localhost';
FLUSH PRIVILEGES;
```

### 5. Chạy server
```bash
npm start        # Production
npm run dev      # Development (nodemon)
```

Server chạy ở port **4002**

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | Đăng nhập |
| POST | `/api/register` | Đăng ký |

### Bills (cần auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bills` | Danh sách hóa đơn |
| GET | `/api/bills?phone=X` | Lọc theo SĐT |
| GET | `/api/bills?month=X` | Lọc theo tháng |
| GET | `/api/bills/:id` | Chi tiết hóa đơn |

### SMS Queue (admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sms/pending` | Lấy 1 SMS pending |
| POST | `/api/sms/report` | Báo kết quả gửi |
| GET | `/api/sms/queue` | Xem hàng đợi |
| POST | `/api/sms/create` | Thêm SMS vào queue |

## Test Accounts
| Phone | Password | Role |
|-------|----------|------|
| `admin` | `123456` | Admin |
| `0982956188` | `123456` | User |

## License
MIT
