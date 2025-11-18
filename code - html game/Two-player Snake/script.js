// 双人贪吃蛇游戏

// 游戏状态对象
const gameState = {
    canvas: null,
    ctx: null,
    gridSize: 20,
    width: 600,
    height: 400,
    isRunning: false,
    isPaused: false,
    gameLoopId: null,
    speed: 150,
    scorePlayer1: 0,
    scorePlayer2: 0,
    highScore: 0,
    // 玩家1的蛇
    snake1: [],
    direction1: { x: 1, y: 0 },
    nextDirection1: { x: 1, y: 0 },
    // 玩家2的蛇
    snake2: [],
    direction2: { x: -1, y: 0 },
    nextDirection2: { x: -1, y: 0 },
    // 食物
    food: { x: 0, y: 0 },
    foodType: 0, // 0: 普通食物, 1: 特殊食物
    specialFoodTimer: 0
};

// DOM元素
const domElements = {
    canvas: null,
    startScreen: null,
    gameOverScreen: null,
    startBtn: null,
    confirmStartBtn: null,
    restartBtn: null,
    player1Score: null,
    player2Score: null,
    player1FinalScore: null,
    player2FinalScore: null,
    winnerText: null
};

// 初始化DOM元素
function initDOM() {
    domElements.canvas = document.getElementById('gameCanvas');
    domElements.startScreen = document.getElementById('startScreen');
    domElements.gameOverScreen = document.getElementById('gameOverScreen');
    domElements.confirmStartBtn = document.getElementById('confirmStartBtn');
    domElements.restartBtn = document.getElementById('restartBtn');
    domElements.player1Score = document.getElementById('player1Score');
    domElements.player2Score = document.getElementById('player2Score');
    domElements.player1FinalScore = document.getElementById('player1FinalScore');
    domElements.player2FinalScore = document.getElementById('player2FinalScore');
    domElements.winnerText = document.getElementById('winnerText');
    
    gameState.canvas = domElements.canvas;
    gameState.ctx = domElements.canvas.getContext('2d');
}

// 初始化游戏
function initGame() {
    // 初始化玩家1的蛇（从左侧开始）
    gameState.snake1 = [
        { x: 5, y: 10 },
        { x: 4, y: 10 },
        { x: 3, y: 10 }
    ];
    gameState.direction1 = { x: 1, y: 0 };
    gameState.nextDirection1 = { x: 1, y: 0 };
    
    // 初始化玩家2的蛇（从右侧开始）
    gameState.snake2 = [
        { x: 24, y: 10 },
        { x: 25, y: 10 },
        { x: 26, y: 10 }
    ];
    gameState.direction2 = { x: -1, y: 0 };
    gameState.nextDirection2 = { x: -1, y: 0 };
    
    // 初始化食物
    generateFood();
    
    // 重置分数
    gameState.scorePlayer1 = 0;
    gameState.scorePlayer2 = 0;
    updateScore();
    
    // 绘制初始游戏状态
    drawGame();
}

// 生成食物
function generateFood() {
    const availablePositions = [];
    
    // 创建所有可能的网格位置
    for (let x = 0; x < gameState.width / gameState.gridSize; x++) {
        for (let y = 0; y < gameState.height / gameState.gridSize; y++) {
            // 检查是否与玩家1或玩家2的蛇体重叠
            let isOccupied = false;
            
            // 检查与玩家1的蛇体重叠
            for (const segment of gameState.snake1) {
                if (segment.x === x && segment.y === y) {
                    isOccupied = true;
                    break;
                }
            }
            
            // 如果没有与玩家1重叠，检查与玩家2的蛇体重叠
            if (!isOccupied) {
                for (const segment of gameState.snake2) {
                    if (segment.x === x && segment.y === y) {
                        isOccupied = true;
                        break;
                    }
                }
            }
            
            // 如果位置可用，添加到可用位置数组
            if (!isOccupied) {
                availablePositions.push({ x, y });
            }
        }
    }
    
    // 随机选择一个可用位置
    if (availablePositions.length > 0) {
        const randomIndex = Math.floor(Math.random() * availablePositions.length);
        gameState.food = availablePositions[randomIndex];
        
        // 10%概率生成特殊食物
        gameState.foodType = Math.random() < 0.1 ? 1 : 0;
        gameState.specialFoodTimer = 50; // 特殊食物持续时间
    }
}

