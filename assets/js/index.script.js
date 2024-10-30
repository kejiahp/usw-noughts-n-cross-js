/**
 * @typedef {Object} PlayerData
 * @property {string} avatar
 * @property {string} name
 * @property {number} score
 */

/**
 * @typedef {Object.<string, string>} PlayerScore
 */

/**
 * @typedef {Object} BoardStructure
 * @property {number} COLUMNS
 * @property {number} ROWS
 */

/** @type {PlayerData[]} */
const playerData = [
  { avatar: "X", name: "Ex", score: 0 },
  { avatar: "O", name: "Oh", score: 0 },
];

/** @type {"best-of-three" | "best-of-nine" | "free-for-all"} */
const roundType = window.localStorage.getItem("roundType") ?? "best-of-three";

/** @type {number | undefined} */
let roundsLeft =
  roundType === "best-of-nine"
    ? 9
    : roundType === "best-of-three"
    ? 3
    : undefined;

/**
 * Object depicting the number of rows and columns of the board.
 *
 * Default number of rows and columns is 3
 *
 * @type {BoardStructure} */
const boardStructure = {
  COLUMNS: 3,
  ROWS: 3,
};

/**
 * Current game board state. This can be later on overwritten by the `renderBoard` function
 *
 *  @type {string[]} */
let gameBoardState = [];

/** @type {number[][]} */
const winConditions = [];

let currentPlayer = playerData[0].avatar; // the starting player

let gameActive = true; // the state of the game whether its ongoing or not.

/**
 * Renders the board using a specified number of rows and columns.
 *
 * @param {number} columnCnt
 * @param {number} rowCnt
 */
(function renderBoard(
  columnCnt = boardStructure["COLUMNS"],
  rowCnt = boardStructure["ROWS"]
) {
  const gameBoardDom = document.getElementById("tic-tac-toe-board");
  /** Keeps track of the number of cells created */
  let cellCnt = 0;
  for (let r = 0; r < rowCnt; r++) {
    const rowDiv = document.createElement("div");
    rowDiv.setAttribute("id", "row");
    rowDiv.classList.add("row");

    for (let c = 0; c < columnCnt; c++) {
      cellCnt += 1;
      const columnDiv = document.createElement("div");
      columnDiv.classList.add("cell");
      columnDiv.setAttribute("id", `cell-${cellCnt}`);
      rowDiv.append(columnDiv);
    }

    gameBoardDom.append(rowDiv);
  }

  // Overwrite the game board state
  for (let item = 0; item < cellCnt; item++) {
    gameBoardState.push("");
  }
})();

/**
 * Renders the score tracker, displaying player information
 */
function renderScoreTracker() {
  const scoreTracker = document.getElementById("scoreTracker");
  scoreTracker.innerHTML = "";
  for (const player of playerData) {
    const sectionEle = document.createElement("section");
    const h1Ele = document.createElement("h1");
    h1Ele.textContent = player.avatar;
    const divEle = document.createElement("div");

    const pEle = document.createElement("div");
    pEle.textContent = player.name;
    const smallEle = document.createElement("small");
    smallEle.textContent = `Score: ${player.score}`;

    divEle.append(pEle, smallEle);
    sectionEle.append(h1Ele, divEle);
    scoreTracker.append(sectionEle);
  }
}

renderScoreTracker();

/**
 * Function to generate the win condition array for the game
 */
function generateWinConditionArray() {
  /** Boolean checking if diagonal win conditions are possible */
  const isDiagonalWinPossible =
    boardStructure["COLUMNS"] === boardStructure["ROWS"];

  const gameBoardStateCopy = [];

  for (let i in gameBoardState) {
    gameBoardStateCopy.push(Number(i));
  }

  // get all row win combinations
  for (let rowWin = 0; rowWin < boardStructure["ROWS"]; rowWin++) {
    const combination = gameBoardStateCopy.slice(
      rowWin * boardStructure["COLUMNS"],
      boardStructure["COLUMNS"] * (rowWin + 1)
    );
    winConditions.push(combination);
  }
  // get all column win combinations
  for (let colWin = 0; colWin < boardStructure["COLUMNS"]; colWin++) {
    const combination = [];
    for (let rowWin = 0; rowWin < boardStructure["ROWS"]; rowWin++) {
      combination.push(rowWin * boardStructure["COLUMNS"] + colWin);
    }
    winConditions.push(combination);
  }

  // stop executing the function if there is no possibility of a diagonal win
  if (!isDiagonalWinPossible) {
    return;
  }

  const ldiaWinCombination = [];
  // get the diagonal win conditions from the top left of the board to the bottom right
  for (let rdiaWin = 0; rdiaWin < boardStructure["ROWS"]; rdiaWin++) {
    ldiaWinCombination.push(rdiaWin * boardStructure["ROWS"] + rdiaWin);
  }
  winConditions.push(ldiaWinCombination);

  const rdiaWinCombination = [];
  // get the diagonal win conditions from the top right to the board to the bottom left
  for (let ldiaWin = 0; ldiaWin < boardStructure["ROWS"]; ldiaWin++) {
    rdiaWinCombination.push((ldiaWin + 1) * (boardStructure["ROWS"] - 1));
  }
  winConditions.push(rdiaWinCombination);
}

