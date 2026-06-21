'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ActivitySparkIcon,
  CalendarRangeIcon,
  PauseIcon,
  PlayIcon,
} from '@hugeicons/core-free-icons'
import { CardTypeIcon } from '@/components/card/CardTypeIcon'
import { StatusIcon } from '@/components/card/StatusIcon'
import { useBoardStore } from '@/lib/store/board'
import { useT } from '@/lib/i18n'
import { shouldStartBoardPan } from '@/lib/board-pan'
import { tagColor } from '@/lib/tag-color'
import { formatRelative } from '@/lib/utils'
import { ALL_STATUSES } from '@/lib/types'
import type {
  ActivityCardSnapshot,
  ActivityEvent,
  ActivityRange,
  CardStatus,
} from '@/lib/types'

type RangePreset = 'today' | 'week' | 'month' | 'custom' | 'all'

const STATUS_KEY: Record<CardStatus, string> = {
  inbox: 'column.inbox',
  shape: 'column.shape',
  ready: 'column.ready',
  doing: 'column.doing',
  review: 'column.review',
  done: 'column.done',
  killed: 'column.killed',
}

const PLAYBACK_INTERVAL_MS = 780
const CARD_LAYOUT_TRANSITION = {
  layout: { type: 'spring', stiffness: 430, damping: 34, mass: 0.75 },
  opacity: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
  scale: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
  rotate: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
}