// 绘制游戏
function drawGame() {
    // 清空画布
    gameState.ctx.clearRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    
    // 绘制网格（可选）
    drawGrid();
    
    // 绘制食物
    drawFood();
    
    // 绘制玩家1的蛇
    drawSnake(gameState.snake1, 'blue');
    
    // 绘制玩家2的蛇
    drawSnake(gameState.snake2, 'red');
}

// 绘制网格
function drawGrid() {
    gameState.ctx.strokeStyle = '#ddd';
    gameState.ctx.lineWidth = 0.5;
    
    // 绘制垂直线
    for (let x = 0; x <= gameState.width; x += gameState.gridSize) {
        gameState.ctx.beginPath();
        gameState.ctx.moveTo(x, 0);
        gameState.ctx.lineTo(x, gameState.height);
        gameState.ctx.stroke();
    }
    
    // 绘制水平线
    for (let y = 0; y <= gameState.height; y += gameState.gridSize) {
        gameState.ctx.beginPath();
        gameState.ctx.moveTo(0, y);
        gameState.ctx.lineTo(gameState.width, y);
        gameState.ctx.stroke();
    }
}

// 绘制食物
function drawFood() {
    gameState.ctx.fillStyle = gameState.foodType === 1 ? 'gold' : 'green';
    gameState.ctx.beginPath();
    gameState.ctx.roundRect(
        gameState.food.x * gameState.gridSize + 2,
        gameState.food.y * gameState.gridSize + 2,
        gameState.gridSize - 4,
        gameState.gridSize - 4,
        4
    );
    gameState.ctx.fill();
    
    // 如果是特殊食物，添加闪烁效果
    if (gameState.foodType === 1) {
        gameState.specialFoodTimer--;
        if (gameState.specialFoodTimer <= 0) {
            generateFood(); // 特殊食物消失，生成新食物
        }
    }
}

