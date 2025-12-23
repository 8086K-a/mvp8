/**
 * 腾讯云 CloudBase 数据库适配器
 * 用于官网国内IP用户的数据存储
 */

// CloudBase集合名称（硬编码避免动态导入问题）
const COLLECTIONS = {
  USERS: 'web_users',
  FAVORITES: 'web_favorites',
  CUSTOM_SITES: 'web_custom_sites',
  SUBSCRIPTIONS: 'web_subscriptions',
  PAYMENT_TRANSACTIONS: 'web_payment_transactions'
}

/**
 * CloudBase适配器类
 */
export class CloudBaseAdapter {
  private userId: string
  private db: any

  constructor(userId: string) {
    this.userId = userId
    // 数据库实例将在第一次使用时初始化
    this.db = null
  }

  // 辅助方法：安全获取db实例和集合
  private getDb() {
    // 只在服务器端初始化数据库
    if (typeof window !== 'undefined') {
      console.warn('⚠️ [CloudBase] 客户端不支持数据库操作')
      return null
    }

    if (!this.db) {
      // 服务器端直接初始化（只在运行时，不在构建时）
      try {
        // 使用require而不是import，避免webpack处理
        const cloudbase = eval('require')('@cloudbase/node-sdk')
        const envId = process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID || 'cloudbase-1gnip2iaa08260e5'

        const app = cloudbase.init({
          env: envId,
          secretId: process.env.CLOUDBASE_SECRET_ID,
          secretKey: process.env.CLOUDBASE_SECRET_KEY
        })

        this.db = app.database()
        console.log('✅ [CloudBase] 数据库实例初始化成功')
      } catch (error) {
        console.error('❌ [CloudBase] 获取数据库实例失败:', error)
        return null
      }
    }
    return this.db
  }

  // ==========================================
  // 收藏功能
  // ==========================================

  async getFavorites(): Promise<string[]> {
    // 客户端环境不支持数据库操作
    if (typeof window !== 'undefined') {
      console.warn('⚠️ [DB-腾讯云] 客户端不支持数据库操作')
      return []
    }

    try {
      const database = this.getDb()
      if (!database) {
        console.warn('⚠️ [DB-腾讯云] 数据库未初始化')
        return []
      }

      const res = await database.collection(COLLECTIONS.FAVORITES)
        .where({ user_id: this.userId })
        .get()

      console.log('✅ [DB-腾讯云] 获取收藏:', res.data.length)
      return res.data.map((f: any) => f.site_id)
    } catch (error) {
      console.error('❌ [DB-腾讯云] 获取收藏失败:', error)
      return []
    }
  }

  async addFavorite(siteId: string): Promise<boolean> {
    // 客户端环境不支持数据库操作
    if (typeof window !== 'undefined') {
      console.warn('⚠️ [DB-腾讯云] 客户端不支持数据库操作')
      return false
    }

    try {
      const database = this.getDb()
      if (!database) {
        console.warn('⚠️ [DB-腾讯云] 数据库未初始化')
        return false
      }

      await database.collection(COLLECTIONS.FAVORITES).add({
        user_id: this.userId,
        site_id: siteId,
        created_at: new Date()
      })

      console.log('✅ [DB-腾讯云] 添加收藏成功:', siteId)
      return true
    } catch (error) {
      console.error('❌ [DB-腾讯云] 添加收藏失败:', error)
      return false
    }
  }

  async removeFavorite(siteId: string): Promise<boolean> {
    try {
      const database = await this.getDb()
      if (!database) {
        console.warn('⚠️ [DB-腾讯云] 数据库未初始化')
        return false
      }

      await database.collection(COLLECTIONS.FAVORITES)
        .where({
          user_id: this.userId,
          site_id: siteId
        })
        .remove()

      console.log('✅ [DB-腾讯云] 删除收藏成功:', siteId)
      return true
    } catch (error) {
      console.error('❌ [DB-腾讯云] 删除收藏失败:', error)
      return false
    }
  }

  // ==========================================
  // 自定义网站功能
  // ==========================================

  async getCustomSites(): Promise<any[]> {
    try {
      const database = await this.getDb()
      if (!database) {
        console.warn('⚠️ [DB-腾讯云] 数据库未初始化')
        return []
      }

      const res = await database.collection(COLLECTIONS.CUSTOM_SITES)
        .where({ user_id: this.userId })
        .orderBy('created_at', 'desc')
        .get()

      console.log('✅ [DB-腾讯云] 获取自定义网站:', res.data.length)
      return res.data
    } catch (error) {
      console.error('❌ [DB-腾讯云] 获取自定义网站失败:', error)
      return []
    }
  }

