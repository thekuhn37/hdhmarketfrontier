'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Upload, Trash2, FileText, AlertTriangle, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { DocumentItem, DocumentStatus } from '@/lib/data-license-benchmark/types'
import { uploadDocument, deleteDocument, getDocumentById } from '@/lib/data-license-benchmark/api'

const STATUS_CONFIG: Record<DocumentStatus, { label: string; className: string }> = {
  processed: {
    label: 'Processed',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  },
  processing: {
    label: 'Processing',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  },
  parser_required: {
    label: 'Parser Required',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  },
  unsupported: {
    label: 'Unsupported',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  },
  pending: {
    label: 'Pending',
    className: 'bg-[#F1F5F9] text-[#6B7280] dark:bg-white/5 dark:text-slate-400',
  },
}

const TERMINAL_STATUSES: DocumentStatus[] = ['processed', 'parser_required', 'unsupported', 'failed']

type FileStatus = 'queued' | 'uploading' | 'processing' | 'done' | 'failed'

interface QueuedFile {
  id: string
  file: File
  status: FileStatus
  message: string
  docId?: string
}

interface Props {
  documents: DocumentItem[]
  onClose: () => void
  onDelete: (id: string) => void
  onAdd: (doc: DocumentItem) => void
  onUpdate: (doc: DocumentItem) => void
  onRefreshExchanges: () => void
}

