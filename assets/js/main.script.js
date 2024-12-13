/**
 * @typedef {Object} PlayerCharacterDetails
 * @property {string} avatar
 * @property {string} name
 * @property {number} score
 * @property {string} color
 * @property {boolean} isAI
 */

/**
 * @typedef {Object.<string, string>} PlayerScore
 */

/**
 * @typedef {Object} BoardStructure
 * @property {number} COLUMNS
 * @property {number} ROWS
 */

const GAME_SETTING_KEY = "gameSettings";

const gameSettingsStr = window.localStorage.getItem(GAME_SETTING_KEY);

/** Prevents users for attempting to play the game if the game settings were not found */
if (!gameSettingsStr) {
  location.href = "./index.html";
}

/** @type {{playerCount:Number, playerDetails:PlayerCharacterDetails[], boardSize:String, roundType:"best-of-three" | "best-of-nine" | "free-for-all", turnDuration:Number | null, aiDifficulty: "easy" | "hard" | null}} */
const gameSettings = JSON.parse(gameSettingsStr);

/** @type {PlayerCharacterDetails[]} */
const playerData = gameSettings.playerDetails.map((item) => {
  return {
    avatar: item.avatar,
    name: item.name,
    score: 0,
    color: item.color,
    isAI: item.isAI,
  };
});

/** @type {"best-of-three" | "best-of-nine" | "free-for-all"} */
const roundType = gameSettings?.roundType ?? "best-of-three";

/** @type {number | undefined} */
let roundsLeft =
  roundType === "best-of-nine"
    ? 9
    : roundType === "best-of-three"
    ? 3
    : undefined;

/**Get the number of rows & columns from the gameSettings */
const [ROW_NO, COLUMN_NO] = gameSettings.boardSize.split("#");

/**
 * Object depicting the number of rows and columns of the board.
 *
 * Default number of rows and columns is 3
 *
 * @type {BoardStructure} */
const boardStructure = {
  COLUMNS: COLUMN_NO,
  ROWS: ROW_NO,
};

/**
 * Current game board state. This can be later on overwritten by the `renderBoard` function
 *
 *  @type {string[]} */
let gameBoardState = [];

/** @type {number[][]} */
const winConditions = [];

let currentPlayer = playerData[0].name; // the starting player

let gameActive = true; // the state of the game whether its ongoing or not.

/** Renders the type of board */
(function () {
  const gameMode = document.getElementById("round_mode_type");
  if (gameSettings.roundType === "best-of-nine") {
    gameMode.textContent = "Best Of Nine";
  } else if (gameSettings.roundType === "best-of-three") {
    gameMode.textContent = "Best Of Three";
  } else {
    gameMode.textContent = "Free For All";
  }
})();

/** Holds the `setInterval` callback for the timer */
let timer;
/**
 * Number of seconds for each players turn
 * @type {number} */
let timeLeft = gameSettings.turnDuration ?? 10;

/** Resets the `timeLeft` back to the default value*/
function resetTurnTimer() {
  if (gameActive) {
    timeLeft = gameSettings.turnDuration ?? 10;
  }
}

/** Starts the timer countdown or counting from where we left off*/
function startTimer() {
  timer = setInterval(updateTimer, 1000);
}

/** Stops the timer countdown or pause the countdown*/
function stopTimer() {
  clearInterval(timer);
}

function updateTimer() {
  document.getElementById("timer_countdown").innerText = timeLeft;
  if (timeLeft > 0) {
    timeLeft--;
  } else {
    /**Change player turn when players turn is over */
    currentPlayer = getNextPlayer();
    clearInterval(timer);
    alert("Time's up!");
    renderPlayerTurnTracker();
    resetTurnTimer();
    startTimer();
    executeAIMoveSet();
  }
}

function pauseGame() {
  const gamePauseModal = document.querySelector(".game_pause_modal");
  gamePauseModal.parentElement.classList.remove("hidden");
  stopTimer();
  gameActive = false;
}

function resumeGame() {
  const gamePauseModal = document.querySelector(".game_pause_modal");
  gamePauseModal.parentElement.classList.add("hidden");
  if (roundType !== "free-for-all") {
    startTimer();
  }
  gameActive = true;
}

function exitGame() {
  window.localStorage.removeItem(GAME_SETTING_KEY);
  window.location.reload();
}

if (roundType !== "free-for-all") {
  /** @type {HTMLDivElement} */
  const timerWrapper = document.getElementById("timer_wrapper");

  /** @type {HTMLDivElement} */
  const roundInstructionsModal = document.querySelector(".round_instructions");

  if (roundInstructionsModal.parentElement.classList.contains("hidden")) {
    roundInstructionsModal.parentElement.classList.remove("hidden");
  }

  /** @type {HTMLButtonElement} */
  const roundInstructionConfirm = document.getElementById(
    "round_instruction_confirm"
  );

  /** @type {HTMLSpanElement} */
  const countDown = document.getElementById("timer_countdown");

  roundInstructionConfirm.addEventListener("click", (e) => {
    e.preventDefault();
    roundInstructionsModal.parentElement.classList.add("hidden");
    startTimer();
  });

  document.getElementById("round_instructions_time_limit").textContent =
    timeLeft;

  if (timerWrapper.classList.contains("hidden")) {
    timerWrapper.classList.remove("hidden");
  }
}

