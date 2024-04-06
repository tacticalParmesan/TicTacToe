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

	function initPlayers() {
		const playerOneName = DisplayController.modal.playerOneNameField.value;
		const playerTwoName = DisplayController.modal.playerTwoNameField.value;
		const playerOneMark = DisplayController.modal.playerOneMarkField.value;
		const playerTwoMark = DisplayController.modal.playerTwoMarkField.value;

		const newPlayerOne = Player(playerOneName, playerOneMark);
		const newPlayerTwo = Player(playerTwoName, playerTwoMark);

		players.push(newPlayerOne, newPlayerTwo);

		DisplayController.displayFunctions.createPlayerTabs();
		startGame();
	}

	function startGame() {
		currentPlayer = players[1];
		updateCurrentPlayer();
		turnCount = 0;

		// Gameboard initialization
		createLogicBoard();
		DisplayController.boardFunctions.createUIBoard();

		if (document.getElementById("start-game-btn")) {
			DisplayController.DOMElements.mainElement
	.removeChild(
				DisplayController.DOMElements.playButton
			);
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
		
		let currentPlayerTab = (currentPlayer === players[0]) 
			? document.querySelector(".player-tab.player-one")
			: document.querySelector(".player-tab.player-two");

		let otherPlayerTab = (currentPlayer === players[0]) 
		? document.querySelector(".player-tab.player-two")
		: document.querySelector(".player-tab.player-one");

		currentPlayerTab.classList.add("current");
		otherPlayerTab.classList.remove("current");

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
						row[0] === players[0].mark ? players[0] : players[1];
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
					winner =
						board[0][i] === players[0].mark ? players[0] : players[1];
				}
			}
		}

		function checkDiagonally() {
			if (
				(board[0][0] === board[1][1] &&
					board[1][1] === board[2][2] &&
					board[1][1] !== null) ||
				(board[0][2] === board[1][1] &&
					board[1][1] === board[2][0] &&
					board[1][1] !== null)
			) {
				winner =
					board[1][1] === players[0].mark ? players[0]: players[1];
			}
		}

		function isTie() {
			// Checks is there is no winner and the maximun of turns has passed (9)
			if (turnCount === 9 && !winner) return true;
		}

		function checkResult() {
			// Checks for different win conditions...
			checkByRow();
			checkByColumn();
			checkDiagonally();

			//...and declares a winner if there is one!
			if (winner) {
				endGame(winner);
			} else if (isTie()) {
				endGame();
			}
		}

		checkResult();
	}

	function endGame(winner = undefined) {
		// 1 | Disables the gameboard
		DisplayController.boardFunctions.disableUIBoard();

		// 2 | Deletes the turn tracking text
		DisplayController.DOMElements.mainElement.removeChild(
			DisplayController.DOMElements.turnTracker
		);

		// 3 | Displays the winner of the game
		if (winner) {
			DisplayController.displayFunctions.displayWinner(winner.name);
			winner.addScore();
		} else {
			DisplayController.displayFunctions.displayTie("It's a tie!");
		}

		// 3.5 Update the score
		DisplayController.displayFunctions.updateScore();

		// 4 | Shows result and button for restart
		DisplayController.displayFunctions.showRestartButton(); // TODO
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

	function getPlayers() {
		return players;
	}

	return { initPlayers, startGame, playTurn, restart, getPlayers };
})();

