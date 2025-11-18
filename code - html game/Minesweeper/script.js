// 游戏配置和状态
const gameState = {
    cols: 9,
    rows: 9,
    mines: 10,
    board: [],
    revealed: 0,
    flags: 0,
    gameOver: false,
    gameStarted: false,
    timer: null,
    time: 0,
    firstClick: true
};

// DOM元素引用
const gameBoard = document.getElementById('game-board');
const timerElement = document.querySelector('.timer .value');
const restartButton = document.getElementById('restart-btn');
const gameMessage = document.getElementById('game-message');
const messageText = document.getElementById('message-text');
const playAgainButton = document.getElementById('play-again');

// 初始化游戏
function initGame() {
    // 重置游戏状态
    gameState.revealed = 0;
    gameState.flags = 0;
    gameState.gameOver = false;
    gameState.gameStarted = false;
    gameState.time = 0;
    gameState.firstClick = true;
    
    // 重置计时器
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
    timerElement.textContent = '0';
    
    // 隐藏重新开始按钮
    restartButton.classList.add('hidden');
    
    // 生成游戏板
    generateBoard();
    renderBoard();
    
    // 隐藏游戏消息
    gameMessage.classList.add('hidden');
}

// 生成游戏板数据
function generateBoard() {
    gameState.board = [];
    
    // 创建空白板
    for (let r = 0; r < gameState.rows; r++) {
        const row = [];
        for (let c = 0; c < gameState.cols; c++) {
            row.push({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            });
        }
        gameState.board.push(row);
    }
}

// 放置地雷
function placeMines(excludeRow, excludeCol) {
    let minesPlaced = 0;
    
    while (minesPlaced < gameState.mines) {
        const row = Math.floor(Math.random() * gameState.rows);
        const col = Math.floor(Math.random() * gameState.cols);
        
        // 确保不在首次点击位置及其周围8个格子放置地雷
        const isExcluded = Math.abs(row - excludeRow) <= 1 && Math.abs(col - excludeCol) <= 1;
        
        if (!gameState.board[row][col].isMine && !isExcluded) {
            gameState.board[row][col].isMine = true;
            minesPlaced++;
        }
    }
    
    // 计算每个格子周围的地雷数
    calculateNeighborMines();
}

// 计算每个格子周围的地雷数
function calculateNeighborMines() {
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (!gameState.board[r][c].isMine) {
                let count = 0;
                
                // 检查周围8个格子
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        
                        const newRow = r + dr;
                        const newCol = c + dc;
                        
                        if (newRow >= 0 && newRow < gameState.rows && 
                            newCol >= 0 && newCol < gameState.cols && 
                            gameState.board[newRow][newCol].isMine) {
                            count++;
                        }
                    }
                }
                
                gameState.board[r][c].neighborMines = count;
            }
        }
    }
}

// 渲染游戏板
function renderBoard() {
    gameBoard.innerHTML = '';
    
    // 设置游戏板网格
    gameBoard.style.gridTemplateColumns = `repeat(${gameState.cols}, 1fr)`;
    gameBoard.style.gridTemplateRows = `repeat(${gameState.rows}, 1fr)`;
    
    // 创建格子元素
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.setAttribute('data-row', r);
            cell.setAttribute('data-col', c);
            
            // 设置格子状态
            const cellData = gameState.board[r][c];
            
            if (cellData.isRevealed) {
                cell.classList.add('revealed');
                
                if (cellData.isMine) {
                    cell.classList.add('mine');
                    if (gameState.gameOver) {
                        cell.classList.add('exploded');
                    }
                } else if (cellData.neighborMines > 0) {
                    cell.classList.add(`number-${cellData.neighborMines}`);
                    cell.textContent = cellData.neighborMines;
                }
            } else if (cellData.isFlagged) {
                cell.classList.add('flagged');
            }
            
            gameBoard.appendChild(cell);
        }
    }
    
    // 添加事件委托，使用更直接的事件处理方式
    attachCellEvents();
}

// 使用事件委托添加格子事件
function attachCellEvents() {
    // 清除之前的事件监听器
    gameBoard.onclick = null;
    gameBoard.oncontextmenu = null;
    
    // 添加点击事件
    gameBoard.onclick = function(e) {
        const cell = e.target;
        if (cell.classList.contains('cell')) {
            const row = parseInt(cell.getAttribute('data-row'));
            const col = parseInt(cell.getAttribute('data-col'));
            handleCellClick(row, col);
        }
    };
    
    // 添加右键事件
    gameBoard.oncontextmenu = function(e) {
        const cell = e.target;
        if (cell.classList.contains('cell')) {
            e.preventDefault();
            const row = parseInt(cell.getAttribute('data-row'));
            const col = parseInt(cell.getAttribute('data-col'));
            handleRightClick(row, col);
            return false;
        }
        return true;
    };
}

