import { NextRequest, NextResponse } from 'next/server'
import { CloudBaseAdapter } from '@/lib/database/cloudbase-adapter'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      )
    }

    console.log('🔄 [User Status Refresh] 开始刷新用户状态:', userId)

    // 地区检测
    const DEPLOYMENT_REGION = process.env.NEXT_PUBLIC_DEPLOYMENT_REGION || 'china'
    const IS_CHINA_DEPLOYMENT = DEPLOYMENT_REGION === 'china'

    if (IS_CHINA_DEPLOYMENT) {
      const adapter = new CloudBaseAdapter(userId)

      // 检查用户是否有活跃订阅
      const subscription = await adapter.getSubscription()
      const hasActiveSubscription = subscription && subscription.status === 'active'

      console.log('📊 [User Status Refresh] 订阅状态:', hasActiveSubscription ? '会员' : '免费')

      return NextResponse.json({
        success: true,
        pro: hasActiveSubscription,
        subscription: subscription
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Unsupported deployment region'
    }, { status: 400 })

  } catch (error) {
    console.error('❌ [User Status Refresh] 刷新失败:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}



