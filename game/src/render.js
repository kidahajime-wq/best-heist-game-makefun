// Rendering: the whole look of the Gilded Gala on one canvas.
// One job: draw the floor, the cones, the people, the loot and the HUD —
// everything the screenshots show comes from here.

import {
  WORLD, PALETTE, ROOMS, WALLS, VAULT_DOOR, FURNITURE, EXIT_ZONE, ENTRY,
  ALARM_STAGES,
} from './config.js';
import { alarmStage, alarmStageInfo } from './alarm.js';
import { cameraDisabled } from './cameras.js';
import { nearestGuardDistance } from './guards.js';
import { nearVaultDoor } from './player.js';

export const CANVAS_W = 1280;
export const CANVAS_H = 864;
export const HUD_H = 64;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function pointInBlockers(x, y, blockers) {
  for (const b of blockers) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return true;
  }
  return false;
}

/**
 * A vision cone clipped by walls: march rays across the cone and stop each
 * one where it first hits a blocker, so cones hug the architecture.
 */
export function conePolygon(eyeX, eyeY, angle, halfAngle, range, blockers) {
  const rays = 26;
  const points = [[eyeX, eyeY]];
  for (let i = 0; i <= rays; i += 1) {
    const a = angle - halfAngle + (2 * halfAngle * i) / rays;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let reach = range;
    for (let d = 10; d < range; d += 8) {
      const px = eyeX + dx * d;
      const py = eyeY + dy * d;
      if (px < 16 || px > WORLD.width - 16 || py < 16 || py > WORLD.height - 16
        || pointInBlockers(px, py, blockers)) {
        reach = d;
        break;
      }
    }
    points.push([eyeX + dx * reach, eyeY + dy * reach]);
  }
  return points;
}

function drawCone(ctx, eyeX, eyeY, angle, halfAngle, range, blockers, fill, edge) {
  const poly = conePolygon(eyeX, eyeY, angle, halfAngle, range, blockers);
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// --- Floor ---

function drawFloor(ctx, time) {
  ctx.fillStyle = '#0a1216';
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  for (const room of ROOMS) {
    if (room.floor === 'carpet') {
      ctx.fillStyle = PALETTE.carpet;
      ctx.fillRect(room.x, room.y, room.w, room.h);
      // Art-deco diamond lattice in gold.
      ctx.strokeStyle = 'rgba(201, 162, 39, 0.16)';
      ctx.lineWidth = 1;
      const step = 64;
      for (let gx = room.x; gx <= room.x + room.w; gx += step) {
        for (let gy = room.y; gy <= room.y + room.h; gy += step) {
          ctx.beginPath();
          ctx.moveTo(gx, gy - 14);
          ctx.lineTo(gx + 14, gy);
          ctx.lineTo(gx, gy + 14);
          ctx.lineTo(gx - 14, gy);
          ctx.closePath();
          ctx.stroke();
        }
      }
      ctx.fillStyle = 'rgba(201, 162, 39, 0.10)';
      ctx.fillRect(room.x, room.y + room.h / 2 - 18, room.w, 36);
    } else if (room.floor === 'marble' || room.floor === 'corridor') {
      ctx.fillStyle = PALETTE.marble;
      ctx.fillRect(room.x, room.y, room.w, room.h);
      ctx.strokeStyle = 'rgba(120, 100, 70, 0.35)';
      ctx.lineWidth = 1;
      for (let gx = room.x; gx <= room.x + room.w; gx += 64) {
        ctx.beginPath(); ctx.moveTo(gx, room.y); ctx.lineTo(gx, room.y + room.h); ctx.stroke();
      }
      for (let gy = room.y; gy <= room.y + room.h; gy += 64) {
        ctx.beginPath(); ctx.moveTo(room.x, gy); ctx.lineTo(room.x + room.w, gy); ctx.stroke();
      }
      if (room.floor === 'corridor') {
        ctx.fillStyle = PALETTE.velvet;
        ctx.fillRect(room.x + room.w / 2 - 46, room.y, 92, room.h);
        ctx.strokeStyle = PALETTE.gold;
        ctx.lineWidth = 2;
        ctx.strokeRect(room.x + room.w / 2 - 46, room.y, 92, room.h);
      }
    } else if (room.floor === 'wood') {
      ctx.fillStyle = PALETTE.wood;
      ctx.fillRect(room.x, room.y, room.w, room.h);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
      for (let gy = room.y + 22; gy < room.y + room.h; gy += 22) {
        ctx.beginPath(); ctx.moveTo(room.x, gy); ctx.lineTo(room.x + room.w, gy); ctx.stroke();
      }
    } else if (room.floor === 'vault') {
      ctx.fillStyle = '#20242e';
      ctx.fillRect(room.x, room.y, room.w, room.h);
      ctx.strokeStyle = 'rgba(232, 193, 90, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(room.x + 10, room.y + 10, room.w - 20, room.h - 20);
      ctx.strokeStyle = 'rgba(232, 193, 90, 0.12)';
      for (let gx = room.x + 40; gx < room.x + room.w; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, room.y); ctx.lineTo(gx, room.y + room.h); ctx.stroke();
      }
    }
    // Faint room label, so each space reads at a glance.
    ctx.fillStyle = 'rgba(242, 232, 213, 0.28)';
    ctx.font = '600 13px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(room.name, room.x + 12, room.y + 24);
  }
  // Gala chandeliers: warm pools of light.
  for (const [cx, cy] of [[160, 140], [420, 140], [160, 460], [420, 460]]) {
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 90);
    g.addColorStop(0, 'rgba(255, 217, 122, 0.20)');
    g.addColorStop(1, 'rgba(255, 217, 122, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, 90, 0, Math.PI * 2);
    ctx.fill();
  }
  void time;
}

