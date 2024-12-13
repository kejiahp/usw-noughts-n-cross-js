const heuristicsDetails = {
  center: 0,
  corner: 0,
  random: 0,
  winningPlay: 0,
};

/** Finds the difference in arrays of the same length
 *
 * @param {Array} arr1
 * @param {Array} arr2
 *
 */
function findTheDifferenceInSameLenArr(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    throw new Error("Arrays must be of the same length");
  }
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return { index: i, arr1: arr1[i], arr2: arr2[i] };
    }
  }
}

class Node {
  constructor(state, parent = null, player = null) {
    this.state = state; // The current board state
    this.parent = parent; // Parent node
    this.children = []; // Child nodes
    this.visits = 0; // Number of visits
    this.wins = 0; // Number of wins
    this.player = player; // Current player

    if (!player) {
      throw new Error("player is required");
    }
  }

  // Expand the node by generating all possible moves
  expand(possibleMoves, currentPlayer) {
    possibleMoves.forEach((move) => {
      const newState = this.state.applyMove(move, currentPlayer); // Apply move

      const playerIndex = this.state.getPlayersIndexNo(currentPlayer);
      const nextPlayer = this.state.getPlayerByIndex(
        (playerIndex + 1) % this.state.playerCount
      );
      this.children.push(new Node(newState, this, nextPlayer));
    });
  }

  // Select the best child using UCT (Upper Confidence Bound for Trees)
  select() {
    return this.children.reduce(
      (best, child) => {
        const uct =
          child.wins / (child.visits + 1) +
          Math.sqrt((2 * Math.log(this.visits + 1)) / (child.visits + 1));
        return uct > best.uct ? { node: child, uct } : best;
      },
      { node: null, uct: -Infinity }
    ).node;
  }

  // Backpropagate results to update the tree
  backpropagate(result) {
    this.visits++;
    if (result === this.player) {
      this.wins++;
    }
    if (this.parent) {
      this.parent.backpropagate(result);
    }
  }
}

// MCTS Algorithm
function MCTS(rootState, iterations, currentPlayer, initBoard) {
  const rootNode = new Node(rootState, null, currentPlayer);

  // REMOVE
  const winProbability = {};
  rootState.listOfPlayers.forEach((item) => {
    winProbability[item] = 0;
  });

  const isWinningMove = checkForWinningPlay(
    initBoard,
    rootState.listOfPlayers,
    rootState.winConditions,
    currentPlayer
  );
  const cornerPlay = verifyCornerPlay(rootState.getPossibleMoves());
  const centerPlay = verifyCentralPlay(rootState.getPossibleMoves());
  if (isWinningMove) {
    return { index: isWinningMove.position };
  } else if (centerPlay) {
    return { index: centerPlay };
  } else if (cornerPlay) {
    return { index: cornerPlay };
  }

  for (let i = 0; i < iterations; i++) {
    /**
     * changes made to `node` also apply to `rootNode`
     *
     * as `node` still points to `rootNode` in memory
     */
    let node = rootNode;

    // Selection
    while (node.children.length > 0) {
      node = node.select();
    }

    // Expansion
    if (!node.state.isTerminal()) {
      const possibleMoves = node.state.getPossibleMoves();
      node.expand(possibleMoves, node.player);
    }

    // Simulation
    const result = simulateGame(node.state, node.player);

    if (result) winProbability[result] = winProbability[result] + 1;

    // Backpropagation
    node.backpropagate(result);
  }

  console.log(winProbability);
  console.log("heuristicsDetails", heuristicsDetails);

  // Choose the most visited child as the best move
  const finalState = rootNode.children.reduce((best, child) =>
    child.visits > best.visits ? child : best
  ).state;

  const diff = findTheDifferenceInSameLenArr(initBoard, finalState.board);

  return diff;
}

// Helper: Simulate a random game
// function simulateGame(state, player) {
//   let currentState = state;
//   let currentPlayer = player;
//   while (!currentState.isTerminal()) {
//     const moves = currentState.getPossibleMoves();
//     const randomMove = moves[Math.floor(Math.random() * moves.length)];
//     currentState = currentState.applyMove(randomMove, currentPlayer);