const DisplayController = (function () {
	// User Interface References
	const mainElement = document.querySelector("main");
	let boardContainer;
	let resultsArea;

	// Dialog references
	const newPlayersModal = document.querySelector("dialog");
	const newPlayersForm = document.querySelector("dialog > form");
	const playerOneNameField = document.querySelector("#player-one-name");
	const playerOneMarkField = document.querySelector("#player-one-mark");
	const playerTwoNameField = document.querySelector("#player-two-name");
	const playerTwoMarkField = document.querySelector("#player-two-mark");

	const startGameButton = document.querySelector("#load-players-btn");
	startGameButton.addEventListener("mousedown", () => {
		GameController.initPlayers();
		newPlayersModal.close();
		newPlayersForm.reset();
	});
	const closeModalButton = document.querySelector("#close-modal-btn");
	closeModalButton.addEventListener("mousedown", () => {
		newPlayersModal.close();
		newPlayersForm.reset();
	});

	const playButton = document.querySelector("#start-game-btn");
	playButton.addEventListener("click", () => newPlayersModal.showModal());

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
		mainElement
		.appendChild(boardContainer);
		mainElement
		.appendChild(turnTracker);
		boardUIArray = document.querySelectorAll(".board-spot");

		// 4 | Loops over the NodeList to attach to each an event listener that reads the spot's coordinates to interact with the logic board
		loadClickListeners();
	}

	function createPlayerTabs() {

		for(let i = 0; i < 2; i++){

			const playerName = document.createElement("p");
			const playerMark = document.createElement("p");

			const playerTab = document.createElement("div");
			playerTab.classList.add("player-tab");
			
			const playerScoreText = document.createElement("p");
			playerScoreText.textContent = "Score";
			
			const playerScoreNum = document.createElement("p");
			playerScoreNum.textContent = 0;

			if(i === 0) {
				playerTab.classList.add("player-one");
				playerScoreNum.classList.add("player-one-score")
				playerName.textContent = playerOneNameField.value;
				playerMark.textContent = playerOneMarkField.value;
			} else {
				playerTab.classList.add("player-two");
				playerScoreNum.classList.add("player-two-score")
				playerName.textContent = playerTwoNameField.value;
				playerMark.textContent = playerTwoMarkField.value;
			}

			playerTab.appendChild(playerName);
			playerTab.appendChild(playerMark);
			playerTab.appendChild(playerScoreText);
			playerTab.appendChild(playerScoreNum);

			mainElement.appendChild(playerTab);

		}
	}

	function updateScore() {
		const displayedScoreOne = document.querySelector(".player-one-score");
		const displayedScoreTwo = document.querySelector(".player-two-score");

		displayedScoreOne.textContent = GameController.getPlayers()[0].getScore();
		displayedScoreTwo.textContent = GameController.getPlayers()[1].getScore();

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
		boardUIArray.forEach((btn) => {
			btn.disabled = true;
		});
	}

	function enableUIBoard() {
		// Disables the buttons, no marks can be placed anymore
		boardUIArray.forEach((btn) => {
			btn.disabled = false;
		});
	}

	function displayWinner(winnerPlayer) {
		const winnerText = document.createElement("p");
		winnerText.id = "result-text";
		winnerText.textContent = `${winnerPlayer} wins the game!`;

		mainElement
.appendChild(winnerText);
	}

	function displayTie() {
		const tieText = document.createElement("p");
		tieText.id = "result-text";
		tieText.textContent = `It's a tie!`;

		mainElement
.appendChild(tieText);
	}

	function showRestartButton() {
		const restartButton = document.createElement("button");
		restartButton.id = "restart-btn";
		restartButton.textContent = "New Game?";
		restartButton.addEventListener("mousedown", GameController.restart);
		mainElement
.appendChild(restartButton);
	}

	function resetUIBoard() {
		mainElement
.removeChild(boardContainer);
		mainElement
.removeChild(document.querySelector("#result-text"));
		mainElement
.removeChild(document.querySelector("#restart-btn"));
	}

	return {
		DOMElements: { 
			mainElement,
		    playButton,
			turnTracker },
		boardFunctions: {
			createUIBoard,
			updateUIBoard,
			disableUIBoard,
			enableUIBoard,
			resetUIBoard,
		},
		displayFunctions: { displayWinner, displayTie, showRestartButton, createPlayerTabs, updateScore },
		modal: {
			newPlayersModal,
			playerOneNameField,
			playerOneMarkField,
			playerTwoNameField,
			playerTwoMarkField,
			startGameButton,
		},
	};
})();

function Player(name, mark) {
	let score = 0;

	function placeMark(mark, row, column) {
		Gameboard.updateBoard(mark, row, column);
	}

	function addScore() {
		score++;
	}

	function getScore() {
		return score;
	}

	return { name, mark, addScore, getScore, placeMark };
}
