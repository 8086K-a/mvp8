import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Activity, Link } from "lucide-react"

const stats = [
  {
    title: "Connected Services",
    value: "8",
    icon: Link,
    description: "+2 from last month",
    trend: "up",
  },
  {
    title: "API Usage",
    value: "12.4K",
    icon: Activity,
    description: "Requests this month",
    trend: "up",
  },
  {
    title: "Active Integrations",
    value: "24",
    icon: Zap,
    description: "4 pending setup",
    trend: "neutral",
  },
]

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
