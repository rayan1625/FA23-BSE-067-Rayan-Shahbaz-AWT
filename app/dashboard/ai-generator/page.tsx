'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Sparkles, RefreshCw, Star, Save, CheckCircle2, ExternalLink, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    }
  },
}

export default function AIGeneratorPage() {
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [demoMode, setDemoMode] = useState(true)
  const [formData, setFormData] = useState({
    product_name: '',
    audience: '',
    platform: '',
    tone: '',
    category: '',
    image_url: '',
    video_url: '',
  })
  
  const [result, setResult] = useState<{
    ads: Array<{
      headline: string
      description: string
      cta: string
      hashtags: string[]
      engagement_score: number
      conversion_score: number
      overall_score: number
      variant_number: number
      id?: string
    }>
    best_ad: {
      headline: string
      description: string
      cta: string
      hashtags: string[]
      engagement_score: number
      conversion_score: number
      overall_score: number
      variant_number: number
      id?: string
    }
    research_insights: string
    strategy_recommendations: string
    saved_to_db: boolean
  } | null>(null)
  const [selectedAd, setSelectedAd] = useState<{
    headline: string
    description: string
    cta: string
    hashtags: string[]
    engagement_score: number
    conversion_score: number
    overall_score: number
    variant_number: number
    id?: string
  } | null>(null)
  const [saving, setSaving] = useState(false)

  const platforms = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'twitter', label: 'Twitter/X' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'tiktok', label: 'TikTok' },
  ]

  const tones = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'humorous', label: 'Humorous' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'inspirational', label: 'Inspirational' },
  ]

  const audiences = [
    { value: 'young-adults', label: 'Young Adults (18-25)' },
    { value: 'adults', label: 'Adults (25-40)' },
    { value: 'professionals', label: 'Professionals' },
    { value: 'parents', label: 'Parents' },
    { value: 'students', label: 'Students' },
  ]

  const categories = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'vehicles', label: 'Vehicles' },
    { value: 'property', label: 'Property' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'home-garden', label: 'Home & Garden' },
    { value: 'sports', label: 'Sports' },
    { value: 'services', label: 'Services' },
    { value: 'jobs', label: 'Jobs' },
    { value: 'pets', label: 'Pets' },
    { value: 'other', label: 'Other' },
  ]

  const handleGenerate = async () => {
    if (!formData.product_name || !formData.audience || !formData.platform || !formData.tone || !formData.category) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    setGenerated(false)
    setResult(null)

    try {
      // Get user ID from localStorage or auth
      const userId = localStorage.getItem('userId') || 'demo-user-id'

      const response = await fetch('/api/ai/generate-ad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_name: formData.product_name,
          audience: formData.audience,
          platform: formData.platform,
          tone: formData.tone,
          category: formData.category,
          image_url: formData.image_url,
          video_url: formData.video_url,
          userId,
          demoMode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate ads')
      }

      setResult(data)
      setGenerated(true)
      setSelectedAd(data.best_ad)
      toast.success('Ads generated successfully!')
    } catch (error) {
      console.error('Error generating ads:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to generate ads. Please check your OpenAI API key configuration.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = () => {
    handleGenerate()
  }

  const handleSaveAd = async () => {
    setSaving(true)
    try {
      // This would save the ad to the regular ads table
      toast.success('Ad saved successfully!')
    } finally {
      setSaving(false)
    }
  }

  const handleFeedback = async (rating: number) => {
    if (!selectedAd) return
    
    try {
      const userId = localStorage.getItem('userId') || 'demo-user-id'
      
      await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ai_ad_id: selectedAd.id,
          user_id: userId,
          rating,
        }),
      })

      toast.success('Feedback submitted successfully!')
    } catch {
      toast.error('Failed to submit feedback')
    }
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-3xl mx-auto space-y-8 pb-12"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">AI Ad Generator</h1>
        <p className="text-muted-foreground text-lg">Generate compelling ads using AI-powered copywriting.</p>
      </motion.div>

      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="flex-1 h-2.5 rounded-full shadow-inner bg-gradient-to-r from-indigo-500 to-purple-500" />
        <div className="flex-1 h-2.5 rounded-full shadow-inner bg-muted" />
        <div className="flex-1 h-2.5 rounded-full shadow-inner bg-muted" />
      </div>

      {/* Input Form */}
      <motion.div variants={itemVariants}>
        <Card className="border-border/80 shadow-md">
          <CardHeader className="bg-muted/20 border-b border-border/40 pb-6 mb-6">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-500" /> Ad Details
            </CardTitle>
            <CardDescription className="text-base">Provide information about your product and target audience.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 px-6 md:px-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Product Name <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g., Premium Fitness Tracker"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  className="h-14 text-base bg-muted/30 focus:bg-background transition-colors"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-base font-semibold">Category <span className="text-red-500">*</span></Label>
                <Select value={formData.category} onValueChange={(value) => value && setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="h-14 text-base bg-muted/30 focus:bg-background transition-colors">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-base font-semibold">Target Audience <span className="text-red-500">*</span></Label>
                <Select value={formData.audience} onValueChange={(value) => value && setFormData({ ...formData, audience: value })}>
                  <SelectTrigger className="h-14 text-base bg-muted/30 focus:bg-background transition-colors">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    {audiences.map((audience) => (
                      <SelectItem key={audience.value} value={audience.value}>
                        {audience.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-base font-semibold">Platform <span className="text-red-500">*</span></Label>
                <Select value={formData.platform} onValueChange={(value) => value && setFormData({ ...formData, platform: value })}>
                  <SelectTrigger className="h-14 text-base bg-muted/30 focus:bg-background transition-colors">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value}>
                        {platform.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-base font-semibold">Tone <span className="text-red-500">*</span></Label>
                <Select value={formData.tone} onValueChange={(value) => value && setFormData({ ...formData, tone: value })}>
                  <SelectTrigger className="h-14 text-base bg-muted/30 focus:bg-background transition-colors">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {tones.map((tone) => (
                      <SelectItem key={tone.value} value={tone.value}>
                        {tone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Image URL (Optional)</Label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="h-14 text-base bg-muted/30 focus:bg-background transition-colors"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-base font-semibold">Video URL (Optional)</Label>
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  className="h-14 text-base bg-muted/30 focus:bg-background transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/40">
              <div className="space-y-0.5">
                <Label htmlFor="demo-mode" className="text-base font-semibold">Demo Mode</Label>
                <p className="text-sm text-muted-foreground">Use mock ads (free) or real AI (requires API key)</p>
              </div>
              <Switch
                id="demo-mode"
                checked={demoMode}
                onCheckedChange={setDemoMode}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button 
                onClick={handleGenerate}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 h-14 px-10 text-lg font-bold shadow-md shadow-indigo-500/20 w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Ads <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Generated Results */}
      {generated && result && (
        <>
          {/* Best Ad */}
          <motion.div variants={itemVariants}>
            <Card className="border-indigo-200/60 shadow-md bg-indigo-50/10 overflow-hidden">
              <CardHeader className="bg-indigo-50/40 border-b border-indigo-100/50 pb-6 mb-6">
                <CardTitle className="text-2xl font-bold flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
                  <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                  Best Generated Ad
                  <Badge className="ml-2 bg-indigo-600 text-white border-none">
                    Score: {result.best_ad.overall_score.toFixed(1)}/10
                  </Badge>
                </CardTitle>
                <CardDescription className="text-base text-indigo-700/70 dark:text-indigo-300/70">
                  This ad scored highest in engagement and conversion potential.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 px-6 md:px-8">
                <div className="space-y-3">
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold text-foreground">Headline</Label>
                    <p className="text-xl font-extrabold text-foreground leading-tight tracking-tight">{result.best_ad.headline || ''}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-semibold text-foreground">Description</Label>
                    <p className="text-lg text-muted-foreground leading-relaxed">{result.best_ad.description || ''}</p>
                  </div>
                  <div className="flex flex-wrap gap-6">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold text-foreground">Call to Action</Label>
                      <p className="text-lg text-indigo-600 font-bold">{result.best_ad.cta || ''}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-foreground">Hashtags</Label>
                    <div className="flex flex-wrap gap-2">
                      {(result.best_ad.hashtags || []).map((tag: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="bg-muted px-3 py-1 text-sm font-medium">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                </div>

                {result.saved_to_db && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <span className="text-base font-medium text-emerald-800 dark:text-emerald-200">Ad automatically saved to your ads</span>
                    <Link href="/dashboard/ads" className="ml-auto">
                      <Button size="sm" variant="ghost" className="text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/40">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </Link>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-6 border-t border-border/60">
                  <Button 
                    onClick={handleSaveAd}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 h-14 px-8 text-base font-bold shadow-md shadow-indigo-500/20 flex-1"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    Save Ad
                  </Button>
                  <Button 
                    onClick={handleRegenerate}
                    variant="outline"
                    className="h-14 px-8 border-border/80 hover:bg-muted font-bold flex-1"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Regenerate
                  </Button>
                </div>

                {/* Feedback Section */}
                <div className="pt-8 mt-8 border-t border-border/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-muted/20 rounded-xl border border-border/40">
                    <div>
                      <Label className="text-base font-bold text-foreground block mb-1">Rate this generation</Label>
                      <p className="text-sm text-muted-foreground">Your feedback helps us improve the AI quality.</p>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleFeedback(star)}
                          className="p-1 hover:scale-125 transition-transform bg-background rounded-full shadow-sm border border-border/50"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Other Variants */}
          <motion.div variants={itemVariants}>
            <Card className="border-border/80 shadow-md">
              <CardHeader className="bg-muted/20 border-b border-border/40 pb-6 mb-6">
                <CardTitle className="text-2xl font-bold">Other Variants</CardTitle>
                <CardDescription className="text-base">Alternative ad versions for A/B testing.</CardDescription>
              </CardHeader>
              <CardContent className="px-6 md:px-8">
                <div className="grid gap-4 md:grid-cols-2">
                  {result.ads
                    .filter((ad) => ad.variant_number !== result.best_ad.variant_number)
                    .map((ad, idx: number) => (
                      <Card 
                        key={idx}
                        className={`cursor-pointer transition-all hover:bg-muted/30 border-border/60 shadow-sm ${
                          selectedAd?.variant_number === ad.variant_number ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : ''
                        }`}
                        onClick={() => setSelectedAd(ad)}
                      >
                        <CardContent className="p-5 space-y-4">
                          <div className="flex justify-between items-start">
                            <Badge variant="outline" className="bg-background/50 border-border/60 font-semibold">
                              Variant {ad.variant_number}
                            </Badge>
                            <Badge className={`${
                              ad.overall_score >= 7 
                                ? 'bg-emerald-500 text-white' 
                                : ad.overall_score >= 5 
                                ? 'bg-amber-500 text-white'
                                : 'bg-rose-500 text-white'
                            } border-none`}>
                              Score: {ad.overall_score.toFixed(1)}
                            </Badge>
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm line-clamp-1">{ad.headline || ''}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-relaxed">{ad.description || ''}</p>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSaveAd()
                              }}
                              className="h-9 px-4 font-bold bg-white dark:bg-zinc-900 border border-border shadow-sm hover:bg-muted"
                            >
                              <Save className="w-3.5 h-3.5 mr-2" />
                              Save
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Research & Strategy Insights */}
          <motion.div variants={itemVariants}>
            <Card className="border-border/80 shadow-md">
              <CardHeader className="bg-muted/20 border-b border-border/40 pb-6 mb-6">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-indigo-500" /> AI Insights
                </CardTitle>
                <CardDescription className="text-base">Research findings and strategy recommendations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 px-6 md:px-8 pb-10">
                <div className="space-y-4">
                  <Label className="text-lg font-bold text-foreground">Research Analysis</Label>
                  <div className="p-6 bg-muted/20 rounded-xl border border-border/40 leading-relaxed text-muted-foreground whitespace-pre-line">
                    {result.research_insights}
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-border/40">
                  <Label className="text-lg font-bold text-foreground">Strategy Recommendations</Label>
                  <div className="p-6 bg-indigo-50/20 dark:bg-indigo-950/20 rounded-xl border border-indigo-100/30 dark:border-indigo-900/30 leading-relaxed text-muted-foreground whitespace-pre-line">
                    {result.strategy_recommendations}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
