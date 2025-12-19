# Lib 目录文档

本目录包含了 MVP 24 项目的核心库和工具函数，提供了完整的全栈应用开发所需的各种功能模块。

## 📁 目录结构

### 🤖 AI 模块 (`/ai`)
AI 集成和智能代理系统

**主要文件：**
- `adapter.ts` - AI 提供商适配器
- `ais.ts` - AI 服务主入口
- `router.ts` - AI 请求路由
- `multi-agent-orchestrator.ts` - 多代理协调器
- `token-counter.ts` - Token 计数器
- `types.ts` - AI 类型定义
- `ai-config-manager.ts` - AI 配置管理器
- `china-ai.config.ts` - 中国地区 AI 配置
- `global-ai.config.ts` - 全球地区 AI 配置

**功能特性：**
- 支持多种 AI 提供商（OpenAI、Anthropic 等）
- 统一的消息接口和响应格式
- Token 使用量追踪
- 地区化 AI 配置
- 多代理编排能力

---

### 🔐 认证模块 (`/auth`)
用户认证和授权系统

**主要文件：**
- `auth.ts` - 核心认证逻辑
- `adapter.ts` - 认证适配器接口
- `adapter-cloudbase.ts` - CloudBase 认证适配器
- `adapter-simple.ts` - 简单认证适配器
- `client.ts` / `client-auth.ts` - 客户端认证
- `cloudbase-auth.ts` - CloudBase 认证实现
- `session-manager.ts` - 会话管理
- `refresh-token-manager.ts` - 刷新令牌管理
- `frontend-token-manager.ts` - 前端令牌管理
- `auth-token-preloader.ts` - 令牌预加载
- `auth-state-manager.ts` - 认证状态管理
- `auth-state-manager-intl.ts` - 国际化认证状态管理
- `auth-utils.ts` - 认证工具函数

**功能特性：**
- 多平台认证支持（Supabase、CloudBase）
- JWT Token 管理
- 会话持久化
- 自动令牌刷新
- 地区化认证策略
- 认证状态同步

---

### ☁️ CloudBase 模块 (`/cloudbase`)
腾讯云 CloudBase 集成

**主要文件：**
- `adapter.ts` - CloudBase 适配器
- `auth-api.ts` - CloudBase 认证 API

**功能特性：**
- CloudBase SDK 封装
- 云函数调用
- 云数据库操作
- 中国地区特化支持

---

### 🗄️ 数据库模块 (`/database`)
数据库抽象层和适配器

**主要文件：**
- `adapter.ts` - 数据库适配器接口
- `cloudbase-db.ts` - CloudBase 数据库实现
- `cloudbase-schema.ts` - CloudBase 数据库 Schema

**功能特性：**
- 统一的数据库接口
- 多数据库支持（Supabase、CloudBase、MySQL）
- Schema 定义和管理
- 数据库迁移支持

---

### 💳 支付模块 (`/payment`)
多平台支付集成

**主要文件：**
- `adapter.ts` - 支付适配器接口
- `init.ts` - 支付初始化
- `payment-config.ts` - 支付配置（定价、货币等）
- `webhook-handler.ts` - 支付 Webhook 处理

**支持的支付方式：**
- Stripe（国际支付）
- PayPal（国际支付）
- 支付宝（Alipay）
- 微信支付（WeChat Pay）

**功能特性：**
- 统一的支付接口
- 多货币支持（CNY、USD）
- 订阅管理（月付、年付）
- Webhook 事件处理
- 支付状态追踪

---

### 🔒 安全模块 (`/security`)
应用安全和防护

**主要文件：**
- `rate-limit.ts` - 速率限制
- `csrf.ts` - CSRF 防护
- `password-security.ts` - 密码安全
- `account-lockout.ts` - 账户锁定

**功能特性：**
- API 速率限制
- CSRF Token 验证
- 密码强度检查
- 暴力破解防护
- 账户自动锁定

---

### 📊 监控模块 (`/monitoring`)
系统健康检查和监控

**主要文件：**
- `health.ts` - 健康检查
- `startup-checks.ts` - 启动检查

**功能特性：**
- 系统健康状态监控
- 依赖服务检查
- 启动时配置验证
- 错误追踪

---

### 💬 微信模块 (`/wechat`)
微信生态集成

**主要文件：**
- `oauth.ts` - 微信 OAuth 认证
- `qrcode-generator.ts` - 二维码生成
- `token-exchange.ts` - Token 交换

**功能特性：**
- 微信登录
- 微信支付集成
- 二维码登录
- 微信小程序支持

---

### 🔌 集成模块 (`/integrations`)
第三方服务集成

**主要文件：**
- `supabase.ts` - Supabase 客户端
- `supabase-admin.ts` - Supabase 管理端
- `sentry.ts` - Sentry 错误追踪
- `platform-detection.ts` - 平台检测

**功能特性：**
- Supabase 认证和数据库
- Sentry 错误监控
- 平台和地区检测

---

### 🛠️ 工具模块 (`/utils`)
通用工具函数

**主要文件：**
- `utils.ts` - 通用工具函数
- `logger.ts` - 日志工具
- `templates.ts` - 模板引擎
- `token-normalizer.ts` - Token 标准化

**功能特性：**
- 日志记录
- 字符串处理
- 日期格式化
- 数据转换

---

### ✅ 验证模块 (`/validation`)
数据验证和环境变量验证

