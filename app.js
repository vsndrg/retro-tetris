const board = document.querySelector("#board");
const preview = document.querySelector("#next-piece");
const startScreen = document.querySelector("#start-screen");
const startButton = document.querySelector("#start");
const restartButton = document.querySelector("#restart");
const boardStatus = document.querySelector("#board-status");
const score = document.querySelector("#score");
const lines = document.querySelector("#lines");
const level = document.querySelector("#level");

function startRound() {
  for (const canvas of [board, preview]) {
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  }

  score.textContent = "000000";
  lines.textContent = "000";
  level.textContent = "01";
  startScreen.hidden = true;
  startButton.disabled = true;
  restartButton.disabled = false;
  boardStatus.textContent = "Поле готово";
  board.focus();
}

startButton.addEventListener("click", startRound);
restartButton.addEventListener("click", startRound);
