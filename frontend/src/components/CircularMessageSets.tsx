/**
 * Circular message sets display around friend icon
 */
import { useState } from 'react';
import { Card, Text, Badge } from '@mantine/core';
import { calculateCircularPosition, getCircularTransform } from '../utils/circularLayout';
import { MessageSet } from '../api/messageSets';

interface CircularMessageSetsProps {
  messageSets: MessageSet[];
  radius?: number;
  onSelectSet: (set: MessageSet) => void;
}

export function CircularMessageSets({ 
  messageSets, 
  radius = 200,
  onSelectSet 
}: CircularMessageSetsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

      {/* Message sets in circle */}
      {messageSets.map((set, index) => {
        const position = calculateCircularPosition(index, messageSets.length, radius);
        const isHovered = hoveredIndex === index;

        return (
          <div
            key={set.id}
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
            onClick={() => onSelectSet(set)}
          >
            <Card
              shadow={isHovered ? 'md' : 'sm'}
              padding="xs"
              radius="md"
              style={{
                width: '80px',
                height: '80px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.2s ease'
              }}
            >
              <Text size="xs" fw={600} ta="center" lineClamp={2}>
                {set.name}
              </Text>
              <Badge size="xs" mt={4}>
                {set.message_count || 0}
              </Badge>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