**主要文件：**
- `api-validation.ts` - API 参数验证
- `env-validation.ts` - 环境变量验证

**功能特性：**
- Zod Schema 验证
- 请求参数校验
- 环境变量类型检查
- 配置完整性验证

---

### 🧩 其他模块

#### `/config` - 配置管理
应用配置和环境变量管理

#### `/types` - TypeScript 类型定义
全局类型定义和接口

#### `/models` - 数据模型
业务数据模型定义

#### `/hooks` - React Hooks
自定义 React Hooks

#### `/i18n` - 国际化
多语言支持

#### `/examples` - 示例代码
使用示例和最佳实践

#### `/usage` - 使用统计
API 使用量追踪

#### `/architecture-modules` - 架构模块
应用架构和设计模式

---

## 🚀 技术栈

### 核心技术
- **Next.js 15** - React 全栈框架
- **TypeScript** - 类型安全
- **React 19** - UI 库

### 数据库
- **Supabase** - PostgreSQL 数据库（国际版）
- **CloudBase** - 腾讯云数据库（中国版）
- **MySQL** - 关系型数据库

### AI 集成
- **OpenAI** - GPT 模型
- **Anthropic** - Claude 模型
- 国内 AI 服务商支持

### 认证
- **Supabase Auth** - 国际版认证
- **CloudBase Auth** - 中国版认证
- **JWT** - Token 认证

### 支付
- **Stripe** - 国际信用卡支付
- **PayPal** - 国际支付
- **支付宝** - 中国支付
- **微信支付** - 中国支付

### UI 组件
- **Radix UI** - 无障碍 UI 组件
- **Tailwind CSS** - 样式框架
- **Lucide Icons** - 图标库

### 开发工具
- **Jest** - 单元测试
- **ESLint** - 代码检查
- **Prettier** - 代码格式化

---

## 🌍 地区化支持

本项目支持全球和中国两个地区的不同服务：

| 功能 | 全球版 | 中国版 |
|------|--------|--------|
| 数据库 | Supabase | CloudBase |
| 认证 | Supabase Auth | CloudBase Auth |
| AI | OpenAI, Anthropic | 国内 AI 服务 |
| 支付 | Stripe, PayPal | 支付宝, 微信支付 |
| 存储 | Supabase Storage | CloudBase Storage |

---

## 📖 使用指南

### 安装依赖

```bash
npm install
```

### 环境变量配置

复制 `.env.example` 到 `.env.local` 并配置必要的环境变量：

```bash
# Supabase（国际版）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# CloudBase（中国版）
CLOUDBASE_ENV_ID=your_cloudbase_env_id
CLOUDBASE_SECRET_ID=your_cloudbase_secret_id
CLOUDBASE_SECRET_KEY=your_cloudbase_secret_key

# AI 配置
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# 支付配置
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

### 开发

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 测试

```bash
npm test
```

---

## 🏗️ 架构设计

### 适配器模式

项目大量使用适配器模式来支持多平台：

```typescript
// 认证适配器示例
interface AuthAdapter {
  signIn(credentials: Credentials): Promise<User>;
  signOut(): Promise<void>;
  getUser(): Promise<User | null>;
}

// Supabase 实现
class SupabaseAuthAdapter implements AuthAdapter { ... }

// CloudBase 实现
class CloudBaseAuthAdapter implements AuthAdapter { ... }
```

### 配置管理

使用集中式配置管理，根据地区自动选择：

```typescript
import { isChinaRegion } from './config/region';

const config = isChinaRegion()
  ? require('./china-config')
  : require('./global-config');
```

### 类型安全

所有模块都有完整的 TypeScript 类型定义：

```typescript
// AI 类型示例
export interface AIMessage {
  role: MessageRole;
  content: string;
  name?: string;
}

export interface AIResponse {
  content: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
}
```

---

## 🔧 开发规范

### 代码组织

- 每个模块独立目录
- 统一的接口定义（`adapter.ts`）
- 类型定义文件（`types.ts`）
- 配置文件单独管理

### 命名规范

- 文件名：kebab-case（如 `auth-utils.ts`）
- 接口：PascalCase + Interface（如 `AuthAdapter`）
- 函数：camelCase（如 `signIn`）
- 常量：UPPER_SNAKE_CASE（如 `API_BASE_URL`）

### 错误处理

```typescript
try {
  const result = await operation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  throw new Error('User-friendly error message');
}
```

### 异步操作

优先使用 `async/await`，避免 callback hell：

```typescript
async function fetchUserData(userId: string) {
  const user = await getUser(userId);
  const posts = await getUserPosts(userId);
  return { user, posts };
}
```

---

## 🧪 测试

### 单元测试

```bash
npm test
```

### 测试覆盖率

```bash
npm test -- --coverage
```

### E2E 测试

```bash
npm run test:e2e
```

---

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📝 许可证

本项目采用私有许可证。

---

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件
- 项目讨论区

---

## 🎯 路线图

### 已完成
- ✅ 多地区支持（全球/中国）
- ✅ 多种认证方式
- ✅ 多支付平台集成
- ✅ AI 服务集成
- ✅ 安全防护机制

### 进行中
- 🚧 性能优化
- 🚧 测试覆盖率提升
- 🚧 文档完善

### 计划中
- 📋 更多 AI 模型支持
- 📋 移动端优化
- 📋 PWA 支持
- 📋 实时通信功能

---

**更新时间：** 2024-12

**版本：** 0.1.0
