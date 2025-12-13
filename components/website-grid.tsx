"use client"

import { useState } from "react"
import { WebsiteCard } from "@/components/website-card"
import { SiteDetailsModal } from "@/components/site-details-modal"

const sampleSites = [
  {
    id: "google",
    name: "Google",
    url: "https://google.com",
    logo: "🔍",
    category: "Search",
    rating: 4.9,
    supportsLogin: true,
    description: "The world's most popular search engine",
    bgColor: "bg-blue-500",
  },
  {
    id: "youtube",
    name: "YouTube",
    url: "https://youtube.com",
    logo: "📺",
    category: "Video",
    rating: 4.8,
    supportsLogin: true,
    description: "Video sharing and streaming platform",
    bgColor: "bg-red-500",
  },
  {
    id: "tiktok",
    name: "TikTok",
    url: "https://tiktok.com",
    logo: "🎵",
    category: "Social",
    rating: 4.7,
    supportsLogin: true,
    description: "Short-form video social platform",
    bgColor: "bg-black",
  },
  {
    id: "instagram",
    name: "Instagram",
    url: "https://instagram.com",
    logo: "📸",
    category: "Social",
    rating: 4.6,
    supportsLogin: true,
    description: "Photo and video sharing social network",
    bgColor: "bg-pink-500",
  },
  {
    id: "amazon",
    name: "Amazon",
    url: "https://amazon.com",
    logo: "📦",
    category: "Shopping",
    rating: 4.5,
    supportsLogin: true,
    description: "Online marketplace and cloud services",
    bgColor: "bg-orange-500",
  },
  {
    id: "netflix",
    name: "Netflix",
    url: "https://netflix.com",
    logo: "🎬",
    category: "Video",
    rating: 4.4,
    supportsLogin: true,
    description: "Streaming service for movies and TV shows",
    bgColor: "bg-red-700",
  },
  {
    id: "twitter",
    name: "Twitter",
    url: "https://twitter.com",
    logo: "🐦",
    category: "Social",
    rating: 4.3,
    supportsLogin: true,
    description: "Social media and microblogging platform",
    bgColor: "bg-blue-400",
  },
  {
    id: "facebook",
    name: "Facebook",
    url: "https://facebook.com",
    logo: "👥",
    category: "Social",
    rating: 4.2,
    supportsLogin: true,
    description: "Social networking platform",
    bgColor: "bg-blue-600",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    url: "https://linkedin.com",
    logo: "💼",
    category: "Professional",
    rating: 4.4,
    supportsLogin: true,
    description: "Professional networking platform",
    bgColor: "bg-blue-700",
  },
  {
    id: "github",
    name: "GitHub",
    url: "https://github.com",
    logo: "🐙",
    category: "Tools",
    rating: 4.8,
    supportsLogin: true,
    description: "Code hosting and collaboration platform",
    bgColor: "bg-gray-800",
  },
  {
    id: "spotify",
    name: "Spotify",
    url: "https://spotify.com",
    logo: "🎵",
    category: "Music",
    rating: 4.6,
    supportsLogin: true,
    description: "Music streaming service",
    bgColor: "bg-green-500",
  },
  {
    id: "discord",
    name: "Discord",
    url: "https://discord.com",
    logo: "🎮",
    category: "Communication",
    rating: 4.5,
    supportsLogin: true,
    description: "Voice, video and text communication service",
    bgColor: "bg-indigo-600",
  },
]

export function WebsiteGrid() {
  const [selectedSite, setSelectedSite] = useState<(typeof sampleSites)[0] | null>(null)

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {sampleSites.map((site) => (
          <WebsiteCard key={site.id} site={site} onClick={() => setSelectedSite(site)} />
        ))}
      </div>

      <SiteDetailsModal site={selectedSite} isOpen={!!selectedSite} onClose={() => setSelectedSite(null)} />
    </>
  )
}
