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


	function getPlayers() {

		const playerOneName = DisplayController.modal.playerOneNameField.value;
		const playerTwoName = DisplayController.modal.playerTwoNameField.value;
		const playerOneMark = DisplayController.modal.playerOneMarkField.value;
		const playerTwoMark = DisplayController.modal.playerTwoMarkField.value;

		const newPlayerOne = Player(playerOneName, playerOneMark);
		const newPlayerTwo = Player(playerTwoName, playerTwoMark);

		players.push(newPlayerOne, newPlayerTwo);

		startGame();

	}

	function startGame() {

		currentPlayer = players[1];
		updateCurrentPlayer();
		turnCount = 0;

		// Gameboard initialization
		createLogicBoard();
		DisplayController.boardFunctions.createUIBoard();

		if(document.getElementById("start-game-btn")){
			DisplayController.DOMElements.body.removeChild(DisplayController.DOMElements.playButton);
		}
		
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
			DisplayController.boardFunctions.updateUIBoard();
            turnCount++;
			checkWinner();

		} else {

			alert("This spot is already occupied!");

		}
	}

	function updateCurrentPlayer() {
		
		// Changes the current player and updates the display text
		currentPlayer = currentPlayer === players[0] ? players[1] : players[0];
		DisplayController.DOMElements.turnTracker.textContent = "It's " + currentPlayer.name + "'s turn!";

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
		DisplayController.boardFunctions.disableUIBoard()

		// 2 | Deletes the turn tracking text
		DisplayController.DOMElements.body.removeChild(DisplayController.DOMElements.turnTracker)

		// 3 | Displays the winner of the game
		if(winner) {
			DisplayController.displayFunctions.displayWinner(winner)
		} else {
			DisplayController.displayFunctions.displayTie("It's a tie!")
		}

		// 4 | Shows result and button for restart
		DisplayController.displayFunctions.showRestartButton() // TODO

	}

	function restart() {

		// Starts a new game
		resetGameData();
		DisplayController.boardFunctions.resetUIBoard();
		startGame();
		
	}

	function resetGameData() {

		winner = undefined;
		turnCount = 0;

	}

	return { getPlayers, startGame, playTurn, restart };
})();


const DisplayController = (function () {

	// User Interface References
	const body = document.querySelector("body");
	let boardContainer;
	
	// Dialog references
	const newPlayersModal = document.querySelector("dialog");
	const newPlayersForm = document.querySelector("dialog > form")
	const playerOneNameField = document.querySelector("#player-one-name");
	const playerOneMarkField = document.querySelector("#player-one-mark");
	const playerTwoNameField = document.querySelector("#player-two-name");
	const playerTwoMarkField = document.querySelector("#player-two-mark");

	const startGameButton = document.querySelector("#load-players-btn");
	startGameButton.addEventListener("mousedown", () => {
		GameController.getPlayers();
		newPlayersModal.close();
		newPlayersForm.reset();
	})

	const playButton = document.querySelector("#start-game-btn");
	playButton.addEventListener("click",() => newPlayersModal.showModal());
	
	const turnTracker = document.createElement("p");
	turnTracker.id = "turn-tracker";

	let boardUIArray = []; // NodeList to store the spots on the UI board

	function createUIBoard() {

		// 1 | Creates the grid
		boardContainer = document.createElement("div");
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

	function enableUIBoard() {

		// Disables the buttons, no marks can be placed anymore
		boardUIArray.forEach( (btn) => {
			btn.disabled = false;
		});
	}

	function displayWinner(winnerPlayer) {

		const winnerText = document.createElement("p");
		winnerText.id = "result-text";
		winnerText.textContent = `${winnerPlayer} wins the game!`

		body.appendChild(winnerText);
	}

	function displayTie() {

		const tieText = document.createElement("p");
		tieText.id = "result-text";
		tieText.textContent = `It's a tie!`;

		body.appendChild(tieText);
	}

	function showRestartButton() {

		const restartButton = document.createElement("button")
		restartButton.id = "restart-btn";
		restartButton.textContent = "New Game?";
		restartButton.addEventListener("mousedown", GameController.restart);
		body.appendChild(restartButton);

	}

	function resetUIBoard() {

		body.removeChild(boardContainer);
		body.removeChild(document.querySelector("#result-text"));
		body.removeChild(document.querySelector("#restart-btn"));

		
	}

	return { DOMElements: {body, playButton, turnTracker},
			 boardFunctions: {createUIBoard, updateUIBoard, disableUIBoard, enableUIBoard, resetUIBoard},
			 displayFunctions: {displayWinner, displayTie, showRestartButton},
			 modal: {newPlayersModal, playerOneNameField, playerOneMarkField, playerTwoNameField, playerTwoMarkField, startGameButton}  };
})();

function Player(name, mark){
	
	function placeMark(mark, row, column){
		Gameboard.updateBoard(mark, row, column)
	}

	return { name, mark, placeMark }

};