export function JourneyView() {
  const { project } = useBoardStore()
  const t = useT()
  const [preset, setPreset] = useState<RangePreset>('week')
  const [isPlaying, setIsPlaying] = useState(false)
  const [playhead, setPlayhead] = useState(0)
  const [baselineEvents, setBaselineEvents] = useState<ActivityEvent[]>([])
  const [rangeEvents, setRangeEvents] = useState<ActivityEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [customStart, setCustomStart] = useState(toDateInput(startOfDay(new Date())))
  const [customEnd, setCustomEnd] = useState(toDateInput(endOfDay(new Date())))
  const [isPanning, setIsPanning] = useState(false)
  const panRef = useRef<{ pointerId: number; x: number } | null>(null)
  const journeyScrollRef = useRef<HTMLDivElement>(null)

  const range = useMemo(() => getRange(preset, customStart, customEnd), [preset, customStart, customEnd])

  useEffect(() => {
    if (!project || !window.electronAPI) return

    let cancelled = false
    setIsLoading(true)
    setIsPlaying(false)
    setPlayhead(0)

    async function load() {
      const baselineRange = range.start
        ? { end: new Date(new Date(range.start).getTime() - 1).toISOString() }
        : null
      const [baseline, scoped] = await Promise.all([
        baselineRange ? window.electronAPI.getActivityEvents(project!.path, baselineRange) : Promise.resolve([]),
        window.electronAPI.getActivityEvents(project!.path, range),
      ])

      if (cancelled) return
      setBaselineEvents(baseline.filter(isCardEvent))
      setRangeEvents(scoped.filter(isCardEvent))
      setIsLoading(false)
    }

    load().catch(() => {
      if (!cancelled) {
        setBaselineEvents([])
        setRangeEvents([])
        setIsLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [project, range])

  useEffect(() => {
    if (!isPlaying) return
    if (playhead >= rangeEvents.length) {
      setIsPlaying(false)
      return
    }

    const timer = window.setTimeout(() => {
      setPlayhead(value => Math.min(value + 1, rangeEvents.length))
    }, PLAYBACK_INTERVAL_MS)

    return () => window.clearTimeout(timer)
  }, [isPlaying, playhead, rangeEvents.length])

  const baselineState = useMemo(() => {
    return applyEvents(new Map(), baselineEvents)
  }, [baselineEvents])

  const visibleCards = useMemo(() => {
    return applyEvents(new Map(baselineState), rangeEvents.slice(0, playhead))
  }, [baselineState, playhead, rangeEvents])

  const grouped = useMemo(() => {
    const columns: Record<CardStatus, ActivityCardSnapshot[]> = {
      inbox: [],
      shape: [],
      ready: [],
      doing: [],
      review: [],
      done: [],
      killed: [],
    }

    for (const card of Array.from(visibleCards.values())) {
      columns[card.status].push(card)
    }

    for (const status of ALL_STATUSES) {
      columns[status].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    }

    return columns
  }, [visibleCards])

  const activeEvent = playhead > 0 ? rangeEvents[playhead - 1] : null
  const activeCardId = activeEvent?.cardId ?? null
  const activeStatus = activeEvent?.after?.status ?? activeEvent?.before?.status ?? null

  if (!project) return null

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-bg">
      <JourneyToolbar
        preset={preset}
        isPlaying={isPlaying}
        hasEvents={rangeEvents.length > 0}
        customStart={customStart}
        customEnd={customEnd}
        onPresetChange={value => setPreset(value)}
        onTogglePlaying={() => setIsPlaying(value => !value)}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <JourneyAtmosphere
          activeEventId={activeEvent?.id ?? null}
          isPlaying={isPlaying}
          playhead={playhead}
          totalEvents={rangeEvents.length}
        />
        <LayoutGroup id="journey-board">
          <div
            ref={journeyScrollRef}
            className={`relative z-10 flex flex-1 gap-px overflow-x-auto overflow-y-hidden bg-transparent ${
              isPanning ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onPointerDown={event => {
              if (event.pointerType !== 'mouse' || !shouldStartBoardPan(event)) return
              panRef.current = { pointerId: event.pointerId, x: event.clientX }
              setIsPanning(true)
              event.currentTarget.setPointerCapture(event.pointerId)
              event.preventDefault()
            }}
            onPointerMove={event => {
              const pan = panRef.current
              if (!pan || pan.pointerId !== event.pointerId) return
              const scrollEl = journeyScrollRef.current
              if (!scrollEl) return

              scrollEl.scrollLeft -= event.clientX - pan.x
              pan.x = event.clientX
            }}
            onPointerUp={event => {
              const pan = panRef.current
              if (!pan || pan.pointerId !== event.pointerId) return
              panRef.current = null
              setIsPanning(false)
              event.currentTarget.releasePointerCapture(event.pointerId)
            }}
            onPointerCancel={event => {
              const pan = panRef.current
              if (!pan || pan.pointerId !== event.pointerId) return
              panRef.current = null
              setIsPanning(false)
            }}
          >
            {ALL_STATUSES.map((status, index) => (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.035, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                className="group h-full border-e border-border-subtle last:border-e-0 bg-surface-1"
              >
                <JourneyColumn
                  status={status}
                  label={t(STATUS_KEY[status])}
                  cards={grouped[status]}
                  activeCardId={activeCardId}
                  isActiveColumn={status === activeStatus}
                  emptyLabel={t('board.empty')}
                />
              </motion.div>
            ))}
          </div>
        </LayoutGroup>
      </div>

      <JourneyStrip
        events={rangeEvents}
        playhead={playhead}
        activeEvent={activeEvent}
        isLoading={isLoading}
        onScrub={value => {
          setIsPlaying(false)
          setPlayhead(value)
        }}
      />
    </div>
  )
}

function JourneyAtmosphere({
  activeEventId,
  isPlaying,
  playhead,
  totalEvents,
}: {
  activeEventId: string | null
  isPlaying: boolean
  playhead: number
  totalEvents: number
}) {
  const progress = totalEvents > 0 ? Math.round((playhead / totalEvents) * 100) : 0

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0,transparent_13.9%,var(--border-subtle)_14%,transparent_14.2%,transparent_28.3%,var(--border-subtle)_28.5%,transparent_28.7%,transparent_42.7%,var(--border-subtle)_42.9%,transparent_43.1%,transparent_57.1%,var(--border-subtle)_57.3%,transparent_57.5%,transparent_71.5%,var(--border-subtle)_71.7%,transparent_71.9%,transparent_85.8%,var(--border-subtle)_86%,transparent_86.2%)] opacity-70" />
      <motion.div
        className="absolute inset-y-0 start-0 w-[22rem] bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.045),var(--accent-soft),transparent)] blur-sm"
        animate={{ x: `${progress}%`, opacity: isPlaying ? 0.8 : 0.42 }}
        transition={{ type: 'spring', stiffness: 90, damping: 24 }}
      />
      <motion.div
        className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,var(--accent-soft),transparent)]"
        animate={{ opacity: isPlaying ? [0.18, 0.36, 0.18] : 0.18 }}
        transition={{ duration: 1.8, repeat: isPlaying ? Infinity : 0, ease: 'easeInOut' }}
      />
      <AnimatePresence>
        {activeEventId && (
          <motion.div
            key={activeEventId}
            className="absolute inset-x-0 top-0 h-full bg-[linear-gradient(115deg,transparent_20%,rgba(255,255,255,0.075)_45%,var(--accent-soft)_50%,transparent_66%)]"
            initial={{ opacity: 0, x: '-45%' }}
            animate={{ opacity: [0, 0.9, 0], x: '45%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.82, ease: [0.16, 1, 0.3, 1] }}
          />
        )}
      </AnimatePresence>
      <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(0deg,var(--bg),transparent)]" />
    </div>
  )
}

function JourneyToolbar({
  preset,
  isPlaying,
  hasEvents,
  customStart,
  customEnd,
  onPresetChange,
  onTogglePlaying,
  onCustomStartChange,
  onCustomEndChange,
}: {
  preset: RangePreset
  isPlaying: boolean
  hasEvents: boolean
  customStart: string
  customEnd: string
  onPresetChange: (preset: RangePreset) => void
  onTogglePlaying: () => void
  onCustomStartChange: (date: string) => void
  onCustomEndChange: (date: string) => void
}) {
  const t = useT()

  return (
    <header className="shrink-0 border-b border-border-subtle bg-surface-1 px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex h-8 items-center gap-2 px-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-accent-border bg-accent-soft text-accent">
            <HugeiconsIcon icon={ActivitySparkIcon} size={14} strokeWidth={1.6} />
          </span>
          <span className="text-sm font-medium text-text-primary">{t('journey.title')}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Segmented
            label={t('journey.range')}
            value={preset}
            options={[
              ['today', t('journey.today')],
              ['week', t('journey.week')],
              ['month', t('journey.month')],
              ['custom', t('journey.custom')],
              ['all', t('journey.all')],
            ]}
            onChange={value => onPresetChange(value as RangePreset)}
          />

          <button
            onClick={onTogglePlaying}
            disabled={!hasEvents}
            title={isPlaying ? t('journey.pause') : t('journey.play')}
            aria-label={isPlaying ? t('journey.pause') : t('journey.play')}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle bg-accent text-accent-contrast transition-all hover:scale-[1.03] hover:shadow-[0_0_18px_var(--accent-soft)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <HugeiconsIcon icon={isPlaying ? PauseIcon : PlayIcon} size={15} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {preset === 'custom' && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
          <DateField label={t('journey.from')} value={customStart} onChange={onCustomStartChange} />
          <DateField label={t('journey.to')} value={customEnd} onChange={onCustomEndChange} />
        </div>
      )}
    </header>
  )
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center gap-2">
      <HugeiconsIcon icon={CalendarRangeIcon} size={13} strokeWidth={1.5} className="text-text-muted" />
      {label}
      <input
        type="date"
        value={value}
        onChange={event => onChange(event.target.value)}
        className="h-8 rounded-md border border-border-subtle bg-surface-2 px-2 text-text-secondary focus:outline-none focus:border-accent-border"
      />
    </label>
  )
}

function JourneyStrip({
  events,
  playhead,
  activeEvent,
  isLoading,
  onScrub,
}: {
  events: ActivityEvent[]
  playhead: number
  activeEvent: ActivityEvent | null
  isLoading: boolean
  onScrub: (playhead: number) => void
}) {
  const t = useT()

  return (
    <footer className="shrink-0 border-t border-border-subtle bg-surface-1 px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between gap-3 text-[11px] text-text-muted">
        <span>{isLoading ? t('journey.loading') : `${events.length} ${t('journey.events')}`}</span>
        <span className="truncate text-text-secondary">{activeEvent ? formatRelative(activeEvent.createdAt) : t('journey.recordingStarts')}</span>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={events.length}
          value={playhead}
          onChange={event => onScrub(Number(event.target.value))}
          className="h-1 flex-1 accent-[var(--accent)]"
        />
        <span className="w-14 text-end text-[11px] text-text-muted">
          {playhead}/{events.length}
        </span>
      </div>

      <div className="mt-2 flex h-5 items-center gap-1 overflow-x-auto">
        {events.length === 0 && (
          <p className="text-xs text-text-muted">
            {t('journey.noEvents')} {t('journey.recordingStarts')}
          </p>
        )}
        {events.map((event, index) => (
          <button
            key={event.id}
            onClick={() => onScrub(index + 1)}
            aria-label={`${index + 1}`}
            className={`h-2.5 shrink-0 rounded-full border transition-all duration-300 ${
              index < playhead
                ? 'w-8 border-accent bg-accent shadow-[0_0_14px_var(--accent-soft)]'
                : 'w-2.5 border-border-strong bg-surface-3 hover:w-5 hover:border-accent-border'
            }`}
            title={eventSentence(event)}
          />
        ))}
      </div>
    </footer>
  )
}

function JourneyColumn({
  status,
  label,
  cards,
  activeCardId,
  isActiveColumn,
  emptyLabel,
}: {
  status: CardStatus
  label: string
  cards: ActivityCardSnapshot[]
  activeCardId: string | null
  isActiveColumn: boolean
  emptyLabel: string
}) {
  return (
    <div className="relative flex flex-col w-72 shrink-0 h-full transition-all duration-200 border-x border-transparent">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,var(--accent-soft),transparent_36%)]"
        animate={{ opacity: isActiveColumn ? 0.52 : 0 }}
        transition={{ duration: 0.35 }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-accent"
        animate={{ opacity: isActiveColumn ? 1 : 0, scaleX: isActiveColumn ? 1 : 0.2 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
      />
      <div className="relative flex shrink-0 items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <StatusIcon status={status} size={14} />
          <span className="text-sm font-medium text-text-primary">{label}</span>
          <span className="text-xs text-text-muted bg-surface-3 rounded px-1.5 py-0.5 min-w-[20px] text-center">
            {cards.length}
          </span>
        </div>
      </div>

      <div className="relative flex-1 column-scroll px-2 pb-3 space-y-2">
        <AnimatePresence initial={false}>
          {cards.map(card => (
            <JourneyCard key={card.id} card={card} isActive={card.id === activeCardId} />
          ))}
        </AnimatePresence>

        {cards.length === 0 && (
          <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-border-subtle/50 bg-surface-2/10">
            <span className="text-xs text-text-muted/80">{emptyLabel}</span>
          </div>
        )}
      </div>
    </div>
  )
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-danger',
  high: 'bg-warning',
  normal: 'bg-transparent',
  low: 'bg-transparent',
}

const PRIORITY_KEY: Record<string, string> = {
  urgent: 'priority.urgent',
  high: 'priority.high',
  normal: 'priority.normal',
  low: 'priority.low',
}

function JourneyCard({ card, isActive }: { card: ActivityCardSnapshot; isActive: boolean }) {
  const t = useT()

  return (
    <motion.div
      layout
      layoutId={`journey-card-${card.id}`}
      initial={{ opacity: 0, y: 18, scale: 0.96, rotate: -1.2, filter: 'blur(4px)' }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        rotate: 0,
        filter: 'blur(0px)',
      }}
      exit={{ opacity: 0, scale: 0.92, y: -10, rotate: 1.4, filter: 'blur(3px)' }}
      transition={CARD_LAYOUT_TRANSITION}
      className={`group/card relative cursor-default overflow-hidden rounded-lg border bg-surface-2 p-3 transition-colors duration-300 focus:outline-none focus-visible:outline-none ${
        isActive
          ? 'border-accent-border bg-accent-soft/20 shadow-[0_12px_30px_rgba(0,0,0,0.2)]'
          : 'border-border-subtle'
      }`}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,var(--accent-soft),transparent_72%)]"
        initial={false}
        animate={{ opacity: isActive ? 0.72 : 0 }}
        transition={{ duration: 0.34 }}
      />
      {isActive && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-accent" />
      )}

      {card.priority !== 'normal' && card.priority !== 'low' && (
        <span
          className={`absolute top-3 end-3 w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[card.priority]}`}
          title={t(PRIORITY_KEY[card.priority])}
        />
      )}

      <div className="relative flex items-start gap-2">
        <div className="mt-0.5 shrink-0 rounded">
          <StatusIcon status={card.status} size={15} />
        </div>
        <div className="mt-0.5 shrink-0">
          <CardTypeIcon type={card.type} size={13} />
        </div>
        <p className="text-sm text-text-primary leading-snug line-clamp-2 flex-1 min-w-0 pe-3">
          {card.title}
        </p>
      </div>

      {card.tags.length > 0 && (
        <div className="relative flex flex-wrap gap-1 mt-2 ms-10">
          {card.tags.slice(0, 4).map(tag => {
            const c = tagColor(tag)
            return (
              <span
                key={tag}
                className="text-[11px] rounded px-1.5 py-0.5 border transition-all duration-150 cursor-default"
                style={{ color: c.text, background: c.bg, borderColor: c.border }}
              >
                #{tag}
              </span>
            )
          })}
          {card.tags.length > 4 && (
            <span className="text-[11px] text-text-muted">+{card.tags.length - 4}</span>
          )}
        </div>
      )}

      <div className="relative mt-2 ms-10 text-[11px] text-text-muted opacity-0 group-hover/card:opacity-100 transition-opacity">
        {formatRelative(card.updatedAt)}
      </div>
    </motion.div>
  )
}

function Segmented({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<[string, string]>
  onChange: (value: string) => void
}) {
  return (
    <div className="flex h-8 items-center gap-1 rounded-md border border-border-subtle bg-surface-2 px-1">
      <span className="px-1 text-[11px] text-text-muted">{label}</span>
      {options.map(([optionValue, optionLabel]) => (
        <button
          key={optionValue}
          onClick={() => onChange(optionValue)}
          className={`h-6 rounded px-2 text-[11px] transition-colors ${
            value === optionValue
              ? 'bg-accent-soft text-text-primary'
              : 'text-text-muted hover:bg-surface-3 hover:text-text-secondary'
          }`}
        >
          {optionLabel}
        </button>
      ))}
    </div>
  )
}

function getRange(preset: RangePreset, customStart: string, customEnd: string): ActivityRange {
  const now = new Date()

  if (preset === 'all') return {}
  if (preset === 'today') return { start: startOfDay(now).toISOString(), end: endOfDay(now).toISOString() }
  if (preset === 'week') return { start: startOfWeek(now).toISOString(), end: endOfDay(now).toISOString() }
  if (preset === 'month') return { start: startOfMonth(now).toISOString(), end: endOfDay(now).toISOString() }

  return {
    start: startOfDay(new Date(`${customStart}T00:00:00`)).toISOString(),
    end: endOfDay(new Date(`${customEnd}T00:00:00`)).toISOString(),
  }
}

function applyEvents(
  initial: Map<string, ActivityCardSnapshot>,
  events: ActivityEvent[]
): Map<string, ActivityCardSnapshot> {
  const cards = new Map(initial)

  for (const event of events) {
    if (!event.cardId) continue
    if (event.kind === 'card.deleted') {
      cards.delete(event.cardId)
      continue
    }
    if (event.after) {
      cards.set(event.cardId, event.after)
    }
  }

  return cards
}

function isCardEvent(event: ActivityEvent): boolean {
  return event.kind.startsWith('card.')
}

function eventSentence(event: ActivityEvent): string {
  const title = event.cardTitle ?? event.after?.title ?? event.before?.title ?? 'Untitled'

  if (event.kind === 'card.created') return `Created "${title}"`
  if (event.kind === 'card.deleted') return `Deleted "${title}"`
  if (event.kind === 'card.restored') return `Restored "${title}"`
  if (event.kind === 'card.moved') {
    const before = event.before?.status
    const after = event.after?.status
    return before && after ? `Moved "${title}" from ${before} to ${after}` : `Moved "${title}"`
  }
  return `Updated "${title}"`
}

function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function endOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(23, 59, 59, 999)
  return copy
}

function startOfWeek(date: Date): Date {
  const copy = startOfDay(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  return copy
}

function startOfMonth(date: Date): Date {
  const copy = startOfDay(date)
  copy.setDate(1)
  return copy
}

function toDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
