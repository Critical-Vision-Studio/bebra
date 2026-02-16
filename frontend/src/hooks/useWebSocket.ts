import { useEffect, useRef, useCallback } from 'react'
import type { ConversationMessage } from '../types'

export interface WsNewMessage {
  type: 'new_message'
  data: ConversationMessage
}

type WsEvent = WsNewMessage

interface UseWebSocketOptions {
  onMessage?: (event: WsEvent) => void
}

/**
 * Connects to the backend WebSocket for real-time events.
 * Automatically reconnects on disconnect with exponential back-off.
 */
export function useWebSocket({ onMessage }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const backoffRef = useRef(1000)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    // Clean up any existing connection
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    const token = localStorage.getItem('access_token')
    if (!token) return

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const wsUrl = `${proto}://${window.location.host}/ws?token=${encodeURIComponent(token)}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      backoffRef.current = 1000
    }

    ws.onmessage = (event) => {
      try {
        const parsed: WsEvent = JSON.parse(event.data)
        onMessageRef.current?.(parsed)
      } catch {
        // ignore non-JSON frames
      }
    }

    ws.onclose = (e) => {
      wsRef.current = null
      if (e.code === 4001) return
      // Schedule reconnect with exponential back-off
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      reconnectTimer.current = setTimeout(() => {
        connect()
      }, backoffRef.current)
      backoffRef.current = Math.min(backoffRef.current * 2, 30000)
    }

    ws.onerror = () => {
      // onclose will fire after onerror
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])
}
