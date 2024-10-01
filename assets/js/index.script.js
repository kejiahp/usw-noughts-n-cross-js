/**
 * @typedef {Object} PossiblePlayer
 * @property {string} X
 * @property {string} O
 */

/** @type {PossiblePlayer} */
const possiblePlayer = {
  X: "X",
  O: "O",
};

/** @type {string[]} */
let gameBoard = ["", "", "", "", "", "", "", "", ""]; // the current game board

/** @type {number[][]} */
const winConditions = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 3, 6], // Left column
  [1, 4, 7], // Middle column
  [2, 5, 8], // Right column
  [0, 4, 8], // Left-to-right diagonal
  [2, 4, 6], // Right-to-left diagonal
];

let currentPlayer = possiblePlayer.X; // the starting player

let gameActive = true; // the state of the game whether its ongoing or not.

/**
 * Function to handleToggling of Player Turns on board cell click
 * @param {number} clickedCellIndex
 * @returns {void}
 */
function handlePlayerTurn(clickedCellIndex) {
  if (!gameActive || gameBoard[clickedCellIndex] !== "") {
    return;
  }

  gameBoard[clickedCellIndex] = currentPlayer;
  checkForWinOrDraw();
  currentPlayer =
    currentPlayer === possiblePlayer.X ? possiblePlayer.O : possiblePlayer.X;
}

/** @type {HTMLDivElement[]} */
const cells = document.querySelectorAll(".cell");
for (let cellCount = 0; cellCount < cells.length; cellCount++) {
  const cellItem = cells[cellCount];
  cellItem.addEventListener("click", cellClicked, false);
}

/**
 *
 * @param {MouseEvent} clickedCellEvent
 */
function cellClicked(clickedCellEvent) {
  const clickedCell = clickedCellEvent.target;
  let clickedCellIndex = clickedCell.id.replace("cell-", "");
  clickedCellIndex = parseInt(clickedCellIndex) - 1;

  if (!gameActive || gameBoard[clickedCellIndex] !== "") {
    return;
  }

  handlePlayerTurn(clickedCellIndex);
  updateUI();
}

/**
 * Updates the UI rendering the respective player characters in the appropraite board cells
 */
function updateUI() {
  for (let cellIndx = 0; cellIndx < cells.length; cellIndx++) {
    cells[cellIndx].innerText = gameBoard[cellIndx];
  }
}

/** Checks all possible win conditions, if a winner is found the game ends and a winner is announced */
function checkForWinOrDraw() {
  let roundWon = false;

  for (let i = 0; i < winConditions.length; i++) {
    const [a, b, c] = winConditions[i];
    if (
      gameBoard[a] &&
      gameBoard[a] === gameBoard[b] &&
      gameBoard[a] === gameBoard[c]
    ) {
      roundWon = true;
      break;
    }
  }

  if (roundWon) {
    announceWinner(currentPlayer);
    gameActive = false;
    return;
  }

  let roundDraw = !gameBoard.includes("");
  if (roundDraw) {
    announceDraw();
    gameActive = false;
    return;
  }
}

/** Announce winner of the game */
function announceWinner(player) {
  const messageElement = document.getElementById("gameMessage");
  messageElement.innerText = `Player ${player} Wins!`;
}

/** Announce the game was a draw */
function announceDraw() {
  const messageElement = document.getElementById("gameMessage");
  messageElement.innerText = "Game Draw!";
}

/** Function to clear game state and player data */
function resetGame() {
  const arr = [];
  for (let i = 0; i < gameBoard.length; i++) {
    arr.push("");
  }
  gameBoard = arr; // Clear the game board
  gameActive = true; // Set the game as active
  currentPlayer = possiblePlayer.X; // Reset to player X
  // Clear all cells on the UI
  for (let i = 0; i < cells.length; i++) {
    cells[i].innerText = "";
  }
  document.getElementById("gameMessage").innerText = "";
}

const resetButton = document.getElementById("resetButton");
resetButton.addEventListener("click", resetGame, false);
