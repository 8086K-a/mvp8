"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, CheckCircle, ArrowRight } from "lucide-react"

const availableServices = [
  { id: "openai", name: "OpenAI GPT", logo: "🤖", category: "AI" },
  { id: "google", name: "Google APIs", logo: "🔍", category: "Search" },
  { id: "youtube", name: "YouTube", logo: "📺", category: "Video" },
  { id: "tiktok", name: "TikTok", logo: "🎵", category: "Social" },
  { id: "instagram", name: "Instagram", logo: "📸", category: "Social" },
  { id: "twitter", name: "Twitter/X", logo: "🐦", category: "Social" },
  { id: "slack", name: "Slack", logo: "💬", category: "Communication" },
  { id: "discord", name: "Discord", logo: "🎮", category: "Communication" },
]

const integrationSteps = [
  { id: 1, title: "Select Service", completed: false },
  { id: 2, title: "Configure API", completed: false },
  { id: 3, title: "Set Permissions", completed: false },
  { id: 4, title: "Test Connection", completed: false },
]

export default function Integrations() {
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [apiKey, setApiKey] = useState("")
  const [permissions, setPermissions] = useState<string[]>([])

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId)
    setCurrentStep(2)
  }

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setPermissions([...permissions, permission])
    } else {
      setPermissions(permissions.filter((p) => p !== permission))
    }
  }

  const selectedServiceData = availableServices.find((s) => s.id === selectedService)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Integrations</h1>
            <p className="text-muted-foreground mt-2">Connect and manage your service integrations</p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Integration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create New Integration</DialogTitle>
                <DialogDescription>Follow the steps below to set up a new service integration</DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-4">
                  <h3 className="font-semibold">Progress</h3>
                  {integrationSteps.map((step) => (
                    <div key={step.id} className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          currentStep > step.id
                            ? "bg-green-500 text-white"
                            : currentStep === step.id
                              ? "bg-indigo-500 text-white"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {currentStep > step.id ? <CheckCircle className="w-4 h-4" /> : step.id}
                      </div>
                      <span className={currentStep >= step.id ? "text-foreground" : "text-muted-foreground"}>
                        {step.title}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="lg:col-span-2">
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold">Select a Service</h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {availableServices.map((service) => (
                          <Card
                            key={service.id}
                            className={`cursor-pointer transition-colors hover:bg-muted ${
                              selectedService === service.id ? "ring-2 ring-indigo-500" : ""
                            }`}
                            onClick={() => handleServiceSelect(service.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{service.logo}</span>
                                <div>
                                  <h4 className="font-medium">{service.name}</h4>
                                  <Badge variant="secondary" className="text-xs">
                                    {service.category}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && selectedServiceData && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">{selectedServiceData.logo}</span>
                        <h3 className="font-semibold">Configure {selectedServiceData.name}</h3>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="api-key">API Key</Label>
                          <Input
                            id="api-key"
                            type="password"
                            placeholder="Enter your API key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                          />
                        </div>

                        <Button onClick={() => setCurrentStep(3)} disabled={!apiKey} className="w-full">
                          Continue
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold">Set Permissions</h3>
                      <div className="space-y-3">
                        {["Read access", "Write access", "Delete access", "Admin access"].map((permission) => (
                          <div key={permission} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission}
                              checked={permissions.includes(permission)}
                              onCheckedChange={(checked) => handlePermissionChange(permission, checked as boolean)}
                            />
                            <Label htmlFor={permission}>{permission}</Label>
                          </div>
                        ))}
                      </div>

                      <Button onClick={() => setCurrentStep(4)} className="w-full">
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="space-y-4 text-center">
                      <div className="text-4xl mb-4">🎉</div>
                      <h3 className="font-semibold">Integration Complete!</h3>
                      <p className="text-muted-foreground">
                        Your {selectedServiceData?.name} integration has been set up successfully.
                      </p>

                      <Button className="w-full">Finish Setup</Button>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableServices.slice(0, 6).map((service) => (
            <Card key={service.id}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{service.logo}</span>
                  <div>
                    <h3 className="font-semibold">{service.name}</h3>
                    <Badge variant="outline">{service.category}</Badge>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Connect your {service.name} account to enable powerful integrations.
                </p>

                <Button variant="outline" className="w-full bg-transparent">
                  Configure
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
