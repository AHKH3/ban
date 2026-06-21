import { TaskIcon, IdeaIcon, BugIcon, ProblemIcon, DecisionIcon, QuestionIcon, NoteIcon } from '@/components/ui/icons'
import type { CardType } from '@/lib/types'
import { TYPE_COLORS } from '@/lib/types'

const ICONS: Record<CardType, React.ComponentType<{ size?: number; color?: string }>> = {
  task: TaskIcon,
  idea: IdeaIcon,
  bug: BugIcon,
  problem: ProblemIcon,
  decision: DecisionIcon,
  question: QuestionIcon,
  note: NoteIcon,
}

export function CardTypeIcon({ type, size = 14 }: { type: CardType; size?: number }) {
  const Icon = ICONS[type]
  return <Icon size={size} color={TYPE_COLORS[type]} />
}
