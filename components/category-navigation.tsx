"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"

const categories = [
  { id: "all", name: "All Sites", count: 300 },
  { id: "social", name: "Social Media", count: 45 },
  { id: "video", name: "Video", count: 32 },
  { id: "shopping", name: "Shopping", count: 28 },
  { id: "tools", name: "Tools", count: 67 },
  { id: "news", name: "News", count: 24 },
  { id: "finance", name: "Finance", count: 19 },
  { id: "education", name: "Education", count: 31 },
]

const filters = [
  { id: "popular", name: "Most Popular", active: true },
  { id: "recent", name: "Recently Added", active: false },
  { id: "login", name: "Login Enabled", active: false },
]

export function CategoryNavigation() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [activeFilters, setActiveFilters] = useState(["popular"])

  const toggleFilter = (filterId: string) => {
    setActiveFilters((prev) => (prev.includes(filterId) ? prev.filter((f) => f !== filterId) : [...prev, filterId]))
  }

  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 mb-8 -mx-4 px-4 py-4">
      <div className="flex flex-col gap-4">
        {/* Categories */}
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category.id)}
              className={`whitespace-nowrap ${
                activeCategory === category.id
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
              }`}
            >
              {category.name}
              <Badge variant="secondary" className="ml-2 text-xs">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <div className="flex gap-2">
            {filters.map((filter) => (
              <Badge
                key={filter.id}
                variant={activeFilters.includes(filter.id) ? "default" : "outline"}
                className={`cursor-pointer ${
                  activeFilters.includes(filter.id)
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "hover:bg-blue-50 hover:text-blue-700"
                }`}
                onClick={() => toggleFilter(filter.id)}
              >
                {filter.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
