/**
 * Grid Layout Engine
 * ===================
 * Pure functions only — no React, no Konva. Given the current config, this
 * returns plain numbers (canvas size + x/y/size for every element). The
 * canvas components just map over the output; they never do positioning
 * math themselves. Keeping this separate makes it easy to retune spacing
 * later without touching rendering code.
 */

export const GROUP_LIMITS = {
  parents: 2,
  relatives: 6,
  children: 5,
  friends: 8,
}

export const CANVAS_DIMS = {
  portrait: { width: 1000, height: 1400 },
  landscape: { width: 1400, height: 1000 },
}

/**
 * Centers `count` square items (size x size) into rows of at most
 * `maxPerRow`, wrapping to additional rows as needed. Each row is
 * independently centered, so partial rows (e.g. 1 child, or 2 cousins)
 * look intentional rather than left-aligned and lopsided.
 */
function wrappedGrid({ count, maxPerRow, canvasWidth, size, gap, startY, rowGap, labelSpace }) {
  const positions = []
  if (count <= 0) return positions

  const rows = Math.ceil(count / maxPerRow)
  let consumed = 0

  for (let r = 0; r < rows; r++) {
    const itemsInRow = Math.min(maxPerRow, count - consumed)
    const rowWidth = itemsInRow * size + (itemsInRow - 1) * gap
    const startX = (canvasWidth - rowWidth) / 2

    for (let c = 0; c < itemsInRow; c++) {
      positions.push({
        x: startX + c * (size + gap),
        y: startY + r * (size + labelSpace + rowGap),
        size,
      })
      consumed++
    }
  }
  return positions
}

// Per-orientation tuning. These were hand-fit against the canvas dims above
// so nothing overlaps even at max counts (2 parents / 6 relatives / 5
// children, or 8 friends). If you change GROUP_LIMITS or CANVAS_DIMS,
// re-check these numbers against the worked math in the README.
const FAMILY_TUNING = {
  portrait: {
    header: { mainY: 50, mainSize: 56, dateY: 130, dateSize: 26, subY: 175, subSize: 38 },
    parents: { size: 170, gap: 50, startY: 260, maxPerRow: 2, rowGap: 20, labelSpace: 30 },
    relatives: { size: 120, gap: 30, startY: 500, maxPerRow: 3, rowGap: 20, labelSpace: 30 },
    children: { size: 130, gap: 25, startY: 870, maxPerRow: 5, rowGap: 20, labelSpace: 30 },
    promoY: 1210,
    promoSize: 20,
    logoY: 1310,
    logoSize: 70,
  },
  landscape: {
    header: { mainY: 30, mainSize: 44, dateY: 85, dateSize: 22, subY: 120, subSize: 30 },
    parents: { size: 130, gap: 40, startY: 180, maxPerRow: 2, rowGap: 15, labelSpace: 26 },
    relatives: { size: 90, gap: 25, startY: 370, maxPerRow: 4, rowGap: 15, labelSpace: 26 },
    children: { size: 100, gap: 25, startY: 650, maxPerRow: 5, rowGap: 15, labelSpace: 26 },
    promoY: 850,
    promoSize: 18,
    logoY: 940,
    logoSize: 56,
  },
}

const FRIENDS_TUNING = {
  portrait: {
    header: { mainY: 50, mainSize: 56, dateY: 130, dateSize: 26, subY: 175, subSize: 38 },
    friends: { size: 220, gap: 30, startY: 280, maxPerRow: 3, rowGap: 30, labelSpace: 30 },
    promoY: 1210,
    promoSize: 20,
    logoY: 1310,
    logoSize: 70,
  },
  landscape: {
    header: { mainY: 30, mainSize: 44, dateY: 85, dateSize: 22, subY: 120, subSize: 30 },
    friends: { size: 200, gap: 30, startY: 180, maxPerRow: 4, rowGap: 20, labelSpace: 26 },
    promoY: 850,
    promoSize: 18,
    logoY: 940,
    logoSize: 56,
  },
}

/**
 * Main entry point. Takes the full app config and returns everything the
 * canvas needs to draw: dimensions, header text positions, a flat list of
 * avatar slots (each with x/y/size/label/dataUrl), promo position, logo
 * position.
 */
export function computeLayout(config) {
  const { template, orientation } = config
  const dims = CANVAS_DIMS[orientation]
  const tuning = template === 'friends' ? FRIENDS_TUNING[orientation] : FAMILY_TUNING[orientation]

  const avatarSlots = []

  if (template === 'friends') {
    const t = tuning.friends
    const list = config.friends.list
    const pos = wrappedGrid({
      count: list.length,
      maxPerRow: t.maxPerRow,
      canvasWidth: dims.width,
      size: t.size,
      gap: t.gap,
      startY: t.startY,
      rowGap: t.rowGap,
      labelSpace: t.labelSpace,
    })
    list.forEach((slot, i) => {
      avatarSlots.push({ ...slot, ...pos[i] })
    })
  } else {
    const groups = [
      { key: 'parents', tuning: tuning.parents },
      { key: 'relatives', tuning: tuning.relatives },
      { key: 'children', tuning: tuning.children },
    ]
    groups.forEach(({ key, tuning: t }) => {
      const list = config.family[key]
      const pos = wrappedGrid({
        count: list.length,
        maxPerRow: t.maxPerRow,
        canvasWidth: dims.width,
        size: t.size,
        gap: t.gap,
        startY: t.startY,
        rowGap: t.rowGap,
        labelSpace: t.labelSpace,
      })
      list.forEach((slot, i) => {
        avatarSlots.push({ ...slot, ...pos[i] })
      })
    })
  }

  return {
    canvasWidth: dims.width,
    canvasHeight: dims.height,
    header: tuning.header,
    avatarSlots,
    promoY: tuning.promoY,
    promoSize: tuning.promoSize,
    logoY: tuning.logoY,
    logoSize: tuning.logoSize,
  }
}

export function makeSlot(label = '') {
  return {
    id: (crypto.randomUUID && crypto.randomUUID()) || `slot-${Date.now()}-${Math.random()}`,
    label,
    dataUrl: null,
  }
}

export function defaultFamily() {
  return {
    parents: [makeSlot('Father'), makeSlot('Mother')],
    relatives: [],
    children: [makeSlot('Child #1')],
  }
}

export function defaultFriends() {
  return {
    list: [makeSlot('Friend #1'), makeSlot('Friend #2')],
  }
}
