# CodePush Server 密码修改指南

本文档说明如何在 code-push-server 中修改用户（包括管理员）密码。

## 1. 正常渠道：使用 API 修改

如果您知道旧密码，可以通过 API 直接修改。

- **接口**: `PATCH /users/password`
- **参数**:
  - `oldPassword`: 旧密码
  - `newPassword`: 新密码（长度 6-20 位）
- **鉴权**: 需要 Bearer Token (登录状态)

此方法会由服务器验证旧密码并自动处理加密。

## 2. 紧急渠道：忘记密码（修改数据库）

如果您忘记了管理员密码，由于 code-push-server 未提供重置密码的 CLI 命令，您需要直接修改数据库。

### 原理
密码存储在 MySQL 数据库的 `users` 表中，字段为 `password`。
存储格式并非明文，而是经过 `bcrypt` 加密后的 Hash 字符串。因此不能直接在数据库填入明文。

### 操作步骤

#### 第1步：生成新密码的 Hash

在服务器项目根目录（即 `package.json` 所在目录）创建一个临时脚本 `gen-pass.js`：

```javascript
// gen-pass.js
// 运行命令: node gen-pass.js
const bcrypt = require('bcryptjs');

// 这里将 "123456" 替换为您想要的新密码
const newPassword = "123456"; 

// 代码库中固定使用 12 轮 Salt
const salt = bcrypt.genSaltSync(12);
const hash = bcrypt.hashSync(newPassword, salt);

console.log("您的新密码 Hash 为:");
console.log(hash);
```

运行该脚本并复制输出的 Hash 字符串。

#### 第2步：更新数据库

使用数据库管理工具或命令行连接到您的 MySQL：

```sql
-- 将 '生成的Hash字符串' 替换为您上一步得到的字符串
-- 将 'admin@example.com' 替换为您的管理员邮箱
UPDATE users 
SET 
  password = '生成的Hash字符串', 
  ack_code = 'reset' 
WHERE email = 'admin@example.com';
```

> **注意**: `ack_code` 字段用于校验 Token 有效性。修改它可以强制该用户在所有设备下线（使旧 Token 失效），这在重置密码时是推荐的安全操作。

#### 第3步：验证

使用新密码登录系统。
