/**
 * Circular layout calculation utilities
 */

export interface CircularPosition {
  x: number;
  y: number;
  rotation: number;
}

/**
 * Calculate position for item in circular layout
 * @param index - Item index (0-based)
 * @param total - Total number of items
 * @param radius - Radius of circle in pixels
 * @returns Position and rotation for CSS transform
 */
export function calculateCircularPosition(
  index: number,
  total: number,
  radius: number
): CircularPosition {
  // Start from top (270 degrees) and go clockwise
  const angleStep = 360 / total;
  const angle = 270 + angleStep * index;
  const radian = (angle * Math.PI) / 180;

  return {
    x: radius * Math.cos(radian),
    y: radius * Math.sin(radian),
    rotation: angle + 90, // Rotate item to face center
  };
}

/**
 * Generate CSS transform string for circular positioning
 */
export function getCircularTransform(position: CircularPosition): string {
  return `translate(${position.x}px, ${position.y}px) rotate(${position.rotation}deg)`;
}

/**
 * Calculate optimal radius based on container size and item count
 */
export function calculateOptimalRadius(
  containerSize: number,
  itemCount: number,
  itemSize: number
): number {
  // Ensure items don't overlap
  const minRadius = (itemSize * itemCount) / (2 * Math.PI);
  // Don't exceed container
  const maxRadius = (containerSize - itemSize) / 2;
  
  return Math.min(Math.max(minRadius, 100), maxRadius);
}
