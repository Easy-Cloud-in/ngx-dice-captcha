# Dice Landing Spacing Improvements

## Overview

Enhanced the dice landing mechanics in the ngx-dice-captcha library to ensure proper spacing between dice when they land, preventing them from clustering too close together.

## Changes Made

### 1. Enhanced `createDice()` Method

**File:** `projects/ngx-dice-captcha/src/lib/components/dice-canvas/dice-canvas.component.ts`

**Key Improvements:**

- **Minimum Spacing:** Increased from `size * 2` to `size * 2.5` (2.5x dice size)

  - This ensures a minimum gap of approximately 1.5x dice size between dice centers
  - Prevents dice from landing too close together or overlapping

- **Wider Drop Area:** Changed from `dropAreaWidth` to `dropAreaWidth * 2`

  - Uses more horizontal space for initial positioning
  - Gives dice more room to spread out naturally

- **Better Z-axis Variation:** Changed from `0.5` to `size * 0.8`

  - Scales with dice size for consistent spacing across different dice sizes
  - Creates more natural, non-aligned positioning

- **Reduced Randomness:** Changed from `spacing * 0.3` to `size * 0.4`
  - More predictable spacing while maintaining natural variation
  - Prevents random positioning from negating the spacing improvements

### 2. Enhanced `rollDice()` Method

**File:** `projects/ngx-dice-captcha/src/lib/components/dice-canvas/dice-canvas.component.ts`

**Key Improvements:**

- **Consistent Spacing Logic:** Applied the same spacing improvements as `createDice()`
  - Ensures dice maintain proper spacing on every roll, not just initial creation
- **Lateral Force Variation:** Added `lateralVariation` calculation

  ```typescript
  const lateralVariation = (index - (this.dice.length - 1) / 2) * 0.3;
  ```

  - Applies slight outward force to each dice based on its position
  - Encourages dice to spread apart during the roll
  - Prevents mid-air collisions and clustering

- **Separation Bias:** Modified horizontal force calculation
  ```typescript
  ((Math.random() - 0.5) * 4 + lateralVariation) * forceFactor;
  ```
  - Combines random force with separation bias
  - Outer dice get pushed slightly outward, center dice stay centered
  - Results in more evenly distributed final positions

## Technical Details

### Spacing Calculation

```typescript
const minSpacing = size * 2.5; // Minimum 2.5x dice size for proper gaps
const availableWidth = dropAreaWidth * 2; // Use more horizontal space
const calculatedSpacing = availableWidth / (count + 1);
const spacing = Math.max(minSpacing, calculatedSpacing);
```

This ensures:

- Minimum spacing is always maintained regardless of screen size
- Spacing scales appropriately with the number of dice
- Larger screens get even more spacing for better visual clarity

### Benefits

1. **Better Visual Clarity:** Dice are easier to read when properly spaced
2. **Reduced Collisions:** Less chance of dice bouncing off each other during landing
3. **More Natural Distribution:** Dice spread out across the play area more evenly
4. **Consistent Behavior:** Same spacing logic applies to both initial creation and re-rolls
5. **Scalable:** Works well with different dice counts (1-6+ dice)
6. **Responsive:** Adapts to different screen sizes while maintaining minimum spacing

## Testing Recommendations

Test the following scenarios:

1. **Different dice counts:** 1, 2, 3, 4, 5, 6 dice
2. **Different screen sizes:** Mobile (320px), Tablet (768px), Desktop (1920px)
3. **Different dice sizes:** Small (1.0), Medium (1.5), Large (2.0)
4. **Multiple rolls:** Ensure spacing is consistent across multiple rolls
5. **Edge cases:** Very narrow containers, portrait orientation

## Before vs After

### Before

- Spacing: `size * 2` (tight clustering possible)
- Drop area: Limited to 25% of width
- Z variation: Fixed 0.5 units
- Random offset: `spacing * 0.3` (could negate spacing)
- No lateral separation forces

### After

- Spacing: `size * 2.5` (guaranteed minimum gap)
- Drop area: 50% of width (2x larger)
- Z variation: `size * 0.8` (scales with dice size)
- Random offset: `size * 0.4` (controlled variation)
- Lateral separation forces applied during roll

## Compatibility

These changes are **backward compatible** and don't require any API changes:

- No breaking changes to component inputs/outputs
- No changes to public methods
- Existing configurations continue to work
- Only internal positioning logic is enhanced