export default function DocManagementModal({
  documents, onClose, onDelete, onAdd, onUpdate, onRefreshExchanges,
}: Props) {
  const [queue, setQueue] = useState<QueuedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollingRefs = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map())

  useEffect(() => {
    return () => {
      pollingRefs.current.forEach(interval => clearInterval(interval))
    }
  }, [])

  function addFilesToQueue(files: FileList | File[]) {
    const pdfs = Array.from(files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'))
    if (pdfs.length === 0) return
    setQueue(prev => [
      ...prev,
      ...pdfs.map(f => ({
        id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
        file: f,
        status: 'queued' as FileStatus,
        message: '',
      })),
    ])
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    addFilesToQueue(e.dataTransfer.files)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragOver(false), [])

  function updateQueueItem(id: string, patch: Partial<QueuedFile>) {
    setQueue(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item))
  }

  function startPollingForItem(queueId: string, docId: string) {
    let attempts = 0
    const MAX_ATTEMPTS = 30
    const interval = setInterval(async () => {
      attempts++
      try {
        const doc = await getDocumentById(docId)
        onUpdate(doc)
        if (TERMINAL_STATUSES.includes(doc.status) || attempts >= MAX_ATTEMPTS) {
          clearInterval(interval)
          pollingRefs.current.delete(queueId)
          const finalStatus: FileStatus = doc.status === 'processed' ? 'done' : 'failed'
          const finalMsg =
            doc.status === 'processed' ? '✓ Processed'
            : doc.status === 'parser_required' ? '⚠ Parser required'
            : doc.status === 'failed' ? `✗ ${doc.errorMessage ?? 'Failed'}`
            : attempts >= MAX_ATTEMPTS ? '⚠ Timed out'
            : '✓ Done'
          updateQueueItem(queueId, { status: finalStatus, message: finalMsg })
          if (TERMINAL_STATUSES.includes(doc.status)) onRefreshExchanges()
        }
      } catch {
        if (attempts >= MAX_ATTEMPTS) {
          clearInterval(interval)
          pollingRefs.current.delete(queueId)
          updateQueueItem(queueId, { status: 'failed', message: '⚠ Status check timed out' })
        }
      }
    }, 2000)
    pollingRefs.current.set(queueId, interval)
  }

  async function handleUploadAll() {
    const queued = queue.filter(item => item.status === 'queued')
    if (queued.length === 0 || isUploading) return
    setIsUploading(true)

    for (const item of queued) {
      updateQueueItem(item.id, { status: 'uploading', message: 'Uploading…' })
      try {
        const result = await uploadDocument(item.file)
        const newDoc: DocumentItem = {
          id: result.documentId,
          title: item.file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '),
          exchange: result.exchange ?? 'Unknown',
          agreementType: 'Auto-detected',
          status: result.status,
          addedDate: new Date(),
          fileName: item.file.name,
          fileSize: item.file.size,
          parserRequiredReason:
            result.status === 'parser_required'
              ? 'No dedicated parser available for this exchange.'
              : undefined,
        }
        onAdd(newDoc)

        if (TERMINAL_STATUSES.includes(result.status)) {
          const msg =
            result.status === 'processed' ? '✓ Processed'
            : result.status === 'parser_required' ? '⚠ Parser required'
            : '✗ Failed'
          updateQueueItem(item.id, {
            status: result.status === 'processed' ? 'done' : 'failed',
            message: msg,
            docId: result.documentId,
          })
          onRefreshExchanges()
        } else {
          updateQueueItem(item.id, { status: 'processing', message: '⏳ Processing…', docId: result.documentId })
          startPollingForItem(item.id, result.documentId)
        }
      } catch {
        updateQueueItem(item.id, { status: 'failed', message: '✗ Upload failed' })
      }
    }

    setIsUploading(false)
  }

  function removeFromQueue(id: string) {
    setQueue(prev => prev.filter(item => item.id !== id))
  }

  function clearDoneItems() {
    setQueue(prev => prev.filter(item => item.status === 'queued' || item.status === 'uploading' || item.status === 'processing'))
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Remove "${title}" from the document library?`)) return
    setDeletingId(id)
    try {
      await deleteDocument(id)
      onDelete(id)
      onRefreshExchanges()
    } finally {
      setDeletingId(null)
    }
  }

  function formatBytes(bytes?: number): string {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  const queuedCount = queue.filter(i => i.status === 'queued').length
  const activeCount = queue.filter(i => i.status === 'uploading' || i.status === 'processing').length
  const doneCount = queue.filter(i => i.status === 'done' || i.status === 'failed').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#0F172A] rounded-2xl border border-[#E5E7EB] dark:border-white/10 shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] dark:border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText size={16} className="text-[#38BDF8]" />
            <h2 className="font-semibold text-sm text-[#0F172A] dark:text-white">Document Management</h2>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F1F5F9] dark:bg-white/5 text-[#6B7280] dark:text-slate-400">
              {documents.length} document{documents.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-white/5 text-[#6B7280] dark:text-slate-400 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Upload section */}
          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] dark:text-slate-500 mb-3">
              Add Documents
            </h3>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex flex-col items-center gap-2 px-6 py-6 rounded-xl border-2 border-dashed transition-colors cursor-pointer',
                isDragOver
                  ? 'border-[#38BDF8] bg-[#F0F9FF] dark:bg-[#38BDF8]/5'
                  : 'border-[#E5E7EB] dark:border-white/10 hover:border-[#38BDF8]/50 hover:bg-[#F8FAFC] dark:hover:bg-white/3',
              )}
            >
              <Upload size={20} className={isDragOver ? 'text-[#38BDF8]' : 'text-[#9CA3AF] dark:text-slate-500'} />
              <div className="text-center">
                <p className="text-sm text-[#4B5563] dark:text-slate-300">
                  Drop PDFs here or{' '}
                  <span className="text-[#38BDF8] font-medium">click to browse</span>
                </p>
                <p className="text-xs text-[#9CA3AF] dark:text-slate-500 mt-0.5">Multiple PDF files supported</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                multiple
                className="hidden"
                onChange={e => {
                  if (e.target.files) addFilesToQueue(e.target.files)
                  e.target.value = ''
                }}
              />
            </div>

            {/* Queue */}
            {queue.length > 0 && (
              <div className="mt-3 rounded-xl border border-[#E5E7EB] dark:border-white/10 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-[#F8FAFC] dark:bg-white/3 border-b border-[#E5E7EB] dark:border-white/10">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] dark:text-slate-500">
                    Upload Queue · {queue.length} file{queue.length !== 1 ? 's' : ''}
                  </span>
                  {doneCount > 0 && (
                    <button
                      onClick={clearDoneItems}
                      className="text-[10px] text-[#9CA3AF] dark:text-slate-500 hover:text-[#4B5563] dark:hover:text-slate-300 transition-colors"
                    >
                      Clear completed
                    </button>
                  )}
                </div>
                <ul className="divide-y divide-[#F1F5F9] dark:divide-white/5">
                  {queue.map(item => (
                    <li key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                      {/* Status icon */}
                      <div className="flex-shrink-0">
                        {item.status === 'queued' && <Clock size={13} className="text-[#9CA3AF] dark:text-slate-500" />}
                        {item.status === 'uploading' && <Loader2 size={13} className="animate-spin text-[#38BDF8]" />}
                        {item.status === 'processing' && <Loader2 size={13} className="animate-spin text-amber-500" />}
                        {item.status === 'done' && <CheckCircle size={13} className="text-emerald-500" />}
                        {item.status === 'failed' && <XCircle size={13} className="text-red-500" />}
                      </div>
                      {/* File info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#0F172A] dark:text-white truncate">{item.file.name}</p>
                        <p className="text-[10px] text-[#9CA3AF] dark:text-slate-500">
                          {formatBytes(item.file.size)}
                          {item.message && <> · <span className={cn(
                            item.message.startsWith('✓') ? 'text-emerald-600 dark:text-emerald-400' :
                            item.message.startsWith('⚠') ? 'text-amber-600 dark:text-amber-400' :
                            item.message.startsWith('✗') ? 'text-red-600 dark:text-red-400' :
                            'text-[#6B7280] dark:text-slate-400'
                          )}>{item.message}</span></>}
                        </p>
                      </div>
                      {/* Remove button (only for queued/failed) */}
                      {(item.status === 'queued' || item.status === 'failed') && (
                        <button
                          onClick={() => removeFromQueue(item.id)}
                          className="p-1 rounded text-[#9CA3AF] hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>

                {/* Upload button */}
                {queuedCount > 0 && (
                  <div className="px-3 py-3 border-t border-[#E5E7EB] dark:border-white/10 bg-[#F8FAFC] dark:bg-white/3">
                    <button
                      onClick={handleUploadAll}
                      disabled={isUploading}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F172A] dark:bg-[#38BDF8] text-white dark:text-[#0B1120] text-sm font-medium hover:bg-[#1E3A5F] dark:hover:bg-[#7DD3FC] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {isUploading
                        ? `Uploading…`
                        : `Upload ${queuedCount} file${queuedCount !== 1 ? 's' : ''}`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Parser notice */}
            <div className="mt-3 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
              <div className="flex items-start gap-2">
                <AlertTriangle size={12} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                  <span className="font-semibold">Note:</span> Documents from unrecognized exchanges may require
                  manual preprocessing in the backend service before analysis is available.
                </p>
              </div>
            </div>
          </section>

          {/* Document library */}
          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] dark:text-slate-500 mb-3">
              Document Library
            </h3>

            {documents.length === 0 ? (
              <div className="py-10 text-center rounded-xl border border-dashed border-[#E5E7EB] dark:border-white/10">
                <FileText size={24} className="text-[#9CA3AF] dark:text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-[#6B7280] dark:text-slate-400">No documents in library</p>
                <p className="text-xs text-[#9CA3AF] dark:text-slate-500 mt-1">Upload PDFs above to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] dark:border-white/10">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] dark:border-white/10 bg-[#F8FAFC] dark:bg-white/3">
                      {['Title', 'Exchange', 'Agreement Type', 'Status', 'Added', ''].map((h, i) => (
                        <th
                          key={i}
                          className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] dark:text-slate-500 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] dark:divide-white/5">
                    {documents.map(doc => (
                      <tr key={doc.id} className="hover:bg-[#F8FAFC] dark:hover:bg-white/3 transition-colors">
                        <td className="px-3 py-3 max-w-[180px]">
                          <a
                            href={`${process.env.NEXT_PUBLIC_LICENSE_POLICY_API_BASE_URL}/api/documents/${doc.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-[#0F172A] dark:text-white leading-snug truncate block hover:text-[#38BDF8] dark:hover:text-[#38BDF8] transition-colors"
                            title="Open PDF in new tab"
                          >
                            {doc.title}
                          </a>
                          <p className="text-[10px] text-[#9CA3AF] dark:text-slate-500 mt-0.5 truncate">
                            {doc.fileName}
                            {doc.fileSize ? ` · ${formatBytes(doc.fileSize)}` : ''}
                          </p>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0F172A] text-white dark:bg-[#1E3A5F] dark:text-[#38BDF8]">
                            {doc.exchange}
                          </span>
                        </td>
                        <td className="px-3 py-3 max-w-[140px]">
                          <p className="text-xs text-[#4B5563] dark:text-slate-300 truncate">{doc.agreementType}</p>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div>
                            <span
                              className={cn(
                                'px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap',
                                STATUS_CONFIG[doc.status].className,
                              )}
                            >
                              {STATUS_CONFIG[doc.status].label}
                            </span>
                            {doc.parserRequiredReason && (
                              <p className="text-[9px] text-amber-600 dark:text-amber-400 mt-0.5 max-w-[100px] leading-snug">
                                {doc.parserRequiredReason}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <p className="text-[10px] text-[#6B7280] dark:text-slate-400">
                            {new Date(doc.addedDate).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() => handleDelete(doc.id, doc.title)}
                            disabled={deletingId === doc.id}
                            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors disabled:opacity-50"
                            aria-label={`Delete ${doc.title}`}
                          >
                            {deletingId === doc.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
