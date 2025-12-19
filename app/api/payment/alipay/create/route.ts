import { NextRequest, NextResponse } from 'next/server'
import { AlipaySdk } from 'alipay-sdk'
import { createClient } from '@supabase/supabase-js'
import { createDatabaseAdapter } from '@/lib/database/adapter'
import { CloudBaseAdapter } from '@/lib/database/cloudbase-adapter'
import { SupabaseAdapter } from '@/lib/database/supabase-adapter'

// 支付宝支付配置 - 只支持公钥模式
const alipayConfig = {
  appId: process.env.ALIPAY_APP_ID,
  privateKey: process.env.ALIPAY_PRIVATE_KEY,
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY,
  gateway: process.env.ALIPAY_GATEWAY,
  signType: 'RSA2',
  charset: 'utf-8',
  version: '1.0',
  timeout: 30000,
  camelcase: false, // 使用下划线命名
}

// 定价配置（与 Stripe/PayPal 保持一致）
const pricingConfig = {
  pro: {
    monthly: 19.99, // 正式价格 $19.99/月
    yearly: 168,   // 正式价格 $168/年
  },
  team: {
    monthly: 299.99, // 正式价格 $299.99/月
    yearly: 2520,  // 正式价格 $2520/年
  },
}

// 汇率配置（美元转人民币，假设汇率 1 USD = 7.2 CNY）
const USD_TO_CNY_RATE = 7.2

// 地区检测
const DEPLOYMENT_REGION = process.env.NEXT_PUBLIC_DEPLOYMENT_REGION || 'china'
const IS_CHINA_DEPLOYMENT = DEPLOYMENT_REGION === 'china'

