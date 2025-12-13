# 使用多阶段构建减小镜像大小
FROM node:20-alpine AS base

# 设置工作目录
WORKDIR /app

# ========== 构建时环境变量声明 ==========
# 只声明必须在构建时使用的变量
ARG NODE_ENV=production

# 将 ARG 转换为 ENV，使构建过程能访问这些变量
ENV NODE_ENV=$NODE_ENV

# ⚠️ 重要：移除所有其他 ARG 和 ENV 声明
# 所有与应用配置相关的变量（数据库、API密钥、认证等）
# 都应该在运行时由部署平台动态注入，不应该在构建时硬编码到镜像中

# 复制包管理文件
COPY package.json ./

# 移除 package.json 中的 link: 协议依赖（Docker 不支持）
RUN sed -i '/"8": "link:/d' package.json

# 安装依赖（项目没有 package-lock.json，使用 npm install）
# 使用 --legacy-peer-deps 绕过 peer dependency 冲突
RUN npm install --production=false --legacy-peer-deps

# 复制源代码
COPY . .

# 构建应用（此时环境变量已可用）
RUN npm run build

# 生产阶段
FROM node:20-alpine AS production

# 设置工作目录
WORKDIR /app

# ========== 运行时环境变量声明 ==========
# 所有配置变量都应该在运行时由部署平台注入，不在 Dockerfile 中指定
#
# 🔧 核心配置：
# - NEXT_PUBLIC_DEPLOYMENT_REGION（可选，默认: china）
#   - 不设置 = 国内版（CloudBase）
#   - 设置为 'overseas' = 海外版（Supabase）
#
# 🇨🇳 国内部署需要（默认配置，不设置 DEPLOYMENT_REGION）：
# - NEXT_PUBLIC_WECHAT_CLOUDBASE_ID
# - CLOUDBASE_SECRET_ID
# - CLOUDBASE_SECRET_KEY
# - WECHAT_APP_SECRET
# - WECHAT_PAY_API_V3_KEY（可选）
#
# 🌍 海外部署需要（设置 NEXT_PUBLIC_DEPLOYMENT_REGION=overseas）：
# - NEXT_PUBLIC_DEPLOYMENT_REGION=overseas
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - STRIPE_SECRET_KEY
# - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
#
# 🔐 通用配置：
# - NEXT_PUBLIC_SITE_URL
# - JWT_SECRET
#
# 📥 下载链接配置（可选，默认使用 mornhub.help）：
# - NEXT_PUBLIC_DOWNLOAD_ANDROID_CN / NEXT_PUBLIC_DOWNLOAD_ANDROID_OVERSEAS
# - NEXT_PUBLIC_DOWNLOAD_IOS_CN / NEXT_PUBLIC_DOWNLOAD_IOS_OVERSEAS
# - NEXT_PUBLIC_DOWNLOAD_WINDOWS_CN / NEXT_PUBLIC_DOWNLOAD_WINDOWS_OVERSEAS
# - NEXT_PUBLIC_DOWNLOAD_MACOS_X64_CN / NEXT_PUBLIC_DOWNLOAD_MACOS_X64_OVERSEAS
# - NEXT_PUBLIC_DOWNLOAD_MACOS_ARM64_CN / NEXT_PUBLIC_DOWNLOAD_MACOS_ARM64_OVERSEAS
#
# ⚠️ 关键原则：
# 1. 构建时不硬编码任何配置
# 2. 所有配置在运行时由部署环境提供
# 3. 同一个镜像可以用于国内或海外（通过 DEPLOYMENT_REGION 切换）
# 4. 国内部署更简单：不需要设置 DEPLOYMENT_REGION

ARG PORT=3000
ENV PORT=$PORT

# 从构建阶段复制必要的文件
COPY --from=base /app/package.json ./
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/next.config.mjs ./

# 移除 package.json 中的 link: 协议依赖（Docker 不支持）
RUN sed -i '/"8": "link:/d' package.json

# 安装生产依赖（项目没有 package-lock.json）
RUN npm install --omit=dev --legacy-peer-deps

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 更改文件所有权
RUN chown -R nextjs:nodejs /app
USER nextjs

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]