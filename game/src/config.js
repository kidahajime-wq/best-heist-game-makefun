// The Gilded Gala — configuration, palette and the Aurum Casino floor plan.
// One job: every number the rest of the game shares, so tuning lives here.

export const WORLD = { width: 1280, height: 800 };

// Art-deco casino palette: deep teal, brass gold, oxblood red, marble cream.
export const PALETTE = {
  felt: '#0e5f52',
  carpet: '#123f4d',
  carpetDark: '#0d2f3a',
  carpetGold: '#c9a227',
  marble: '#d8cfc0',
  marbleDark: '#b8ab93',
  wood: '#4a2f22',
  woodDark: '#38220f',
  velvet: '#7a1220',
  gold: '#e8c15a',
  goldBright: '#ffd97a',
  goldDim: '#9a7b2d',
  cream: '#f2e8d5',
  ink: '#101820',
  guardNavy: '#22375e',
  guardGold: '#e8c15a',
  thief: '#1b1b22',
  thiefMask: '#e8c15a',
  coneGuard: 'rgba(232, 193, 90, 0.20)',
  coneGuardEdge: 'rgba(232, 193, 90, 0.55)',
  coneCamera: 'rgba(255, 84, 84, 0.20)',
  coneCameraEdge: 'rgba(255, 84, 84, 0.55)',
  coneOff: 'rgba(140, 140, 140, 0.10)',
  alarmCalm: '#58c98a',
  alarmSuspicious: '#e8c15a',
  alarmAlert: '#ff7a3c',
  alarmLockdown: '#ff3b30',
};

export const TIMER_SECONDS = 240;
export const PLAYER_RADIUS = 13;

// Alarm stages: [upper bound, label, colour key]
export const ALARM_STAGES = [
  { max: 25, label: 'CALM', colour: 'alarmCalm' },
  { max: 50, label: 'SUSPICIOUS', colour: 'alarmSuspicious' },
  { max: 75, label: 'ALERT', colour: 'alarmAlert' },
  { max: 100, label: 'LOCKDOWN', colour: 'alarmLockdown' },
];

export const DIAMOND_ALARM_JUMP = 25;
export const ALARM_DECAY_PER_SEC = 5;
export const LOCKDOWN_TIMER_DRAIN = 2;

// Movement (px per second) before loot weight.
export const SPEEDS = { walk: 152, sprint: 218, crouch: 86 };
export const WEIGHT_PENALTY_PER_UNIT = 0.055;
export const MIN_SPEED_FACTOR = 0.55;

// Detection tuning.
export const DETECTION = {
  guardRate: 26, // alarm per second at point blank, scaled by distance and stance
  cameraRate: 34,
  guestRate: 10,
  sprintMultiplier: 1.6,
  crouchMultiplier: 0.45,
  standMultiplier: 1.0,
  chaseRange: 260,
};

// Rooms, for floor rendering only (walls are the authority for collision).
export const ROOMS = [
  { x: 16, y: 16, w: 544, h: 544, floor: 'carpet', name: 'GALA HALL' },
  { x: 576, y: 16, w: 184, h: 768, floor: 'marble', name: 'GRAND CORRIDOR' },
  { x: 776, y: 16, w: 488, h: 264, floor: 'wood', name: 'SECURITY OFFICE' },
  { x: 776, y: 296, w: 224, h: 344, floor: 'marble', name: 'VAULT ANTECHAMBER' },
  { x: 1016, y: 296, w: 248, h: 344, floor: 'vault', name: 'THE VAULT' },
  { x: 16, y: 576, w: 1248, h: 208, floor: 'corridor', name: 'SERVICE CORRIDOR' },
];

// Axis-aligned walls. Gaps are doors; the vault door is a separate dynamic wall.
export const WALLS = [
  // Outer shell (bottom wall split for the entry and the service exit).
  { x: 0, y: 0, w: 1280, h: 16 },
  { x: 0, y: 0, w: 16, h: 800 },
  { x: 1264, y: 0, w: 16, h: 800 },
  { x: 0, y: 784, w: 96, h: 16 },
  { x: 160, y: 784, w: 960, h: 16 },
  { x: 1184, y: 784, w: 96, h: 16 },
  // Gala hall <-> grand corridor (gap y 300-364).
  { x: 560, y: 16, w: 16, h: 284 },
  { x: 560, y: 364, w: 16, h: 276 },
  // Corridor <-> security office / vault wing (gaps y 120-184 and y 380-444).
  { x: 760, y: 16, w: 16, h: 104 },
  { x: 760, y: 184, w: 16, h: 196 },
  { x: 760, y: 444, w: 16, h: 196 },
  // Security office <-> vault wing (gap x 900-964).
  { x: 776, y: 280, w: 124, h: 16 },
  { x: 964, y: 280, w: 300, h: 16 },
  // Antechamber <-> vault (gap y 420-484 is the vault door).
  { x: 1000, y: 296, w: 16, h: 124 },
  { x: 1000, y: 484, w: 16, h: 156 },
  // Gala hall <-> service corridor (gap x 280-344).
  { x: 16, y: 560, w: 264, h: 16 },
  { x: 344, y: 560, w: 216, h: 16 },
  // Vault wing <-> service corridor (gap x 1080-1144, the back way into the vault).
  { x: 776, y: 640, w: 304, h: 16 },
  { x: 1144, y: 640, w: 120, h: 16 },
];

// The locked vault door: a wall while shut, gone once the insider opens it.
export const VAULT_DOOR = { x: 1000, y: 420, w: 16, h: 64 };

// Entry point and the service exit the thief must reach with the diamond.
export const ENTRY = { x: 128, y: 742 };
export const EXIT_ZONE = { x: 1120, y: 742, w: 64, h: 42 };