// 生成唯一的支付ID（与mvp_modules-main保持一致）
function generatePaymentId(): string {
  return `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function POST(req: NextRequest) {
  try {
    console.log('🔵 [Alipay] 开始创建支付订单...', { region: DEPLOYMENT_REGION })

    // 检查支付宝配置
    console.log('🔍 [Alipay] 检查环境变量配置:', {
      ALIPAY_APP_ID: alipayConfig.appId ? '已配置' : '未配置',
      ALIPAY_PRIVATE_KEY: alipayConfig.privateKey ? '已配置' : '未配置',
      ALIPAY_PUBLIC_KEY: alipayConfig.alipayPublicKey ? '已配置' : '未配置',
      ALIPAY_GATEWAY: alipayConfig.gateway ? '已配置' : '未配置',
    })

    if (!alipayConfig.appId || !alipayConfig.privateKey || !alipayConfig.alipayPublicKey) {
      console.error('❌ [Alipay] 配置缺失:', {
        hasAppId: !!alipayConfig.appId,
        hasPrivateKey: !!alipayConfig.privateKey,
        hasPublicKey: !!alipayConfig.alipayPublicKey,
        ALIPAY_APP_ID: alipayConfig.appId || 'null/undefined',
      })
      return NextResponse.json(
        {
          error: 'Alipay payment is currently unavailable. Please use Stripe or PayPal.',
          errorCode: 'ALIPAY_NOT_CONFIGURED',
          details: 'Alipay credentials are not configured. Contact support.',
        },
        { status: 503 }
      )
    }

    // 类型断言：此时配置已验证不为undefined
    const validatedConfig = alipayConfig as {
      appId: string;
      privateKey: string;
      alipayPublicKey: string;
      gateway: string;
      signType: string;
      charset: string;
      version: string;
      timeout: number;
      camelcase: boolean;
    }

    const body = await req.json()
    const { planType, billingCycle, userEmail, userId: requestUserId } = body

    console.log('📝 [Alipay] 订单信息:', { planType, billingCycle, userEmail, userId: requestUserId })

    // 获取用户信息（用于数据库适配器）
    const authHeader = req.headers.get('authorization')
    let userId = requestUserId || ''

    if (authHeader) {
      // 如果有认证头，解析用户信息
      try {
        const token = authHeader.replace('Bearer ', '')
        // 这里需要根据你的认证系统解析token获取用户ID和邮箱
        // 暂时从请求体获取
      } catch (error) {
        console.warn('⚠️ [Alipay] 无法解析认证token')
      }
    }

    if (!userId && IS_CHINA_DEPLOYMENT) {
      console.error('❌ [Alipay] 国内版需要提供userId')
      return NextResponse.json(
        { error: 'User ID is required for domestic deployment' },
        { status: 400 }
      )
    }

    // 验证输入
    if (!planType || !billingCycle || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: planType, billingCycle, userEmail' },
        { status: 400 }
      )
    }

    if (!['pro', 'team'].includes(planType)) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 })
    }

    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 })
    }

    // 计算价格（美元）
    const amountUSD = pricingConfig[planType as 'pro' | 'team'][billingCycle as 'monthly' | 'yearly']

    // 转换为人民币
    const amountCNY = (amountUSD * USD_TO_CNY_RATE).toFixed(2)

    console.log('💰 [Alipay] 价格计算:', {
      amountUSD: `$${amountUSD}`,
      amountCNY: `¥${amountCNY}`,
      rate: USD_TO_CNY_RATE,
    })

    // 生成订单号（与mvp_modules-main保持一致）
    const outTradeNo = generatePaymentId()

    // 订单描述（与mvp_modules-main保持一致）
    const description = `${billingCycle === "monthly" ? "1 Month" : "1 Year"} Premium Membership (One-time Payment)`

    // 初始化支付宝 SDK
    const alipaySdk = new AlipaySdk(validatedConfig as any)

    // 转换金额为数字（与mvp_modules-main保持一致）
    const amountNum = parseFloat(amountCNY)

    // 创建支付宝订单参数（与mvp_modules-main完全一致）
    const bizContent = {
      out_trade_no: outTradeNo, // 必需：商户订单号
      total_amount: amountNum.toFixed(2), // 必需：订单总金额，单位元，精确到小数点后两位
      subject: description, // 必需：订单标题，最长256字符（使用description而不是自定义字符串）
      product_code: 'FAST_INSTANT_TRADE_PAY', // 电脑网站支付
      passback_params: userId || "", // ✅ 传递用户ID，支付宝会原样返回
      // ✅ 重要：notify_url 和 return_url 必须在 bizContent 中，支付宝才会异步回调
      notify_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/alipay/notify`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?session_id=${outTradeNo}`,
    }

    console.log('📤 [Alipay] 支付宝请求参数:', { bizContent })

    // 生成支付链接（与mvp_modules-main完全一致）
    const method = 'alipay.trade.page.pay'
    const orderData = {
      method,
      bizContent,
    }

    const paymentUrl = await (alipaySdk as any).pageExec(orderData.method, {
      return_url: orderData.bizContent.return_url,
      notify_url: orderData.bizContent.notify_url,
      bizContent: orderData.bizContent,
    })

    console.log('✅ [Alipay] 支付链接生成成功')

    // 保存订单到数据库（使用数据库适配器）
    const amountInCents = Math.round(parseFloat(amountCNY) * 100) // 转换为分
    const paymentFee = Math.round(amountInCents * 0.006) // 支付宝手续费约 0.6%
    const netAmount = amountInCents - paymentFee

    try {
      console.log('🔧 [Alipay] 准备保存订单到数据库...', { userId, IS_CHINA_DEPLOYMENT })

      // 创建数据库适配器
      const dbAdapter = IS_CHINA_DEPLOYMENT ?
        new CloudBaseAdapter(userId) :
        new SupabaseAdapter(userId)

      console.log('🔧 [Alipay] 数据库适配器创建成功')

      // 适配不同数据库的字段结构
      const transactionData = IS_CHINA_DEPLOYMENT ? {
        // CloudBase字段结构
        user_id: userId,
        product_name: 'sitehub',
        plan_type: planType,
        billing_cycle: billingCycle,
        payment_method: 'alipay',
        payment_status: 'pending',
        transaction_type: 'purchase',
        currency: 'CNY',
        gross_amount: amountInCents,
        payment_fee: paymentFee,
        net_amount: netAmount,
        profit: netAmount,
        transaction_id: outTradeNo,
        payment_time: new Date().toISOString()
      } : {
        // Supabase字段结构
        user_email: userEmail,
        plan_type: planType,
        billing_cycle: billingCycle,
        amount_usd: amountUSD,
        amount_cny: parseFloat(amountCNY),
        payment_method: 'alipay',
        transaction_id: outTradeNo,
        status: 'pending'
      }

      console.log('🔧 [Alipay] 准备保存数据:', transactionData)

      const saveSuccess = await dbAdapter.savePaymentTransaction(transactionData)

      if (!saveSuccess) {
        console.error('⚠️ [Alipay] 数据库保存失败 (不影响支付)')
      } else {
        console.log('✅ [Alipay] 订单已保存到数据库')
      }
    } catch (dbError) {
      console.error('⚠️ [Alipay] 数据库操作异常 (不影响支付):', dbError)
      console.error('⚠️ [Alipay] 错误详情:', {
        message: dbError instanceof Error ? dbError.message : String(dbError),
        stack: dbError instanceof Error ? dbError.stack : undefined,
        userId,
        IS_CHINA_DEPLOYMENT
      })
    }

    // 返回支付链接
    return NextResponse.json({
      paymentUrl,
      orderId: outTradeNo,
      amount: amountCNY,
      currency: 'CNY',
    })
  } catch (error) {
    console.error('❌ [Alipay] 订单创建失败:', error)
    return NextResponse.json(
      {
        error: 'Failed to create Alipay order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
