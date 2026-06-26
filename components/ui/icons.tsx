'use client'

import React from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'

import {
  Search01Icon,
  Cancel01Icon,
  Add01Icon,
  Folder01Icon,
  Settings01Icon,
  BoltIcon,
  CheckmarkSquare02Icon,
  Idea01Icon,
  Bug01Icon,
  AlertCircleIcon,
  Analytics01Icon,
  HelpCircleIcon,
  Note01Icon,
  KanbanIcon,
  LayoutTable01Icon,
  Delete01Icon,
  FloppyDiskIcon,
  SourceCodeIcon,
  EyeIcon,
  ArrowLeft01Icon,
  Task01Icon,
  PencilEdit01Icon,
} from '@hugeicons/core-free-icons'

export {
  Search01Icon,
  Cancel01Icon,
  Add01Icon,
  Folder01Icon,
  Settings01Icon,
  BoltIcon,
  CheckmarkSquare02Icon,
  Idea01Icon,
  Bug01Icon,
  AlertCircleIcon,
  Analytics01Icon,
  HelpCircleIcon,
  Note01Icon,
  KanbanIcon,
  LayoutTable01Icon,
  Delete01Icon,
  FloppyDiskIcon,
  SourceCodeIcon,
  EyeIcon,
  ArrowLeft01Icon,
  Task01Icon,
  PencilEdit01Icon,
}

interface IconProps {
  size?: number
  color?: string
  strokeWidth?: number
  className?: string
}

function makeIcon(iconData: IconSvgElement) {
  return function Icon({ size = 16, color, strokeWidth = 1.5, className }: IconProps) {
    return (
      <HugeiconsIcon
        icon={iconData}
        size={size}
        primaryColor={color ?? 'currentColor'}
        strokeWidth={strokeWidth}
        className={className}
      />
    )
  }
}

export const SearchIcon = makeIcon(Search01Icon)
export const CloseIcon = makeIcon(Cancel01Icon)
export const AddIcon = makeIcon(Add01Icon)
export const FolderIcon = makeIcon(Folder01Icon)
export const SettingsIcon = makeIcon(Settings01Icon)
export const CaptureIcon = makeIcon(BoltIcon)
export const TaskIcon = makeIcon(CheckmarkSquare02Icon)
export const IdeaIcon = makeIcon(Idea01Icon)
export const BugIcon = makeIcon(Bug01Icon)
export const ProblemIcon = makeIcon(AlertCircleIcon)
export const DecisionIcon = makeIcon(Analytics01Icon)
export const QuestionIcon = makeIcon(HelpCircleIcon)
export const NoteIcon = makeIcon(Note01Icon)
export const BoardIcon = makeIcon(KanbanIcon)
export const LayoutIcon = makeIcon(LayoutTable01Icon)
export const DeleteIcon = makeIcon(Delete01Icon)
export const SaveIcon = makeIcon(FloppyDiskIcon)
export const CodeIcon = makeIcon(SourceCodeIcon)
export const PreviewIcon = makeIcon(EyeIcon)
export const BackIcon = makeIcon(ArrowLeft01Icon)
export const EditIcon = makeIcon(PencilEdit01Icon)

// Hand-rolled terminal glyph (kept off Hugeicons to avoid name drift).
export function TerminalIcon({ size = 16, color, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color ?? 'currentColor'} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="M6.5 9.5 9.5 12l-3 2.5M12.5 14.5h5" />
    </svg>
  )
}
