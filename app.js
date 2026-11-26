const board = document.querySelector("#board");
const preview = document.querySelector("#next-piece");
const startScreen = document.querySelector("#start-screen");
const pauseScreen = document.querySelector("#pause-screen");
const gameOverScreen = document.querySelector("#game-over-screen");
const startButton = document.querySelector("#start");
const restartButton = document.querySelector("#restart");
const boardStatus = document.querySelector("#board-status");
const score = document.querySelector("#score");
const record = document.querySelector("#record");
const lines = document.querySelector("#lines");
const level = document.querySelector("#level");
const boardContext = board.getContext("2d");
const previewContext = preview.getContext("2d");

const CELL_COLORS = {
  I: "#7ed7ce",
  J: "#7e9bdf",
  L: "#ec9b59",
  O: "#f4ce63",
  S: "#a5ce75",
  T: "#bb91d8",
  Z: "#e97868",
};
const RECORD_KEY = "blocks.record";
const INITIAL_FALL_DELAY = 800;
const MIN_FALL_DELAY = 80;
const SOFT_DROP_DELAY = 50;

let game;
let fallTimer;
let isPaused = false;
let isSoftDropping = false;
let bestScore = readRecord();

function parseRecord(value) {
  const points = Number(value);
  return Number.isSafeInteger(points) && points >= 0 ? points : 0;
}

function readRecord() {
  try {
    return parseRecord(localStorage.getItem(RECORD_KEY));
  } catch {
    return 0;
  }
}

function displayNumber(element, value, digits) {
  element.textContent = String(value).padStart(digits, "0");
}

function updateRecord(candidate) {
  const savedScore = readRecord();
  bestScore = Math.max(bestScore, candidate, savedScore);
  if (bestScore > savedScore) {
    try {
      localStorage.setItem(RECORD_KEY, String(bestScore));
    } catch {
      // Keep the record for this page even if browser storage is unavailable.
    }
  }
  displayNumber(record, bestScore, 6);
}

function drawCell(x, y, type, outline = false) {
  const width = board.width / BOARD_WIDTH;
  const height = board.height / BOARD_HEIGHT;
  if (outline) {
    boardContext.strokeStyle = CELL_COLORS[type];
    boardContext.lineWidth = 2;
    boardContext.strokeRect(x * width + 3, y * height + 3, width - 6, height - 6);
    return;
  }
  boardContext.fillStyle = CELL_COLORS[type];
  boardContext.fillRect(x * width + 1, y * height + 1, width - 2, height - 2);
}

function renderBoard() {
  boardContext.clearRect(0, 0, board.width, board.height);
  for (const [y, row] of game.grid.entries()) {
    for (const [x, type] of row.entries()) {
      if (type !== null) drawCell(x, y, type);
    }
  }

  if (!game.isOver) {
    const landing = game.landingPiece;
    if (landing.y !== game.activePiece.y) {
      for (const [x, y] of pieceCells(landing)) {
        drawCell(x, y, landing.type, true);
      }
    }
    for (const [x, y] of pieceCells(game.activePiece)) {
      drawCell(x, y, game.activePiece.type);
    }
  }
}

function renderPreview() {
  previewContext.clearRect(0, 0, preview.width, preview.height);
  if (game.isOver) return;

  const cells = pieceCells({ type: game.nextType, rotation: 0, x: 0, y: 0 });
  const columns = cells.map(([x]) => x);
  const rows = cells.map(([, y]) => y);
  const size = preview.width / 4;
  const offsetX = (3 - Math.min(...columns) - Math.max(...columns)) * size / 2;
  const offsetY = (3 - Math.min(...rows) - Math.max(...rows)) * size / 2;
  previewContext.fillStyle = CELL_COLORS[game.nextType];
  for (const [x, y] of cells) {
    previewContext.fillRect(offsetX + x * size + 1, offsetY + y * size + 1, size - 2, size - 2);
  }
}

function renderRound() {
  if (game.score > bestScore) updateRecord(game.score);
  displayNumber(score, game.score, 6);
  displayNumber(lines, game.lines, 3);
  displayNumber(level, game.level, 2);
  renderBoard();
  renderPreview();
}

function updateRoundStatus() {
  pauseScreen.hidden = !isPaused;
  gameOverScreen.hidden = !game.isOver;
  if (game.isOver) {
    boardStatus.textContent = "Конец игры";
  } else {
    boardStatus.textContent = isPaused ? "Пауза" : "Игра идёт";
  }
}

function scheduleFall() {
  clearTimeout(fallTimer);
  if (isPaused || game.isOver) return;

  const fallDelay = Math.max(MIN_FALL_DELAY, INITIAL_FALL_DELAY * 0.8 ** (game.level - 1));
  fallTimer = setTimeout(fallOneRow, isSoftDropping ? SOFT_DROP_DELAY : fallDelay);
}

function finishDrop() {
  renderRound();
  if (game.isOver) {
    isSoftDropping = false;
    updateRoundStatus();
  }
  scheduleFall();
}

function fallOneRow() {
  game.stepDown();
  finishDrop();
}

function startRound() {
  game = new BlockGame();
  isPaused = false;
  isSoftDropping = false;
  startScreen.hidden = true;
  startButton.disabled = true;
  restartButton.disabled = false;
  updateRoundStatus();
  renderRound();
  board.focus();
  scheduleFall();
}

function stopSoftDrop() {
  if (!isSoftDropping) return;

  isSoftDropping = false;
  scheduleFall();
}

function handleKeyDown(event) {
  if (!game || game.isOver || event.altKey || event.ctrlKey || event.metaKey) return;

  if (event.code === "KeyP") {
    event.preventDefault();
    if (!event.repeat) {
      isPaused = !isPaused;
      isSoftDropping = false;
      updateRoundStatus();
      scheduleFall();
    }
    return;
  }
  if (isPaused) return;

  switch (event.code) {
    case "ArrowLeft":
    case "ArrowRight":
      if (game.move(event.code === "ArrowLeft" ? -1 : 1)) renderBoard();
      break;
    case "ArrowUp":
    case "KeyZ":
      if (!event.repeat && game.rotate(event.code === "ArrowUp" ? 1 : -1)) renderBoard();
      break;
    case "ArrowDown":
      if (!event.repeat && !isSoftDropping) {
        isSoftDropping = true;
        fallOneRow();
      }
      break;
    case "Space":
      if (event.target instanceof HTMLButtonElement) return;
      if (!event.repeat) {
        game.hardDrop();
        finishDrop();
      }
      break;
    default:
      return;
  }
  event.preventDefault();
}

displayNumber(record, bestScore, 6);
startButton.addEventListener("click", startRound);
restartButton.addEventListener("click", startRound);
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", event => {
  if (event.code === "ArrowDown") stopSoftDrop();
});
window.addEventListener("blur", stopSoftDrop);
window.addEventListener("storage", event => {
  if (event.key === RECORD_KEY && event.newValue !== null) {
    updateRecord(parseRecord(event.newValue));
  }
});
