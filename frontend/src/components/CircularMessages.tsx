import { useState } from 'react';
import { Text, Image } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import { calculateCircularPosition } from '../utils/circularLayout';
import type { Message } from '../types';

interface CircularMessagesProps {
  messages: Message[];
  radius?: number;
  onSelectMessage: (message: Message) => void;
}

export function CircularMessages({
  messages,
  radius = 260,
  onSelectMessage,
}: CircularMessagesProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleClick = (message: Message, index: number) => {
    if (selectedIndex === index) {
      onSelectMessage(message);
      setSelectedIndex(null);
    } else {
      setSelectedIndex(index);
    }
  };

  const containerSize = radius * 2 + 240;

  return (
    <div
      style={{
        position: 'relative',
        width: containerSize,
        height: containerSize,
      }}
      onClick={() => setSelectedIndex(null)}
    >
      {messages.map((message, index) => {
        const pos = calculateCircularPosition(index, messages.length, radius);
        const isHovered = hoveredIndex === index;
        const isSelected = selectedIndex === index;
        const active = isSelected || isHovered;

        return (
          <div
            key={message.id}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(${pos.x}px, ${pos.y}px)`,
              zIndex: isSelected ? 20 : isHovered ? 10 : 1,
            }}
          >
            <div
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={(e) => {
                e.stopPropagation();
                handleClick(message, index);
              }}
              style={{
                transform: `translate(-50%, -50%) scale(${
                  isSelected ? 1.08 : isHovered ? 1.04 : 1
                })`,
                width: isSelected ? 200 : 120,
                maxHeight: isSelected ? 280 : 80,
                overflow: 'hidden',
                cursor: 'pointer',
                background: isSelected
                  ? 'rgba(255, 255, 255, 0.95)'
                  : `rgba(255, 255, 255, ${active ? 0.82 : 0.72})`,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: isSelected ? 16 : 12,
                padding: isSelected ? '12px 14px' : '8px 10px',
                border: isSelected
                  ? '2px solid var(--mantine-color-blue-4)'
                  : `1px solid rgba(255, 255, 255, ${active ? 0.5 : 0.35})`,
                boxShadow: isSelected
                  ? '0 8px 32px rgba(59, 130, 246, 0.25), 0 2px 8px rgba(0,0,0,0.06)'
                  : active
                    ? '0 4px 20px rgba(0,0,0,0.1)'
                    : '0 2px 10px rgba(0,0,0,0.06)',
                transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              {message.content_type === 'text' ? (
                <Text
                  size={isSelected ? 'sm' : 'xs'}
                  lh={1.45}
                  lineClamp={isSelected ? undefined : 3}
                >
                  {message.content}
                </Text>
              ) : (
                <Image
                  src={message.content}
                  alt="Message"
                  fit="cover"
                  radius="sm"
                  style={{
                    width: '100%',
                    maxHeight: isSelected ? 160 : 56,
                    transition: 'max-height 0.3s ease',
                  }}
                />
              )}

              {isSelected && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: '1px solid var(--mantine-color-gray-2)',
                  }}
                >
                  <IconSend size={13} style={{ color: 'var(--mantine-color-blue-5)' }} />
                  <Text size="xs" c="blue.5" fw={500}>
                    Tap to send
                  </Text>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
