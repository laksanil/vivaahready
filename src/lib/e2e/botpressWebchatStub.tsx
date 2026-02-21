'use client'

import type { CSSProperties, MouseEventHandler } from 'react'

interface WebchatProps {
  style?: CSSProperties
}

interface FabProps {
  onClick?: MouseEventHandler<HTMLButtonElement>
  style?: CSSProperties
}

export function Webchat({ style }: WebchatProps) {
  return <div data-testid="botpress-webchat-stub" style={style} />
}

export function Fab({ onClick, style }: FabProps) {
  return (
    <button type="button" data-testid="botpress-fab-stub" onClick={onClick} style={style}>
      Chat
    </button>
  )
}
