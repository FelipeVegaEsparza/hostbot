'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from '@/components/i18n-provider'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { KnowledgeBase, KnowledgeItem } from '@/types'

export default function KnowledgeBaseDetailPage() {
  const params = useParams()
  const locale = params.locale as string
  const id = params.id as string
  const t = useTranslations('knowledge')
  const tCommon = useTranslations('common')
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null)
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  })

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const loadData = async () => {
    try {
      const [kbData, itemsData] = await Promise.all([
        api.getKnowledgeBase(id) as Promise<KnowledgeBase>,
        api.getKnowledgeItems(id) as Promise<KnowledgeItem[]>,
      ])
      setKnowledgeBase(kbData)
      setItems(itemsData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await api.createKnowledgeItem(id, formData)
      setShowCreateDialog(false)
      setFormData({ title: '', content: '' })
      loadData()
    } catch (error) {
      console.error('Failed to create item:', error)
    }
  }

  const handleDelete = async () => {
    if (!selectedItem) return
    try {
      await api.deleteKnowledgeItem(selectedItem)
      setShowDeleteDialog(false)
      setSelectedItem(null)
      loadData()
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }

  if (loading) {
    return <div>{tCommon('loading')}</div>
  }

  if (!knowledgeBase) {
    return <div>{t('knowledgeBaseNotFound')}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/dashboard/knowledge`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{knowledgeBase.name}</h1>
          <p className="text-muted-foreground">
            {knowledgeBase.description || t('form.noDescription')}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addItem')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('items')}</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">{t('noItemsYet')}</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('addFirstItem')}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('itemTitle')}</TableHead>
                  <TableHead>{t('contentPreview')}</TableHead>
                  <TableHead className="w-[100px]">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {item.content}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedItem(item.id)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('addItemDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('addItemDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('form.title')}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('form.titlePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">{t('form.content')}</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder={t('form.contentPlaceholder')}
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleCreate}>{t('actions.addItem')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteItemDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('deleteItemDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {tCommon('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