// 绘制蛇
function drawSnake(snake, color) {
    // 绘制蛇身
    for (let i = 1; i < snake.length; i++) {
        gameState.ctx.fillStyle = color + '80'; // 半透明的身体
        gameState.ctx.fillRect(
            snake[i].x * gameState.gridSize,
            snake[i].y * gameState.gridSize,
            gameState.gridSize,
            gameState.gridSize
        );
    }
    
    // 绘制蛇头
    const head = snake[0];
    gameState.ctx.fillStyle = color;
    gameState.ctx.fillRect(
        head.x * gameState.gridSize,
        head.y * gameState.gridSize,
        gameState.gridSize,
        gameState.gridSize
    );
    
    // 绘制眼睛（简单的白色点）
    gameState.ctx.fillStyle = 'white';
    const eyeSize = gameState.gridSize / 6;
    
    if (color === 'blue') { // 玩家1
        if (gameState.direction1.x === 1) { // 右
            gameState.ctx.beginPath();
            gameState.ctx.arc(head.x * gameState.gridSize + gameState.gridSize * 0.75, head.y * gameState.gridSize + gameState.gridSize * 0.25, eyeSize, 0, Math.PI * 2);
            gameState.ctx.arc(head.x * gameState.gridSize + gameState.gridSize * 0.75, head.y * gameState.gridSize + gameState.gridSize * 0.75, eyeSize, 0, Math.PI * 2);
            gameState.ctx.fill();
        } else if (gameState.direction1.x === -1) { // 左
            gameState.ctx.beginPath();
            gameState.ctx.arc(head.x * gameState.gridSize + gameState.gridSize * 0.25, head.y * gameState.gridSize + gameState.gridSize * 0.25, eyeSize, 0, Math.PI * 2);
            gameState.ctx.arc(head.x * gameState.gridSize + gameState.gridSize * 0.25, head.y * gameState.gridSize + gameState.gridSize * 0.75, eyeSize, 0, Math.PI * 2);
            gameState.ctx.fill();
        } else if (gameState.direction1.y === -1) { // 上
            gameState.ctx.beginPath();
            gameState.ctx.arc(head.x * gameState.gridSize + gameState.gridSize * 0.25, head.y * gameState.gridSize + gameState.gridSize * 0.25, eyeSize, 0, Math.PI * 2);
            gameState.ctx.arc(head.x * gameState.gridSize + gameState.gridSize * 0.75, head.y * gameState.gridSize + gameState.gridSize * 0.25, eyeSize, 0, Math.PI * 2);
            gameState.ctx.fill();
        } else if (gameState.direction1.y === 1) { // 下
            gameState.ctx.beginPath();
            gameState.ctx.arc(head.x * gameState.gridSize + gameState.gridSize * 0.25, head.y * gameState.gridSize + gameState.gridSize * 0.75, eyeSize, 0, Math.PI * 2);
            gameState.ctx.arc(head.x * gameState.gridSize + gameState.gridSize * 0.75, head.y * gameState.gridSize + gameState.gridSize * 0.75, eyeSize, 0, Math.PI * 2);
            gameState.ctx.fill();
        }
    } else { // 玩家2
        if (gameState.direction2.x === 1) { // 右
            gameState.ctx.beginPath();
            gameState.ctx.arc(head.x * gameState.gridSize + gameState.gridSize * 0.75, head.y * gameState.gridSize + gameState.gridSize * 0.25, eyeSize, 0, Math.PI * 2);
            gameState.ctx.arc(head.x * gameState.gridSize + gameState.gridSize * 0.75, head.y * gameState.gridSize + gameState.gridSize * 0.75, eyeSize, 0, Math.PI * 2);
            gameState.ctx.fill();
        } else if (gameState.direction2.x === -1) { // 左
            gameState.ctx.beginPath();
            gameState.ctx.arc(head.x * gameState.gridSize + gameState.gridSize * 0.25, head.y * gameState.gridSize + gameState.gridSize * 0.25, eyeSize, 0, Math.PI * 2);
            gameState.ctx.arc(head.x * gameState.gridSize + gameState.gridSize * 0.25, head.y * gameState.gridSize + gameState.gridSize * 0.75, eyeSize, 0, Math.PI * 2);
            gameState.ctx.fill();
        } else if (gameState.direction2.y === -1) { // 上
            gameState.ctx.beginPath();
            gameState.ctx.arc(head.x * gameState.gridSize + gameState.gridSize * 0.25, head.y * gameState.gridSize + gameState.gridSize * 0.25, eyeSize, 0, Math.PI * 2);
            gameState.ctx.arc(head.x * gameState.gridSize + gameState.gridSize * 0.75, head.y * gameState.gridSize + gameState.gridSize * 0.25, eyeSize, 0, Math.PI * 2);
            gameState.ctx.fill();
        } else if (gameState.direction2.y === 1) { // 下
            gameState.ctx.beginPath();
            gameState.ctx.arc(head.x * gameState.gridSize + gameState.gridSize * 0.25, head.y * gameState.gridSize + gameState.gridSize * 0.75, eyeSize, 0, Math.PI * 2);
            gameState.ctx.arc(head.x * gameState.gridSize + gameState.gridSize * 0.75, head.y * gameState.gridSize + gameState.gridSize * 0.75, eyeSize, 0, Math.PI * 2);
            gameState.ctx.fill();
        }
    }
}

// 更新游戏状态
function updateGame() {
    if (gameState.isPaused || !gameState.isRunning) return;
    
    // 更新方向
    gameState.direction1 = { ...gameState.nextDirection1 };
    gameState.direction2 = { ...gameState.nextDirection2 };
    
    // 保存蛇的当前长度，用于后续检查是否需要增长
    const snake1Length = gameState.snake1.length;
    const snake2Length = gameState.snake2.length;
    
    // 移动玩家1的蛇
    moveSnake(gameState.snake1, gameState.direction1);
    // 移动玩家2的蛇
    moveSnake(gameState.snake2, gameState.direction2);
    
    // 检查玩家1是否吃到食物（移动后检查）
    if (checkFoodCollision(gameState.snake1)) {
        // 增加蛇的长度
        gameState.snake1.push({ ...gameState.snake1[gameState.snake1.length - 1] });
        handleFoodCollision(gameState.snake1, 1);
    }
    
    // 检查玩家2是否吃到食物（移动后检查）
    if (checkFoodCollision(gameState.snake2)) {
        // 增加蛇的长度
        gameState.snake2.push({ ...gameState.snake2[gameState.snake2.length - 1] });
        handleFoodCollision(gameState.snake2, 2);
    }
    
    // 检查碰撞
    const collisionResult = checkCollisions();
    if (collisionResult !== 0) {
        gameOver(collisionResult);
        return;
    }
    
    // 绘制游戏
    drawGame();
}

