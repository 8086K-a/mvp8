"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Edit, Trash2, ExternalLink, Clock, Heart } from "lucide-react"

const savedCredentials = [
  { id: 1, site: "Google", username: "john@email.com", logo: "🔍", lastUsed: "2 hours ago" },
  { id: 2, site: "YouTube", username: "john@email.com", logo: "📺", lastUsed: "1 day ago" },
  { id: 3, site: "Netflix", username: "john.doe", logo: "🎬", lastUsed: "3 days ago" },
]

const recentlyVisited = [
  { id: 1, site: "Google", logo: "🔍", visits: 24 },
  { id: 2, site: "YouTube", logo: "📺", visits: 18 },
  { id: 3, site: "Instagram", logo: "📸", visits: 12 },
  { id: 4, site: "TikTok", logo: "🎵", visits: 8 },
]

const favoriteSites = [
  { id: 1, site: "Google", logo: "🔍", category: "Search" },
  { id: 2, site: "YouTube", logo: "📺", category: "Video" },
  { id: 3, site: "GitHub", logo: "🐙", category: "Tools" },
  { id: 4, site: "Netflix", logo: "🎬", category: "Video" },
]

export default function Dashboard() {
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({})

  const togglePassword = (id: number) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, John!</h1>
          <p className="text-gray-600">Manage your saved credentials and favorite sites</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Saved Credentials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Saved Credentials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {savedCredentials.map((cred) => (
                  <div key={cred.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cred.logo}</span>
                      <div>
                        <h4 className="font-medium">{cred.site}</h4>
                        <p className="text-sm text-gray-500">{cred.username}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            type={showPasswords[cred.id] ? "text" : "password"}
                            value="••••••••"
                            readOnly
                            className="w-24 h-6 text-xs"
                          />
                          <Button variant="ghost" size="sm" onClick={() => togglePassword(cred.id)}>
                            {showPasswords[cred.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recently Visited */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recently Visited
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentlyVisited.map((site) => (
                  <div key={site.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{site.logo}</span>
                      <div>
                        <h4 className="font-medium">{site.site}</h4>
                        <p className="text-sm text-gray-500">{site.visits} visits this week</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Favorite Sites */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Your Favorite Sites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {favoriteSites.map((site) => (
                  <div key={site.id} className="p-4 bg-gray-50 rounded-lg text-center">
                    <span className="text-3xl block mb-2">{site.logo}</span>
                    <h4 className="font-medium mb-1">{site.site}</h4>
                    <Badge variant="outline" className="text-xs mb-3">
                      {site.category}
                    </Badge>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
