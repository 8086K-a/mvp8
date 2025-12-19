/**
 * 数据库统一适配器
 * 根据环境变量自动选择腾讯云或Supabase
 * 提供统一的数据库操作接口
 */

// 动态导入，避免SSR问题
// import { CloudBaseAdapter } from './cloudbase-adapter'
// import { SupabaseAdapter } from './supabase-adapter'

/**
 * 数据库适配器接口
 */
export interface IDatabaseAdapter {
  // 收藏功能
  getFavorites(): Promise<string[]>
  addFavorite(siteId: string): Promise<boolean>
  removeFavorite(siteId: string): Promise<boolean>

  // 自定义网站功能
  getCustomSites(): Promise<any[]>
  addCustomSite(site: any): Promise<boolean>
  removeCustomSite(siteId: string): Promise<boolean>

  // 订阅功能
  getSubscription(): Promise<any | null>
  upsertSubscription(subscription: any): Promise<boolean>

  // 支付功能
  savePaymentTransaction(transaction: any): Promise<boolean>
  updatePaymentStatus(transactionId: string, status: string): Promise<boolean>
  getPaymentTransaction(transactionId: string): Promise<any | null>
}

/**
 * 创建数据库适配器工厂函数
 *
 * @param isChina - 是否国内版部署（从环境变量读取，保持向后兼容）
 * @param userId - 用户ID
 * @returns 数据库适配器实例
 */
export async function createDatabaseAdapter(
  isChina: boolean,
  userId: string
): Promise<IDatabaseAdapter> {
  if (isChina) {
    console.log('🇨🇳 [DB] 使用腾讯云数据库（国内版）')
    const { CloudBaseAdapter } = await import('./cloudbase-adapter')
    return new CloudBaseAdapter(userId)
  } else {
    console.log('🌍 [DB] 使用Supabase数据库（海外版）')
    const { SupabaseAdapter } = await import('./supabase-adapter')
    return new SupabaseAdapter(userId)
  }
}

/**
 * 获取数据库名称（用于日志）
 */
export function getDatabaseName(isChina: boolean): string {
  return isChina ? '腾讯云CloudBase' : 'Supabase'
}

/**
 * 获取用户所在数据库的类型
 */
export function getDatabaseType(isChina: boolean): 'cloudbase' | 'supabase' {
  return isChina ? 'cloudbase' : 'supabase'
}

