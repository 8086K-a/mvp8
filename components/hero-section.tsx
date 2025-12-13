"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

const popularLogos = [
  { name: "Google", emoji: "🔍", color: "bg-red-500" },
  { name: "YouTube", emoji: "📺", color: "bg-red-600" },
  { name: "TikTok", emoji: "🎵", color: "bg-black" },
  { name: "Twitter", emoji: "🐦", color: "bg-blue-400" },
  { name: "Instagram", emoji: "📸", color: "bg-pink-500" },
  { name: "Netflix", emoji: "🎬", color: "bg-red-700" },
  { name: "Amazon", emoji: "📦", color: "bg-orange-500" },
  { name: "Facebook", emoji: "👥", color: "bg-blue-600" },
]

export function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % popularLogos.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 text-white">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

      <div className="container mx-auto px-4 py-20 relative">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="grid grid-cols-4 gap-4 md:grid-cols-8">
              {popularLogos.map((logo, index) => (
                <div
                  key={logo.name}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transform transition-all duration-500 ${
                    index === currentIndex ? "scale-110 rotate-12 shadow-2xl" : "scale-100 rotate-0 shadow-lg"
                  } ${logo.color}`}
                  style={{
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  {logo.emoji}
                </div>
              ))}
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Access the World's Top{" "}
            <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">300 Sites</span>{" "}
            in One Click
          </h1>

          <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
            No more bookmarks - instant access to Google, YouTube, TikTok, Amazon and more
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4">
              <Sparkles className="w-5 h-5 mr-2" />
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <div className="flex items-center gap-2 text-blue-200">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-blue-400 border-2 border-white" />
                ))}
              </div>
              <span className="text-sm">Join 50K+ users</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
