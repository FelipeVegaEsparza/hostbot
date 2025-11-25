'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from '@/components/i18n-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, QrCode } from 'lucide-react'

export default function WhatsAppPage() {
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations('whatsapp')
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('integration.title')}</h1>
        <p className="text-muted-foreground">
          {t('integration.subtitle')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-primary" />
              <CardTitle>{t('cloudApi.title')}</CardTitle>
            </div>
            <CardDescription>
              {t('cloudApi.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>{t('cloudApi.features.official')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>{t('cloudApi.features.verified')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>{t('cloudApi.features.limits')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>{t('cloudApi.features.reliability')}</span>
              </li>
            </ul>
            <Button asChild className="w-full">
              <Link href={`/${locale}/dashboard/whatsapp/cloud`}>
                {t('cloudApi.configure')}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <QrCode className="h-6 w-6 text-primary" />
              <CardTitle>{t('qrCode.title')}</CardTitle>
            </div>
            <CardDescription>
              {t('qrCode.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>{t('qrCode.features.quickSetup')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>{t('qrCode.features.personal')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>{t('qrCode.features.noApproval')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">⚠</span>
                <span>{t('qrCode.features.lowerLimits')}</span>
              </li>
            </ul>
            <Button asChild className="w-full" variant="outline">
              <Link href={`/${locale}/dashboard/whatsapp/qr`}>
                {t('qrCode.manage')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('gettingStarted.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">{t('cloudApi.title')}</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>{t('cloudApi.gettingStarted.steps.1')}</li>
              <li>{t('cloudApi.gettingStarted.steps.2')}</li>
              <li>{t('cloudApi.gettingStarted.steps.3')}</li>
              <li>{t('cloudApi.gettingStarted.steps.4')}</li>
              <li>{t('cloudApi.gettingStarted.steps.5')}</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">{t('qrCode.title')}</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>{t('qrCode.gettingStarted.steps.1')}</li>
              <li>{t('qrCode.gettingStarted.steps.2')}</li>
              <li>{t('qrCode.gettingStarted.steps.3')}</li>
              <li>{t('qrCode.gettingStarted.steps.4')}</li>
              <li>{t('qrCode.gettingStarted.steps.5')}</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