generateWinConditionArray();

/** Controls player turns */
function getNextPlayer() {
  for (const player in playerData) {
    if (currentPlayer === playerData[player].avatar) {
      const nextPlayer = playerData[Number(player) + 1];

      if (nextPlayer !== undefined) {
        return nextPlayer.avatar;
      } else {
        return playerData[0].avatar;
      }
    }
  }
}

/**
 * Function to handleToggling of Player Turns on board cell click
 * @param {number} clickedCellIndex
 * @returns {void}
 */
function handlePlayerTurn(clickedCellIndex) {
  if (!gameActive || gameBoardState[clickedCellIndex] !== "") {
    return;
  }

  gameBoardState[clickedCellIndex] = currentPlayer;
  checkForWinOrDraw();
  currentPlayer = getNextPlayer();
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

  if (!gameActive || gameBoardState[clickedCellIndex] !== "") {
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
    cells[cellIndx].innerText = gameBoardState[cellIndx];
  }
}

/**
 * Check if array items are same.
 *
 * **NOTE:** Always returns false if an empty string is found
 *
 * @param {string[]} array
 * @returns {boolean}
 * */
function identical(array) {
  for (var i = 0; i < array.length - 1; i++) {
    // prevent the function from running on empty strings
    if (array[i] === "") {
      return false;
    }
    if (array[i] !== array[i + 1]) {
      return false;
    }
  }
  return true;
}

/**
 *
 * @param {number[]} array
 */
function colorWinCell(array) {
  for (const item of array) {
    document.getElementById(`cell-${item + 1}`).classList.add("bg-green");
  }
}

/** Checks all possible win conditions, if a winner is found the game ends and a winner is announced */
function checkForWinOrDraw() {
  let roundWon = false;

  for (let i = 0; i < winConditions.length; i++) {
    const arrToCompare = [];
    const winCombinationCellIndex = [];
    for (let j = 0; j < winConditions[i].length; j++) {
      winCombinationCellIndex.push(winConditions[i][j]);
      arrToCompare.push(gameBoardState[winConditions[i][j]]);
    }
    const combinationMatch = identical(arrToCompare);
    if (combinationMatch) {
      roundWon = true;
      colorWinCell(winCombinationCellIndex);
      break;
    }
  }

  if (roundWon) {
    announceWinner(currentPlayer);
    incrementPlayerScoreCount([currentPlayer]);
    gameActive = false;

    renderScoreTracker();
    decrementRoundsLeft();
    return;
  }

  let roundDraw = !gameBoardState.includes("");

  if (roundDraw) {
    announceDraw();
    incrementPlayerScoreCount(playerData.map((item) => item.avatar));
    gameActive = false;

    renderScoreTracker();
    decrementRoundsLeft();
    return;
  }
}

/**
 * Keeps track of the number of rounds played when `roundType` is of values `best-of-nine` and `best-of-three`
 */
function decrementRoundsLeft() {
  if (
    (roundType === "best-of-nine" || roundType === "best-of-three") &&
    typeof roundsLeft === "number" &&
    roundsLeft > 0
  ) {
    roundsLeft -= 1;
  }
  console.log(roundType);
  console.log(roundsLeft);
}

/**
 * Increments player score count
 *
 * @param {string[]} playerArray
 */
function incrementPlayerScoreCount(playerArray) {
  playerArray.forEach((player) => {
    playerData.forEach((item) => {
      if (item.avatar === player) {
        item.score = item.score + 1;
      }
    });
  });
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
  for (let i = 0; i < gameBoardState.length; i++) {
    arr.push("");
  }
  gameBoardState = arr; // Clear the game board
  gameActive = true; // Set the game as active
  currentPlayer = playerData[0].avatar; // Reset to player X
  // Clear all cells on the UI
  for (let i = 0; i < cells.length; i++) {
    cells[i].innerText = "";
    if (cells[i].classList.contains("bg-green")) {
      cells[i].classList.remove("bg-green");
    }
  }
  document.getElementById("gameMessage").innerText = "";
}

const resetButton = document.getElementById("resetButton");
// if (
//   (roundType === "best-of-nine" || roundType === "best-of-three") &&
//   typeof roundsLeft === "number" &&
//   roundsLeft > 0
// ) {
//   resetButton.textContent = "Next round";
// } else {
//   resetButton.textContent = "Play Again";
// }

resetButton.addEventListener("click", resetGame, false);
