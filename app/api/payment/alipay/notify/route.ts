import { NextRequest, NextResponse } from 'next/server'
import * as AlipaySdk from 'alipay-sdk'
import { createClient } from '@supabase/supabase-js'

// 支付宝配置（与 create/route.ts 保持一致）
const alipayConfig = {
  appId: process.env.ALIPAY_APP_ID || '2021005199628151',
  privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
  gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
  signType: 'RSA2',
  charset: 'utf-8',
  version: '1.0',
}

/**
 * POST - 支付宝异步通知回调
 * 支付宝会在支付成功后调用此接口
 */
export async function POST(req: NextRequest) {
  try {
    // Supabase 客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    console.log('🔔 [Alipay Notify] 收到支付宝回调通知')

    // 检查配置
    if (!alipayConfig.appId || !alipayConfig.privateKey || !alipayConfig.alipayPublicKey) {
      console.error('❌ [Alipay Notify] 配置缺失')
      return new NextResponse('fail', { status: 503 })
    }

    // 获取POST数据
    const formData = await req.formData()
    const params: Record<string, string> = {}

    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    console.log('📝 [Alipay Notify] 回调参数:', {
      out_trade_no: params.out_trade_no,
      trade_no: params.trade_no,
      trade_status: params.trade_status,
      total_amount: params.total_amount,
    })

    // 初始化支付宝 SDK
    const alipaySdk = new AlipaySdk(alipayConfig)

    // 验证签名
    const signVerified = alipaySdk.checkNotifySign(params)

    if (!signVerified) {
      console.error('❌ [Alipay Notify] 签名验证失败')
      return new NextResponse('fail', { status: 400 })
    }

    console.log('✅ [Alipay Notify] 签名验证通过')

    // 提取关键信息
    const {
      out_trade_no, // 商户订单号
      trade_no, // 支付宝交易号
      trade_status, // 交易状态
      total_amount, // 订单金额
      passback_params, // ✅ 从 passback_params 获取用户邮箱（创建订单时传递）
    } = params
    
    // 从 passback_params 提取 userEmail（如果存在）
    const userEmail = passback_params || ''

    // 更新数据库订单状态
    if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
      console.log('💰 [Alipay Notify] 支付成功，更新订单状态')

      // 查询订单信息（使用商户订单号 out_trade_no）
      const { data: transaction, error: queryError } = await supabase
        .from('web_payment_transactions')
        .select('*')
        .eq('transaction_id', out_trade_no)
        .single()

      if (queryError || !transaction) {
        console.error('❌ [Alipay Notify] 未找到订单记录:', out_trade_no)
        // 即使找不到订单，也返回 success 给支付宝，避免重复通知
        return new NextResponse('success', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        })
      }

      console.log('📦 [Alipay Notify] 订单信息:', {
        email: transaction.user_email,
        plan: transaction.plan_type,
        cycle: transaction.billing_cycle,
      })

      // 使用 passback_params 中的 userEmail，如果没有则使用订单中的 user_email
      const finalUserEmail = userEmail || transaction.user_email

      if (!finalUserEmail) {
        console.error('❌ [Alipay Notify] 无法获取用户邮箱')
        return new NextResponse('success', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        })
      }

      // 更新订单状态为已支付（使用正确的表名和字段）
      const { error: updateError } = await supabase
        .from('web_payment_transactions')
        .update({
          payment_status: 'completed',
          transaction_id: trade_no, // 更新为支付宝交易号
          alipay_trade_no: trade_no, // 保存支付宝交易号
          updated_at: new Date().toISOString(),
        })
        .eq('transaction_id', out_trade_no)

      if (updateError) {
        console.error('❌ [Alipay Notify] 数据库更新失败:', updateError)
        // 即使数据库更新失败，也要返回success给支付宝，避免重复通知
      } else {
        console.log('✅ [Alipay Notify] 订单状态已更新为 completed')
      }

      // 计算订阅到期时间
      const now = new Date()
      const expireTime = new Date(now)
      if (transaction.billing_cycle === 'monthly') {
        expireTime.setMonth(expireTime.getMonth() + 1)
      } else {
        expireTime.setFullYear(expireTime.getFullYear() + 1)
      }

      console.log('📅 Alipay subscription period:', {
        planType: transaction.plan_type,
        billingCycle: transaction.billing_cycle,
        startTime: now.toISOString(),
        expireTime: expireTime.toISOString()
      })

      // 更新或创建用户订阅（使用正确的表名和字段，参考 Stripe 实现）
      const { data: subscriptionRows, error: subError } = await supabase.from('web_subscriptions').upsert({
        user_email: finalUserEmail,
        platform: 'web',
        payment_method: 'alipay',
        plan_type: transaction.plan_type,
        billing_cycle: transaction.billing_cycle,
        status: 'active',
        start_time: now.toISOString(),
        expire_time: expireTime.toISOString(),
        alipay_trade_no: trade_no,
        auto_renew: false,
        next_billing_date: expireTime.toISOString(),
        updated_at: now.toISOString(),
      }, {
        onConflict: 'user_email'
      }).select().maybeSingle()

      if (subError) {
        console.error('❌ [Alipay Notify] 订阅更新失败:', subError)
      } else {
        console.log('✅ [Alipay Notify] 用户订阅已激活')
      }

      // 更新用户的 pro 状态（参考 Stripe 实现）
      try {
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
        const user = userData?.users.find(u => u.email === finalUserEmail)

        if (user) {
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            {
              user_metadata: {
                ...user.user_metadata,
                pro: true,
                upgraded_at: now.toISOString()
              }
            }
          )

          if (updateError) {
            console.error('Failed to update user pro status:', updateError)
          } else {
            console.log('✅ User pro status updated:', finalUserEmail)
          }
        } else {
          console.warn('⚠️ User not found in auth.users:', finalUserEmail)
        }
      } catch (error) {
        console.error('Error updating user pro status:', error)
        // 不返回错误，因为订阅已经创建成功
      }

    } else if (trade_status === 'TRADE_CLOSED') {
      console.log('⚠️ [Alipay Notify] 交易已关闭')

      // 更新订单状态为已关闭（使用正确的表名和字段）
      await supabase
        .from('web_payment_transactions')
        .update({
          payment_status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('transaction_id', out_trade_no)
    }

    // 返回 success 给支付宝（必须返回纯文本 "success"）
    console.log('✅ [Alipay Notify] 回调处理完成，返回 success')
    return new NextResponse('success', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  } catch (error) {
    console.error('❌ [Alipay Notify] 回调处理异常:', error)
    // 返回 fail 给支付宝，支付宝会重试
    return new NextResponse('fail', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }
}

/**
 * GET - 支付宝同步返回（用户支付完成后浏览器跳转）
 * 这个接口主要用于页面跳转，不处理业务逻辑（业务逻辑在POST中处理）
 */
export async function GET(req: NextRequest) {
  try {
    console.log('🔄 [Alipay Return] 用户支付完成，同步返回')

    const searchParams = req.nextUrl.searchParams
    const params: Record<string, string> = {}

    searchParams.forEach((value, key) => {
      params[key] = value
    })

    console.log('📝 [Alipay Return] 返回参数:', {
      out_trade_no: params.out_trade_no,
      trade_no: params.trade_no,
      total_amount: params.total_amount,
    })

    // 验证签名
    if (alipayConfig.alipayPublicKey) {
      const alipaySdk = new AlipaySdk(alipayConfig)
      const signVerified = alipaySdk.checkNotifySign(params)

      if (!signVerified) {
        console.error('❌ [Alipay Return] 签名验证失败')
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancel`)
      }

      console.log('✅ [Alipay Return] 签名验证通过')
    }

    // 跳转到成功页面（带订单号）
    const successUrl = new URL('/payment/success', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    if (params.out_trade_no) {
      successUrl.searchParams.set('session_id', params.out_trade_no)
    }

    return NextResponse.redirect(successUrl.toString())
  } catch (error) {
    console.error('❌ [Alipay Return] 同步返回处理异常:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancel`)
  }
}
