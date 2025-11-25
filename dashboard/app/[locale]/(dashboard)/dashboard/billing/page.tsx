'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from '@/components/i18n-provider'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Download } from 'lucide-react'
import { Subscription, Invoice } from '@/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function BillingPage() {
  const t = useTranslations('billing')
  const tCommon = useTranslations('common')
  
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [subData, invoicesData] = await Promise.all([
        api.getSubscription() as Promise<Subscription>,
        api.getInvoices() as Promise<Invoice[]>,
      ])
      setSubscription(subData)
      setInvoices(invoicesData)
    } catch (error) {
      console.error('Failed to load billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>{tCommon('loading')}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>{t('currentPlan')}</CardTitle>
            <CardDescription>{t('subscriptionDetails')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{subscription.plan?.name}</h3>
                <p className="text-muted-foreground">
                  ${Number(subscription.plan?.price || 0).toFixed(2)} {t('perMonth')}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${
                subscription.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-700'
                  : subscription.status === 'SUSPENDED'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {t(`status.${subscription.status.toLowerCase()}`)}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">{t('maxChatbots')}</p>
                <p className="text-lg font-semibold">{subscription.plan?.maxChatbots}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('maxMessages')}</p>
                <p className="text-lg font-semibold">
                  {(subscription.plan?.maxMessagesPerMonth || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('nextBilling')}</p>
                <p className="text-lg font-semibold">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline">
                <CreditCard className="mr-2 h-4 w-4" />
                {t('updatePayment')}
              </Button>
              <Button variant="outline">
                {t('changePlan')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('invoices')}</CardTitle>
          <CardDescription>{t('billingHistory')}</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('noInvoices')}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('invoiceNumber')}</TableHead>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('amount')}</TableHead>
                  <TableHead>{tCommon('status')}</TableHead>
                  <TableHead>{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      ${Number(invoice.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        invoice.status === 'PAID'
                          ? 'bg-green-100 text-green-700'
                          : invoice.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {t(`status.${invoice.status.toLowerCase()}`)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" title={t('download')}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
