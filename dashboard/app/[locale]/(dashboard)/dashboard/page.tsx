'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from '@/components/i18n-provider'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, MessageSquare, TrendingUp, Users, Database, MessageCircle } from 'lucide-react'
import { UsageStats } from '@/types'

export default function DashboardPage() {
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common')
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await api.getUsageStats() as UsageStats
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>{tCommon('loading')}</div>
  }

  const usagePercentage = stats
    ? Math.round((stats.messagesThisMonth / stats.messagesLimit) * 100)
    : 0

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header con gradiente */}
      <div className="animate-fade-in-up">
        <h1 className="text-4xl font-bold gradient-text-primary mb-2">
          {t('title')}
        </h1>
        <p className="text-muted-foreground text-lg">{t('welcomeBack')}</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Active Chatbots Card */}
        <Card className="glass hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 overflow-hidden group relative animate-scale-in">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500" />

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-foreground/80">
              {t('stats.activeChatbots')}
            </CardTitle>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/50 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
              <Bot className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              {stats?.chatbotsActive || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              {t('stats.chatbotsActive')}
            </p>
          </CardContent>
        </Card>

        {/* Total Conversations Card */}
        <Card className="glass hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 overflow-hidden group relative animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all duration-500" />

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-foreground/80">
              {t('stats.totalConversations')}
            </CardTitle>
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/50 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-400 bg-clip-text text-transparent">
              {stats?.conversationsTotal || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              {t('stats.allTimeConversations')}
            </p>
          </CardContent>
        </Card>

        {/* Messages This Month Card */}
        <Card className="glass hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 overflow-hidden group relative animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-500" />

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-foreground/80">
              {t('stats.messagesThisMonth')}
            </CardTitle>
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg shadow-purple-500/50 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-400 bg-clip-text text-transparent">
              {stats?.messagesThisMonth || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('stats.ofLimit', { limit: stats?.messagesLimit || 0 })}
            </p>
          </CardContent>
        </Card>

        {/* Usage Percentage Card */}
        <Card className="glass hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 overflow-hidden group relative animate-scale-in" style={{ animationDelay: '0.3s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-amber-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all duration-500" />

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-foreground/80">
              {t('stats.usage')}
            </CardTitle>
            <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/50 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-400 bg-clip-text text-transparent">
              {usagePercentage}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('stats.ofMonthlyQuota')}
            </p>
            {/* Progress bar */}
            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Card */}
      <Card className="glass shadow-xl hover:shadow-2xl transition-all duration-500 border-0 overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <span className="text-3xl animate-bounce-subtle">⚡</span>
            <span className="gradient-text-primary">{t('quickActions.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 relative z-10">
          <a
            href={`/${locale}/dashboard/chatbots`}
            className="block rounded-xl border border-white/20 p-5 bg-gradient-to-r from-transparent to-transparent hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30 transition-all duration-500 hover:shadow-lg hover:scale-[1.02] group/item relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-indigo-500/0 group-hover/item:from-blue-500/5 group-hover/item:to-indigo-500/5 transition-all duration-500" />
            <h3 className="font-semibold text-lg group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors flex items-center gap-2">
              <Bot className="h-5 w-5 group-hover/item:scale-110 transition-transform" />
              {t('quickActions.createChatbot')}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t('quickActions.createChatbotDesc')}
            </p>
          </a>

          <a
            href={`/${locale}/dashboard/knowledge`}
            className="block rounded-xl border border-white/20 p-5 bg-gradient-to-r from-transparent to-transparent hover:from-purple-50/50 hover:to-pink-50/50 dark:hover:from-purple-950/30 dark:hover:to-pink-950/30 transition-all duration-500 hover:shadow-lg hover:scale-[1.02] group/item relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-pink-500/0 group-hover/item:from-purple-500/5 group-hover/item:to-pink-500/5 transition-all duration-500" />
            <h3 className="font-semibold text-lg group-hover/item:text-purple-600 dark:group-hover/item:text-purple-400 transition-colors flex items-center gap-2">
              <Database className="h-5 w-5 group-hover/item:scale-110 transition-transform" />
              {t('quickActions.addKnowledge')}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t('quickActions.addKnowledgeDesc')}
            </p>
          </a>

          <a
            href={`/${locale}/dashboard/whatsapp`}
            className="block rounded-xl border border-white/20 p-5 bg-gradient-to-r from-transparent to-transparent hover:from-green-50/50 hover:to-emerald-50/50 dark:hover:from-green-950/30 dark:hover:to-emerald-950/30 transition-all duration-500 hover:shadow-lg hover:scale-[1.02] group/item relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 to-emerald-500/0 group-hover/item:from-green-500/5 group-hover/item:to-emerald-500/5 transition-all duration-500" />
            <h3 className="font-semibold text-lg group-hover/item:text-green-600 dark:group-hover/item:text-green-400 transition-colors flex items-center gap-2">
              <MessageCircle className="h-5 w-5 group-hover/item:scale-110 transition-transform" />
              {t('quickActions.connectWhatsapp')}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t('quickActions.connectWhatsappDesc')}
            </p>
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
