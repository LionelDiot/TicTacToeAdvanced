class Morpion {
    humanPlayer = "J1";
    iaPlayer = "J2";
    turn = 0;
    gameOver = false;
    aiDifficulty;
    playerTurn = true;
    moveHistory = [];
    oldMoveHistory = [];
    gridMap = [
        [null, null, null],
        [null, null, null],
        [null, null, null],
    ];

    constructor(humanRole = "J1") {
        // Load move history from localStorage
        const savedHistory = localStorage.getItem("moveHistory");
        if (savedHistory) {
            this.moveHistory = JSON.parse(savedHistory);
            this.restoreGameState();
        } else {
            this.clearBoard();
            this.gameOver = false;
            this.removeEndMessage();
            this.humanPlayer = humanRole;
            this.iaPlayer = humanRole === "J1" ? "J2" : "J1";
            this.aiDifficulty = "beginner"; // Default difficulty
            this.initGame();
        }
    }
    // My added functions
    saveGameState = () => {
        // Save move history to localStorage
        localStorage.setItem("ai", JSON.stringify(this.aiDifficulty));
        localStorage.setItem("moveHistory", JSON.stringify(this.moveHistory));
    };
    restoreGameState = (moves = this.moveHistory) => {
        // Restore game state based on move history
        this.gridMap = [
            [null, null, null],
            [null, null, null],
            [null, null, null],
        ];
        this.aiDifficulty = JSON.parse(localStorage.getItem("ai"));
        moves.forEach((move) => {
            const { x, y, player } = move;
            this.gridMap[y][x] = player;
            this.getCell(x, y).classList.add(`filled-${player}`);
            this.turn += 1;
        });
        this.gridMap.forEach((line, y) => {
            line.forEach((cell, x) => {
                this.getCell(x, y).onclick = () => {
                    this.doPlayHuman(x, y);
                };
            });
        });
        this.checkWinner(this.iaPlayer);
        this.checkWinner(this.humanPlayer);
    };
    setAIDifficulty = () => {
        return new Promise((resolve) => {
            const modalContainer = document.createElement("div");
            modalContainer.classList.add("modal-container");

            const modalContent = document.createElement("div");
            modalContent.classList.add("modal-content");
            modalContent.innerHTML = `
              <p>Choose AI Difficulty:</p>
              <button id="btn-beginner">Beginner</button>
              <button id="btn-advanced">Advanced</button>
          `;

            modalContainer.appendChild(modalContent);
            document.body.appendChild(modalContainer);

            const btnBeginner = document.getElementById("btn-beginner");
            btnBeginner.addEventListener("click", () => {
                this.aiDifficulty = "beginner";
                resolve();
                document.body.removeChild(modalContainer);
            });

            const btnAdvanced = document.getElementById("btn-advanced");
            btnAdvanced.addEventListener("click", () => {
                this.aiDifficulty = "advanced";
                resolve();
                document.body.removeChild(modalContainer);
            });
        });
    };
    playRandomCell = () => {
        const availableCells = [];
        this.gridMap.forEach((line, y) => {
            line.forEach((cell, x) => {
                if (cell === null) {
                    availableCells.push({ x, y });
                }
            });
        });

        if (availableCells.length > 0) {
            const randomIndex = Math.floor(
                Math.random() * availableCells.length
            );
            const randomCell = availableCells[randomIndex];
            this.drawHit(randomCell.x, randomCell.y, this.iaPlayer);
        }
    };
    undo = async () => {
        if (this.moveHistory.length > 1) {
            if (this.gameOver) {
                this.gameOver = false;
                this.removeEndMessage();
            }

            let movetoDelete = this.moveHistory.pop();
            let { x, y, player } = movetoDelete;
            this.oldMoveHistory.push(movetoDelete);
            this.getCell(x, y).classList.value = "cell";
            this.gridMap[y][x] = null;
            this.turns -= 1;
            localStorage.setItem(
                "moveHistory",
                JSON.stringify(this.moveHistory)
            );

            if (player == this.iaPlayer) {
                await new Promise((resolve) => setTimeout(resolve, 200));
                let movetoDelete2 = this.moveHistory.pop();
                x = movetoDelete2.x;
                y = movetoDelete2.y;
                this.oldMoveHistory.push(movetoDelete2);
                this.getCell(x, y).classList.value = "cell";
                this.gridMap[y][x] = null;
                this.turns -= 1;
                localStorage.setItem(
                    "moveHistory",
                    JSON.stringify(this.moveHistory)
                );
            }
            this.playerTurn = true;
        }
    };

    redo = async () => {
        let move = this.oldMoveHistory.pop();
        const { x, y, player } = move;
        this.drawHit(x, y, player);
        await new Promise((resolve) => setTimeout(resolve, 200));
        if (player !== this.iaPlayer && this.oldMoveHistory.length > 0) {
            move = this.oldMoveHistory.pop();
            let { x, y, player } = move;
            this.drawHit(x, y, player);
        }
    };
    clearBoard() {
        // Clear the board cells
        const cells = document.querySelectorAll(".cell");
        cells.forEach((cell) => {
            cell.textContent = null;
            cell.className = "cell";
        });
    }
    removeEndMessage = () => {
        const endMessageElement = document.getElementById("end-message");
        endMessageElement.textContent = null;
        endMessageElement.style.display = "none";
    };
    // Rest of code as unmodified as possible
    initGame = async () => {
        await this.setAIDifficulty(); // Wait for user to select AI difficulty

        this.gridMap.forEach((line, y) => {
            line.forEach((cell, x) => {
                this.getCell(x, y).onclick = () => {
                    this.doPlayHuman(x, y);
                };
            });
        });

        if (this.iaPlayer === "J1") {
            await this.doPlayIa();
        }
    };

    getCell = (x, y) => {
        const column = x + 1;
        const lines = ["A", "B", "C"];
        const cellId = `${lines[y]}${column}`;
        return document.getElementById(cellId);
    };

    getBoardWinner = (board) => {
        const isWinningRow = ([a, b, c]) => a !== null && a === b && b === c;

        let winner = null;

        // Horizontal
        board.forEach((line) => {
            if (isWinningRow(line)) {
                winner = line[0];
            }
        });

        // Vertical
        [0, 1, 2].forEach((col) => {
            if (isWinningRow([board[0][col], board[1][col], board[2][col]])) {
                winner = board[0][col];
            }
        });

        if (winner) {
            return winner;
        }

        // Diagonal
        const diagonal1 = [board[0][0], board[1][1], board[2][2]];
        const diagonal2 = [board[0][2], board[1][1], board[2][0]];
        if (isWinningRow(diagonal1) || isWinningRow(diagonal2)) {
            return board[1][1];
        }

        const isFull = board.every((line) =>
            line.every((cell) => cell !== null)
        );
        return isFull ? "tie" : null;
    };

    checkWinner = (lastPlayer) => {
        const winner = this.getBoardWinner(this.gridMap);
        if (!winner) {
            return;
        }

        this.gameOver = true;
        switch (winner) {
            case "tie":
                this.displayEndMessage("Vous êtes à égalité !");
                break;
            case this.iaPlayer:
                this.displayEndMessage("L'IA a gagné !");
                break;
            case this.humanPlayer:
                this.displayEndMessage("Tu as battu l'IA !");
                break;
        }
    };

    displayEndMessage = (message) => {
        const endMessageElement = document.getElementById("end-message");
        endMessageElement.textContent = message;
        endMessageElement.style.display = "block";
    };

    drawHit = (x, y, player) => {
        if (this.gridMap[y][x] !== null) {
            return false;
        }

        this.gridMap[y][x] = player;
        this.turn += 1;
        this.getCell(x, y).classList.add(`filled-${player}`);
        // Save move to move history
        this.moveHistory.push({ x, y, player });

        this.saveGameState();
        this.checkWinner(player);
        return true;
    };

    doPlayHuman = (x, y) => {
        if (this.gameOver || !this.playerTurn) {
            return;
        }

        if (this.drawHit(x, y, this.humanPlayer)) {
            this.oldMoveHistory = [];

            this.playerTurn = false; // Disable player's turn
            this.doPlayIa();
        }
    };

    doPlayIa = async () => {
        if (this.gameOver) {
            return;
        }

        this.playerTurn = false;
        await new Promise((resolve) => setTimeout(resolve, 500)); // Delay the AI move
        if (this.aiDifficulty === "advanced") {
            const { x, y } = this.minmax(
                this.gridMap,
                0,
                -Infinity,
                Infinity,
                true
            );
            this.drawHit(x, y, this.iaPlayer);
        } else if (this.aiDifficulty === "beginner") {
            this.playRandomCell();
        }
        this.playerTurn = true; // Enable player's turn
    };

    minmax = (board, depth, alpha, beta, isMaximizing) => {
        // Return a score when there is a winner
        const winner = this.getBoardWinner(board);
        if (winner === this.iaPlayer) {
            return 10 - depth;
        }
        if (winner === this.humanPlayer) {
            return depth - 10;
        }
        if (winner === "tie" && this.turn === 9) {
            return 0;
        }

        const getSimulatedScore = (x, y, player) => {
            board[y][x] = player;
            this.turn += 1;

            const score = this.minmax(
                board,
                depth + 1,
                alpha,
                beta,
                player === this.humanPlayer
            );

            board[y][x] = null;
            this.turn -= 1;

            return score;
        };

        // This tree is going to test every move still possible in game
        // and suppose that the 2 players will always play there best move.
        // The IA search for its best move by testing every combinations,
        // and affects score to every node of the tree.
        if (isMaximizing) {
            // The higher is the score, the better is the move for the IA.
            let bestIaScore = -Infinity;
            let optimalMove;
            for (const y of [0, 1, 2]) {
                for (const x of [0, 1, 2]) {
                    if (board[y][x]) {
                        continue;
                    }

                    const score = getSimulatedScore(x, y, this.iaPlayer);
                    if (score > bestIaScore) {
                        bestIaScore = score;
                        optimalMove = { x, y };
                    }

                    // clear useless branch of the algorithm tree
                    // (optional but recommended)
                    alpha = Math.max(alpha, score);
                    if (beta <= alpha) {
                        break;
                    }
                }
            }

            return depth === 0 ? optimalMove : bestIaScore;
        }

        // The lower is the score, the better is the move for the player.
        let bestHumanScore = Infinity;
        for (const y of [0, 1, 2]) {
            for (const x of [0, 1, 2]) {
                if (board[y][x]) {
                    continue;
                }

                const score = getSimulatedScore(x, y, this.humanPlayer);
                bestHumanScore = Math.min(bestHumanScore, score);

                // clear useless branch of the algorithm tree
                // (optional but recommended)
                beta = Math.min(beta, score);
                if (beta <= alpha) {
                    break;
                }
            }
        }

        return bestHumanScore;
    };
}