function renderPlayerTurnTracker() {
  /** @type {HTMLDivElement} */
  const section = document.getElementById("player_turn_tracker");
  section.innerHTML = "";
  const currentPlayerObj = playerData.find(
    (item) => item.name === currentPlayer
  );
  const playerImg = document.createElement("img");
  playerImg.setAttribute("src", currentPlayerObj.avatar);
  playerImg.setAttribute("alt", currentPlayerObj.name);
  playerImg.classList.add("current_player_avatar");
  section.appendChild(playerImg);
}
renderPlayerTurnTracker();

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
    const img = document.createElement("img");
    img.setAttribute("src", player.avatar);
    img.setAttribute("alt", player.name);

    const divEle = document.createElement("div");

    const pEle = document.createElement("p");
    pEle.textContent = player.name;
    const spanEl = document.createElement("span");
    spanEl.textContent = player.isAI ? " AI" : "";
    spanEl.style.color = player.color;
    pEle.appendChild(spanEl);
    const smallEle = document.createElement("small");
    smallEle.textContent = `Score: ${player.score}`;

    divEle.append(pEle, smallEle);
    sectionEle.append(img, divEle);
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
    if (currentPlayer === playerData[player].name) {
      const nextPlayer = playerData[Number(player) + 1];

      if (nextPlayer !== undefined) {
        return nextPlayer.name;
      } else {
        return playerData[0].name;
      }
    }
  }
}

/** Random number generator
 *
 * Generates a random number within the range of `min` & `max`
 *
 * @returns {number}
 */
function getRandomInt(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}

/** Makes a play on a cell using Montey Carlos Tree Search (MCTS), simulating the AI's moveset */
function AIAction() {
  // console.log("gameBoardState", gameBoardState);
  const gameStateObj = new GameState(
    gameBoardState,
    winConditions,
    playerData.map((item) => item.name)
  );
  const monteyCarlosTreeSearch = MCTS(
    gameStateObj,
    1000,
    currentPlayer,
    gameBoardState
  );

  if (monteyCarlosTreeSearch) {
    /* Make play according to U  */
    cellClicked(undefined, monteyCarlosTreeSearch.index);
  }
}

