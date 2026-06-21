'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CardTypeIcon } from '@/components/card/CardTypeIcon'
import { StatusIcon } from '@/components/card/StatusIcon'
import { useBoardStore } from '@/lib/store/board'
import { useT } from '@/lib/i18n'
import { tagColor } from '@/lib/tag-color'
import { ALL_STATUSES } from '@/lib/types'
import type {
  ActivityCardSnapshot,
  ActivityEvent,
  ActivityRange,
  CardStatus,
  JourneyReplayMode,
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

const SPEEDS = [0.5, 1, 2, 4]

export function JourneyView() {
  const { project } = useBoardStore()
  const t = useT()
  const [preset, setPreset] = useState<RangePreset>('week')
  const [mode, setMode] = useState<JourneyReplayMode>('range-state')
  const [speed, setSpeed] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playhead, setPlayhead] = useState(0)
  const [baselineEvents, setBaselineEvents] = useState<ActivityEvent[]>([])
  const [rangeEvents, setRangeEvents] = useState<ActivityEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [customStart, setCustomStart] = useState(toDateInput(startOfDay(new Date())))
  const [customEnd, setCustomEnd] = useState(toDateInput(endOfDay(new Date())))

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
    }, 850 / speed)

    return () => window.clearTimeout(timer)
  }, [isPlaying, playhead, rangeEvents.length, speed])

  const affectedCardIds = useMemo(() => {
    return new Set(rangeEvents.map(event => event.cardId).filter(Boolean) as string[])
  }, [rangeEvents])

  const baselineState = useMemo(() => {
    return mode === 'range-state' ? applyEvents(new Map(), baselineEvents) : new Map<string, ActivityCardSnapshot>()
  }, [baselineEvents, mode])

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

  const baselineCardIds = useMemo(() => new Set(Array.from(baselineState.keys())), [baselineState])

  const activeEvent = playhead > 0 ? rangeEvents[playhead - 1] : null
  const activeCardId = activeEvent?.cardId

  if (!project) return null

  return (
    <div className="flex h-full flex-col overflow-hidden bg-bg">
      <JourneyToolbar
        preset={preset}
        mode={mode}
        speed={speed}
        isPlaying={isPlaying}
        hasEvents={rangeEvents.length > 0}
        customStart={customStart}
        customEnd={customEnd}
        onPresetChange={value => setPreset(value)}
        onModeChange={value => {
          setMode(value)
          setPlayhead(0)
        }}
        onSpeedChange={setSpeed}
        onTogglePlaying={() => setIsPlaying(value => !value)}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex flex-1 gap-px overflow-x-auto overflow-y-hidden bg-bg">
          {ALL_STATUSES.map(status => (
            <JourneyColumn
              key={status}
              status={status}
              label={t(STATUS_KEY[status])}
              cards={grouped[status]}
              activeCardId={activeCardId}
              affectedCardIds={affectedCardIds}
              baselineCardIds={baselineCardIds}
              emptyLabel={t('board.empty')}
            />
          ))}
        </div>
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

function JourneyToolbar({
  preset,
  mode,
  speed,
  isPlaying,
  hasEvents,
  customStart,
  customEnd,
  onPresetChange,
  onModeChange,
  onSpeedChange,
  onTogglePlaying,
  onCustomStartChange,
  onCustomEndChange,
}: {
  preset: RangePreset
  mode: JourneyReplayMode
  speed: number
  isPlaying: boolean
  hasEvents: boolean
  customStart: string
  customEnd: string
  onPresetChange: (preset: RangePreset) => void
  onModeChange: (mode: JourneyReplayMode) => void
  onSpeedChange: (speed: number) => void
  onTogglePlaying: () => void
  onCustomStartChange: (date: string) => void
  onCustomEndChange: (date: string) => void
}) {
  const t = useT()

  return (
    <header className="shrink-0 border-b border-border-subtle bg-surface-1 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-text-primary">{t('journey.title')}</h1>
          <p className="mt-0.5 text-xs text-text-muted">{t('journey.subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
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

          <Segmented
            label={t('journey.mode')}
            value={mode}
            options={[
              ['range-state', t('journey.modeRange')],
              ['empty', t('journey.modeEmpty')],
            ]}
            onChange={value => onModeChange(value as JourneyReplayMode)}
          />

          <button
            onClick={onTogglePlaying}
            disabled={!hasEvents}
            className="rounded border border-border-subtle bg-accent px-3 py-1.5 font-medium text-accent-contrast transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isPlaying ? t('journey.pause') : t('journey.play')}
          </button>

          <label className="flex items-center gap-1.5 rounded border border-border-subtle bg-surface-2 px-2 py-1.5 text-text-secondary">
            <span className="text-text-muted">{t('journey.speed')}</span>
            <select
              value={speed}
              onChange={event => onSpeedChange(Number(event.target.value))}
              className="bg-transparent text-text-primary focus:outline-none"
            >
              {SPEEDS.map(value => <option key={value} value={value}>{value}x</option>)}
            </select>
          </label>
        </div>
      </div>

      {preset === 'custom' && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-muted">
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
      {label}
      <input
        type="date"
        value={value}
        onChange={event => onChange(event.target.value)}
        className="rounded border border-border-subtle bg-surface-2 px-2 py-1 text-text-secondary focus:outline-none focus:border-accent-border"
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
    <footer className="shrink-0 border-t border-border-subtle bg-surface-1 px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-text-muted">
        <span>{isLoading ? t('journey.loading') : `${events.length} ${t('journey.events')}`}</span>
        {activeEvent && (
          <span className="truncate text-text-secondary">
            {t('journey.selectedEvent')}: {eventSentence(activeEvent)}
          </span>
        )}
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
        <span className="w-16 text-end text-[11px] text-text-muted">
          {playhead}/{events.length}
        </span>
      </div>

      <div className="mt-3 flex h-7 items-center gap-1 overflow-x-auto">
        {events.length === 0 && (
          <p className="text-xs text-text-muted">
            {t('journey.noEvents')} {t('journey.recordingStarts')}
          </p>
        )}
        {events.map((event, index) => (
          <button
            key={event.id}
            onClick={() => onScrub(index + 1)}
            className={`h-3 shrink-0 rounded-full border transition-all ${
              index < playhead
                ? 'w-8 border-accent bg-accent'
                : 'w-3 border-border-strong bg-surface-3 hover:border-accent-border'
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
  affectedCardIds,
  baselineCardIds,
  emptyLabel,
}: {
  status: CardStatus
  label: string
  cards: ActivityCardSnapshot[]
  activeCardId?: string
  affectedCardIds: Set<string>
  baselineCardIds: Set<string>
  emptyLabel: string
}) {
  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-x border-transparent bg-surface-1">
      <div className="flex shrink-0 items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <StatusIcon status={status} size={14} />
          <span className="text-sm font-medium text-text-primary">{label}</span>
          <span className="min-w-[20px] rounded bg-surface-3 px-1.5 py-0.5 text-center text-xs text-text-muted">
            {cards.length}
          </span>
        </div>
      </div>

      <div className="column-scroll flex-1 space-y-2 px-2 pb-3">
        <AnimatePresence initial={false}>
          {cards.map(card => (
            <JourneyCard
              key={card.id}
              card={card}
              active={card.id === activeCardId}
              muted={baselineCardIds.has(card.id) && !affectedCardIds.has(card.id)}
            />
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

function JourneyCard({ card, active, muted }: { card: ActivityCardSnapshot; active: boolean; muted: boolean }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{
        opacity: muted ? 0.48 : 1,
        y: 0,
        scale: active ? 1.02 : 1,
      }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className={`relative rounded-lg border bg-surface-2 p-3 transition-colors ${
        active ? 'border-accent shadow-[0_0_0_1px_var(--accent-border),0_12px_36px_rgba(94,106,210,0.18)]' : 'border-border-subtle'
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0">
          <StatusIcon status={card.status} size={15} />
        </div>
        <div className="mt-0.5 shrink-0">
          <CardTypeIcon type={card.type} size={13} />
        </div>
        <p className="line-clamp-2 min-w-0 flex-1 text-sm leading-snug text-text-primary">
          {card.title}
        </p>
      </div>

      {card.tags.length > 0 && (
        <div className="ms-10 mt-2 flex flex-wrap gap-1">
          {card.tags.slice(0, 3).map(tag => {
            const color = tagColor(tag)
            return (
              <span
                key={tag}
                className="rounded border px-1.5 py-0.5 text-[11px]"
                style={{ color: color.text, background: color.bg, borderColor: color.border }}
              >
                #{tag}
              </span>
            )
          })}
          {card.tags.length > 3 && <span className="text-[11px] text-text-muted">+{card.tags.length - 3}</span>}
        </div>
      )}
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
    <div className="flex items-center gap-1 rounded border border-border-subtle bg-surface-2 p-1">
      <span className="px-1 text-text-muted">{label}</span>
      {options.map(([optionValue, optionLabel]) => (
        <button
          key={optionValue}
          onClick={() => onChange(optionValue)}
          className={`rounded px-2 py-1 transition-colors ${
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
