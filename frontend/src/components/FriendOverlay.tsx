import { useEffect, useRef, useState } from 'react'
import { Box, Overlay, ActionIcon, Text } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import UserAvatar from './UserAvatar'
import type { FriendUser } from '../types'

const OVERLAY_AVATAR_SIZE = 154
const FLY_MS = 380
const CONTENT_DELAY_MS = FLY_MS * 0.55

interface FriendOverlayProps {
  friend: FriendUser | null
  originRect: DOMRect | null
  animKey: number
  subtitle?: string | null
  stackContent?: boolean
  onGoBack: () => void
  children: React.ReactNode
}

export default function FriendOverlay({ friend, originRect, animKey, subtitle, stackContent, onGoBack, children }: FriendOverlayProps) {
  const avatarRef = useRef<HTMLDivElement>(null)
  const [contentVisible, setContentVisible] = useState(false)
  const [keepAlive, setKeepAlive] = useState(false)

  const showing = !!friend

  useEffect(() => {
    if (friend) {
      setKeepAlive(true)
    } else {
      setContentVisible(false)
      const t = setTimeout(() => setKeepAlive(false), 250)
      return () => clearTimeout(t)
    }
  }, [!!friend])

  useEffect(() => {
    if (!friend) return
    setContentVisible(false)

    const el = avatarRef.current
    if (!el || !originRect) {
      setContentVisible(true)
      return
    }

    let cancelled = false
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled || !el) return
        const target = el.getBoundingClientRect()
        const dx = (originRect.left + originRect.width / 2) - (target.left + target.width / 2)
        const dy = (originRect.top + originRect.height / 2) - (target.top + target.height / 2)
        const scale = originRect.height / OVERLAY_AVATAR_SIZE

        el.style.transition = 'none'
        el.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`
        void el.offsetHeight

        el.style.transition = `transform ${FLY_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
        el.style.transform = 'translate(0, 0) scale(1)'
      })
    })

    const t = setTimeout(() => setContentVisible(true), CONTENT_DELAY_MS)
    return () => { cancelled = true; clearTimeout(t) }
  }, [animKey])

  if (!showing && !keepAlive) return null

  const contentPadTop = OVERLAY_AVATAR_SIZE / 2 + 30

  return (
    <Box style={{ position: 'absolute', inset: 0, zIndex: 100 }}>
      <Overlay
        backgroundOpacity={showing ? 0.45 : 0}
        blur={showing ? 4 : 0}
        onClick={onGoBack}
        zIndex={100}
        style={{ transition: 'opacity 250ms ease' }}
      />

      <ActionIcon
        variant="filled"
        color="white"
        size={56}
        radius="xl"
        onClick={onGoBack}
        aria-label="Go back"
        style={{
          position: 'absolute',
          left: 24,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 103,
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          color: '#333',
          opacity: showing ? 1 : 0,
          transition: 'opacity 250ms ease',
          pointerEvents: showing ? 'auto' : 'none',
        }}
      >
        <IconArrowLeft size={28} />
      </ActionIcon>

      <Box
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 101,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        {friend && (
          <>
            <div
              ref={avatarRef}
              style={{
                position: 'absolute',
                zIndex: 2,
                willChange: 'transform',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <UserAvatar
                avatarUrl={friend.avatar_url}
                shaderFragment={friend.shader_fragment}
                size={OVERLAY_AVATAR_SIZE}
                username={friend.username}
              />
              <Text
                size="sm"
                fw={600}
                c="white"
                mt={4}
                style={{
                  textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                  opacity: contentVisible ? 1 : 0,
                  transition: 'opacity 200ms ease',
                }}
              >
                {friend.username}
              </Text>
              {subtitle && (
                <Text
                  size="xs"
                  c="gray.3"
                  style={{
                    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                    opacity: contentVisible ? 1 : 0,
                    transition: 'opacity 200ms ease',
                  }}
                >
                  {subtitle}
                </Text>
              )}
            </div>

            {stackContent ? (
              <Box
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  paddingTop: contentPadTop,
                  overflow: 'auto',
                  pointerEvents: contentVisible ? 'auto' : 'none',
                  opacity: contentVisible ? 1 : 0,
                  transition: 'opacity 250ms ease',
                }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                {children}
              </Box>
            ) : (
              <Box
                style={{
                  zIndex: 3,
                  pointerEvents: contentVisible ? 'auto' : 'none',
                  opacity: contentVisible ? 1 : 0,
                  transform: contentVisible ? 'scale(1)' : 'scale(0.95)',
                  transition: 'opacity 250ms ease, transform 250ms ease',
                }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                {children}
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}