// --- Walls, doors, furniture ---

function drawWalls(ctx, state) {
  for (const w of WALLS) {
    ctx.fillStyle = '#1d2733';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PALETTE.goldDim;
    if (w.h <= 16) ctx.fillRect(w.x, w.y + w.h - 3, w.w, 3);
    else ctx.fillRect(w.x + w.w - 3, w.y, 3, w.h);
  }
  // The vault door: barred gold while locked, an open dark gap once opened.
  if (!state.vaultDoorOpen) {
    ctx.fillStyle = '#3a2f16';
    ctx.fillRect(VAULT_DOOR.x, VAULT_DOOR.y, VAULT_DOOR.w, VAULT_DOOR.h);
    ctx.fillStyle = PALETTE.gold;
    for (let i = 0; i < 4; i += 1) {
      ctx.fillRect(VAULT_DOOR.x + 2, VAULT_DOOR.y + 6 + i * 15, VAULT_DOOR.w - 4, 5);
    }
    ctx.fillStyle = '#ff5a4e';
    ctx.beginPath();
    ctx.arc(VAULT_DOOR.x + 8, VAULT_DOOR.y + 32, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Service exit: a green-lit door in the bottom wall.
  ctx.fillStyle = '#0d3b26';
  ctx.fillRect(EXIT_ZONE.x, EXIT_ZONE.y - 8, EXIT_ZONE.w, 10);
  ctx.fillStyle = '#58c98a';
  ctx.font = '700 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', EXIT_ZONE.x + EXIT_ZONE.w / 2, EXIT_ZONE.y - 12);
  // Entry mat.
  ctx.fillStyle = 'rgba(232, 193, 90, 0.5)';
  ctx.fillRect(ENTRY.x - 34, ENTRY.y + 12, 68, 6);
}

function drawFurniture(ctx, time) {
  for (const f of FURNITURE) {
    ctx.save();
    if (f.kind === 'bar') {
      ctx.fillStyle = '#2c1c12';
      ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.fillStyle = PALETTE.goldDim;
      ctx.fillRect(f.x + f.w - 4, f.y, 4, f.h);
      ctx.fillStyle = 'rgba(232, 193, 90, 0.5)';
      for (let y = f.y + 16; y < f.y + f.h; y += 26) ctx.fillRect(f.x + 4, y, 6, 12);
    } else if (f.kind === 'slots') {
      ctx.fillStyle = '#3d2b12';
      ctx.fillRect(f.x, f.y, f.w, f.h);
      for (let x = f.x + 8; x < f.x + f.w - 20; x += 34) {
        ctx.fillStyle = ['#ff5a4e', '#58c98a', '#e8c15a'][Math.floor(x / 34) % 3];
        ctx.fillRect(x, f.y + 6, 22, 16);
      }
    } else if (f.kind === 'poker') {
      ctx.fillStyle = PALETTE.felt;
      rr(ctx, f.x, f.y, f.w, f.h, 18);
      ctx.fill();
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 3;
      rr(ctx, f.x + 3, f.y + 3, f.w - 6, f.h - 6, 15);
      ctx.stroke();
      ctx.fillStyle = 'rgba(242, 232, 213, 0.7)';
      ctx.font = '11px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('♠ ♥', f.x + f.w / 2, f.y + f.h / 2 + 4);
    } else if (f.kind === 'round') {
      ctx.fillStyle = '#5e1a24';
      ctx.beginPath();
      ctx.arc(f.x + f.w / 2, f.y + f.h / 2, f.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = PALETTE.cream;
      ctx.beginPath();
      ctx.arc(f.x + f.w / 2, f.y + f.h / 2, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (f.kind === 'roulette') {
      ctx.fillStyle = '#20242e';
      ctx.beginPath();
      ctx.arc(f.x + 45, f.y + 45, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#7a1220';
      ctx.beginPath();
      ctx.arc(f.x + 45, f.y + 45, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.cream;
      ctx.beginPath();
      ctx.arc(f.x + 45, f.y + 45, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (f.kind === 'plant') {
      ctx.fillStyle = '#2e5d3a';
      ctx.beginPath();
      ctx.arc(f.x + 12, f.y + 10, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a4a22';
      ctx.fillRect(f.x + 6, f.y + 16, 12, 8);
    } else if (f.kind === 'statue') {
      ctx.fillStyle = PALETTE.goldDim;
      ctx.beginPath();
      ctx.arc(f.x + 15, f.y + 12, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a2f16';
      ctx.fillRect(f.x + 6, f.y + 20, 18, 10);
    } else if (f.kind === 'desk') {
      ctx.fillStyle = '#2c2118';
      ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.strokeStyle = PALETTE.goldDim;
      ctx.lineWidth = 2;
      ctx.strokeRect(f.x, f.y, f.w, f.h);
      ctx.fillStyle = '#9fd8ff';
      ctx.fillRect(f.x + 20, f.y + 12, 34, 22);
      ctx.fillRect(f.x + 84, f.y + 12, 34, 22);
    } else if (f.kind === 'case') {
      ctx.fillStyle = 'rgba(160, 200, 230, 0.25)';
      ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 2;
      ctx.strokeRect(f.x, f.y, f.w, f.h);
      ctx.fillStyle = PALETTE.goldBright;
      for (let x = f.x + 14; x < f.x + f.w - 10; x += 26) {
        ctx.beginPath();
        ctx.arc(x, f.y + f.h / 2, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (f.kind === 'pedestal') {
      ctx.fillStyle = '#101820';
      ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 3;
      ctx.strokeRect(f.x + 4, f.y + 4, f.w - 8, f.h - 8);
    } else if (f.kind === 'shelf') {
      ctx.fillStyle = '#3a2f16';
      ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.fillStyle = PALETTE.gold;
      for (let y = f.y + 10; y < f.y + f.h; y += 30) ctx.fillRect(f.x + 3, y, f.w - 6, 4);
    } else if (f.kind === 'safes') {
      ctx.fillStyle = '#2a2f38';
      ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.strokeStyle = PALETTE.goldDim;
      for (let y = f.y + 8; y < f.y + f.h; y += 34) {
        ctx.strokeRect(f.x + 4, y, f.w - 8, 26);
      }
    } else if (f.kind === 'crate') {
      ctx.fillStyle = '#6b4a22';
      ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.strokeStyle = '#3a2a12';
      ctx.lineWidth = 2;
      ctx.strokeRect(f.x + 2, f.y + 2, f.w - 4, f.h - 4);
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      ctx.lineTo(f.x + f.w, f.y + f.h);
      ctx.stroke();
    } else if (f.kind === 'cart') {
      ctx.fillStyle = '#4a4a52';
      ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(f.x + 6, f.y + 6, f.w - 12, 8);
    }
    ctx.restore();
  }
  void time;
}

// --- Loot ---

function drawLoot(ctx, state, time) {
  for (const item of state.loot) {
    if (item.taken) continue;
    const tw = 1 + 0.12 * Math.sin(time * 3 + item.x);
    if (item.kind === 'chips') {
      for (let i = 0; i < 3; i += 1) {
        ctx.fillStyle = ['#ff5a4e', '#f2e8d5', '#3f7fd0'][i];
        ctx.beginPath();
        ctx.ellipse(item.x, item.y - i * 4, 11, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (item.kind === 'gold') {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.scale(tw, 1);
      ctx.fillStyle = PALETTE.goldBright;
      ctx.beginPath();
      ctx.moveTo(-11, 5); ctx.lineTo(-7, -6); ctx.lineTo(7, -6); ctx.lineTo(11, 5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = PALETTE.goldDim;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    } else if (item.kind === 'cash') {
      ctx.fillStyle = '#2e7d4f';
      ctx.fillRect(item.x - 11, item.y - 7, 22, 14);
      ctx.fillStyle = PALETTE.cream;
      ctx.fillRect(item.x - 3, item.y - 7, 6, 14);
      ctx.fillStyle = '#1d5c36';
      ctx.font = '700 9px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', item.x, item.y + 3);
    } else if (item.kind === 'diamond') {
      const pulse = 0.7 + 0.3 * Math.sin(time * 4);
      const g = ctx.createRadialGradient(item.x, item.y, 2, item.x, item.y, 34 * pulse);
      g.addColorStop(0, 'rgba(191, 233, 255, 0.85)');
      g.addColorStop(1, 'rgba(191, 233, 255, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 34 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#bfe9ff';
      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 16);
      ctx.lineTo(item.x + 12, item.y - 4);
      ctx.lineTo(item.x + 8, item.y + 10);
      ctx.lineTo(item.x - 8, item.y + 10);
      ctx.lineTo(item.x - 12, item.y - 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(item.x - 1, item.y - 4, 2, 14);
    }
  }
}

// --- People ---

function drawFigure(ctx, x, y, r, body, head, angle, opts = {}) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.75, r, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = head;
  ctx.beginPath();
  ctx.arc(x + Math.cos(angle) * r * 0.35, y + Math.sin(angle) * r * 0.35, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  if (opts.mask) {
    ctx.fillStyle = PALETTE.thiefMask;
    ctx.fillRect(x - r * 0.7, y - r * 0.35, r * 1.4, r * 0.32);
  }
  if (opts.epaulette) {
    ctx.fillStyle = PALETTE.guardGold;
    ctx.beginPath();
    ctx.arc(x - r * 0.6, y - r * 0.6, 2.5, 0, Math.PI * 2);
    ctx.arc(x + r * 0.6, y - r * 0.6, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGuests(ctx, state) {
  for (const guest of state.guests) {
    const colours = ['#b03a5b', '#3a7fb0', '#7a5fb0', '#b07a3a', '#3ab07a'];
    drawFigure(ctx, guest.x, guest.y, 11, colours[guest.id % colours.length], '#e8c9a0', guest.angle);
    if (guest.alarmed > 0.3) {
      ctx.fillStyle = '#ffd97a';
      ctx.font = '700 18px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', guest.x, guest.y - 18);
    }
  }
}

function drawGuards(ctx, state, blockers) {
  for (const guard of state.guards) {
    // Vision cone first (under the figure), clipped by the walls.
    drawCone(
      ctx, guard.x, guard.y, guard.angle, guard.halfAngle, guard.range, blockers,
      guard.mode === 'chase' ? 'rgba(255, 84, 84, 0.26)' : PALETTE.coneGuard,
      guard.mode === 'chase' ? 'rgba(255, 84, 84, 0.7)' : PALETTE.coneGuardEdge,
    );
  }
  for (const guard of state.guards) {
    drawFigure(ctx, guard.x, guard.y, 13, guard.colour, '#e8c9a0', guard.angle, { epaulette: true });
    ctx.strokeStyle = 'rgba(242, 232, 213, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(guard.x + Math.cos(guard.angle) * 14, guard.y + Math.sin(guard.angle) * 14);
    ctx.lineTo(guard.x + Math.cos(guard.angle) * 22, guard.y + Math.sin(guard.angle) * 22);
    ctx.stroke();
    if (guard.mode === 'chase') {
      ctx.fillStyle = '#ff3b30';
      ctx.font = '700 20px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, guard.y - 20);
    } else if (guard.suspicion > 0.25) {
      ctx.fillStyle = '#ffd97a';
      ctx.font = '700 18px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', guard.x, guard.y - 20);
    }
    ctx.fillStyle = 'rgba(242, 232, 213, 0.85)';
    ctx.font = '10px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(guard.name, guard.x, guard.y + 26);
  }
}

function drawCameras(ctx, state, blockers) {
  for (const camera of state.cameras) {
    const disabled = cameraDisabled(state, camera);
    if (!disabled) {
      drawCone(
        ctx, camera.x, camera.y, camera.angle, 0.38, camera.range, blockers,
        PALETTE.coneCamera, PALETTE.coneCameraEdge,
      );
    } else {
      drawCone(ctx, camera.x, camera.y, camera.angle, 0.38, camera.range, blockers,
        PALETTE.coneOff, 'rgba(140, 140, 140, 0.3)');
    }
  }
  for (const camera of state.cameras) {
    const disabled = cameraDisabled(state, camera);
    ctx.fillStyle = '#1d2733';
    ctx.fillRect(camera.x - 7, camera.y - 7, 14, 14);
    ctx.strokeStyle = disabled ? '#8a8a8a' : '#ff5a4e';
    ctx.lineWidth = 2;
    ctx.strokeRect(camera.x - 7, camera.y - 7, 14, 14);
    ctx.strokeStyle = disabled ? '#8a8a8a' : '#ff5a4e';
    ctx.beginPath();
    ctx.moveTo(camera.x, camera.y);
    ctx.lineTo(camera.x + Math.cos(camera.angle) * 18, camera.y + Math.sin(camera.angle) * 18);
    ctx.stroke();
    ctx.fillStyle = disabled ? '#8a8a8a' : '#ff3b30';
    ctx.beginPath();
    ctx.arc(camera.x, camera.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer(ctx, state, time) {
  const p = state.player;
  const r = p.stance === 'crouch' ? 10 : 13;
  if (p.stance === 'sprint' && p.moving) {
    ctx.strokeStyle = 'rgba(242, 232, 213, 0.35)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) {
      const back = 18 + i * 7;
      ctx.beginPath();
      ctx.moveTo(p.x - Math.cos(p.angle) * back, p.y - Math.sin(p.angle) * back);
      ctx.lineTo(p.x - Math.cos(p.angle) * (back + 8), p.y - Math.sin(p.angle) * (back + 8));
      ctx.stroke();
    }
  }
  drawFigure(ctx, p.x, p.y, r, PALETTE.thief, '#1b1b22', p.angle, { mask: true });
  // The swag bag grows with the loot.
  if (p.weight > 0) {
    ctx.fillStyle = PALETTE.goldDim;
    ctx.beginPath();
    ctx.arc(p.x - Math.cos(p.angle) * 14, p.y - Math.sin(p.angle) * 14, 4 + Math.min(5, p.weight), 0, Math.PI * 2);
    ctx.fill();
  }
  // Prompt: the vault door can be opened from here.
  if (!state.vaultDoorOpen && nearVaultDoor(p) && p.insiderKeys > 0) {
    ctx.fillStyle = '#ffd97a';
    ctx.font = '700 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Press E — Marcel opens the vault door', p.x, p.y - 26);
  }
  void time;
}

function drawParticles(ctx, state, dt) {
  for (const pt of state.particles) {
    const alpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.colour;
    ctx.globalAlpha = alpha;
    ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;
  void dt;
}

function drawToasts(ctx, state) {
  ctx.textAlign = 'left';
  let y = CANVAS_H - 26;
  for (let i = state.toasts.length - 1; i >= 0; i -= 1) {
    const toast = state.toasts[i];
    if (state.elapsed > toast.until) continue;
    ctx.fillStyle = 'rgba(10, 18, 22, 0.82)';
    ctx.font = '13px Georgia, serif';
    const w = ctx.measureText(toast.text).width + 24;
    rr(ctx, 16, y - 18, w, 24, 6);
    ctx.fill();
    ctx.fillStyle = PALETTE.goldBright;
    ctx.fillText(toast.text, 28, y - 1);
    y -= 30;
  }
}

// --- HUD ---

function drawHUD(ctx, state, input) {
  ctx.fillStyle = '#0d151b';
  ctx.fillRect(0, 0, CANVAS_W, HUD_H);
  ctx.fillStyle = PALETTE.goldDim;
  ctx.fillRect(0, HUD_H - 2, CANVAS_W, 2);

  // Left: title and objective.
  ctx.fillStyle = PALETTE.goldBright;
  ctx.font = '700 19px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('★ THE GILDED GALA', 16, 26);
  ctx.fillStyle = 'rgba(242, 232, 213, 0.8)';
  ctx.font = '12px Georgia, serif';
  const objective = state.diamondTaken
    ? 'Diamond secured — reach the green EXIT, bottom right.'
    : 'Steal the Star of Aurum from the vault, then escape.';
  ctx.fillText(objective, 16, 46);

  // Centre: the alarm meter.
  const stage = alarmStage(state.alarm);
  const info = alarmStageInfo(state.alarm);
  const barX = 470;
  const barW = 320;
  ctx.fillStyle = 'rgba(242, 232, 213, 0.85)';
  ctx.font = '700 12px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', barX, 22);
  ctx.fillStyle = '#1d2733';
  rr(ctx, barX, 28, barW, 16, 4);
  ctx.fill();
  ctx.fillStyle = PALETTE[info.colour];
  if (state.alarm > 0) {
    rr(ctx, barX, 28, Math.max(8, (barW * state.alarm) / 100), 16, 4);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(242, 232, 213, 0.5)';
  ctx.lineWidth = 1;
  for (const mark of [25, 50, 75]) {
    ctx.beginPath();
    ctx.moveTo(barX + (barW * mark) / 100, 28);
    ctx.lineTo(barX + (barW * mark) / 100, 44);
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE[info.colour];
  ctx.font = '700 13px Georgia, serif';
  ctx.fillText(`${info.label}  ${Math.round(state.alarm)}`, barX + barW + 10, 42);
  void stage;

  // Right: timer, loot, tools.
  const mins = Math.max(0, Math.floor(state.timeLeft / 60));
  const secs = Math.max(0, Math.floor(state.timeLeft % 60));
  const lowTime = state.timeLeft < 30;
  ctx.fillStyle = lowTime ? '#ff5a4e' : 'rgba(242, 232, 213, 0.9)';
  ctx.font = '700 22px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}`, 1010, 30);
  ctx.fillStyle = PALETTE.goldBright;
  ctx.font = '700 15px Georgia, serif';
  ctx.fillText(`$${state.player.value.toLocaleString('en-US')} · ${state.player.weight} kg`, 1010, 52);
  ctx.textAlign = 'left';

  // Tool buttons (clickable; the renderer registers their hit boxes).
  const buttons = [
    { id: 'power', label: `⚡ POWER ×${state.player.powerCuts}`, x: 1030, y: 12, w: 108, h: 40, on: state.player.powerCuts > 0 },
    { id: 'insider', label: `🗝 INSIDER ×${state.player.insiderKeys}`, x: 1146, y: 12, w: 118, h: 40, on: state.player.insiderKeys > 0 },
  ];
  for (const b of buttons) {
    ctx.fillStyle = b.on ? 'rgba(232, 193, 90, 0.16)' : 'rgba(120, 120, 120, 0.12)';
    rr(ctx, b.x, b.y, b.w, b.h, 6);
    ctx.fill();
    ctx.strokeStyle = b.on ? PALETTE.gold : 'rgba(140, 140, 140, 0.6)';
    ctx.lineWidth = 1.5;
    rr(ctx, b.x, b.y, b.w, b.h, 6);
    ctx.stroke();
    ctx.fillStyle = b.on ? PALETTE.goldBright : 'rgba(180, 180, 180, 0.8)';
    ctx.font = '700 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.label, b.x + b.w / 2, b.y + 25);
    input.buttons.push({ id: b.id, x: b.x, y: b.y, w: b.w, h: b.h });
  }
  ctx.textAlign = 'left';
}

// --- Overlays ---

function overlay(ctx, alpha) {
  ctx.fillStyle = `rgba(8, 14, 18, ${alpha})`;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function decoFrame(ctx) {
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 96, CANVAS_W - 96, CANVAS_H - 192);
  ctx.strokeStyle = 'rgba(232, 193, 90, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(58, 106, CANVAS_W - 116, CANVAS_H - 212);
}

function drawTitle(ctx, state) {
  overlay(ctx, 0.78);
  decoFrame(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.goldBright;
  ctx.font = '700 15px Georgia, serif';
  ctx.fillText('T H E   A U R U M   C A S I N O   P R E S E N T S', CANVAS_W / 2, 170);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '700 64px Georgia, serif';
  ctx.fillText('THE GILDED GALA', CANVAS_W / 2, 250);
  ctx.fillStyle = PALETTE.goldBright;
  ctx.font = 'italic 20px Georgia, serif';
  ctx.fillText('One thief. One diamond. One very long night.', CANVAS_W / 2, 292);
  ctx.fillStyle = 'rgba(242, 232, 213, 0.9)';
  ctx.font = '15px Georgia, serif';
  const lines = [
    'Slip through the gala in a borrowed tuxedo. Read the guards’ cones, mind the sweeping cameras,',
    'and lift the Star of Aurum from the vault — every bar of gold slows your escape.',
    'Cut the power to blind the cameras (Q), or let Marcel the insider open the vault door (E).',
    'Grab the diamond, then reach the green EXIT before the clock — or the alarm — runs out.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, CANVAS_W / 2, 350 + i * 26));
  ctx.fillStyle = PALETTE.goldBright;
  ctx.font = '700 16px Georgia, serif';
  ctx.fillText('WASD / arrows — move      SHIFT — sprint (loud)      C — crouch (quiet)', CANVAS_W / 2, 486);
  ctx.fillText('Q — power cut      E — insider      M — mute      R — restart', CANVAS_W / 2, 514);
  const blink = 0.65 + 0.35 * Math.sin(state.elapsed * 4);
  ctx.globalAlpha = blink;
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '700 22px Georgia, serif';
  ctx.fillText('— Press ENTER to begin the heist —', CANVAS_W / 2, 580);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

function scoreBreakdown(state) {
  const timeBonus = Math.max(0, Math.round(state.timeLeft)) * 10;
  const ghost = state.stats.peakAlarm < 25 ? 2500 : 0;
  return { timeBonus, ghost, total: state.player.value + timeBonus + ghost };
}

function drawEnd(ctx, state, won) {
  overlay(ctx, 0.8);
  decoFrame(ctx);
  ctx.textAlign = 'center';
  if (won) {
    ctx.fillStyle = PALETTE.goldBright;
    ctx.font = '700 56px Georgia, serif';
    ctx.fillText('CLEAN GETAWAY', CANVAS_W / 2, 230);
    ctx.fillStyle = PALETTE.cream;
    ctx.font = 'italic 19px Georgia, serif';
    ctx.fillText('The Star of Aurum is gone, and so are you. The gala never knew.', CANVAS_W / 2, 272);
  } else {
    ctx.fillStyle = '#ff5a4e';
    ctx.font = '700 56px Georgia, serif';
    ctx.fillText('BUSTED', CANVAS_W / 2, 230);
    ctx.fillStyle = PALETTE.cream;
    ctx.font = 'italic 19px Georgia, serif';
    ctx.fillText(state.endReason || 'The house always wins.', CANVAS_W / 2, 272);
  }
  const score = scoreBreakdown(state);
  ctx.fillStyle = 'rgba(242, 232, 213, 0.9)';
  ctx.font = '16px Georgia, serif';
  const rows = [
    `Loot lifted:  $${state.player.value.toLocaleString('en-US')}`,
    `Time bonus:  $${score.timeBonus.toLocaleString('en-US')}`,
    score.ghost > 0 ? `Ghost bonus (never raised suspicion):  $${score.ghost.toLocaleString('en-US')}` : null,
    `Times spotted:  ${state.stats.timesSpotted}`,
    `Peak alarm:  ${Math.round(state.stats.peakAlarm)}`,
  ].filter(Boolean);
  rows.forEach((row, i) => ctx.fillText(row, CANVAS_W / 2, 340 + i * 30));
  ctx.fillStyle = PALETTE.goldBright;
  ctx.font = '700 26px Georgia, serif';
  ctx.fillText(`TOTAL SCORE  $${score.total.toLocaleString('en-US')}`, CANVAS_W / 2, 340 + rows.length * 30 + 16);
  const blink = 0.65 + 0.35 * Math.sin(state.elapsed * 4);
  ctx.globalAlpha = blink;
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '700 20px Georgia, serif';
  ctx.fillText('— Press R to run it again —', CANVAS_W / 2, 600);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

function drawPaused(ctx) {
  overlay(ctx, 0.55);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '700 44px Georgia, serif';
  ctx.fillText('PAUSED', CANVAS_W / 2, CANVAS_H / 2 - 10);
  ctx.font = '16px Georgia, serif';
  ctx.fillText('P — resume      R — restart', CANVAS_W / 2, CANVAS_H / 2 + 30);
  ctx.textAlign = 'left';
}

// --- The frame ---

/** Draw one frame: world, HUD, vignette, and any overlay for the current screen. */
export function render(ctx, state, input, dt, paused) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  const time = state.elapsed;
  ctx.save();
  ctx.translate(0, HUD_H);
  const blockers = [...WALLS, ...FURNITURE];
  if (!state.vaultDoorOpen) blockers.push(VAULT_DOOR);

  drawFloor(ctx, time);
  drawWalls(ctx, state);
  drawFurniture(ctx, time);
  drawLoot(ctx, state, time);
  drawCameras(ctx, state, blockers);
  drawGuards(ctx, state, blockers);
  drawGuests(ctx, state);
  drawPlayer(ctx, state, time);
  drawParticles(ctx, state, dt);
  ctx.restore();

  // Alarm vignette: the room itself turns red as the heat rises.
  if (state.alarm >= 50) {
    const pulse = 0.10 + 0.05 * Math.sin(time * 5) + (state.alarm / 100) * 0.12;
    const g = ctx.createRadialGradient(
      CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.35,
      CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.75,
    );
    g.addColorStop(0, 'rgba(255, 59, 48, 0)');
    g.addColorStop(1, `rgba(255, 59, 48, ${pulse})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
  // Near-catch heartbeat ring around the thief.
  const near = nearestGuardDistance(state);
  if (state.screen === 'play' && near < 110 && state.alarm >= 25) {
    const throb = 0.25 + 0.2 * Math.sin(time * 9);
    ctx.strokeStyle = `rgba(255, 59, 48, ${throb})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y + HUD_H, 30 + 4 * Math.sin(time * 9), 0, Math.PI * 2);
    ctx.stroke();
  }

  drawHUD(ctx, state, input);
  drawToasts(ctx, state);

  if (state.screen === 'title') drawTitle(ctx, state);
  else if (state.screen === 'caught') drawEnd(ctx, state, false);
  else if (state.screen === 'escaped') drawEnd(ctx, state, true);
  else if (paused) drawPaused(ctx);
}
