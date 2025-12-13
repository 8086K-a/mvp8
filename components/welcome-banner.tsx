import { Card, CardContent } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

interface WelcomeBannerProps {
  userName: string
}

export function WelcomeBanner({ userName }: WelcomeBannerProps) {
  return (
    <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {userName}!</h1>
            <p className="text-indigo-100 mt-1">Manage your integrations and connect your favorite services</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