// 移动蛇
function moveSnake(snake, direction) {
    const head = { ...snake[0] };
    
    // 更新蛇头位置
    head.x += direction.x;
    head.y += direction.y;
    
    // 将新的头部添加到蛇的前端
    snake.unshift(head);
    
    // 默认移除尾部，吃到食物时在updateGame中处理增长
    // 保留初始长度（3段）
    if (snake.length > 3) {
        snake.pop();
    }
}

// 检查蛇头是否与食物碰撞
function checkFoodCollision(snake) {
    const head = snake[0];
    return head.x === gameState.food.x && head.y === gameState.food.y;
}

// 处理食物碰撞
function handleFoodCollision(snake, player) {
    // 增加分数
    const points = gameState.foodType === 1 ? 3 : 1;
    if (player === 1) {
        gameState.scorePlayer1 += points;
    } else {
        gameState.scorePlayer2 += points;
    }
    updateScore();
    
    // 生成新食物
    generateFood();
    
    // 不需要pop尾部，这样蛇就会增长
    // 注意：在移动蛇的时候已经添加了新的头部，这里不pop就会让蛇增长
    // 移除了snake.pop()，让蛇增长
}

// 检查碰撞（边界、自己、对方）
function checkCollisions() {
    const head1 = gameState.snake1[0];
    const head2 = gameState.snake2[0];
    
    // 检查边界碰撞
    if (head1.x < 0 || head1.x >= gameState.width / gameState.gridSize ||
        head1.y < 0 || head1.y >= gameState.height / gameState.gridSize) {
        return 2; // 玩家2胜利
    }
    
    if (head2.x < 0 || head2.x >= gameState.width / gameState.gridSize ||
        head2.y < 0 || head2.y >= gameState.height / gameState.gridSize) {
        return 1; // 玩家1胜利
    }
    
    // 检查玩家1是否撞到自己
    for (let i = 1; i < gameState.snake1.length; i++) {
        if (head1.x === gameState.snake1[i].x && head1.y === gameState.snake1[i].y) {
            return 2; // 玩家2胜利
        }
    }
    
    // 检查玩家2是否撞到自己
    for (let i = 1; i < gameState.snake2.length; i++) {
        if (head2.x === gameState.snake2[i].x && head2.y === gameState.snake2[i].y) {
            return 1; // 玩家1胜利
        }
    }
    
    // 检查玩家1是否撞到玩家2
    for (let i = 0; i < gameState.snake2.length; i++) {
        if (head1.x === gameState.snake2[i].x && head1.y === gameState.snake2[i].y) {
            return 2; // 玩家2胜利
        }
    }
    
    // 检查玩家2是否撞到玩家1
    for (let i = 0; i < gameState.snake1.length; i++) {
        if (head2.x === gameState.snake1[i].x && head2.y === gameState.snake1[i].y) {
            return 1; // 玩家1胜利
        }
    }
    
    return 0; // 没有碰撞
}

// 更新分数显示
function updateScore() {
    domElements.player1Score.textContent = gameState.scorePlayer1;
    domElements.player2Score.textContent = gameState.scorePlayer2;
}

// 游戏结束
function gameOver(winner) {
    gameState.isRunning = false;
    clearInterval(gameState.gameLoopId);
    
    // 更新最终分数
    domElements.player1FinalScore.textContent = gameState.scorePlayer1;
    domElements.player2FinalScore.textContent = gameState.scorePlayer2;
    
    // 显示获胜者
    if (winner === 1) {
        domElements.winnerText.textContent = '玩家1获胜！';
    } else if (winner === 2) {
        domElements.winnerText.textContent = '玩家2获胜！';
    }
    
    // 显示游戏结束界面
    domElements.gameOverScreen.classList.remove('hidden');
}

// 启动游戏循环
function startGameLoop() {
    console.log('启动游戏循环');
    if (gameState.gameLoopId) {
        clearInterval(gameState.gameLoopId);
    }
    gameState.gameLoopId = setInterval(updateGame, gameState.speed);
}

// 开始游戏
function startGame() {
    console.log('开始游戏');
    domElements.startScreen.classList.add('hidden');
    domElements.gameOverScreen.classList.add('hidden');
    
    gameState.isPaused = false;
    gameState.isRunning = true;
    
    initGame();
    startGameLoop();
}

