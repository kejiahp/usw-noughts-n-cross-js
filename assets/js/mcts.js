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
function MCTS(rootState, iterations, currentPlayer) {
  const rootNode = new Node(rootState, null, currentPlayer);

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

    // Backpropagation
    node.backpropagate(result);
  }

  // Choose the most visited child as the best move
  return rootNode.children.reduce((best, child) =>
    child.visits > best.visits ? child : best
  ).state;
}

// Helper: Simulate a random game
function simulateGame(state, player) {
  let currentState = state;
  let currentPlayer = player;
  while (!currentState.isTerminal()) {
    const moves = currentState.getPossibleMoves();
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    currentState = currentState.applyMove(randomMove, currentPlayer);

    const playerIndex = currentState.getPlayersIndexNo(currentPlayer);
    const nextPlayer = currentState.getPlayerByIndex(
      (playerIndex + 1) % currentState.playerCount
    );
    currentPlayer = nextPlayer;
  }
  return currentState.getWinner(); // Returns the winner
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
      throw new Error("Invalid move: Cell is already occupied.");
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
