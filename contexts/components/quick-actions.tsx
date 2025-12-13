import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Zap } from "lucide-react"

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Integration
          </Button>
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Zap className="w-4 h-4" />
            Add Service
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
