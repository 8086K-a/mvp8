"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const popularSearches = ["Google", "YouTube", "Netflix", "Amazon", "TikTok", "Instagram"]

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filteredSuggestions = popularSearches.filter((site) => site.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="max-w-2xl mx-auto mb-8 relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Search from 300+ websites..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="pl-12 pr-4 py-4 text-lg rounded-2xl border-2 border-blue-200 focus:border-blue-500 shadow-lg"
        />
        <Sparkles className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
      </div>

      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
          <div className="p-4">
            <div className="text-sm text-gray-500 mb-3">Popular searches</div>
            <div className="flex flex-wrap gap-2">
              {filteredSuggestions.map((suggestion) => (
                <Badge
                  key={suggestion}
                  variant="secondary"
                  className="cursor-pointer hover:bg-blue-100 hover:text-blue-700"
                  onClick={() => setSearchQuery(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
