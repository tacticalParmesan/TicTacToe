const Gameboard = (function () {
	
	let board = [
		[, , ,],
		[, , ,],
		[, , ,],
	];


	function updateBoard(mark, row, column) {
		board[row][column] = mark; 
	}

	function isSpotEmpty(row, column) {
		return !board[row][column] ? true : false;
	}

	function clearBoard() {
		for (let i = 0; i < board.length; i++) {
			for (let j = 0; j < board[i].length; j++) {
				board[i][j] = null;
			}
		}
	}

	function getBoard() {
		return board;
	}

	return { updateBoard, clearBoard, getBoard, isSpotEmpty };
})();

const GameController = (function () {

	let players = [];
	let currentPlayer = {};
    let turnCount = 0;

	function startGame() {

		// Players initialization
		const edo = Player("edo", "X");
		const fede = Player("fede", "O");
		players.push(edo, fede);
		currentPlayer = players[1];
		updateCurrentPlayer();

		// Gameboard initialization
		createLogicBoard();
		DisplayController.createUIBoard();
		DisplayController.body.removeChild(DisplayController.startButton);
		
	}

	function createLogicBoard() {
		Gameboard.clearBoard();
	}

	function playTurn(row, col) {

		if (Gameboard.isSpotEmpty(row, col)) {

			// Current player places its mark and passes the turn
			currentPlayer.placeMark(currentPlayer.mark, row, col);
			updateCurrentPlayer();

			// The logic check if there is a winner and moves onto the next turn
			DisplayController.updateUIBoard();
            turnCount++;
			checkWinner();

		} else {

			alert("This spot is already occupied!");

		}
	}

	function updateCurrentPlayer() {
		
		// Changes the current player and updates the display text
		currentPlayer = currentPlayer === players[0] ? players[1] : players[0];
		DisplayController.turnTracker.textContent = "It's " + currentPlayer.name + "'s turn!";

	}

	function checkWinner() {

		// Gets a copy of the board and performs checks to see if there is a winner
		const board = Gameboard.getBoard();
		let winner;

		function checkByRow() {
			
			for (const row of board) {
				if (row[0] === row[1] && row[1] === row[2] && row[0] !== null) {

					winner =
						row[0] === players[0].mark ? players[0].name : players[1].name;
				}
			}
		}

		function checkByColumn() {

			for (let i = 0; i < 3; i++) {
				if (board[0][i] === board[1][i] && board[1][i] === board[2][i] && board[0][i] !== null) {

					winner =
						board[0][i] === players[0].mark ? players[0].name : players[1].name;
				}
			}
		}

		function checkDiagonally() {

			if (
				(board[0][0] === board[1][1] &&	board[1][1] === board[2][2] && board[1][1] !== null) ||
				(board[0][2] === board[1][1] &&	board[1][1] === board[2][0] && board[1][1] !== null)) {

				winner =
					board[1][1] === players[0].mark ? players[0].name : players[1].name;
			}
		}

        function isTie(){

			// Checks is there is no winner and the maximun of turns has passed (9)
            if(turnCount === 9 && !winner) return true; 
        }

		function checkResult() {

			// Checks for different win conditions...
			checkByRow();
			checkByColumn();
			checkDiagonally();

			//...and declares a winner if there is one!
			if(winner){
				endGame(winner);
			} else if (isTie()) {
				endGame()
			}
		}

		checkResult();

	}

	function endGame(winner=undefined) {

		// 1 | Disables the gameboard
		DisplayController.disableUIBoard()

		// 2 | Deletes the turn tracking text
		DisplayController.body.removeChild(DisplayController.turnTracker)

		// 3 | Displays the winner of the game
		if(winner) {
			DisplayController.displayWinner(winner)
		} else {
			DisplayController.displayTie("It's a tie!")
		}

		// 4 | Shows result and button for restart
		DisplayController.showRestartButton() // TODO

	}
	return { startGame, playTurn };
})();


const DisplayController = (function () {

	// User Interface References
	const body = document.querySelector("body");

	const startButton = document.querySelector("#start-game-btn");
	startButton.addEventListener("click", GameController.startGame);

	const turnTracker = document.createElement("p");
	turnTracker.id = "turn-tracker";

	let boardUIArray = []; // NodeList to store the spots on the UI board

	function createUIBoard() {

		// 1 | Creates the grid
		const boardContainer = document.createElement("div");
		boardContainer.classList.add("board-container");

		// 2 | Creates the board one row at a time
		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 3; j++) {

				const newSpot = document.createElement("button");
				newSpot.classList.add("board-spot");
				newSpot.setAttribute("row", i);
				newSpot.setAttribute("col", j);

				boardContainer.appendChild(newSpot);
			}
		}

		// 3 | Appends the newly created spots to the grid and stores them in the NodeList
		body.appendChild(boardContainer);
		body.appendChild(turnTracker);
		boardUIArray = document.querySelectorAll(".board-spot");

		// 4 | Loops over the NodeList to attach to each an event listener that reads the spot's coordinates to interact with the logic board
		loadClickListeners();
	}

	function loadClickListeners() {

		// As per point 4 of the createUIBoard function

		for (const spot of boardUIArray) {

			const spotRow = spot.getAttribute("row");
			const spotCol = spot.getAttribute("col");

			spot.addEventListener("mousedown", () => {
				GameController.playTurn(spotRow, spotCol); // Every click it tied to the spots coordinates
			});
		}
	}

	function updateUIBoard() {

		// Updates the UI displaying the marks placed in the spots
		for (const spot of boardUIArray) {

			// Does so by getting the corresponding coordinates from UI grid...
			const spotRow = spot.getAttribute("row");
			const spotCol = spot.getAttribute("col");

			//...and sets the text value to the mark for each corresponding spot
			spot.textContent = Gameboard.getBoard()[spotRow][spotCol];
		}
	}

	function disableUIBoard() {

		// Disables the buttons, no marks can be placed anymore
		boardUIArray.forEach( (btn) => {
			btn.disabled = true;
		});
	}

	function displayWinner(winnerPlayer) {

		const winnerText = document.createElement("p");
		winnerText.id = "winner-text";
		winnerText.textContent = `${winnerPlayer} wins the game!`

		body.appendChild(winnerText);
	}

	function displayTie() {

		const tieText = document.createElement("p");
		tieText.id = "tie-text";
		tieText.textContent = `It's a tie!`

		body.appendChild(tieText);
	}

	return { body, startButton, createUIBoard, turnTracker, updateUIBoard, disableUIBoard, displayWinner, displayTie };
})();

function Player(name, mark){
	
	function placeMark(mark, row, column){
		Gameboard.updateBoard(mark, row, column)
	}

	return { name, mark, placeMark }

};