  async addCustomSite(site: any): Promise<boolean> {
    try {
      const database = await this.getDb()
      if (!database) {
        console.warn('⚠️ [DB-腾讯云] 数据库未初始化')
        return false
      }

      await database.collection(COLLECTIONS.CUSTOM_SITES).add({
        user_id: this.userId,
        name: site.name,
        url: site.url,
        logo: site.logo,
        category: site.category,
        description: site.description || '',
        created_at: new Date(),
        updated_at: new Date()
      })

      console.log('✅ [DB-腾讯云] 添加自定义网站成功')
      return true
    } catch (error) {
      console.error('❌ [DB-腾讯云] 添加自定义网站失败:', error)
      return false
    }
  }

  async removeCustomSite(siteId: string): Promise<boolean> {
    try {
      const database = await this.getDb()
      if (!database) {
        console.warn('⚠️ [DB-腾讯云] 数据库未初始化')
        return false
      }

      await database.collection(COLLECTIONS.CUSTOM_SITES)
        .doc(siteId)
        .remove()

      console.log('✅ [DB-腾讯云] 删除自定义网站成功')
      return true
    } catch (error) {
      console.error('❌ [DB-腾讯云] 删除自定义网站失败:', error)
      return false
    }
  }

  // ==========================================
  // 订阅功能
  // ==========================================

  async getSubscription(): Promise<any | null> {
    // 客户端环境不支持数据库操作
    if (typeof window !== 'undefined') {
      console.warn('⚠️ [DB-腾讯云] 客户端不支持数据库操作')
      return null
    }

    try {
      const database = this.getDb()
      if (!database) {
        console.warn('⚠️ [DB-腾讯云] 数据库未初始化')
        return null
      }

      const res = await database.collection(COLLECTIONS.SUBSCRIPTIONS)
        .where({ user_id: this.userId })
        .get()

      console.log('✅ [DB-腾讯云] 获取订阅:', res.data.length > 0 ? '已订阅' : '未订阅')
      return res.data.length > 0 ? res.data[0] : null
    } catch (error) {
      console.error('❌ [DB-腾讯云] 获取订阅失败:', error)
      return null
    }
  }

  async upsertSubscription(subscription: any): Promise<boolean> {
    // 客户端环境不支持数据库操作
    if (typeof window !== 'undefined') {
      console.warn('⚠️ [DB-腾讯云] 客户端不支持数据库操作')
      return false
    }

    try {
      console.log('🔄 [DB-腾讯云] 开始更新订阅，用户ID:', this.userId)
      console.log('📋 [DB-腾讯云] 订阅数据:', subscription)

      const database = this.getDb()
      if (!database) {
        console.warn('⚠️ [DB-腾讯云] 数据库未初始化')
        return false
      }

      console.log('📊 [DB-腾讯云] 集合名称:', COLLECTIONS.SUBSCRIPTIONS)

      const result = await database.collection(COLLECTIONS.SUBSCRIPTIONS).add({
        user_id: this.userId,
        ...subscription,
        created_at: new Date(),
        updated_at: new Date()
      })

      console.log('✅ [DB-腾讯云] 订阅创建成功，记录ID:', result.id)
      return true
    } catch (error) {
      console.error('❌ [DB-腾讯云] 更新订阅失败:', error)
      console.error('❌ [DB-腾讯云] 错误详情:', {
        message: error.message,
        code: error.code,
        requestId: error.requestId,
        userId: this.userId
      })
      return false
    }
  }

  // ==========================================
  // 支付功能
  // ==========================================

  async savePaymentTransaction(transaction: any): Promise<boolean> {
    // 客户端环境不支持数据库操作
    if (typeof window !== 'undefined') {
      console.warn('⚠️ [DB-腾讯云] 客户端不支持数据库操作')
      return false
    }

    try {
      const database = this.getDb()
      if (!database) {
        console.warn('⚠️ [DB-腾讯云] 数据库未初始化')
        return false
      }

      // CloudBase字段结构
      const cloudbaseTransaction = {
        user_id: this.userId,
        product_name: transaction.product_name || 'sitehub',
        plan_type: transaction.plan_type,
        billing_cycle: transaction.billing_cycle,
        payment_method: transaction.payment_method,
        payment_status: transaction.payment_status || 'pending',
        transaction_type: transaction.transaction_type || 'purchase',
        currency: transaction.currency || 'CNY',
        gross_amount: transaction.gross_amount,
        payment_fee: transaction.payment_fee || 0,
        net_amount: transaction.net_amount || transaction.gross_amount,
        profit: transaction.profit || transaction.net_amount,
        transaction_id: transaction.transaction_id,
        payment_time: transaction.payment_time || new Date().toISOString()
      }

      await database.collection(COLLECTIONS.PAYMENT_TRANSACTIONS).add(cloudbaseTransaction)

      console.log('✅ [DB-腾讯云] 保存支付记录成功:', transaction.transaction_id)
      return true
    } catch (error) {
      console.error('❌ [DB-腾讯云] 保存支付记录失败:', error)
      return false
    }
  }