//     const playerIndex = currentState.getPlayersIndexNo(currentPlayer);
//     const nextPlayer = currentState.getPlayerByIndex(
//       (playerIndex + 1) % currentState.playerCount
//     );
//     currentPlayer = nextPlayer;
//   }
//   return currentState.getWinner(); // Returns the winner
// }

// Helper: Simulate a random game
function simulateGame(state, player) {
  // TODO: Remove

  let currentState = state;
  let currentPlayer = player;
  while (!currentState.isTerminal()) {
    const moves = currentState.getPossibleMoves();
    const playPosition = heuristicMoveSelection(
      moves,
      currentPlayer,
      currentState.board,
      currentState.winConditions,
      currentState.listOfPlayers,
      heuristicsDetails
    );

    currentState = currentState.applyMove(playPosition, currentPlayer);

    const playerIndex = currentState.getPlayersIndexNo(currentPlayer);
    const nextPlayer = currentState.getPlayerByIndex(
      (playerIndex + 1) % currentState.playerCount
    );
    currentPlayer = nextPlayer;
  }
  return currentState.getWinner(); // Returns the winner
}

/**
 *
 * @param {number[]} possibleMove
 * @param {string} currentPlayer
 */
function heuristicMoveSelection(
  possibleMove,
  currentPlayer,
  board = null,
  winConditions = null,
  listOfPlayers = null,
  heuristicsDetails = null
) {
  const centerPlay = verifyCentralPlay(possibleMove);
  const isWinningMove = checkForWinningPlay(
    board,
    listOfPlayers,
    winConditions,
    currentPlayer
  );
  const cornerPlay = verifyCornerPlay(possibleMove);

  if (isWinningMove) {
    heuristicsDetails["winningPlay"] = heuristicsDetails["winningPlay"] + 1;
    return isWinningMove.position;
  } else if (centerPlay) {
    heuristicsDetails["center"] = heuristicsDetails["center"] + 1;
    return centerPlay;
  } else if (cornerPlay) {
    heuristicsDetails["corner"] = heuristicsDetails["corner"] + 1;
    return cornerPlay;
  } else {
    heuristicsDetails["random"] = heuristicsDetails["random"] + 1;
    const randomMove =
      possibleMove[Math.floor(Math.random() * possibleMove.length)];
    return randomMove;
  }
}

/**
 * If the board allows diagonal wins, detect the center and make a play there
 *
 * @param {number[]} playableMoves
 *  */
function verifyCentralPlay(playableMoves) {
  const rows = Number(boardStructure["ROWS"]);
  const cols = Number(boardStructure["COLUMNS"]);
  const isSame = rows === cols;
  if (!isSame) {
    return null;
  }
  if (rows % 2 === 0 || cols % 2 === 0) {
    return null;
  }
  const center = Math.floor((rows * cols) / 2);
  if (!playableMoves.includes(center)) {
    return null;
  }
  return center;
}

function verifyCornerPlay(playableMoves) {
  const rows = Number(boardStructure["ROWS"]);
  const cols = Number(boardStructure["COLUMNS"]);
  const isSame = rows === cols;
  if (!isSame) {
    return null;
  }
  if (rows % 2 === 0 || cols % 2 === 0) {
    return null;
  }
  // get all the corners of the board
  const vv = [];
  for (let colWin = 0; colWin < cols; colWin++) {
    const combination = [];
    for (let rowWin = 0; rowWin < rows; rowWin++) {
      combination.push(rowWin * cols + colWin);
    }
    vv.push(combination);
  }
  const corners = [];
  corners.push(vv[0][0], vv[0][cols - 1]);
  corners.push(vv[vv.length - 1][0], vv[vv.length - 1][cols - 1]);
  for (let corner of corners) {
    if (playableMoves.includes(corner)) {
      return corner;
    }
  }
  return null;
}

