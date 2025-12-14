import { NextRequest, NextResponse } from 'next/server'
import {
  getRegionFromCountryCode,
  getDefaultLanguage,
  getPaymentMethodsByRegion,
  getCurrencyByRegion,
  isEuropeanCountry,
  type Region,
  type Language
} from '@/lib/ip-detection'

// 内存缓存，避免重复请求相同的IP
const geoCache = new Map<string, { data: GeoLocation; timestamp: number }>()
const CACHE_DURATION = 1000 * 60 * 30 // 30分钟缓存

/**
 * IP 地理位置检测 API (升级版)
 *
 * 功能：
 * 1. 检测用户 IP 地址
 * 2. 返回国家代码、货币、语言等信息
 * 3. 区域分类：中国、美国、印度、新加坡、欧洲、其他
 * 4. 欧洲地区标识（用于GDPR合规）
 * 5. 自动语言识别（中文/英文）
 *
 * 使用 ip-api.com 免费服务 (无需注册，每分钟45次请求)
 */

export interface GeoLocation {
  country: string        // 国家名称 (e.g., "China", "United States")
  countryCode: string    // 国家代码 (e.g., "CN", "US")
  region: string         // 地区代码 (e.g., "BJ", "CA")
  regionName: string     // 地区名称 (e.g., "Beijing", "California")
  city: string           // 城市 (e.g., "Beijing", "Los Angeles")
  timezone: string       // 时区 (e.g., "Asia/Shanghai")
  currency: string       // 推荐货币 (e.g., "CNY", "USD")
  language: string       // 推荐语言 (e.g., "zh-CN", "en-US")
  paymentMethods: string[] // 推荐支付方式
  ip: string            // IP地址
  regionCategory: Region // 区域分类 (新增)
  languageCode: Language // 语言代码 (新增)
  isEurope: boolean     // 是否欧洲 (新增)
}

// 从请求头获取真实 IP
function getClientIP(request: NextRequest): string {
  // 尝试从各种代理头获取真实 IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip') // Cloudflare

  if (cfConnectingIP) return cfConnectingIP
  if (realIP) return realIP
  if (forwarded) return forwarded.split(',')[0].trim()

  // 开发环境：如果检测不到 IP，返回 null 让 API 处理错误
  return ''
}

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)

    // 如果没有获取到 IP，直接返回默认配置
    if (!clientIP) {
      console.log('⚠️ [Geo] No IP detected, using default configuration')
      const defaultLocation: GeoLocation = {
        country: 'United States',
        countryCode: 'US',
        region: '',
        regionName: '',
        city: '',
        timezone: 'America/New_York',
        currency: 'USD',
        language: 'en-US',
        paymentMethods: ['stripe', 'paypal'],
        ip: 'unknown',
        regionCategory: 'usa',
        languageCode: 'en',
        isEurope: false
      }
      return NextResponse.json({
        success: false,
        error: 'No IP detected',
        data: defaultLocation
      })
    }

    // 检查缓存
    const now = Date.now()
    const cached = geoCache.get(clientIP)
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log(`✅ [Geo] 使用缓存数据 for IP: ${clientIP}`)
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true
      })
    }

    console.log(`🌍 [Geo] 请求新的地理位置数据 for IP: ${clientIP}`)

    // 调用 ip-api.com 获取地理位置信息
    const response = await fetch(`http://ip-api.com/json/${clientIP}?fields=status,message,country,countryCode,region,regionName,city,timezone,query`, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('IP-API request failed')
    }

    const data = await response.json()

    // 检查 API 响应状态
    if (data.status !== 'success') {
      throw new Error(data.message || 'IP detection failed')
    }

    // 获取国家代码和区域分类
    const countryCode = data.countryCode || 'US'
    const regionCategory = getRegionFromCountryCode(countryCode)
    const languageCode = getDefaultLanguage(regionCategory)
    const isEurope = isEuropeanCountry(countryCode)

    // 获取区域配置
    const currency = getCurrencyByRegion(regionCategory)
    const paymentMethods = getPaymentMethodsByRegion(regionCategory)

    // 构造返回数据
    const geoLocation: GeoLocation = {
      country: data.country,
      countryCode: countryCode,
      region: data.region,
      regionName: data.regionName,
      city: data.city,
      timezone: data.timezone,
      currency: currency,
      language: languageCode === 'zh' ? 'zh-CN' : 'en-US',
      paymentMethods: paymentMethods,
      ip: data.query || clientIP,
      regionCategory: regionCategory,
      languageCode: languageCode,
      isEurope: isEurope
    }

    // 存入缓存
    geoCache.set(clientIP, { data: geoLocation, timestamp: now })

    // 清理过期缓存
    if (geoCache.size > 1000) { // 防止内存泄漏
      const cutoff = now - CACHE_DURATION
      for (const [ip, entry] of geoCache.entries()) {
        if (entry.timestamp < cutoff) {
          geoCache.delete(ip)
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: geoLocation,
      cached: false
    })

  } catch (error) {
    console.error('IP detection error:', error)

    // 返回默认配置（假设为美国用户）
    const defaultLocation: GeoLocation = {
      country: 'United States',
      countryCode: 'US',
      region: '',
      regionName: '',
      city: '',
      timezone: 'America/New_York',
      currency: 'USD',
      language: 'en-US',
      paymentMethods: ['stripe', 'paypal'],
      ip: 'unknown',
      regionCategory: 'usa',
      languageCode: 'en',
      isEurope: false
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'IP detection failed',
      data: defaultLocation // 返回默认值确保应用可用
    })
  }
}

// 支持 POST 请求（用于指定 IP 测试）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const testIP = body.ip || getClientIP(request)

    const response = await fetch(`http://ip-api.com/json/${testIP}?fields=status,message,country,countryCode,region,regionName,city,timezone,query`)
    const data = await response.json()

    if (data.status !== 'success') {
      throw new Error(data.message || 'IP detection failed')
    }

    const countryCode = data.countryCode || 'US'
    const regionCategory = getRegionFromCountryCode(countryCode)
    const languageCode = getDefaultLanguage(regionCategory)
    const isEurope = isEuropeanCountry(countryCode)

    const currency = getCurrencyByRegion(regionCategory)
    const paymentMethods = getPaymentMethodsByRegion(regionCategory)

    const geoLocation: GeoLocation = {
      country: data.country,
      countryCode: countryCode,
      region: data.region,
      regionName: data.regionName,
      city: data.city,
      timezone: data.timezone,
      currency: currency,
      language: languageCode === 'zh' ? 'zh-CN' : 'en-US',
      paymentMethods: paymentMethods,
      ip: data.query || testIP,
      regionCategory: regionCategory,
      languageCode: languageCode,
      isEurope: isEurope
    }

    return NextResponse.json({
      success: true,
      data: geoLocation
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'IP detection failed'
    }, { status: 500 })
  }
}
