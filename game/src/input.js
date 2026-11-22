// Input: keyboard state plus clickable HUD buttons.
// One job: turn keys and mouse clicks into the plain object the update step reads.

export const KEY_ACTIONS = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  sprint: ['ShiftLeft', 'ShiftRight'],
  crouch: ['KeyC', 'ControlLeft'],
  powerCut: ['KeyQ'],
  insider: ['KeyE'],
  pause: ['KeyP', 'Escape'],
  restart: ['KeyR'],
  mute: ['KeyM'],
  confirm: ['Enter', 'Space'],
};

/** Create the input state and attach listeners to the window. */
export function createInput() {
  const input = {
    keys: new Set(),
    pressed: new Set(), // edge-triggered: cleared each frame by the game loop
    mouseX: 0, mouseY: 0, clicked: false,
    buttons: [], // {x, y, w, h, id} in canvas coordinates, set by the renderer
  };

  const codeOf = (event) => event.code;
  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (!event.repeat) input.pressed.add(event.code);
    input.keys.add(event.code);
  });
  window.addEventListener('keyup', (event) => input.keys.delete(event.code));
  window.addEventListener('blur', () => input.keys.clear());
  window.addEventListener('mousemove', (event) => {
    const rect = document.getElementById('game').getBoundingClientRect();
    const scale = Math.min(rect.width / 1280, rect.height / 864);
    input.mouseX = (event.clientX - rect.left - (rect.width - 1280 * scale) / 2) / scale;
    input.mouseY = (event.clientY - rect.top - (rect.height - 864 * scale) / 2) / scale;
  });
  window.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    input.clicked = true;
    const rect = document.getElementById('game').getBoundingClientRect();
    const scale = Math.min(rect.width / 1280, rect.height / 864);
    input.mouseX = (event.clientX - rect.left - (rect.width - 1280 * scale) / 2) / scale;
    input.mouseY = (event.clientY - rect.top - (rect.height - 864 * scale) / 2) / scale;
  });
  return input;
}

/** True while any of the action's keys is held. */
export function held(input, action) {
  return KEY_ACTIONS[action].some((code) => input.keys.has(code));
}

/** True only on the frame the key went down. */
export function justPressed(input, action) {
  return KEY_ACTIONS[action].some((code) => input.pressed.has(code));
}

/** Movement vector from the held keys, normalised. */
export function moveVector(input) {
  let x = 0;
  let y = 0;
  if (held(input, 'left')) x -= 1;
  if (held(input, 'right')) x += 1;
  if (held(input, 'up')) y -= 1;
  if (held(input, 'down')) y += 1;
  if (x !== 0 && y !== 0) {
    x *= Math.SQRT1_2;
    y *= Math.SQRT1_2;
  }
  return { x, y };
}

/** Id of the HUD button under the last click, or null. */
export function clickedButton(input) {
  if (!input.clicked) return null;
  for (const button of input.buttons) {
    if (input.mouseX >= button.x && input.mouseX <= button.x + button.w
      && input.mouseY >= button.y && input.mouseY <= button.y + button.h) {
      return button.id;
    }
  }
  return null;
}

/** Clear the edge-triggered state at the end of a frame. */
export function endFrame(input) {
  input.pressed.clear();
  input.clicked = false;
  input.buttons = [];
}
