const board = document.querySelector("#board");
const preview = document.querySelector("#next-piece");
const startScreen = document.querySelector("#start-screen");
const startButton = document.querySelector("#start");
const restartButton = document.querySelector("#restart");
const boardStatus = document.querySelector("#board-status");
const score = document.querySelector("#score");
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

let game;

function drawCell(x, y, type) {
  const width = board.width / BOARD_WIDTH;
  const height = board.height / BOARD_HEIGHT;
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
    for (const [x, y] of pieceCells(game.activePiece)) {
      drawCell(x, y, game.activePiece.type);
    }
  }
}

function startRound() {
  game = new BlockGame();
  renderBoard();
  previewContext.clearRect(0, 0, preview.width, preview.height);

  score.textContent = "000000";
  lines.textContent = "000";
  level.textContent = "01";
  startScreen.hidden = true;
  startButton.disabled = true;
  restartButton.disabled = false;
  boardStatus.textContent = "Игра началась";
  board.focus();
}

startButton.addEventListener("click", startRound);
restartButton.addEventListener("click", startRound);
