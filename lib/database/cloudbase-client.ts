/**
 * 腾讯云 CloudBase 数据库客户端
 * 用于官网国内IP用户的数据存储
 */

// 延迟初始化，避免SSR错误
let app: any = null
let db: any = null
let auth: any = null
let initPromise: Promise<any> | null = null

// ========================================
// 改为直接读取环境变量：从 NEXT_PUBLIC_WECHAT_CLOUDBASE_ID 获取 CloudBase ID
// ========================================
async function initCloudBase() {
  if (app) return { app, db, auth } // 已初始化

  // 如果正在初始化中，等待完成
  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    try {
      // 动态导入Node.js SDK，避免客户端构建问题
      const cloudbase = (await import('@cloudbase/node-sdk')).default

      // 直接从环境变量读取 CloudBase ID
      const envId = process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID || 'cloudbase-1gnip2iaa08260e5'

      // 使用Node.js SDK，支持服务器端
      app = cloudbase.init({
        env: envId,
        secretId: process.env.CLOUDBASE_SECRET_ID,
        secretKey: process.env.CLOUDBASE_SECRET_KEY
      })

      db = app.database()
      auth = app.auth()

      console.log('✅ [CloudBase] 初始化成功（环境变量）:', envId)
      return { app, db, auth }
    } catch (error) {
      console.error('❌ [CloudBase] 初始化失败:', error)
      return { app: null, db: null, auth: null }
    }
  })()

  return initPromise
}

// 只在服务器端自动初始化
if (typeof window === 'undefined') {
  initCloudBase()
}

// 导出实例和初始化函数
export { db, auth, initCloudBase }
export default app

// 辅助函数：获取集合引用
export function getCollection(collectionName: string) {
  if (!db) {
    initCloudBase()
  }
  return db?.collection(collectionName)
}

// 官网专用集合名称（带web_前缀）
export const COLLECTIONS = {
  USERS: 'web_users',
  FAVORITES: 'web_favorites',
  CUSTOM_SITES: 'web_custom_sites',
  SUBSCRIPTIONS: 'web_subscriptions',
  PAYMENT_TRANSACTIONS: 'web_payment_transactions'
}

