/* Gameboard object responsibile for taking note of the marks on the field; the board itself
is a private variable that can be updated from the outside only with the dedicated function. */
const Gameboard = (function () {
	// The board itself, as a 2D array of empty values;
	let board = [
		[, , ,],
		[, , ,],
		[, , ,],
	];

	// The board can be accessed only by the functions below, it takes coordinates as arguments;

	function printBoard() {
		console.log(board);
	}

	function updateBoard(mark, row, column) {
		board[row][column] = mark; // TODO: Remember to pass the turn only when the mark is successfully placed!
	}

	function isSpotEmpty(row, column) {
		// Checks if the spot is not occupied before placing the mark;
		return !board[row][column] ? true : false;
	}

	function clearBoard() {
		for (let i = 0; i < board.length; i++) {
			for (let j = 0; j < board[i].length; j++) {
				board[i][j] = null;
			}
		}

		printBoard();
	}

	function getBoard() {
		return board;
	}

	return { updateBoard, printBoard, clearBoard, getBoard, isSpotEmpty };
})();

/* The Players are stored each in its own object with their mark; the player object
can place the mark on the board accessing the board Object. */
const Player = function (name, mark) {
	function placeMark(mark, row, column) {
		Gameboard.updateBoard(mark, row, column);
	}

	return { name, mark, placeMark };
};

/* Th gameManager controls the game flow and interacts with the players, the board and
the displayControllor to update the game and provide feedback. */
const gameManager = (function () {
	let players = [];
	let currentPlayer = {};
    let turnCount = 0;

	function startGame() {
		// When the game starts, two players are initialized.
		const edo = Player("edo", "X");
		const fede = Player("fede", "O");
		players.push(edo, fede);

		console.info("Created players:", edo.name, fede.name);

		createLogicBoard();
		console.info("Created a new empty board:");
		UI.createUIBoard();
		console.info("Created UI board.");
		createLogicBoard();
		UI.body.removeChild(UI.startButton);
		currentPlayer = players[1];
		console.log(currentPlayer);
		updateCurrentPlayer();
		UI.updateUIBoard();
	}

	function createLogicBoard() {
		Gameboard.clearBoard();
	}

	function playTurn(row, col) {
		if (Gameboard.isSpotEmpty(row, col)) {
			currentPlayer.placeMark(currentPlayer.mark, row, col);

			updateCurrentPlayer();
			UI.updateUIBoard();

            turnCount++;
			checkWinner();
		} else {
			alert("This spot is already occupied!");
		}
	}

	function updateCurrentPlayer() {
		currentPlayer = currentPlayer === players[0] ? players[1] : players[0];
		UI.turnTracker.textContent = "It's " + currentPlayer.name + "'s turn!";
	}

	function checkWinner() {
		const board = Gameboard.getBoard();

		function checkByRow() {
			for (const row of board) {
				if (row[0] === row[1] && row[1] === row[2] && row[0] !== null) {
					const winner =
						row[0] === players[0].mark ? players[0].name : players[1].name;
					alert(winner + " wins the game by row!");
				}
			}
		}

		function checkByColumn() {
			for (let i = 0; i < 3; i++) {
				if (
					board[0][i] === board[1][i] &&
					board[1][i] === board[2][i] &&
					board[0][i] !== null
				) {
					const winner =
						board[0][i] === players[0].mark ? players[0].name : players[1].name;
					alert(winner + " wins the game by column!");
				}
			}
		}

		function checkDiagonally() {
			// Check for winner diagonally
			if (
				(board[0][0] === board[1][1] &&
					board[1][1] === board[2][2] &&
					board[1][1] !== null) ||
				(board[0][2] === board[1][1] &&
					board[1][1] === board[2][0] &&
					board[1][1] !== null)
			) {
				const winner =
					board[1][1] === players[0].mark ? players[0].name : players[1].name;
				alert(winner + " wins the game by diagonal!");
			}
		}

        function checkTie(){
            if(turnCount === 9){
                alert("It's a tie.")
            }
        }

		checkByRow();
		checkByColumn();
        checkDiagonally();
        checkTie()
	}

	return { startGame, playTurn };
})();

/* The UI component will handle interactions with the game logic, object creation and
visual effects. */
const UI = (function () {
	const body = document.querySelector("body");

	const startButton = document.querySelector("#start-game-btn");
	startButton.addEventListener("click", gameManager.startGame);

	const turnTracker = document.createElement("p");
	turnTracker.id = "turn-tracker";

	let boardUIArray = [];

	function createUIBoard() {
		const boardContainer = document.createElement("div");
		boardContainer.classList.add("board-container");

		// TODO: Create board with for loop
		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 3; j++) {
				const newSpot = document.createElement("div");
				newSpot.classList.add("board-spot");
				newSpot.setAttribute("row", i);
				newSpot.setAttribute("col", j);
				boardContainer.appendChild(newSpot);
			}
		}

		body.appendChild(boardContainer);
		body.appendChild(turnTracker);
		boardUIArray = document.querySelectorAll(".board-spot");
		loadClickListeners();
	}

	function loadClickListeners() {
		for (const spot of boardUIArray) {
			const spotRow = spot.getAttribute("row");
			const spotCol = spot.getAttribute("col");
			spot.addEventListener("mousedown", () => {
				gameManager.playTurn(spotRow, spotCol);
			});
		}
	}

	function updateUIBoard() {
		for (const spot of boardUIArray) {
			const spotRow = spot.getAttribute("row");
			const spotCol = spot.getAttribute("col");
			spot.textContent = Gameboard.getBoard()[spotRow][spotCol];
		}
	}

	return { body, startButton, createUIBoard, turnTracker, updateUIBoard };
})();
