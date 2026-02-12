/**
 * Circular messages display for selected message set
 */
import { useState } from 'react';
import { Card, Text, Image } from '@mantine/core';
import { calculateCircularPosition, getCircularTransform } from '../utils/circularLayout';
import { Message } from '../api/messageSets';

interface CircularMessagesProps {
  messages: Message[];
  radius?: number;
  onSelectMessage: (message: Message) => void;
}

export function CircularMessages({ 
  messages, 
  radius = 250,
  onSelectMessage 
}: CircularMessagesProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const renderMessageContent = (message: Message) => {
    if (message.content_type === 'text') {
      return (
        <Text size="xs" ta="center" lineClamp={2}>
          {message.content}
        </Text>
      );
    }

    if (message.content_type === 'image' || message.content_type === 'gif') {
      const src = message.storage_type === 'url' ? message.content : message.content;
      return (
        <Image
          src={src}
          alt="Message"
          fit="cover"
          style={{ width: '100%', height: '100%' }}
        />
      );
    }

    return null;
  };

  return (
    <div style={{
      position: 'relative',
      width: `${radius * 2 + 100}px`,
      height: `${radius * 2 + 100}px`,
      margin: '0 auto'
    }}>
      {/* Center friend icon placeholder */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: '#e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#666'
      }}>
        👤
      </div>

      {/* Messages in circle */}
      {messages.map((message, index) => {
        const position = calculateCircularPosition(index, messages.length, radius);
        const isHovered = hoveredIndex === index;

        return (
          <div
            key={message.id}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: getCircularTransform(position),
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => onSelectMessage(message)}
          >
            <Card
              shadow={isHovered ? 'md' : 'sm'}
              padding="xs"
              radius="md"
              style={{
                width: '70px',
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform 0.2s ease',
                overflow: 'hidden'
              }}
            >
              {renderMessageContent(message)}
            </Card>
          </div>
        );
      })}
    </div>
  );
}
