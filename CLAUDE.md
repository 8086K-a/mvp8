# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SiteHub is a Next.js web application providing access to 300+ websites with user authentication and data persistence. The app uses **environment variable-based deployment** to serve different regions: China (CloudBase), overseas (Supabase). IP detection is only used to block European users for GDPR compliance.

## Development Commands

### Core Commands
```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Package Manager
This project uses **npm** (not pnpm despite README.md claiming otherwise - see package.json scripts).

## Architecture

### Environment-Based Multi-Region System

The application deploys in two modes controlled by `NEXT_PUBLIC_DEPLOYMENT_REGION` environment variable:

1. **China Deployment** (`NEXT_PUBLIC_DEPLOYMENT_REGION=china`)
   - Auth: Tencent CloudBase (`web_users` collection)
   - Database: CloudBase adapter
   - Payment: WeChat Pay, Alipay
   - API: `/api/auth-cn` (Pages Router), `/api/auth/email` (App Router)
   - Language: Chinese (zh-CN)
   - Currency: CNY

2. **Overseas Deployment** (`NEXT_PUBLIC_DEPLOYMENT_REGION=overseas`)
   - Auth: Supabase (`auth.users` table)
   - Database: Supabase adapter
   - Payment: Stripe, PayPal
   - API: `/api/auth/email` (App Router)
   - Language: English (en-US)
   - Currency: USD

3. **Europe Blocking** (`isEurope = true` from IP detection)
   - IP detection runs on both deployments
   - Blocks European IPs with `/blocked/europe` page
   - GDPR compliance measure

**Key Files:**
- `contexts/geo-context.tsx` - Reads deployment region from env, detects Europe IPs
- `app/api/geo/detect/route.ts` - IP detection API (Europe blocking only)
- `app/api/auth/email/route.ts` - Environment-based auth routing
- `lib/database/adapter.ts` - Factory pattern for DB selection
- `lib/auth-client-cn.ts` - China-specific auth client

### Database Architecture

**Adapter Pattern:** `lib/database/adapter.ts` provides `createDatabaseAdapter(isChina, userId)` which returns either:
- `CloudBaseAdapter` - Tencent CloudBase (China deployment)
- `SupabaseAdapter` - Supabase (Overseas deployment)

The `isChina` parameter is derived from `NEXT_PUBLIC_DEPLOYMENT_REGION` environment variable.

Both implement `IDatabaseAdapter` interface with methods:
- `getFavorites()`, `addFavorite()`, `removeFavorite()`
- `getCustomSites()`, `addCustomSite()`, `removeCustomSite()`
- `getSubscription()`, `upsertSubscription()`

**CloudBase Schema (`web_users` collection):**
```typescript
{
  _id: string,              // Auto-generated
  email: string,
  password: string,         // bcrypt hashed
  name: string,
  pro: boolean,
  region: 'china',
  createdAt: string,        // ISO 8601
  updatedAt: string
}
```

**Supabase:** Uses built-in `auth.users` with custom `user_metadata.region = 'overseas'`.

### Authentication Flow

**China Deployment:**
1. Frontend calls `/api/auth-cn` (Pages Router) or `/api/auth/email` (App Router)
2. API reads `NEXT_PUBLIC_DEPLOYMENT_REGION=china` and uses CloudBase
3. CloudBase Node.js SDK queries `web_users` collection
4. Returns JWT token (7 days for free, 30 days for pro)
5. Frontend stores token in `localStorage` as `user_token`

**Overseas Deployment:**
1. Frontend calls `/api/auth/email` (App Router)
2. API reads `NEXT_PUBLIC_DEPLOYMENT_REGION=overseas` and uses Supabase
3. Supabase Auth handles `signUp()` or `signInWithPassword()`
4. User metadata includes `region: 'overseas'`

**Session Management:**
- JWT tokens stored in `localStorage.user_token`
- User info in `localStorage.user_info`
- Context: `contexts/auth-context.tsx`

### API Routes

**App Router (`app/api/`):**
- `auth/email/route.ts` - Environment-based email auth (reads DEPLOYMENT_REGION)
- `auth/wechat/route.ts`, `auth/wechat/callback/route.ts` - WeChat OAuth
- `geo/detect/route.ts` - IP geolocation (Europe blocking only)
- `payment/stripe/*` - Stripe integration
- `payment/paypal/*` - PayPal integration
- `payment/wechat/*`, `payment/alipay/*` - China payments

**Pages Router (`pages/api/`):**
- `auth-cn.ts` - Direct CloudBase auth (legacy, China deployment only)

### Payment Integration

**China:**
- WeChat Pay: `app/api/payment/wechat/`
- Alipay: `app/api/payment/alipay/`

**Overseas:**
- Stripe: `app/api/payment/stripe/` (primary)
- PayPal: `app/api/payment/paypal/` (secondary)

**Payment Page:** `app/payment/page.tsx` - Environment-aware, shows appropriate payment methods.

### Context Providers

Located in `contexts/`:
- `geo-context.tsx` - Reads deployment region from env, detects Europe IPs for blocking
- `auth-context.tsx` - User authentication state
- `language-context.tsx` - i18n support (Chinese/English)
- `settings-context.tsx` - User preferences

### Internationalization

**Structure:** `lib/i18n/`
- `auth-zh.ts`, `auth-en.ts` - Auth UI translations
- `payment-zh.ts`, `payment-en.ts` - Payment UI translations
- `home-ui.ts` - Home page translations

**Usage:** Language context auto-detects based on deployment region from `NEXT_PUBLIC_DEPLOYMENT_REGION`.

## Important Constraints

### Deployment Region Control
- **Region is controlled by `NEXT_PUBLIC_DEPLOYMENT_REGION` environment variable**
- **Default: `china`** (国内版，不设置此变量即为国内版)
- Only set `NEXT_PUBLIC_DEPLOYMENT_REGION=overseas` for overseas deployment
- IP detection is **ONLY** used to block European users (GDPR compliance)
- **DO NOT use IP detection for region switching** - use environment variable instead

### Environment Variables Required
```
# ============================================
# Deployment Region (可选，默认为国内版)
# ============================================
# 不设置此变量 = 国内版（CloudBase + 微信/支付宝）
# NEXT_PUBLIC_DEPLOYMENT_REGION=overseas     # 仅海外版需要设置

# CloudBase (国内部署，默认配置)
NEXT_PUBLIC_WECHAT_CLOUDBASE_ID=
CLOUDBASE_SECRET_ID=
CLOUDBASE_SECRET_KEY=

# Supabase (海外部署，需要设置 DEPLOYMENT_REGION=overseas)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Auth
JWT_SECRET=

# Payments (根据部署区域选择)
STRIPE_SECRET_KEY=                           # 海外版
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=          # 海外版
WECHAT_PAY_API_V3_KEY=                       # 国内版
```

### WeChat Integration
- WeChat OAuth: `lib/wechat-auth.ts`, `lib/adapters/wechat-web.ts`
- Uses `@cloudbase/js-sdk` and `wechat-oauth` packages
- Requires WeChat Official Account setup

## Code Patterns

### Environment-Aware Components
Check `isChina` from `GeoContext` (reads from env) before rendering region-specific UI:
```typescript
const { isChina, isEurope } = useGeo()
if (isEurope) return <EuropeBlocked />  // IP-based blocking
// isChina comes from NEXT_PUBLIC_DEPLOYMENT_REGION
```

### Database Operations
Use adapter factory pattern with `isChina` from context:
```typescript
const { isChina } = useGeo()
const adapter = await createDatabaseAdapter(isChina, userId)
const favorites = await adapter.getFavorites()
```

### API Route Pattern
Read deployment region from environment variable:
```typescript
const DEPLOYMENT_REGION = process.env.NEXT_PUBLIC_DEPLOYMENT_REGION || 'overseas'
const IS_CHINA_DEPLOYMENT = DEPLOYMENT_REGION === 'china'

if (IS_CHINA_DEPLOYMENT) {
  // CloudBase logic
} else {
  // Supabase logic
}
```

## Testing Notes

- **China Version (Default):** 不设置 `NEXT_PUBLIC_DEPLOYMENT_REGION`，或留空 `.env.local`
- **Overseas Version:** Set `NEXT_PUBLIC_DEPLOYMENT_REGION=overseas` in `.env.local`
- **Europe Blocking:** Works on both deployments via IP detection
- **Session Expiry:** Guest mode has 10-minute timeout (see README)
- **Payment Testing:** Use Stripe/PayPal test mode, WeChat/Alipay sandbox

## Deployment Guide

### China Deployment (Tencent Cloud) - 默认配置
1. **不需要设置** `NEXT_PUBLIC_DEPLOYMENT_REGION`（默认即为国内版）
2. Configure CloudBase credentials
3. Deploy to Tencent Cloud, Vercel, or Docker

**Docker 部署示例（国内版）：**
```bash
docker build -t sitehub .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_WECHAT_CLOUDBASE_ID=your_id \
  -e CLOUDBASE_SECRET_ID=your_secret_id \
  -e CLOUDBASE_SECRET_KEY=your_secret_key \
  -e JWT_SECRET=your_jwt_secret \
  sitehub
```

### Overseas Deployment (Vercel/AWS)
1. Set environment variable: `NEXT_PUBLIC_DEPLOYMENT_REGION=overseas`
2. Configure Supabase credentials
3. Deploy to Vercel, AWS, or any global CDN

**Docker 部署示例（海外版）：**
```bash
docker build -t sitehub .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_DEPLOYMENT_REGION=overseas \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  -e JWT_SECRET=your_jwt_secret \
  -e STRIPE_SECRET_KEY=your_stripe_key \
  sitehub
```

## Known Issues

- Project uses npm but README claims pnpm
- Backup payment implementations in `backup/payments-stripe-paypal/` (legacy)
- Multiple documentation files in root (see `lib/DEPLOYMENT-CLEANUP-COMPLETE.md` for production readiness)