function pureIsIdentical(array) {
  for (let i = 0; i < array.length - 1; i++) {
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
 * @param {number[][]} winConditions
 * @param {string[]} board
 * @returns {string | null}
 */
function pureWinChecker(winConditions, board) {
  for (let i = 0; i < winConditions.length; i++) {
    const arrToCompare = [];
    for (let j = 0; j < winConditions[i].length; j++) {
      arrToCompare.push(board[winConditions[i][j]]);
    }
    const combinationMatch = pureIsIdentical(arrToCompare);
    if (combinationMatch) {
      return arrToCompare[0];
    }
  }
  return null;
}

/**
 * Check for the winning play on the game board
 *
 * If a player is set to win the game in the next move the AI attempts to block the play.
 *
 * If the AI is set to win in the next play, the AI attempts to make the play.
 * @param {string[]} board
 * @param {string[]} allPlayers
 * @param {number[][]} winConditions
 * @param {string} currentPly
 * */
function checkForWinningPlay(board, allPlayers, winConditions, currentPly) {
  const newBoard = [...board];
  // ensure the checks happen for the current player first to prioritize winning plays over blocking plays
  const indexOfCurrPly = allPlayers.indexOf(currentPly);
  if (indexOfCurrPly !== -1) {
    allPlayers.splice(indexOfCurrPly, 1);
  }
  allPlayers.unshift(currentPly);
  for (let currPly = 0; currPly < allPlayers.length; currPly++) {
    console.log("currPly", currPly);
    for (let i = 0; i < newBoard.length; i++) {
      if (newBoard[i] === "") {
        newBoard[i] = allPlayers[currPly];
        const winningPlayer = pureWinChecker(winConditions, newBoard);
        if (winningPlayer) {
          newBoard[i] = "";
          return { winningPlayer, position: i };
        }
        newBoard[i] = "";
      }
    }
  }
}

/** This Class represents the state of the game */
class GameState {
  playerCount;
  constructor(board, winConditions, listOfPlayers) {
    this.board = board;
    this.winConditions = winConditions;
    this.listOfPlayers = listOfPlayers;
    this.playerCount = listOfPlayers.length ?? 0;
  }

  getPossibleMoves() {
    const possibleMoves = [];
    for (let i = 0; i < this.board.length; i++) {
      if (this.board[i] === "") {
        possibleMoves.push(i);
      }
    }
    return possibleMoves;
  }

  getPlayerByIndex(index) {
    return this.listOfPlayers[index];
  }

  getPlayersIndexNo(player) {
    return this.listOfPlayers.indexOf(player);
  }

  applyMove(moveIndex, currentPlayer) {
    if (this.board[moveIndex] !== "") {
      // TODO: Remove
      throw new Error(
        `Invalid move: Cell (${moveIndex}) is already occupied| current player: ${currentPlayer} | board: ${this.board}`
      );
    }
    const newBoardState = [...this.board];
    newBoardState[moveIndex] = currentPlayer;
    return new GameState(newBoardState, this.winConditions, this.listOfPlayers);
  }

  isTerminal() {
    // if there is a winner (is terminal)
    if (this.getWinner() !== null) {
      return true;
    }
    // if the game is still on going (is not terminal)
    if (this.board.includes("")) {
      return false;
    }

    // if the game is a draw, no empty spaces (is terminal)
    return true;
  }

  getWinner() {
    const result = this.checkForWin();
    if (result) {
      return result;
    }
    return null;
  }

  identical(array) {
    for (let i = 0; i < array.length - 1; i++) {
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

  checkForWin() {
    for (let i = 0; i < this.winConditions.length; i++) {
      const arrToCompare = [];
      for (let j = 0; j < this.winConditions[i].length; j++) {
        arrToCompare.push(this.board[this.winConditions[i][j]]);
      }
      const combinationMatch = this.identical(arrToCompare);
      if (combinationMatch) {
        return arrToCompare[0];
      }
    }
    return null;
  }
}