// 处理格子点击
function handleCellClick(row, col) {
    if (gameState.gameOver) return;
    
    const cell = gameState.board[row][col];
    
    // 如果格子已被标记或已揭示，不做处理
    if (cell.isFlagged || cell.isRevealed) return;
    
    // 首次点击时放置地雷并开始计时
    if (gameState.firstClick) {
        gameState.firstClick = false;
        placeMines(row, col);
        startTimer();
    }
    
    // 揭示格子
    revealCell(row, col);
    
    // 检查游戏状态
    checkGameStatus();
}

// 处理右键点击（标记旗子）
function handleRightClick(row, col) {
    // 游戏结束后不能再操作
    if (gameState.gameOver) {
        return;
    }
    
    const cell = gameState.board[row][col];
    
    // 已经揭示的格子不能标记
    if (cell.isRevealed) {
        return;
    }
    
    // 自由切换旗子状态，不受地雷数量限制
    cell.isFlagged = !cell.isFlagged;
    gameState.flags += cell.isFlagged ? 1 : -1;
    
    // 重新渲染游戏板
    renderBoard();
    
    // 检查游戏状态
    checkGameStatus();
}

// 揭示格子
function revealCell(row, col) {
    const cell = gameState.board[row][col];
    
    if (cell.isRevealed || cell.isFlagged) return;
    
    cell.isRevealed = true;
    gameState.revealed++;
    
    // 如果点击到地雷，游戏结束
    if (cell.isMine) {
        gameOver(false);
        return;
    }
    
    // 如果周围没有地雷，递归揭示周围的格子
    if (cell.neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                
                const newRow = row + dr;
                const newCol = col + dc;
                
                if (newRow >= 0 && newRow < gameState.rows && 
                    newCol >= 0 && newCol < gameState.cols) {
                    revealCell(newRow, newCol);
                }
            }
        }
    }
    
    // 关键修复：揭示格子后立即渲染游戏板
    renderBoard();
}

// 开始计时器
function startTimer() {
    gameState.gameStarted = true;
    gameState.timer = setInterval(() => {
        gameState.time++;
        timerElement.textContent = gameState.time;
    }, 1000);
}

// 游戏结束
function gameOver(isWin) {
    gameState.gameOver = true;
    gameState.gameStarted = false;
    
    // 停止计时器
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
    
    // 显示重新开始按钮
    restartButton.classList.remove('hidden');
    
    // 如果失败，揭示所有地雷
    if (!isWin) {
        revealAllMines();
    }
    
    // 根据游戏结果显示不同的提示信息
    if (isWin) {
        // 游戏胜利，根据用时显示不同的提示
        if (gameState.time <= 100) {
            messageText.textContent = '🎉 太厉害了！';
        } else if (gameState.time <= 200) {
            messageText.textContent = '👏 真棒！';
        } else {
            messageText.textContent = '💪 继续努力吧！';
        }
    } else {
        // 游戏失败
        messageText.textContent = '💣 很遗憾你输了！';
    }
    
    // 平滑显示游戏消息
    setTimeout(() => {
        gameMessage.classList.remove('hidden');
    }, 100); // 短暂延迟以确保渲染正确
}

// 揭示所有地雷
function revealAllMines() {
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            const cell = gameState.board[r][c];
            if (cell.isMine) {
                cell.isRevealed = true;
            }
        }
    }
    renderBoard();
}

// 检查游戏状态
function checkGameStatus() {
    // 检查是否获胜：所有非地雷格子都被揭示
    const totalCells = gameState.rows * gameState.cols;
    const nonMineCells = totalCells - gameState.mines;
    
    if (gameState.revealed === nonMineCells) {
        // 自动标记所有剩余地雷
        for (let r = 0; r < gameState.rows; r++) {
            for (let c = 0; c < gameState.cols; c++) {
                const cell = gameState.board[r][c];
                if (cell.isMine && !cell.isFlagged) {
                    cell.isFlagged = true;
                    gameState.flags++;
                }
            }
        }
        
        // 重新渲染
        renderBoard();
        
        // 游戏胜利
        gameOver(true);
    }
}

// 事件监听
function setupEventListeners() {
    // 移除难度选择相关逻辑
    
    // 重新开始
    restartButton.addEventListener('click', () => {
        initGame();
    });
    
    // 再玩一次
    playAgainButton.addEventListener('click', () => {
        initGame();
    });
}

// 初始化游戏和事件监听
function initialize() {
    setupEventListeners();
    initGame();
}

// 当页面加载完成时初始化游戏
window.addEventListener('DOMContentLoaded', initialize);