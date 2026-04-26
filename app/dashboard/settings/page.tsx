'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Bell,
  Globe,
  Trash2,
  Shield,
  Lock,
  Download,
  Smartphone,
  CreditCard,
  Palette,
  Languages,
  Eye,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getUserSettings, updateUserSettings, createUserSettingsIfNotExists } from '@/lib/supabase/settings'

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

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

  useEffect(() => {
    setSupabase(createClient())
  }, [])
  
  // 2FA Settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorMethod, setTwoFactorMethod] = useState<'email' | 'authenticator'>('email')
  
  // Language & Region
  const [language, setLanguage] = useState('en')
  const [timezone, setTimezone] = useState('UTC+5')
  const [currency, setCurrency] = useState('PKR')
  
  // Privacy Controls
  const [showPhone, setShowPhone] = useState(true)
  const [showEmail, setShowEmail] = useState(false)
  const [profileVisibility, setProfileVisibility] = useState(true)
  const [privateMode, setPrivateMode] = useState(false)
  
  // Notification Settings
  const [emailAdApproved, setEmailAdApproved] = useState(true)
  const [emailAdRejected, setEmailAdRejected] = useState(true)
  const [emailPaymentVerified, setEmailPaymentVerified] = useState(true)
  const [inAppNotifications, setInAppNotifications] = useState(true)
  const [soundNotifications, setSoundNotifications] = useState(false)
  
  // Ad Preferences
  const [defaultCategory, setDefaultCategory] = useState('all')
  const [defaultCity, setDefaultCity] = useState('all')
  const [autoRenewAds, setAutoRenewAds] = useState(false)
  const [featuredAdPreference, setFeaturedAdPreference] = useState(false)
  
  // UI Personalization
  const [themeColor, setThemeColor] = useState('indigo')
  const [compactMode, setCompactMode] = useState(false)
  const [cardListView, setCardListView] = useState(true)

  const loadSettings = useCallback(async () => {
    if (!supabase) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await createUserSettingsIfNotExists(user.id)
      
      const settings = await getUserSettings(user.id)
      if (settings) {
        setTwoFactorEnabled(settings.two_factor_enabled)
        setTwoFactorMethod(settings.two_factor_method)
        setLanguage(settings.language)
        setTimezone(settings.timezone)
        setCurrency(settings.currency)
        setShowPhone(settings.show_phone)
        setShowEmail(settings.show_email)
        setProfileVisibility(settings.profile_visibility)
        setPrivateMode(settings.private_mode)
        setEmailAdApproved(settings.email_ad_approved)
        setEmailAdRejected(settings.email_ad_rejected)
        setEmailPaymentVerified(settings.email_payment_verified)
        setInAppNotifications(settings.in_app_notifications)
        setSoundNotifications(settings.sound_notifications)
        setDefaultCategory(settings.default_category)
        setDefaultCity(settings.default_city)
        setAutoRenewAds(settings.auto_renew_ads)
        setFeaturedAdPreference(settings.featured_ad_preference)
        setThemeColor(settings.theme_color)
        setCompactMode(settings.compact_mode)
        setCardListView(settings.card_list_view)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Auto-save effect
  useEffect(() => {
    if (loading || !supabase) return

    const timer = setTimeout(async () => {
      setSaving(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await updateUserSettings(user.id, {
          two_factor_enabled: twoFactorEnabled,
          two_factor_method: twoFactorMethod,
          language,
          timezone,
          currency,
          show_phone: showPhone,
          show_email: showEmail,
          profile_visibility: profileVisibility,
          private_mode: privateMode,
          email_ad_approved: emailAdApproved,
          email_ad_rejected: emailAdRejected,
          email_payment_verified: emailPaymentVerified,
          in_app_notifications: inAppNotifications,
          sound_notifications: soundNotifications,
          default_category: defaultCategory,
          default_city: defaultCity,
          auto_renew_ads: autoRenewAds,
          featured_ad_preference: featuredAdPreference,
          theme_color: themeColor,
          compact_mode: compactMode,
          card_list_view: cardListView
        })

        setLastSaved(new Date())
      } catch (error) {
        console.error('Error saving settings:', error)
        toast.error('Failed to save settings')
      } finally {
        setSaving(false)
      }
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [
    loading,
    twoFactorEnabled, twoFactorMethod, language, timezone, currency,
    showPhone, showEmail, profileVisibility, privateMode,
    emailAdApproved, emailAdRejected, emailPaymentVerified,
    inAppNotifications, soundNotifications,
    defaultCategory, defaultCity, autoRenewAds, featuredAdPreference,
    themeColor, compactMode, cardListView,
    supabase
  ])

  const handleDeleteAccount = async () => {
    if (!supabase) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('No user found')
        return
      }

      // Delete user's ads
      const { error: adsError } = await supabase
        .from('ads')
        .delete()
        .eq('user_id', user.id)

      if (adsError) {
        console.error('Error deleting ads:', adsError)
      }

      // Delete user's settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', user.id)

      if (settingsError) {
        console.error('Error deleting settings:', settingsError)
      }

      // Delete user from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id)

      if (authError) {
        toast.error('Failed to delete account. Please contact support.')
        return
      }

      toast.success('Account deleted successfully')
      setDeleteDialogOpen(false)
      
      // Redirect to home
      window.location.href = '/'
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account')
    }
  }

  const handleExportData = async () => {
    if (!supabase) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all user data
      const [adsData, settingsData, profileData] = await Promise.all([
        supabase.from('ads').select('*').eq('user_id', user.id),
        supabase.from('user_settings').select('*').eq('user_id', user.id),
        supabase.from('users').select('*').eq('id', user.id).single()
      ])

      const exportData = {
        profile: profileData.data,
        settings: settingsData.data,
        ads: adsData.data,
        exportedAt: new Date().toISOString()
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `adflow-export-${user.id}-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Data exported successfully!')
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export data')
    }
  }

  const handleLogoutAllDevices = async () => {
    if (!supabase) return
    try {
      await supabase.auth.signOut({ scope: 'global' })
      toast.success('Logged out from all devices')
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error('Failed to logout from all devices')
    }
  }

  const securityLogs = [
    { device: 'Chrome on Windows', location: 'Lahore, Pakistan', time: '2 hours ago', ip: '192.168.1.1' },
    { device: 'Safari on iPhone', location: 'Karachi, Pakistan', time: '1 day ago', ip: '192.168.1.2' },
    { device: 'Firefox on Mac', location: 'Islamabad, Pakistan', time: '3 days ago', ip: '192.168.1.3' },
  ]

  const billingHistory = [
    { id: 'INV-001', date: 'Jan 15, 2024', amount: 'PKR 5,000', status: 'Paid' },
    { id: 'INV-002', date: 'Feb 15, 2024', amount: 'PKR 5,000', status: 'Paid' },
    { id: 'INV-003', date: 'Mar 15, 2024', amount: 'PKR 5,000', status: 'Paid' },
  ]

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 max-w-4xl"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-foreground">Settings</h1>
          <p className="text-muted-foreground text-lg">Manage your account settings and preferences.</p>
        </div>
        {saving ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Saving...
          </div>
        ) : lastSaved && (
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--success))]">
            <CheckCircle2 className="w-4 h-4" />
            Saved {lastSaved.toLocaleTimeString()}
          </div>
        )}
      </motion.div>

      {/* Security Section */}
      <motion.div variants={itemVariants}>
        <Card className="af-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Shield className="w-5 h-5 text-primary" /> Security
            </CardTitle>
            <CardDescription>Manage your account security and authentication.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 2FA */}
            <div className="flex items-center justify-between py-3 border-b border-border/10">
              <div>
                <p className="font-bold text-sm text-foreground">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground mt-0.5">Add an extra layer of security to your account.</p>
              </div>
              <Switch 
                checked={twoFactorEnabled}
                onCheckedChange={setTwoFactorEnabled}
                className="data-[state=checked]:bg-[hsl(var(--primary))]"
              />
            </div>
            
            {twoFactorEnabled && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pb-4"
              >
                <div>
                  <Label className="text-sm font-semibold">2FA Method</Label>
                  <Select value={twoFactorMethod} onValueChange={(value) => value && setTwoFactorMethod(value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email OTP</SelectItem>
                      <SelectItem value="authenticator">Google Authenticator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}

            {/* Security Logs */}
            <div>
              <p className="font-bold text-sm text-foreground mb-3">Recent Security Activity</p>
              <div className="space-y-3">
                {securityLogs.map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{log.device}</p>
                        <p className="text-xs text-muted-foreground">{log.location} • {log.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={handleLogoutAllDevices}>
                <Lock className="w-4 h-4 mr-2" /> Logout from all devices
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Language & Region */}
      <motion.div variants={itemVariants}>
        <Card className="af-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Globe className="w-5 h-5 text-primary" /> Language & Region
            </CardTitle>
            <CardDescription>Set your language, timezone, and currency preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label className="text-sm font-semibold">Language</Label>
                <Select value={language} onValueChange={(value) => value && setLanguage(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ur">اردو (Urdu)</SelectItem>
                    <SelectItem value="ar">العربية (Arabic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold">Timezone</Label>
                <Select value={timezone} onValueChange={(value) => value && setTimezone(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC+5">UTC+5 (Pakistan)</SelectItem>
                    <SelectItem value="UTC+0">UTC+0 (London)</SelectItem>
                    <SelectItem value="UTC-5">UTC-5 (New York)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold">Currency</Label>
                <Select value={currency} onValueChange={(value) => value && setCurrency(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PKR">PKR (Pakistani Rupee)</SelectItem>
                    <SelectItem value="USD">USD (US Dollar)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Privacy Controls */}
      <motion.div variants={itemVariants}>
        <Card className="af-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Eye className="w-5 h-5 text-primary" /> Privacy Controls
            </CardTitle>
            <CardDescription>Manage your profile visibility and data sharing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between py-3 border-b border-border/10">
              <div>
                <p className="font-bold text-sm text-foreground">Show Phone Number</p>
                <p className="text-xs text-muted-foreground mt-0.5">Display your phone number in ad listings.</p>
              </div>
              <Switch 
                checked={showPhone}
                onCheckedChange={setShowPhone}
                className="data-[state=checked]:bg-[hsl(var(--primary))]"
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border/10">
              <div>
                <p className="font-bold text-sm text-foreground">Show Email Publicly</p>
                <p className="text-xs text-muted-foreground mt-0.5">Allow others to see your email address.</p>
              </div>
              <Switch 
                checked={showEmail}
                onCheckedChange={setShowEmail}
                className="data-[state=checked]:bg-[hsl(var(--primary))]"
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border/10">
              <div>
                <p className="font-bold text-sm text-foreground">Profile Visibility</p>
                <p className="text-xs text-muted-foreground mt-0.5">Make your profile visible to other users.</p>
              </div>
              <Switch 
                checked={profileVisibility}
                onCheckedChange={setProfileVisibility}
                className="data-[state=checked]:bg-[hsl(var(--primary))]"
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-bold text-sm text-foreground">Private Mode</p>
                <p className="text-xs text-muted-foreground mt-0.5">Hide your activity from other users.</p>
              </div>
              <Switch 
                checked={privateMode}
                onCheckedChange={setPrivateMode}
                className="data-[state=checked]:bg-[hsl(var(--primary))]"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div variants={itemVariants}>
        <Card className="af-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Bell className="w-5 h-5 text-primary" /> Notifications
            </CardTitle>
            <CardDescription>Choose how and when you want to be notified.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="font-bold text-sm text-foreground mb-3">Email Notifications</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div>
                    <p className="font-medium text-sm text-foreground">Ad Approved</p>
                    <p className="text-xs text-muted-foreground">Get notified when your ad is approved.</p>
                  </div>
                  <Switch 
                    checked={emailAdApproved}
                    onCheckedChange={setEmailAdApproved}
                    className="data-[state=checked]:bg-[hsl(var(--primary))]"
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div>
                    <p className="font-medium text-sm text-foreground">Ad Rejected</p>
                    <p className="text-xs text-muted-foreground">Get notified when your ad is rejected.</p>
                  </div>
                  <Switch 
                    checked={emailAdRejected}
                    onCheckedChange={setEmailAdRejected}
                    className="data-[state=checked]:bg-[hsl(var(--primary))]"
                  />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-sm text-foreground">Payment Verified</p>
                    <p className="text-xs text-muted-foreground">Receive receipt when payment is verified.</p>
                  </div>
                  <Switch 
                    checked={emailPaymentVerified}
                    onCheckedChange={setEmailPaymentVerified}
                    className="data-[state=checked]:bg-[hsl(var(--primary))]"
                  />
                </div>
              </div>
            </div>
            <div>
              <p className="font-bold text-sm text-foreground mb-3">In-App Notifications</p>
              <div className="flex items-center justify-between py-3 border-b border-border/10">
                <div>
                  <p className="font-medium text-sm text-foreground">Enable Notifications</p>
                  <p className="text-xs text-muted-foreground">Show notifications in the app.</p>
                </div>
                <Switch 
                  checked={inAppNotifications}
                  onCheckedChange={setInAppNotifications}
                  className="data-[state=checked]:bg-[hsl(var(--primary))]"
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm text-foreground">Sound Notifications</p>
                  <p className="text-xs text-muted-foreground">Play sound for new notifications.</p>
                </div>
                <Switch 
                  checked={soundNotifications}
                  onCheckedChange={setSoundNotifications}
                  className="data-[state=checked]:bg-[hsl(var(--primary))]"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Billing */}
      <motion.div variants={itemVariants}>
        <Card className="af-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CreditCard className="w-5 h-5 text-primary" /> Billing & Payments
            </CardTitle>
            <CardDescription>View your payment history and manage billing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-bold text-sm text-foreground mb-3">Payment History</p>
              <div className="space-y-2">
                {billingHistory.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">{invoice.id}</p>
                      <p className="text-xs text-muted-foreground">{invoice.date}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-foreground">{invoice.amount}</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${invoice.status === 'Paid' ? 'bg-[hsl(var(--success))] text-white' : 'bg-[hsl(var(--warning))] text-white'}`}>
                        {invoice.status}
                      </span>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border/10">
              <div>
                <p className="font-bold text-sm text-foreground">Default Payment Method</p>
                <p className="text-xs text-muted-foreground mt-0.5">Visa ending in 4242</p>
              </div>
              <Button variant="outline" size="sm">Update</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ad Preferences */}
      <motion.div variants={itemVariants}>
        <Card className="af-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Languages className="w-5 h-5 text-primary" /> Ad Preferences
            </CardTitle>
            <CardDescription>Set your default preferences for creating ads.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-semibold">Default Category</Label>
                <Select value={defaultCategory} onValueChange={(value) => value && setDefaultCategory(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="vehicles">Vehicles</SelectItem>
                    <SelectItem value="property">Property</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold">Default City</Label>
                <Select value={defaultCity} onValueChange={(value) => value && setDefaultCity(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    <SelectItem value="lahore">Lahore</SelectItem>
                    <SelectItem value="karachi">Karachi</SelectItem>
                    <SelectItem value="islamabad">Islamabad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-border/10">
              <div>
                <p className="font-bold text-sm text-foreground">Auto-Renew Ads</p>
                <p className="text-xs text-muted-foreground mt-0.5">Automatically renew your ads before they expire.</p>
              </div>
              <Switch 
                checked={autoRenewAds}
                onCheckedChange={setAutoRenewAds}
                className="data-[state=checked]:bg-[hsl(var(--primary))]"
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-bold text-sm text-foreground">Featured Ad Preference</p>
                <p className="text-xs text-muted-foreground mt-0.5">Default to featured when creating ads.</p>
              </div>
              <Switch 
                checked={featuredAdPreference}
                onCheckedChange={setFeaturedAdPreference}
                className="data-[state=checked]:bg-[hsl(var(--primary))]"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* UI Personalization */}
      <motion.div variants={itemVariants}>
        <Card className="af-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Palette className="w-5 h-5 text-primary" /> UI Personalization
            </CardTitle>
            <CardDescription>Customize your interface appearance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Theme Color</Label>
              <div className="flex gap-3 mt-2">
                {['indigo', 'violet', 'rose', 'emerald', 'cyan'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setThemeColor(color)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      themeColor === color 
                        ? 'border-[hsl(var(--primary))] scale-110' 
                        : 'border-border/50 hover:border-border'
                    }`}
                    style={{ backgroundColor: color === 'indigo' ? '#6366f1' : color === 'violet' ? '#8b5cf6' : color === 'rose' ? '#f43f5e' : color === 'emerald' ? '#10b981' : '#06b6d4' }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-border/10">
              <div>
                <p className="font-bold text-sm text-foreground">Compact Mode</p>
                <p className="text-xs text-muted-foreground mt-0.5">Use a more compact interface layout.</p>
              </div>
              <Switch 
                checked={compactMode}
                onCheckedChange={setCompactMode}
                className="data-[state=checked]:bg-[hsl(var(--primary))]"
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-bold text-sm text-foreground">Card View</p>
                <p className="text-xs text-muted-foreground mt-0.5">Display ads as cards instead of list.</p>
              </div>
              <Switch 
                checked={cardListView}
                onCheckedChange={setCardListView}
                className="data-[state=checked]:bg-[hsl(var(--primary))]"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Data Management */}
      <motion.div variants={itemVariants}>
        <Card className="af-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Download className="w-5 h-5 text-primary" /> Data Management
            </CardTitle>
            <CardDescription>Export or delete your data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border/10">
              <div>
                <p className="font-bold text-sm text-foreground">Export Data</p>
                <p className="text-xs text-muted-foreground mt-0.5">Download all your data in JSON format.</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportData}>
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-bold text-sm text-foreground">Delete All Ads</p>
                <p className="text-xs text-muted-foreground mt-0.5">Remove all your ads from the platform.</p>
              </div>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" /> Delete All
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div variants={itemVariants}>
        <Card className="border-[hsl(var(--danger))]/20 bg-[hsl(var(--danger))]/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--danger))]">
              <Trash2 className="w-5 h-5" /> Danger Zone
            </CardTitle>
            <CardDescription className="text-[hsl(var(--danger))]/70">These actions are irreversible.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[hsl(var(--danger))]/10">
              <div>
                <p className="font-bold text-sm text-[hsl(var(--danger))]">Delete Account</p>
                <p className="text-xs text-muted-foreground mt-0.5">Permanently delete your account and all data.</p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                className="bg-[hsl(var(--danger))] hover:bg-[hsl(var(--danger))]/90"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete Account
              </Button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-bold text-sm text-[hsl(var(--danger))]">Reset All Settings</p>
                <p className="text-xs text-muted-foreground mt-0.5">Restore all settings to default values.</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-[hsl(var(--danger))] text-[hsl(var(--danger))] hover:bg-[hsl(var(--danger))]/10"
              >
                Reset Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="border-border/10 bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[hsl(var(--danger))]">
              <Trash2 className="w-5 h-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-border/50">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              className="bg-[hsl(var(--danger))] hover:bg-[hsl(var(--danger))]/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

