const Player = function(markerSymbol) {
  const marker = markerSymbol;

  return { marker };
}

const Board = (function() {
  const rows = 3;
  const columns = 3;
  const state = [];

  const reset = () => {
    state.splice(0, state.length);

    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < columns; j++) {
        row.push(null);
      }
      state.push(row);
    }
  }

  const get = () => {
    return [...state];
  }

  const placeMarker = (marker, x , y) =>  {
    if (x < 0 || x > rows - 1) {
      throw new RangeError(`x argument must be between 0 and ${rows - 1}`);
    }
    if (y < 0 || y > columns - 1) {
      throw new RangeError(`y argument must be between 0 and ${columns - 1}`);
    }

    if (state[x][y] !== null) {
      throw new Error('You must play in a space that is not already occupied');
    }

    state[x][y] = marker;
  };

  return { reset, get, placeMarker };
})();

const GameController = (function() {
  const GameState = {
    NOT_OVER: 0,
    X_WINS: 1,
    O_WINS: 2,
    TIE: 3,
  };
  const players = [Player('X'), Player('O')];
  let turn = 0;


  const newGame = () => {
    turn = 0;
    Board.reset();
    DisplayController.notify('New game started');
    
    DisplayController.renderBoard();

    newTurn();
  }

  const getActivePlayer = () => players[turn % 2];

  const newTurn = () => {
    DisplayController.notify(`${getActivePlayer().marker}, play your turn`);
  }

  const playTurn = (x, y) => {
    const player = getActivePlayer();
    try {
      Board.placeMarker(player.marker, x, y);
    } catch(error) {
      console.error(error);
      newTurn();
      return;
    }

    endTurn();
  }

  const endTurn = () => {
    DisplayController.renderBoard();
    const gameOver = gameIsOver();
    if (gameOver) {
      DisplayController.notify('Game over');

      switch(gameOver) {
        case GameState.X_WINS:
          DisplayController.notify('X wins!');
          break;
        case GameState.O_WINS:
          DisplayController.notify('O wins!');
          break;
        case GameState.TIE:
          DisplayController.notify('Tie!');
          break;
        default:
          break;
      }

    } else {
      turn++;
      newTurn();
    }
  }

  const isSetComplete = (set, marker) => set.every(cell => cell === marker);

  const checkRows = (board, marker) => {
    return board.some((row) => isSetComplete(row, marker));
  }

  const checkColumns = (board, marker) => {
    const getColumn = (columnNumber) => board.map(row => row[columnNumber]);
    const columns = board[0].map((_col, i) => getColumn(i));
    return columns.some((col) => isSetComplete(col, marker));
  }

  const checkDiagonals = (board, marker) => {
    const getDiagonal = (increment) => {
      let column = increment ? 0 : board[0].length - 1;
      return board.map(row => increment ? row[column++] : row[column--]);
    }

    const diagonals = [getDiagonal(true), getDiagonal(false)];

    return diagonals.some((diag) => isSetComplete(diag, marker));
  }

  const gameIsOver = () => {
    const board = Board.get();

    const tie = board.flat().every((cell) => cell !== null);
    if (tie) {
      DisplayController.notify('tie');
      return GameState.TIE;
    }

    const checkPlayerVictory = (marker) => checkRows(board, marker) || checkColumns(board, marker) || checkDiagonals(board, marker);

    if (checkPlayerVictory(players[0].marker)) {
      return GameState.X_WINS;
    }

    if (checkPlayerVictory(players[1].marker)) {
      return GameState.O_WINS;
    }

    return GameState.NOT_OVER;
  }


  return { newGame, playTurn };
})();

const DisplayController = (function() {
  const notify = (message) => {
    console.log(message);
  } 

  const renderBoard = () => {
    const board = Board.get();
    const stateString = board.map(row => {
      return row.map(column => `[${column || ' '}]`).join('');
    });

    console.log(stateString.join('\n'));
  }

  return { notify, renderBoard };
})();

GameController.newGame();
