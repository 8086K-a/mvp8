"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Region, Language } from '@/lib/ip-detection'

export interface GeoLocation {
  country: string
  countryCode: string
  region: string
  regionName: string
  city: string
  timezone: string
  currency: string
  language: string
  paymentMethods: string[]
  ip: string
  regionCategory: Region  // 区域分类
  languageCode: Language  // 语言代码
  isEurope: boolean       // 是否欧洲（用于屏蔽）
}

interface GeoContextType {
  location: GeoLocation | null
  loading: boolean
  error: string | null
  isChina: boolean        // 由环境变量控制，不再由IP决定
  isEurope: boolean       // 由IP检测，用于屏蔽
  regionCategory: Region
  languageCode: Language
  refresh: () => Promise<void>
}

// 从环境变量读取部署区域（默认为国内版）
const DEPLOYMENT_REGION = process.env.NEXT_PUBLIC_DEPLOYMENT_REGION || 'china'

// 根据部署区域生成默认配置
function getDefaultLocationByRegion(region: string): GeoLocation {
  if (region === 'china') {
    return {
      country: 'China',
      countryCode: 'CN',
      region: '',
      regionName: '',
      city: '',
      timezone: 'Asia/Shanghai',
      currency: 'CNY',
      language: 'zh-CN',
      paymentMethods: ['alipay', 'wechatpay', 'stripe', 'paypal'],
      ip: 'unknown',
      regionCategory: 'china',
      languageCode: 'zh',
      isEurope: false
    }
  } else {
    return {
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
  }
}

const defaultLocation = getDefaultLocationByRegion(DEPLOYMENT_REGION)

const GeoContext = createContext<GeoContextType>({
  location: defaultLocation,
  loading: false,
  error: null,
  isChina: DEPLOYMENT_REGION === 'china',
  isEurope: false,
  regionCategory: DEPLOYMENT_REGION === 'china' ? 'china' : 'usa',
  languageCode: DEPLOYMENT_REGION === 'china' ? 'zh' : 'en',
  refresh: async () => {}
})

export function useGeo() {
  const context = useContext(GeoContext)
  if (!context) {
    throw new Error('useGeo must be used within GeoProvider')
  }
  return context
}

interface GeoProviderProps {
  children: ReactNode
}

export function GeoProvider({ children }: GeoProviderProps) {
  const [location, setLocation] = useState<GeoLocation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGeoLocation = async () => {
    try {
      setLoading(true)
      setError(null)

      // ✅ IP检测仅用于检测欧洲用户，用于GDPR屏蔽
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000) // 2秒超时

      try {
        const response = await fetch('/api/geo/detect', {
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        const result = await response.json()

        if (result.success) {
          // 合并环境变量配置和IP检测结果
          const detectedLocation = result.data
          const finalLocation: GeoLocation = {
            ...defaultLocation,
            // 保留IP检测的实际地理信息（用于日志和统计）
            country: detectedLocation.country,
            countryCode: detectedLocation.countryCode,
            region: detectedLocation.region,
            regionName: detectedLocation.regionName,
            city: detectedLocation.city,
            ip: detectedLocation.ip,
            // 关键：isEurope从IP检测获取，用于屏蔽
            isEurope: detectedLocation.isEurope,
            // 其他配置使用环境变量定义的默认值
            timezone: defaultLocation.timezone,
            currency: defaultLocation.currency,
            language: defaultLocation.language,
            paymentMethods: defaultLocation.paymentMethods,
            regionCategory: defaultLocation.regionCategory,
            languageCode: defaultLocation.languageCode
          }
          setLocation(finalLocation)
        } else {
          setError(result.error || 'Failed to detect location')
          setLocation(defaultLocation)
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          console.warn('⚠️ [Geo] IP检测超时，使用默认配置（仅影响欧洲屏蔽功能）')
          setLocation(defaultLocation)
        } else {
          throw fetchError
        }
      }
    } catch (err) {
      console.error('Geo detection error:', err)
      setError(err instanceof Error ? err.message : 'Failed to detect location')
      setLocation(defaultLocation)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 仅在首次加载时获取地理位置，避免每次路由变化都重新请求
    fetchGeoLocation()
  }, []) // 移除依赖项，仅执行一次

  const value: GeoContextType = {
    location,
    loading,
    error,
    // 核心改动：isChina由环境变量决定，不再由IP决定
    isChina: DEPLOYMENT_REGION === 'china',
    // isEurope从IP检测获取，用于屏蔽
    isEurope: location?.isEurope || false,
    regionCategory: defaultLocation.regionCategory,
    languageCode: defaultLocation.languageCode,
    refresh: fetchGeoLocation
  }

  return <GeoContext.Provider value={value}>{children}</GeoContext.Provider>
}
