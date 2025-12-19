import { NextRequest, NextResponse } from 'next/server'
import { AlipaySdk } from 'alipay-sdk'
import { createClient } from '@supabase/supabase-js'
import { CloudBaseAdapter } from '@/lib/database/cloudbase-adapter'
import { SupabaseAdapter } from '@/lib/database/supabase-adapter'

// 支付宝配置
const alipayConfig = {
  appId: process.env.ALIPAY_APP_ID,
  privateKey: process.env.ALIPAY_PRIVATE_KEY,
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY,
  gateway: process.env.ALIPAY_GATEWAY,
  signType: 'RSA2',
  charset: 'utf-8',
  version: '1.0',
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const outTradeNo = searchParams.get('out_trade_no')

    if (!outTradeNo) {
      return NextResponse.json(
        { success: false, error: 'Missing out_trade_no parameter' },
        { status: 400 }
      )
    }

    console.log('🔍 [Alipay Verify] Verifying payment:', outTradeNo)

    // 检查配置
    if (!alipayConfig.appId || !alipayConfig.privateKey || !alipayConfig.alipayPublicKey) {
      console.error('❌ [Alipay Verify] 配置缺失')
      return NextResponse.json(
        { success: false, error: 'Alipay configuration missing' },
        { status: 500 }
      )
    }

    // 初始化支付宝SDK
    const alipaySdk = new AlipaySdk(alipayConfig as any)

    // 查询支付宝支付状态
    const result = await alipaySdk.exec('alipay.trade.query', {
      bizContent: {
        out_trade_no: outTradeNo,
      },
    })

    console.log('📊 [Alipay Verify] Query result:', result)

    if (result.code === '10000') {
      // 支付成功
      const tradeStatus = result.tradeStatus
      console.log('✅ [Alipay Verify] Payment verified:', {
        out_trade_no: outTradeNo,
        trade_status: tradeStatus,
        trade_no: result.tradeNo,
        total_amount: result.totalAmount,
      })

      // 如果支付成功，处理订阅创建
      if (tradeStatus === 'TRADE_SUCCESS') {
        try {
          console.log('🎫 [Alipay Verify] 开始处理支付成功逻辑...')

          // 地区检测
          const DEPLOYMENT_REGION = process.env.NEXT_PUBLIC_DEPLOYMENT_REGION || 'china'
          const IS_CHINA_DEPLOYMENT = DEPLOYMENT_REGION === 'china'

          if (IS_CHINA_DEPLOYMENT) {
            // CloudBase逻辑
            const cloudbaseAdapter = new CloudBaseAdapter('temp_user')
            const transaction = await cloudbaseAdapter.getPaymentTransaction(outTradeNo)

            if (transaction) {
              console.log('📋 [Alipay Verify] 找到支付记录:', {
                user_id: transaction.user_id,
                plan_type: transaction.plan_type,
                payment_status: transaction.payment_status
              })

              const userId = transaction.user_id

              // 更新支付状态为已完成
              const updateSuccess = await cloudbaseAdapter.updatePaymentStatus(outTradeNo, 'completed')
              if (updateSuccess) {
                console.log('✅ [Alipay Verify] 支付状态已更新为 completed')
              }

              // 计算订阅到期时间
              const now = new Date()
              const expireTime = new Date(now)
              if (transaction.billing_cycle === 'monthly') {
                expireTime.setMonth(expireTime.getMonth() + 1)
              } else {
                expireTime.setFullYear(expireTime.getFullYear() + 1)
              }

              // 创建订阅数据
              const subscriptionData = {
                user_email: transaction.user_email,
                platform: 'web',
                payment_method: 'alipay',
                plan_type: transaction.plan_type,
                billing_cycle: transaction.billing_cycle,
                status: 'active',
                start_time: now.toISOString(),
                expire_time: expireTime.toISOString(),
                alipay_trade_no: result.tradeNo,
                auto_renew: false,
                next_billing_date: expireTime.toISOString(),
                updated_at: now.toISOString(),
              }

              console.log('📋 [Alipay Verify] 准备创建订阅:', subscriptionData)

              // 使用正确的用户ID创建适配器
              const userAdapter = new CloudBaseAdapter(userId)
              const subSuccess = await userAdapter.upsertSubscription(subscriptionData)

              if (subSuccess) {
                console.log('✅ [Alipay Verify] CloudBase订阅已激活')

                // 更新用户记录的pro状态
                try {
                  const cloudbaseDB = await userAdapter.getDb()
                  if (cloudbaseDB) {
                    await cloudbaseDB.collection('web_users')
                      .where({ _id: userId })
                      .update({
                        is_pro: true,
                        updated_at: new Date().toISOString()
                      })
                    console.log('✅ [Alipay Verify] 用户pro状态已更新')
                  }
                } catch (updateError) {
                  console.error('❌ [Alipay Verify] 更新用户pro状态失败:', updateError)
                }
              } else {
                console.error('❌ [Alipay Verify] CloudBase订阅创建失败')
              }
            } else {
              console.warn('⚠️ [Alipay Verify] 未找到对应的支付记录:', outTradeNo)
            }
          } else {
            // Supabase逻辑（如果需要的话）
            console.log('ℹ️ [Alipay Verify] Supabase部署，跳过订阅创建')
          }
        } catch (error) {
          console.error('❌ [Alipay Verify] 处理支付成功逻辑失败:', error)
          // 不影响支付验证的结果，只记录错误
        }
      }

      return NextResponse.json({
        success: true,
        trade_status: tradeStatus,
        trade_no: result.tradeNo,
        total_amount: result.totalAmount,
        out_trade_no: outTradeNo,
      })
    } else {
      // 查询失败或支付未完成
      console.log('❌ [Alipay Verify] Payment not completed:', {
        code: result.code,
        msg: result.msg,
        sub_code: result.subCode,
        sub_msg: result.subMsg,
      })

      return NextResponse.json({
        success: false,
        error: result.msg || 'Payment not completed',
        code: result.code,
        trade_status: result.tradeStatus,
      })
    }
  } catch (error) {
    console.error('❌ [Alipay Verify] Verification error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      },
      { status: 500 }
    )
  }
}



