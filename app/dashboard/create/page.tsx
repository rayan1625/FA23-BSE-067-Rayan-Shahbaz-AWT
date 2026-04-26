'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowRight, Image as ImageIcon, Link as LinkIcon, Loader2, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'

export default function CreateAdPage() {
  const [step] = useState(1)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [city, setCity] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [tempImageUrl, setTempImageUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [tempVideoUrl, setTempVideoUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const [categories, setCategories] = useState<{id: number, name: string}[]>([])
  const [cities, setCities] = useState<{id: number, name: string, state: string, country: string}[]>([])

  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const [catRes, cityRes] = await Promise.all([
        supabase.from('categories').select('id, name').order('name'),
        supabase.from('cities').select('id, name, state, country').order('name'),
      ])
      if (catRes.data) setCategories(catRes.data)
      if (cityRes.data) setCities(cityRes.data)
    }
    void loadData()
  }, [])

  const handleAddImage = () => {
    if (!tempImageUrl.trim()) return
    if (!tempImageUrl.startsWith('http')) {
      toast.error('Please enter a valid image URL')
      return
    }
    setImageUrls([...imageUrls, tempImageUrl])
    setTempImageUrl('')
    toast.success('Image added')
  }

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index))
  }

  const handleAddVideo = () => {
    if (!tempVideoUrl.trim()) return
    if (!tempVideoUrl.includes('youtube.com') && !tempVideoUrl.includes('youtu.be')) {
      toast.error('Please enter a valid YouTube URL')
      return
    }
    setVideoUrl(tempVideoUrl)
    setTempVideoUrl('')
    toast.success('Video link added')
  }

  const handleGenerateWithAI = async () => {
    if (!title.trim()) {
      toast.error('Please enter an Ad Title before generating a description.')
      return
    }
    setIsGenerating(true)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, price }),
      })
      const data = await res.json()
      if (data.success) {
        setDescription(data.text)
        if (data.isMock) {
          toast.info(data.message || 'AI fallback description used.')
        } else {
          toast.success('AI description generated!')
        }
      } else {
        toast.error(data.error || 'AI generation failed. Please try again.')
      }
    } catch {
      toast.error('Network error. Could not reach AI service.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category || !city) {
      toast.error('Please select a category and city')
      return
    }

    const userId = localStorage.getItem('userId') || 'demo-user-id'

    try {
      const response = await fetch('/api/ads/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          price,
          category: parseInt(category),
          city: parseInt(city),
          imageUrls,
          videoUrl,
          userId,
          is_featured: false,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create ad')
      }

      toast.success('Ad created successfully! Moving to package selection.')
      router.push('/dashboard/create/package')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      console.error('Error creating ad:', error)
      toast.error('Failed to create ad. Please try again.')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Create New Ad</h1>
        <p className="text-muted-foreground text-lg">Fill in the details below to list your item or service.</p>
      </div>

      <div className="flex items-center gap-3 mb-8 px-2">
        <div className={`flex-1 h-2.5 rounded-full shadow-inner ${step >= 1 ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-muted'}`} />
        <div className={`flex-1 h-2.5 rounded-full shadow-inner ${step >= 2 ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-muted'}`} />
        <div className={`flex-1 h-2.5 rounded-full shadow-inner ${step >= 3 ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-muted'}`} />
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-border/80 shadow-md">
          <CardHeader className="bg-muted/20 border-b border-border/40 pb-6 mb-6">
            <CardTitle className="text-2xl font-bold">Basic Information</CardTitle>
            <CardDescription className="text-base">Give your listing a catchy title and detailed description.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 px-6 md:px-8">
            <div className="space-y-3">
              <Label htmlFor="title" className="text-base font-semibold">Ad Title <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                placeholder="e.g. 2022 Tesla Model 3 Long Range"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-14 text-base bg-muted/30 focus:bg-background transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="category" className="text-base font-semibold">Category <span className="text-red-500">*</span></Label>
                <Select required value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="h-14 text-base bg-muted/30 focus:bg-background transition-colors">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label htmlFor="city" className="text-base font-semibold">City <span className="text-red-500">*</span></Label>
                <Select required value={city} onValueChange={setCity}>
                  <SelectTrigger id="city" className="h-14 text-base bg-muted/30 focus:bg-background transition-colors">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}, {c.state || c.country}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="price" className="text-base font-semibold">Price ($) <span className="text-red-500">*</span></Label>
              <Input
                id="price"
                type="number"
                placeholder="0.00"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-14 text-base bg-muted/30 focus:bg-background transition-colors"
              />
            </div>

            <div className="space-y-3">
               <div className="flex justify-between items-end">
                  <Label htmlFor="description" className="text-base font-semibold">Description <span className="text-red-500">*</span></Label>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={handleGenerateWithAI}
                    disabled={isGenerating}
                    className="h-9 px-4 font-bold border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 disabled:opacity-60"
                  >
                    {isGenerating ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" /> Generate with AI</>
                    )}
                  </Button>
               </div>
              <Textarea
                id="description"
                placeholder="Describe what you are selling, its condition, and other key details..."
                className="min-h-[200px] resize-y text-base bg-muted/30 focus:bg-background transition-colors p-4"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="pt-8 mt-8 border-t border-border/60">
              <h3 className="text-xl font-bold mb-2">Media Links</h3>
              <p className="text-base text-muted-foreground mb-6">You can provide external image URLs or a YouTube video link. We automatically normalize and optimize them.</p>
              
              <div className="space-y-6 bg-muted/20 p-6 rounded-xl border border-border/40">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                    <div className="flex-1 space-y-2 w-full">
                      <Label className="font-semibold">Image URL</Label>
                      <div className="relative">
                        <ImageIcon className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                        <Input 
                          placeholder="https://unsplash.com/photos/..." 
                          className="pl-12 h-14 bg-background" 
                          value={tempImageUrl}
                          onChange={(e) => setTempImageUrl(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button type="button" variant="secondary" onClick={handleAddImage} className="h-14 px-8 w-full sm:w-auto font-bold shadow-sm">Add Image</Button>
                  </div>

                  {imageUrls.length > 0 && (
                    <div className="flex flex-wrap gap-4 mt-4">
                      {imageUrls.map((url, i) => (
                        <div key={i} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-border shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Ad draft ${i}`} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => handleRemoveImage(i)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end border-t border-border/40 pt-6">
                  <div className="flex-1 space-y-2 w-full">
                    <Label className="font-semibold">YouTube Video</Label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                      <Input 
                        placeholder="https://youtube.com/watch?v=..." 
                        className="pl-12 h-14 bg-background" 
                        value={tempVideoUrl}
                        onChange={(e) => setTempVideoUrl(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button type="button" variant="secondary" onClick={handleAddVideo} className="h-14 px-8 w-full sm:w-auto font-bold shadow-sm">Add Video</Button>
                </div>

                {videoUrl && (
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-8 h-8 rounded bg-red-500 flex items-center justify-center shrink-0">
                        <LinkIcon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium truncate">{videoUrl}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setVideoUrl('')} className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-8 flex justify-end">
              <Button type="submit" size="lg" className="bg-indigo-600 hover:bg-indigo-700 h-14 px-10 text-lg font-bold shadow-md shadow-indigo-500/20">
                Save & Continue <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
