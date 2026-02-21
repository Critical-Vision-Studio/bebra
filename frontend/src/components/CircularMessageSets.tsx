import { useState } from 'react';
import { Card, Text, Badge, ThemeIcon } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { calculateCircularPosition } from '../utils/circularLayout';
import type { MessageSet } from '../types';

interface CircularMessageSetsProps {
  messageSets: MessageSet[];
  radius?: number;
  onSelectSet: (set: MessageSet) => void;
  onBrowse?: () => void;
}

export function CircularMessageSets({
  messageSets,
  radius = 200,
  onSelectSet,
  onBrowse,
}: CircularMessageSetsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalSlots = messageSets.length + (onBrowse ? 1 : 0);

  return (
    <div style={{
      position: 'relative',
      width: `${radius * 2 + 100}px`,
      height: `${radius * 2 + 100}px`,
      margin: '0 auto',
    }}>
      {messageSets.map((set, index) => {
        const pos = calculateCircularPosition(index, totalSlots, radius);
        const isHovered = hoveredIndex === index;

        return (
          <div
            key={set.id}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(${pos.x}px, ${pos.y}px)`,
              zIndex: isHovered ? 10 : 1,
            }}
          >
            <Card
              shadow={isHovered ? 'md' : 'sm'}
              padding="xs"
              radius="md"
              style={{
                width: 80,
                height: 80,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `translate(-50%, -50%) scale(${isHovered ? 1.1 : 1})`,
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => onSelectSet(set)}
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

      {onBrowse && (() => {
        const browseIndex = messageSets.length;
        const pos = calculateCircularPosition(browseIndex, totalSlots, radius);
        const isHovered = hoveredIndex === browseIndex;

        return (
          <div
            key="__browse__"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(${pos.x}px, ${pos.y}px)`,
              zIndex: isHovered ? 10 : 1,
            }}
          >
            <Card
              shadow={isHovered ? 'md' : 'sm'}
              padding="xs"
              radius="md"
              style={{
                width: 80,
                height: 80,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `translate(-50%, -50%) scale(${isHovered ? 1.1 : 1})`,
                transition: 'all 0.2s ease',
                border: '2px dashed var(--mantine-color-blue-4)',
                background: isHovered ? 'var(--mantine-color-blue-0)' : 'transparent',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setHoveredIndex(browseIndex)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={onBrowse}
            >
              <ThemeIcon variant="light" size="md" radius="xl" color="blue">
                <IconPlus size={16} />
              </ThemeIcon>
              <Text size="xs" fw={500} c="blue" mt={4}>
                Browse
              </Text>
            </Card>
          </div>
        );
      })()}
    </div>
  );
}