// 重置游戏（保留canvas和ctx引用）
function resetGame() {
    console.log('重置游戏状态');
    // 保存canvas和ctx引用
    const canvas = gameState.canvas;
    const ctx = gameState.ctx;
    const highScore = gameState.highScore;
    
    // 重置游戏状态
    Object.assign(gameState, {
        canvas: canvas,
        ctx: ctx,
        gridSize: 20,
        width: 600,
        height: 400,
        isRunning: false,
        isPaused: false,
        gameLoopId: null,
        speed: 150,
        scorePlayer1: 0,
        scorePlayer2: 0,
        highScore: highScore,
        snake1: [],
        direction1: { x: 1, y: 0 },
        nextDirection1: { x: 1, y: 0 },
        snake2: [],
        direction2: { x: -1, y: 0 },
        nextDirection2: { x: -1, y: 0 },
        food: { x: 0, y: 0 },
        foodType: 0,
        specialFoodTimer: 0
    });
    
    // 隐藏游戏结束界面
    domElements.gameOverScreen.classList.add('hidden');
}

// 重新开始游戏
function restartGame() {
    console.log('重新开始游戏');
    // 隐藏游戏结束和开始界面
    domElements.gameOverScreen.classList.add('hidden');
    domElements.startScreen.classList.add('hidden');
    
    // 清除旧的游戏循环
    if (gameState.gameLoopId) {
        clearInterval(gameState.gameLoopId);
        gameState.gameLoopId = null;
    }
    
    // 重置游戏状态
    resetGame();
    
    // 设置游戏状态
    gameState.isRunning = true;
    gameState.isPaused = false;
    
    // 初始化游戏
    initGame();
    
    // 绘制游戏画面
    drawGame();
    
    // 启动游戏循环
    startGameLoop();
}

// 暂停/继续游戏
function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    console.log(gameState.isPaused ? '游戏暂停' : '游戏继续');
}

// 处理键盘按键
function handleKeyPress(event) {
    console.log('按键按下:', event.key);
    
    // 玩家1控制（WASD）
    switch (event.key.toLowerCase()) {
        case 'w':
            if (gameState.direction1.y !== 1) { // 不能向上移动如果当前是向下移动
                gameState.nextDirection1 = { x: 0, y: -1 };
            }
            break;
        case 's':
            if (gameState.direction1.y !== -1) { // 不能向下移动如果当前是向上移动
                gameState.nextDirection1 = { x: 0, y: 1 };
            }
            break;
        case 'a':
            if (gameState.direction1.x !== 1) { // 不能向左移动如果当前是向右移动
                gameState.nextDirection1 = { x: -1, y: 0 };
            }
            break;
        case 'd':
            if (gameState.direction1.x !== -1) { // 不能向右移动如果当前是向左移动
                gameState.nextDirection1 = { x: 1, y: 0 };
            }
            break;
    }
    
    // 玩家2控制（方向键）
    switch (event.key) {
        case 'ArrowUp':
            if (gameState.direction2.y !== 1) { // 不能向上移动如果当前是向下移动
                gameState.nextDirection2 = { x: 0, y: -1 };
            }
            break;
        case 'ArrowDown':
            if (gameState.direction2.y !== -1) { // 不能向下移动如果当前是向上移动
                gameState.nextDirection2 = { x: 0, y: 1 };
            }
            break;
        case 'ArrowLeft':
            if (gameState.direction2.x !== 1) { // 不能向左移动如果当前是向右移动
                gameState.nextDirection2 = { x: -1, y: 0 };
            }
            break;
        case 'ArrowRight':
            if (gameState.direction2.x !== -1) { // 不能向右移动如果当前是向左移动
                gameState.nextDirection2 = { x: 1, y: 0 };
            }
            break;
    }
    
    // 通用控制
    switch (event.key.toLowerCase()) {
        case 'p':
            if (gameState.isRunning) {
                togglePause();
            }
            break;
        case ' ': // 空格键开始游戏
            if (!gameState.isRunning) {
                startGame();
            }
            break;
        case 'o':
            // O键重置游戏，使用restartGame而不是resetGame
            restartGame();
            break;
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 键盘事件
    document.addEventListener('keydown', handleKeyPress);
    
    // 按钮事件
    domElements.confirmStartBtn.addEventListener('click', startGame);
    domElements.restartBtn.addEventListener('click', restartGame);
    
    // 显示开始游戏界面
    domElements.startScreen.classList.remove('hidden');
}

// 初始化游戏
function init() {
    console.log('初始化双人贪吃蛇游戏');
    initDOM();
    setupEventListeners();
}

// 当页面加载完成后初始化游戏
window.addEventListener('load', init);