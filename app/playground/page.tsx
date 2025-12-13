"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Play, Copy } from "lucide-react"

const apiEndpoints = [
  { value: "openai-completion", label: "OpenAI - Text Completion" },
  { value: "google-search", label: "Google - Web Search" },
  { value: "youtube-upload", label: "YouTube - Video Upload" },
  { value: "instagram-post", label: "Instagram - Create Post" },
]

const codeExamples = {
  "openai-completion": `import requests

# OpenAI Text Completion
response = requests.post('/api/openai/completion', {
    'prompt': 'Write a creative story about...',
    'max_tokens': 150,
    'temperature': 0.7
})

print(response.json())`,
  "google-search": `import requests

# Google Web Search
response = requests.get('/api/google/search', {
    'q': 'Python web development',
    'num': 10
})

results = response.json()
for item in results['items']:
    print(item['title'])`,
  "youtube-upload": `import requests

# YouTube Video Upload
files = {'video': open('video.mp4', 'rb')}
data = {
    'title': 'My Video Title',
    'description': 'Video description here',
    'tags': 'python,tutorial'
}

response = requests.post('/api/youtube/upload', 
                        files=files, data=data)
print(response.json())`,
  "instagram-post": `import requests

# Instagram Post Creation
files = {'image': open('photo.jpg', 'rb')}
data = {
    'caption': 'Check out this amazing photo! #photography',
    'location': 'New York, NY'
}

response = requests.post('/api/instagram/post', 
                        files=files, data=data)
print(response.json())`,
}

export default function APIPlayground() {
  const [selectedEndpoint, setSelectedEndpoint] = useState("openai-completion")
  const [response, setResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const runTest = async () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setResponse(
        JSON.stringify(
          {
            status: "success",
            data: {
              message: "API call completed successfully",
              timestamp: new Date().toISOString(),
              endpoint: selectedEndpoint,
            },
          },
          null,
          2,
        ),
      )
      setIsLoading(false)
    }, 2000)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(codeExamples[selectedEndpoint as keyof typeof codeExamples])
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">API Playground</h1>
          <p className="text-muted-foreground mt-2">Test your API integrations with live examples</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Code Editor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select API Endpoint</label>
                <Select value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {apiEndpoints.map((endpoint) => (
                      <SelectItem key={endpoint.value} value={endpoint.value}>
                        {endpoint.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Python Example</label>
                  <Button variant="ghost" size="sm" onClick={copyCode}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <div className="relative">
                  <Textarea
                    value={codeExamples[selectedEndpoint as keyof typeof codeExamples]}
                    readOnly
                    className="font-mono text-sm min-h-[300px] bg-muted"
                  />
                </div>
              </div>

              <Button onClick={runTest} disabled={isLoading} className="w-full">
                <Play className="w-4 h-4 mr-2" />
                {isLoading ? "Running Test..." : "Run Test"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Status</Badge>
                  <Badge variant={response ? "default" : "secondary"}>{response ? "Success" : "Ready"}</Badge>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">API Response</label>
                  <Textarea
                    value={response || 'Click "Run Test" to see the API response here...'}
                    readOnly
                    className="font-mono text-sm min-h-[300px] bg-muted"
                    placeholder="API response will appear here..."
                  />
                </div>

                {response && (
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(response)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Response
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