// Furniture: blocking rectangles with a draw kind.
export const FURNITURE = [
  // Gala hall: bar, slots, poker tables, round tables, roulette.
  { x: 32, y: 64, w: 24, h: 200, kind: 'bar' },
  { x: 120, y: 32, w: 360, h: 28, kind: 'slots' },
  { x: 120, y: 180, w: 150, h: 80, kind: 'poker' },
  { x: 330, y: 180, w: 150, h: 80, kind: 'poker' },
  { x: 120, y: 380, w: 90, h: 90, kind: 'round' },
  { x: 330, y: 380, w: 90, h: 90, kind: 'round' },
  { x: 440, y: 120, w: 90, h: 90, kind: 'roulette' },
  { x: 225, y: 470, w: 90, h: 60, kind: 'round' },
  // Grand corridor: plants and a statue.
  { x: 600, y: 100, w: 24, h: 24, kind: 'plant' },
  { x: 700, y: 500, w: 24, h: 24, kind: 'plant' },
  { x: 640, y: 300, w: 30, h: 30, kind: 'statue' },
  // Security office: desks.
  { x: 820, y: 60, w: 140, h: 50, kind: 'desk' },
  { x: 820, y: 180, w: 140, h: 50, kind: 'desk' },
  // Vault antechamber: display cases.
  { x: 820, y: 340, w: 120, h: 50, kind: 'case' },
  { x: 820, y: 480, w: 120, h: 50, kind: 'case' },
  // The vault: the pedestal, gold shelving, safe boxes.
  { x: 1116, y: 416, w: 48, h: 48, kind: 'pedestal' },
  { x: 1032, y: 320, w: 20, h: 200, kind: 'shelf' },
  { x: 1220, y: 320, w: 28, h: 200, kind: 'safes' },
  // Service corridor: crates and a cart.
  { x: 700, y: 700, w: 60, h: 40, kind: 'crate' },
  { x: 900, y: 700, w: 60, h: 40, kind: 'crate' },
  { x: 500, y: 720, w: 50, h: 30, kind: 'cart' },
];

// Loot: kind, position, value in dollars, carry weight. Every piece sits just
// clear of the furniture beside it, so the thief can actually reach it.
export const LOOT_DEFS = [
  { id: 'chip1', kind: 'chips', x: 195, y: 275, value: 500, weight: 1 },
  { id: 'chip2', kind: 'chips', x: 405, y: 275, value: 500, weight: 1 },
  { id: 'chip3', kind: 'chips', x: 165, y: 485, value: 500, weight: 1 },
  { id: 'chip4', kind: 'chips', x: 375, y: 485, value: 500, weight: 1 },
  { id: 'chip5', kind: 'chips', x: 500, y: 225, value: 500, weight: 1 },
  { id: 'chip6', kind: 'chips', x: 270, y: 545, value: 500, weight: 1 },
  { id: 'gold1', kind: 'gold', x: 1075, y: 340, value: 2000, weight: 3 },
  { id: 'gold2', kind: 'gold', x: 1075, y: 470, value: 2000, weight: 3 },
  { id: 'gold3', kind: 'gold', x: 1205, y: 340, value: 2000, weight: 3 },
  { id: 'gold4', kind: 'gold', x: 1205, y: 470, value: 2000, weight: 3 },
  { id: 'cash1', kind: 'cash', x: 890, y: 125, value: 1500, weight: 2 },
  { id: 'cash2', kind: 'cash', x: 890, y: 245, value: 1500, weight: 2 },
  { id: 'diamond', kind: 'diamond', x: 1140, y: 440, value: 10000, weight: 2 },
];

// Guards: name, patrol loop, base speed, vision range and half-angle.
export const GUARD_DEFS = [
  {
    name: 'Rook', colour: '#22375e',
    waypoints: [[100, 120], [480, 120], [480, 500], [100, 500]],
    speed: 56, range: 235, halfAngle: 0.56,
  },
  {
    name: 'Bishop', colour: '#2c4a72',
    waypoints: [[668, 80], [668, 700]],
    speed: 62, range: 235, halfAngle: 0.56,
  },
  {
    name: 'Knight', colour: '#22375e',
    waypoints: [[840, 340], [950, 340], [950, 590], [840, 590]],
    speed: 56, range: 225, halfAngle: 0.56,
  },
  {
    name: 'Queen', colour: '#2c4a72',
    waypoints: [[850, 80], [1150, 80], [1150, 240], [850, 240]],
    speed: 60, range: 235, halfAngle: 0.56,
  },
];

// Cameras: mount point, base angle, sweep amplitude and period, range.
export const CAMERA_DEFS = [
  { x: 545, y: 30, baseAngle: 2.25, amplitude: 0.62, period: 5.0, range: 265 },
  { x: 668, y: 30, baseAngle: Math.PI / 2, amplitude: 0.5, period: 6.0, range: 265 },
  { x: 1008, y: 300, baseAngle: Math.PI / 2, amplitude: 0.7, period: 4.5, range: 255 },
  { x: 700, y: 656, baseAngle: 0, amplitude: 0.6, period: 5.5, range: 255 },
];

// Gala guests: wanderers who notice a sprinting thief.
export const GUEST_DEFS = [
  { x: 150, y: 300, area: { x: 60, y: 60, w: 460, h: 460 } },
  { x: 300, y: 140, area: { x: 60, y: 60, w: 460, h: 460 } },
  { x: 450, y: 320, area: { x: 60, y: 60, w: 460, h: 460 } },
  { x: 250, y: 440, area: { x: 60, y: 60, w: 460, h: 460 } },
  { x: 500, y: 480, area: { x: 60, y: 60, w: 460, h: 460 } },
];

export const TOOLS = { powerCutCharges: 2, insiderCharges: 1, powerCutSeconds: 6 };