  async updatePaymentStatus(transactionId: string, status: string): Promise<boolean> {
    try {
      const database = await this.getDb()
      if (!database) {
        console.warn('⚠️ [DB-腾讯云] 数据库未初始化')
        return false
      }

      await database.collection(COLLECTIONS.PAYMENT_TRANSACTIONS)
        .where({ transaction_id: transactionId })
        .update({
          payment_status: status,
          updated_at: new Date()
        })

      console.log('✅ [DB-腾讯云] 更新支付状态成功:', transactionId, status)
      return true
    } catch (error) {
      console.error('❌ [DB-腾讯云] 更新支付状态失败:', error)
      return false
    }
  }

  async getPaymentTransaction(transactionId: string): Promise<any | null> {
    // 客户端环境不支持数据库操作
    if (typeof window !== 'undefined') {
      console.warn('⚠️ [DB-腾讯云] 客户端不支持数据库操作')
      return null
    }

    try {
      const database = this.getDb()
      if (!database) {
        console.warn('⚠️ [DB-腾讯云] 数据库未初始化')
        return null
      }

      const res = await database.collection(COLLECTIONS.PAYMENT_TRANSACTIONS)
        .where({ transaction_id: transactionId })
        .get()

      console.log('✅ [DB-腾讯云] 获取支付记录:', res.data.length > 0 ? '找到' : '未找到')
      return res.data.length > 0 ? res.data[0] : null
    } catch (error) {
      console.error('❌ [DB-腾讯云] 获取支付记录失败:', error)
      return null
    }
  }

  async getSubscription(): Promise<any | null> {
    try {
      const database = await this.getDb()
      if (!database) {
        console.warn('⚠️ [DB-腾讯云] 数据库未初始化')
        return null
      }

      const res = await database.collection(COLLECTIONS.SUBSCRIPTIONS)
        .where({ user_id: this.userId })
        .orderBy('created_at', 'desc')
        .limit(1)
        .get()

      const subscription = res.data[0] || null
      console.log('✅ [DB-腾讯云] 获取订阅状态:', subscription ? '有订阅' : '无订阅')
      return subscription
    } catch (error) {
      console.error('❌ [DB-腾讯云] 获取订阅失败:', error)
      return null
    }
  }

  async upsertSubscription(subscription: any): Promise<boolean> {
    // 客户端环境不支持数据库操作
    if (typeof window !== 'undefined') {
      console.warn('⚠️ [DB-腾讯云] 客户端不支持数据库操作')
      return false
    }

    try {
      const database = this.getDb()
      if (!database) {
        console.warn('⚠️ [DB-腾讯云] 数据库未初始化')
        return false
      }

      // 先查询是否存在
      const existing = await this.getSubscription()

      if (existing && existing._id) {
        // 更新现有订阅
        await database.collection(COLLECTIONS.SUBSCRIPTIONS)
          .doc(existing._id)
          .update({
            ...subscription,
            updated_at: new Date().toISOString()
          })
      } else {
        // 创建新订阅
        await database.collection(COLLECTIONS.SUBSCRIPTIONS).add({
          user_id: this.userId,
          ...subscription,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }

      console.log('✅ [DB-腾讯云] 更新订阅成功')
      return true
    } catch (error) {
      console.error('❌ [DB-腾讯云] 更新订阅失败:', error)
      return false
    }
  }

  /**
   * 更新用户的 Pro 会员状态
   */
  async setUserProStatus(isPro: boolean): Promise<boolean> {
    // 客户端环境不支持数据库操作
    if (typeof window !== 'undefined') {
      console.warn('⚠️ [DB-腾讯云] 客户端不支持数据库操作')
      return false
    }

    try {
      const database = this.getDb()
      if (!database) {
        console.warn('⚠️ [DB-腾讯云] 数据库未初始化')
        return false
      }

      console.log(`🔄 [DB-腾讯云] 更新用户 ${this.userId} 的 Pro 状态为: ${isPro}`)

      await database.collection(COLLECTIONS.USERS)
        .doc(this.userId)
        .update({
          pro: isPro,
          is_pro: isPro,
          updated_at: new Date().toISOString()
        })

      console.log('✅ [DB-腾讯云] 用户 Pro 状态更新成功')
      return true
    } catch (error) {
      console.error('❌ [DB-腾讯云] 更新用户 Pro 状态失败:', error)
      return false
    }
  }
}

