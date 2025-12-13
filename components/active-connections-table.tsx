"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Unplug } from "lucide-react"

const connections = [
  {
    id: 1,
    service: "OpenAI GPT",
    logo: "🤖",
    connectionDate: "2024-01-15",
    status: "Active",
    lastUsed: "2 hours ago",
  },
  {
    id: 2,
    service: "Google APIs",
    logo: "🔍",
    connectionDate: "2024-01-10",
    status: "Active",
    lastUsed: "1 hour ago",
  },
  {
    id: 3,
    service: "Instagram",
    logo: "📸",
    connectionDate: "2024-01-08",
    status: "Error",
    lastUsed: "1 day ago",
  },
  {
    id: 4,
    service: "Slack",
    logo: "💬",
    connectionDate: "2024-01-05",
    status: "Active",
    lastUsed: "3 hours ago",
  },
]

export function ActiveConnectionsTable() {
  const [sortBy, setSortBy] = useState<"service" | "date" | "status">("date")

  const sortedConnections = [...connections].sort((a, b) => {
    switch (sortBy) {
      case "service":
        return a.service.localeCompare(b.service)
      case "status":
        return a.status.localeCompare(b.status)
      case "date":
      default:
        return new Date(b.connectionDate).getTime() - new Date(a.connectionDate).getTime()
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Connections</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:text-foreground" onClick={() => setSortBy("service")}>
                Service
              </TableHead>
              <TableHead className="cursor-pointer hover:text-foreground" onClick={() => setSortBy("date")}>
                Connection Date
              </TableHead>
              <TableHead className="cursor-pointer hover:text-foreground" onClick={() => setSortBy("status")}>
                Status
              </TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedConnections.map((connection) => (
              <TableRow key={connection.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{connection.logo}</span>
                    {connection.service}
                  </div>
                </TableCell>
                <TableCell>{connection.connectionDate}</TableCell>
                <TableCell>
                  <Badge variant={connection.status === "Active" ? "default" : "destructive"}>
                    {connection.status}
                  </Badge>
                </TableCell>
                <TableCell>{connection.lastUsed}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Unplug className="mr-2 h-4 w-4" />
                        Disconnect
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {connections.length} of {connections.length} connections
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
