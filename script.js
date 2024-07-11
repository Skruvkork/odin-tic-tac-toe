const Player = function(markerSymbol) {
  const marker = markerSymbol;
  let name = null;

  const getName = () => name;

  const setName = (newName) => {
    name = newName;
  }

  return { marker, getName, setName };
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

    if (state[y][x] !== null) {
      throw new Error('You must play in a space that is not already occupied');
    }

    state[y][x] = marker;
  };

  return { reset, get, placeMarker };
})();

const GameController = (function() {
  const GameState = {
    NOT_OVER: 0,
    VICTORY: 1,
    TIE: 2,
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
    DisplayController.updateBoard(x, y);
    endTurn();
  }

  const endTurn = () => {
    const gameState = getGameState();
    if (gameState.gameOver) {
      DisplayController.notify('Game over');
      DisplayController.disableAllCells();

      switch(gameState.gameOver) {
        case GameState.VICTORY:
          DisplayController.notify(`${gameState.player.getName() || gameState.player.marker} wins!`);
          break;
        case GameState.TIE:
          DisplayController.notify('Tie!');
          break;
        default:
          break;
      }

    } else {
      turn++;
      DisplayController.switchPlayer();
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

  const getGameState = () => {
    const board = Board.get();

    const tie = board.flat().every((cell) => cell !== null);
    if (tie) {
      DisplayController.notify('tie');
      return { gameOver: GameState.TIE, player: null };
    }

    const checkPlayerVictory = (marker) => checkRows(board, marker) || checkColumns(board, marker) || checkDiagonals(board, marker);

    const winningPlayer = players.find((player) => checkPlayerVictory(player.marker));
    if (winningPlayer) return { gameOver: GameState.VICTORY, player: winningPlayer };

    return { gameOver: GameState.NOT_OVER, player: null };
  }

  const getPlayer = (index) => players[index];

  const setPlayerName = (player, newName) => {
    player.setName(newName);
  }


  return { newGame, playTurn, getPlayer, setPlayerName };
})();

const DisplayController = (function() {
  const boardEl = document.getElementById('board');
  const player1Input = document.querySelector('input[name="player1"]');
  const player2Input = document.querySelector('input[name="player2"]');

  player1Input.addEventListener('blur', (e) => GameController.setPlayerName(GameController.getPlayer(0), e.target.value));
  player2Input.addEventListener('blur', (e) => GameController.setPlayerName(GameController.getPlayer(1), e.target.value));

  const notify = (message) => {
    console.log(message);
  } 

  const renderBoard = () => {
    const board = Board.get();
    boardEl.innerHTML = '';
    board.forEach((row, y) => {
      const rowEl = createRow();
      row.map((_col, x) => createCell(x, y)).forEach(cell => {
        rowEl.appendChild(cell);
      });

      boardEl.appendChild(rowEl);
    });
  }

  const updateBoard = (x, y) => {
    const board = Board.get();
    
    const cellEl = document.getElementById(`${x}-${y}`);
    const marker = board[y][x]
    cellEl.ariaLabel = `${marker}. Row ${y + 1}, column ${x + 1}`;
    cellEl.classList.add(`cell--${marker.toLowerCase()}`);
    cellEl.ariaDisabled = true;
  }

  const disableAllCells = () => {
    const cellEls = Array.from(document.getElementsByClassName('cell'));
    cellEls.forEach(cellEl => cellEl.ariaDisabled = true);
  }

  const switchPlayer = () => {
    boardEl.classList.toggle('board--player-2');
  }

  const createRow = () => {
    const row = document.createElement('div');
    row.role = 'row';
    row.className = 'board__row';

    return row;
  }

  const createCell = (x, y) => {
    const cell = document.createElement('button');
    cell.id = `${x}-${y}`;
    cell.dataset.x = x;
    cell.dataset.y = y;
    cell.className = 'cell';
    cell.role = 'gridcell';
    cell.ariaLabel = `Empty cell. Row ${y + 1}, column ${x + 1}`;
    cell.addEventListener('click', (e) => {
      if (e.target.ariaDisabled) return;
      GameController.playTurn(x, y);
    });

    return cell;
  }

  return { notify, renderBoard, updateBoard, switchPlayer, disableAllCells };
})();

GameController.newGame();