/** Function triggers AI moveset */
function executeAIMoveSet() {
  const nextTurnPlayer = playerData.find((item) => item.name === currentPlayer);
  if (!nextTurnPlayer) {
    return;
  }
  if (gameActive === false) {
    return;
  }
  if (nextTurnPlayer.isAI) {
    AIAction();
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
  cellItem.addEventListener(
    "click",
    (e) => {
      cellClicked(e);
      const clickAudio = new Audio("../assets/audio/button_click.mp3");
      clickAudio.volume = 0.7;
      clickAudio.play();
    },
    false
  );
}

/**
 *
 * @param {MouseEvent | undefined} clickedCellEvent
 * @param {number | undefined} cellIndx
 */
function cellClicked(clickedCellEvent, cellIndx) {
  let clickedCellIndex;
  if (clickedCellEvent) {
    const clickedCell = clickedCellEvent.target;
    clickedCellIndex = clickedCell.id.replace("cell-", "");
    clickedCellIndex = parseInt(clickedCellIndex) - 1;
  } else {
    clickedCellIndex = cellIndx;
  }

  if (!gameActive || gameBoardState[clickedCellIndex] !== "") {
    return;
  }

  /**
   * On each play of the timer is greater than 0
   * reset the `timeLeft` to default
   * else
   * reset the `timeLeft` and restart the timer.
   */
  if (roundType !== "free-for-all") {
    if (timeLeft > 0) {
      resetTurnTimer();
    } else {
      resetTurnTimer();
      startTimer();
    }
  }
  handlePlayerTurn(clickedCellIndex);
  updateUI();
  renderPlayerTurnTracker();

  executeAIMoveSet();
}

/**
 * Updates the UI rendering the respective player characters in the appropraite board cells
 */
function updateUI() {
  for (let cellIndx = 0; cellIndx < cells.length; cellIndx++) {
    const player = playerData.find(
      (item) => item.name === gameBoardState[cellIndx]
    );
    if (player) {
      cells[cellIndx].innerHTML = `
    <img style="width:100%;height:100%;object-fit:contain;" src="${player.avatar}" alt="${player.name}"/>
    `;
    }
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
    if (roundType !== "free-for-all") {
      stopTimer();
      resetTurnTimer();
    }
    incrementPlayerScoreCount([currentPlayer]);
    gameActive = false;

    renderScoreTracker();
    decrementRoundsLeft();
    return;
  }

  let roundDraw = !gameBoardState.includes("");

  if (roundDraw) {
    announceDraw();
    if (roundType !== "free-for-all") {
      stopTimer();
      resetTurnTimer();
    }
    incrementPlayerScoreCount(playerData.map((item) => item.name));
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
  if (isOnGoingRound()) {
    roundsLeft -= 1;

    if (roundsLeft === 0) {
      /** @type {HTMLDivElement} */
      const gameOverModal = document.querySelector(".game-over-modal");

      gameOverModal.parentElement.classList.remove("hidden");
      const gameOverModalWinnerLabel = document.querySelector(".winner_name");

      const highestScorePlayer = getWinner();
      if (highestScorePlayer === "same_score") {
        gameOverModalWinnerLabel.textContent = `Oh...Its a draw😮`;
      } else {
        gameOverModalWinnerLabel.textContent = `"${highestScorePlayer.name}" won`;
      }
    }
  }
}

/**
 * Function that gets the player with the highest score
 *
 * @returns {PlayerCharacterDetails | "same_score"}
 */
function getWinner() {
  let highScore = 0;
  let playerName = "";

  if (isSameScoreForAllPlayers()) {
    return "same_score";
  }

  for (const item of playerData) {
    if (item.score > highScore) {
      highScore = item.score;
      playerName = item.name;
    }
  }

  return playerData.find((item) => item.name === playerName) ?? playerData[0];
}

/** Function that checks if all players have the same score */
function isSameScoreForAllPlayers() {
  let score = playerData[0].score;
  for (const item of playerData) {
    if (score !== item.score) {
      return false;
    }
  }
  return true;
}

/**
 * Increments player score count
 *
 * @param {string[]} playerArray
 */
function incrementPlayerScoreCount(playerArray) {
  playerArray.forEach((player) => {
    playerData.forEach((item) => {
      if (item.name === player) {
        item.score = item.score + 1;
      }
    });
  });
}

/**
 * Function to reset all player score to zero
 *
 * @return {void}
 * */
function resetPlayerScore() {
  playerData.forEach((player) => {
    player.score = 0;
  });
}

function resetRoundsLeft() {
  roundsLeft =
    roundType === "best-of-nine"
      ? 9
      : roundType === "best-of-three"
      ? 3
      : undefined;
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

/**
 * Function to clear game state and player data
 *
 * @param {?{closeGameOverModal: boolean, closePauseModal: boolean }} options
 *  */
function resetGame(options) {
  const arr = [];
  for (let i = 0; i < gameBoardState.length; i++) {
    arr.push("");
  }
  gameBoardState = arr; // Clear the game board
  gameActive = true; // Set the game as active
  currentPlayer = playerData[0].name; // Reset to player X
  if (options && options.closeGameOverModal === true) {
    /** @type {HTMLDivElement} */
    const gameOverModal = document.querySelector(".game-over-modal");
    gameOverModal.parentElement.classList.add("hidden");
  }
  if (options && options.closePauseModal === true) {
    const gamePauseModal = document.querySelector(".game_pause_modal");
    gamePauseModal.parentElement.classList.add("hidden");
  }
  if (isOnGoingRound()) {
    resetTurnTimer();
    startTimer();
  }

  resetPlayerScore();
  renderScoreTracker();
  resetRoundsLeft();

  // Clear all cells on the UI
  for (let i = 0; i < cells.length; i++) {
    cells[i].innerText = "";
    if (cells[i].classList.contains("bg-green")) {
      cells[i].classList.remove("bg-green");
    }
  }
  document.getElementById("gameMessage").innerText = "";
  renderPlayerTurnTracker();
}

/** Function that clears the board for the next round
 *
 * @param {boolean} activateGame
 */
function nextGameRound(activateGame) {
  const arr = [];
  for (let i = 0; i < gameBoardState.length; i++) {
    arr.push("");
  }
  // Clear the game board
  gameBoardState = arr;
  // Set the game as active
  if (isOnGoingRound() || activateGame) {
    gameActive = true;
  }
  currentPlayer = playerData[0].name; // Reset to player X
  // Clear all cells on the UI
  for (let i = 0; i < cells.length; i++) {
    cells[i].innerText = "";
    if (cells[i].classList.contains("bg-green")) {
      cells[i].classList.remove("bg-green");
    }
  }
  document.getElementById("gameMessage").innerText = "";
  if (roundType !== "free-for-all") {
    startTimer();
  }
  renderPlayerTurnTracker();
}

const resetButton = document.getElementById("resetButton");
/** Game over modal play again button */
const playAgain = document.getElementById("play_again");
playAgain.addEventListener("click", () =>
  resetGame({
    closeGameOverModal: true,
  })
);

/**
 * @type {HTMLButtonElement}
 */
const trueResetBtn = document.getElementById("true-reset-btn");
trueResetBtn.addEventListener("click", () =>
  resetGame({
    closePauseModal: true,
  })
);

/**
 * Function that checks for on going rounds
 * @returns boolean
 */
function isOnGoingRound() {
  return (
    roundType !== "free-for-all" &&
    typeof roundsLeft === "number" &&
    roundsLeft > 0
  );
}

if (isOnGoingRound()) {
  resetButton.textContent = "Next round";
  resetButton.addEventListener("click", nextGameRound, false);
} else {
  resetButton.textContent = "Next Game";
  resetButton.addEventListener("click", () => nextGameRound(true), false);
}
