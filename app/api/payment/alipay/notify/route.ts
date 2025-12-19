import { NextRequest, NextResponse } from 'next/server'
import { AlipaySdk } from 'alipay-sdk'
import { createClient } from '@supabase/supabase-js'
import { CloudBaseAdapter } from '@/lib/database/cloudbase-adapter'
import { SupabaseAdapter } from '@/lib/database/supabase-adapter'

// 支付宝配置（完全使用 .env.local 中的值）
const alipayConfig = {
  appId: process.env.ALIPAY_APP_ID,
  privateKey: process.env.ALIPAY_PRIVATE_KEY,
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY,
  gateway: process.env.ALIPAY_GATEWAY,
  signType: 'RSA2',
  charset: 'utf-8',
  version: '1.0',
}

// 地区检测
const DEPLOYMENT_REGION = process.env.NEXT_PUBLIC_DEPLOYMENT_REGION || 'china'
const IS_CHINA_DEPLOYMENT = DEPLOYMENT_REGION === 'china'

/**
 * POST - 支付宝异步通知回调
 * 支付宝会在支付成功后调用此接口
 */
export async function POST(req: NextRequest) {
  try {
    console.log('🔔 [Alipay Notify] 收到支付宝回调通知', { region: DEPLOYMENT_REGION })

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

      let transaction: any = null
      let finalUserEmail = userEmail
      let userId = ''

      try {
        if (IS_CHINA_DEPLOYMENT) {
          // CloudBase逻辑：需要先查询订单获取用户信息
          console.log('🔍 [Alipay Notify] 开始查询CloudBase订单记录...')
          const cloudbaseAdapter = new CloudBaseAdapter('temp_user') // 使用临时userId进行查询
          transaction = await cloudbaseAdapter.getPaymentTransaction(out_trade_no)

          console.log('📊 [Alipay Notify] 查询结果:', transaction ? '找到订单' : '未找到订单')

          if (!transaction) {
            console.error('❌ [Alipay Notify] CloudBase未找到订单记录:', out_trade_no)
            return new NextResponse('success', {
              status: 200,
              headers: { 'Content-Type': 'text/plain' },
            })
          }

          console.log('📋 [Alipay Notify] 订单详情:', {
            user_id: transaction.user_id,
            plan_type: transaction.plan_type,
            payment_status: transaction.payment_status,
            transaction_id: transaction.transaction_id
          })

          userId = transaction.user_id
          // CloudBase中可能没有直接的邮箱，需要从用户信息中获取
          finalUserEmail = transaction.user_email || userEmail
        } else {
          // Supabase逻辑
          const supabaseAdapter = new SupabaseAdapter('')
          transaction = await supabaseAdapter.getPaymentTransaction(out_trade_no)

          if (!transaction) {
            console.error('❌ [Alipay Notify] Supabase未找到订单记录:', out_trade_no)
            return new NextResponse('success', {
              status: 200,
              headers: { 'Content-Type': 'text/plain' },
            })
          }

          finalUserEmail = transaction.user_email || userEmail
          userId = transaction.user_id
        }

        console.log('📦 [Alipay Notify] 订单信息:', {
          email: finalUserEmail,
          plan: transaction.plan_type,
          cycle: transaction.billing_cycle,
          db: IS_CHINA_DEPLOYMENT ? 'CloudBase' : 'Supabase'
        })

        if (!finalUserEmail) {
          console.error('❌ [Alipay Notify] 无法获取用户邮箱')
          return new NextResponse('success', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
          })
        }

        // 更新订单状态
        if (IS_CHINA_DEPLOYMENT) {
          console.log('🔄 [Alipay Notify] 开始更新订单状态为 completed...')
          const cloudbaseAdapter = new CloudBaseAdapter(userId)
          const updateSuccess = await cloudbaseAdapter.updatePaymentStatus(out_trade_no, 'completed')
          if (!updateSuccess) {
            console.error('❌ [Alipay Notify] CloudBase更新失败')
          } else {
            console.log('✅ [Alipay Notify] CloudBase订单状态已更新为 completed')
          }
        } else {
          const supabaseAdapter = new SupabaseAdapter(userId)
          const updateSuccess = await supabaseAdapter.updatePaymentStatus(out_trade_no, 'completed')
          if (!updateSuccess) {
            console.error('❌ [Alipay Notify] Supabase更新失败')
          } else {
            console.log('✅ [Alipay Notify] Supabase订单状态已更新为 completed')
          }
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
          expireTime: expireTime.toISOString(),
          db: IS_CHINA_DEPLOYMENT ? 'CloudBase' : 'Supabase'
        })

        // 更新或创建用户订阅
        const subscriptionData = {
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
        }

        if (IS_CHINA_DEPLOYMENT) {
          console.log('🎫 [Alipay Notify] 开始创建用户订阅...')
          console.log('👤 [Alipay Notify] 用户ID:', userId)
          console.log('📋 [Alipay Notify] 订阅数据:', subscriptionData)
          const cloudbaseAdapter = new CloudBaseAdapter(userId)
          const subSuccess = await cloudbaseAdapter.upsertSubscription(subscriptionData)
          if (!subSuccess) {
            console.error('❌ [Alipay Notify] CloudBase订阅更新失败')
          } else {
            console.log('✅ [Alipay Notify] CloudBase用户订阅已激活')
          }
        } else {
          const supabaseAdapter = new SupabaseAdapter(userId)
          const subSuccess = await supabaseAdapter.upsertSubscription(subscriptionData)
          if (!subSuccess) {
            console.error('❌ [Alipay Notify] Supabase订阅更新失败')
          } else {
            console.log('✅ [Alipay Notify] Supabase用户订阅已激活')
          }

          // 更新用户的 pro 状态（仅Supabase需要）
          try {
            const supabaseClient = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!
            )
            const { data: userData, error: userError } = await supabaseClient.auth.admin.listUsers()
            const user = userData?.users.find(u => u.email === finalUserEmail)

            if (user) {
              const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
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
        }
      } catch (error) {
        console.error('❌ [Alipay Notify] 处理支付成功逻辑时出错:', error)
        // 即使处理出错，也返回success给支付宝，避免重复通知
      }
    } else if (trade_status === 'TRADE_CLOSED') {
      console.log('⚠️ [Alipay Notify] 交易已关闭')

      // 更新订单状态为已关闭
      if (IS_CHINA_DEPLOYMENT) {
        // CloudBase逻辑：先查询获取userId
        const cloudbaseAdapter = new CloudBaseAdapter('')
        const transaction = await cloudbaseAdapter.getPaymentTransaction(out_trade_no)
        if (transaction) {
          const adapterWithUser = new CloudBaseAdapter(transaction.user_id)
          await adapterWithUser.updatePaymentStatus(out_trade_no, 'cancelled')
          console.log('✅ [Alipay Notify] CloudBase订单状态已更新为 cancelled')
        }
      } else {
        // Supabase逻辑
        const supabaseAdapter = new SupabaseAdapter('')
        await supabaseAdapter.updatePaymentStatus(out_trade_no, 'cancelled')
        console.log('✅ [Alipay Notify] Supabase订单状态已更新为 cancelled')
      }
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
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://site.mornscience.top'}/payment/cancel`)
      }

      console.log('✅ [Alipay Return] 签名验证通过')
    }

    // 跳转到成功页面（带订单号）
    const successUrl = new URL('/payment/success', process.env.NEXT_PUBLIC_SITE_URL)
    if (params.out_trade_no) {
      successUrl.searchParams.set('session_id', params.out_trade_no)
    }

    return NextResponse.redirect(successUrl.toString())
  } catch (error) {
    console.error('❌ [Alipay Return] 同步返回处理异常:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://site.mornscience.top'}/payment/cancel`)
  }
}
