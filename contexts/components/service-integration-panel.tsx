"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CheckCircle, XCircle, Settings } from "lucide-react"

const services = [
  {
    name: "OpenAI GPT",
    logo: "🤖",
    connected: true,
    lastSync: "2 hours ago",
    description: "AI-powered text generation and completion",
  },
  {
    name: "Google APIs",
    logo: "🔍",
    connected: true,
    lastSync: "1 hour ago",
    description: "Search, Maps, Drive, and more Google services",
  },
  {
    name: "YouTube",
    logo: "📺",
    connected: false,
    lastSync: "Never",
    description: "Video upload, analytics, and channel management",
  },
  {
    name: "TikTok",
    logo: "🎵",
    connected: false,
    lastSync: "Never",
    description: "Content creation and analytics tools",
  },
  {
    name: "Instagram",
    logo: "📸",
    connected: true,
    lastSync: "30 minutes ago",
    description: "Photo sharing and business insights",
  },
  {
    name: "Twitter/X",
    logo: "🐦",
    connected: false,
    lastSync: "Never",
    description: "Social media posting and engagement",
  },
]

export function ServiceIntegrationPanel() {
  const [selectedService, setSelectedService] = useState<(typeof services)[0] | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Integrations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.name} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{service.logo}</span>
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">Last sync: {service.lastSync}</p>
                    </div>
                  </div>
                  {service.connected ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>

                <Badge variant={service.connected ? "default" : "secondary"} className="mb-3">
                  {service.connected ? "Connected" : "Not Connected"}
                </Badge>

                <p className="text-sm text-muted-foreground mb-4">{service.description}</p>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      onClick={() => setSelectedService(service)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Configure {service.name}</DialogTitle>
                      <DialogDescription>
                        Set up your {service.name} integration settings and API keys.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="text-center py-8">
                        <span className="text-4xl">{service.logo}</span>
                        <h3 className="text-lg font-semibold mt-2">{service.name}</h3>
                        <p className="text-muted-foreground">{service.description}</p>
                      </div>
                      <Button className="w-full">{service.connected ? "Reconfigure" : "Connect Service"}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
