// 游戏常量
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;
const GRID_SIZE = 20;
const INITIAL_SPEED = 150; // 初始移动间隔（毫秒）
const MIN_SPEED = 50; // 最小移动间隔（毫秒）
const SPEED_INCREASE = 5; // 每次升级速度增加的毫秒数
const SCORE_PER_FOOD = 10; // 每个食物的分数
const FOOD_PER_LEVEL = 3; // 每升一级需要吃的食物数量

// 游戏状态
let gameState = {
    canvas: null,
    ctx: null,
    snake: [],
    food: null,
    direction: { x: 1, y: 0 }, // 初始向右移动
    nextDirection: { x: 1, y: 0 }, // 下一个方向
    score: 0,
    highScore: 0,
    level: 1,
    foodsEaten: 0,
    speed: INITIAL_SPEED,
    isRunning: false,
    isPaused: false,
    gameLoop: null
};

// DOM元素
let domElements = {
    scoreDisplay: null,
    highScoreDisplay: null,
    levelDisplay: null,
    startBtn: null,
    gameOverScreen: null,
    finalScoreDisplay: null,
    restartBtn: null,
    startScreen: null,
    confirmStartBtn: null
};

// 初始化游戏
function initGame() {
    // 获取DOM元素
    gameState.canvas = document.getElementById('gameCanvas');
    gameState.ctx = gameState.canvas.getContext('2d');
    
    domElements.scoreDisplay = document.getElementById('score');
    domElements.highScoreDisplay = document.getElementById('high-score');
    domElements.levelDisplay = document.getElementById('level');
    domElements.startBtn = document.getElementById('startBtn');
    domElements.gameOverScreen = document.getElementById('gameOver');
    domElements.finalScoreDisplay = document.getElementById('finalScore');
    domElements.restartBtn = document.getElementById('restartBtn');
    domElements.startScreen = document.getElementById('startScreen');
    domElements.confirmStartBtn = document.getElementById('confirmStartBtn');
    
    // 设置事件监听
    setupEventListeners();
    
    // 加载最高分
    loadHighScore();
    
    // 初始化蛇和食物
    resetGame();
    
    // 绘制初始界面
    drawGame();
    
    // 显示开始游戏界面
    domElements.startScreen.classList.remove('hidden');
}

// 设置事件监听
function setupEventListeners() {
    // 键盘控制
    window.addEventListener('keydown', handleKeyPress);
    
    // 按钮事件
    domElements.startBtn.addEventListener('click', startGame);
    domElements.restartBtn.addEventListener('click', restartGame);
    domElements.confirmStartBtn.addEventListener('click', startGame);
}

// 处理键盘按键
function handleKeyPress(e) {
    // 如果显示开始界面，按空格键开始
    if (!domElements.startScreen.classList.contains('hidden')) {
        if (e.key === ' ') {
            startGame();
            return;
        }
    }
    
    // 重置游戏 - 按O键
    if (e.key === 'o' || e.key === 'O') {
        restartGame();
        return;
    }
    
    // 暂停/继续游戏 - 按P键
    if (e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
    }
    
    // 方向控制 - 只使用WASD键
    switch (e.key.toLowerCase()) {
        case 'w':
            // 不能直接向上移动（如果当前正在向下移动）
            if (gameState.direction.y !== 1) {
                gameState.nextDirection = { x: 0, y: -1 };
            }
            break;
        case 's':
            // 不能直接向下移动（如果当前正在向上移动）
            if (gameState.direction.y !== -1) {
                gameState.nextDirection = { x: 0, y: 1 };
            }
            break;
        case 'a':
            // 不能直接向左移动（如果当前正在向右移动）
            if (gameState.direction.x !== 1) {
                gameState.nextDirection = { x: -1, y: 0 };
            }
            break;
        case 'd':
            // 不能直接向右移动（如果当前正在向左移动）
            if (gameState.direction.x !== -1) {
                gameState.nextDirection = { x: 1, y: 0 };
            }
            break;
    }
}

// 改变方向（用于按钮控制）
function changeDirection(x, y) {
    // 确保不能直接反向移动
    if ((x !== 0 && x !== -gameState.direction.x) || 
        (y !== 0 && y !== -gameState.direction.y)) {
        gameState.nextDirection = { x, y };
    }
}

// 初始化蛇
function initSnake() {
    // 创建初始蛇，长度为3
    const centerX = Math.floor(CANVAS_WIDTH / (2 * GRID_SIZE)) * GRID_SIZE;
    const centerY = Math.floor(CANVAS_HEIGHT / (2 * GRID_SIZE)) * GRID_SIZE;
    
    gameState.snake = [
        { x: centerX, y: centerY },
        { x: centerX - GRID_SIZE, y: centerY },
        { x: centerX - GRID_SIZE * 2, y: centerY }
    ];
    
    // 初始方向向右
    gameState.direction = { x: 1, y: 0 };
    gameState.nextDirection = { x: 1, y: 0 };
}

// 生成食物
function generateFood() {
    // 计算有效的网格位置
    const maxX = Math.floor((CANVAS_WIDTH - GRID_SIZE) / GRID_SIZE);
    const maxY = Math.floor((CANVAS_HEIGHT - GRID_SIZE) / GRID_SIZE);
    
    let x, y;
    let onSnake;
    
    // 确保食物不会生成在蛇身上
    do {
        x = Math.floor(Math.random() * maxX) * GRID_SIZE;
        y = Math.floor(Math.random() * maxY) * GRID_SIZE;
        
        // 检查是否在蛇身上
        onSnake = gameState.snake.some(segment => segment.x === x && segment.y === y);
    } while (onSnake);
    
    gameState.food = { x, y };
}

// 移动蛇
function moveSnake() {
    // 更新方向
    gameState.direction = { ...gameState.nextDirection };
    
    // 获取蛇头位置
    const head = { ...gameState.snake[0] };
    
    // 计算新的蛇头位置
    head.x += gameState.direction.x * GRID_SIZE;
    head.y += gameState.direction.y * GRID_SIZE;
    
    // 将新的蛇头添加到蛇的前面
    gameState.snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
        // 吃到食物，增加分数
        gameState.score += SCORE_PER_FOOD;
        gameState.foodsEaten++;
        
        // 更新分数显示
        updateScoreDisplay();
        
        // 检查是否升级
        if (gameState.foodsEaten >= FOOD_PER_LEVEL) {
            levelUp();
        }
        
        // 生成新食物
        generateFood();
    } else {
        // 没有吃到食物，移除尾部
        gameState.snake.pop();
    }
}

// 升级
function levelUp() {
    gameState.level++;
    gameState.foodsEaten = 0;
    
    // 增加游戏速度，但不低于最小值
    gameState.speed = Math.max(MIN_SPEED, gameState.speed - SPEED_INCREASE);
    
    // 更新等级显示
    domElements.levelDisplay.textContent = gameState.level;
    
    // 如果游戏正在运行，重新设置游戏循环
    if (gameState.isRunning && !gameState.isPaused) {
        clearInterval(gameState.gameLoop);
        startGameLoop();
    }
}

// 检查碰撞
function checkCollisions() {
    const head = gameState.snake[0];
    
    // 检查边界碰撞
    if (head.x < 0 || head.x >= CANVAS_WIDTH || 
        head.y < 0 || head.y >= CANVAS_HEIGHT) {
        return true;
    }
    
    // 检查自身碰撞
    for (let i = 1; i < gameState.snake.length; i++) {
        if (head.x === gameState.snake[i].x && head.y === gameState.snake[i].y) {
            return true;
        }
    }
    
    return false;
}

// 绘制游戏
function drawGame() {
    // 清空画布
    gameState.ctx.fillStyle = '#2ecc71';
    gameState.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 绘制网格（可选）
    drawGrid();
    
    // 绘制蛇
    drawSnake();
    
    // 绘制食物
    drawFood();
    
    // 如果游戏暂停，显示暂停信息
    if (gameState.isPaused) {
        drawPausedMessage();
    }
    
    // 如果游戏未运行，显示开始提示
    if (!gameState.isRunning && !gameState.gameOverScreen.classList.contains('hidden')) {
        drawStartMessage();
    }
}

// 绘制网格
function drawGrid() {
    gameState.ctx.strokeStyle = '#27ae60';
    gameState.ctx.lineWidth = 0.5;
    
    // 绘制垂直线
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
        gameState.ctx.beginPath();
        gameState.ctx.moveTo(x, 0);
        gameState.ctx.lineTo(x, CANVAS_HEIGHT);
        gameState.ctx.stroke();
    }
    
    // 绘制水平线
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
        gameState.ctx.beginPath();
        gameState.ctx.moveTo(0, y);
        gameState.ctx.lineTo(CANVAS_WIDTH, y);
        gameState.ctx.stroke();
    }
}

// 绘制蛇
function drawSnake() {
    for (let i = 0; i < gameState.snake.length; i++) {
        const segment = gameState.snake[i];
        
        // 设置蛇的颜色，头部颜色不同
        if (i === 0) {
            gameState.ctx.fillStyle = '#e74c3c'; // 蛇头红色
        } else {
            gameState.ctx.fillStyle = '#3498db'; // 蛇身蓝色
        }
        
        // 绘制蛇段
        gameState.ctx.fillRect(segment.x, segment.y, GRID_SIZE, GRID_SIZE);
        
        // 绘制边框
        gameState.ctx.strokeStyle = '#2980b9';
        gameState.ctx.lineWidth = 1;
        gameState.ctx.strokeRect(segment.x, segment.y, GRID_SIZE, GRID_SIZE);
    }
    
    // 绘制蛇的眼睛（可选）
    drawSnakeEyes();
}

// 绘制蛇的眼睛
function drawSnakeEyes() {
    const head = gameState.snake[0];
    const eyeSize = GRID_SIZE / 6;
    const eyeOffset = GRID_SIZE / 3;
    
    gameState.ctx.fillStyle = 'white';
    
    // 根据蛇头方向绘制眼睛
    if (gameState.direction.x === 1) { // 向右
        gameState.ctx.beginPath();
        gameState.ctx.arc(head.x + GRID_SIZE - eyeOffset, head.y + eyeOffset, eyeSize, 0, Math.PI * 2);
        gameState.ctx.arc(head.x + GRID_SIZE - eyeOffset, head.y + GRID_SIZE - eyeOffset, eyeSize, 0, Math.PI * 2);
        gameState.ctx.fill();
    } else if (gameState.direction.x === -1) { // 向左
        gameState.ctx.beginPath();
        gameState.ctx.arc(head.x + eyeOffset, head.y + eyeOffset, eyeSize, 0, Math.PI * 2);
        gameState.ctx.arc(head.x + eyeOffset, head.y + GRID_SIZE - eyeOffset, eyeSize, 0, Math.PI * 2);
        gameState.ctx.fill();
    } else if (gameState.direction.y === -1) { // 向上
        gameState.ctx.beginPath();
        gameState.ctx.arc(head.x + eyeOffset, head.y + eyeOffset, eyeSize, 0, Math.PI * 2);
        gameState.ctx.arc(head.x + GRID_SIZE - eyeOffset, head.y + eyeOffset, eyeSize, 0, Math.PI * 2);
        gameState.ctx.fill();
    } else if (gameState.direction.y === 1) { // 向下
        gameState.ctx.beginPath();
        gameState.ctx.arc(head.x + eyeOffset, head.y + GRID_SIZE - eyeOffset, eyeSize, 0, Math.PI * 2);
        gameState.ctx.arc(head.x + GRID_SIZE - eyeOffset, head.y + GRID_SIZE - eyeOffset, eyeSize, 0, Math.PI * 2);
        gameState.ctx.fill();
    }
}

// 绘制食物
function drawFood() {
    if (!gameState.food) return;
    
    // 绘制红色食物
    gameState.ctx.fillStyle = '#e74c3c';
    gameState.ctx.fillRect(gameState.food.x, gameState.food.y, GRID_SIZE, GRID_SIZE);
    
    // 绘制食物细节
    gameState.ctx.fillStyle = '#c0392b';
    gameState.ctx.beginPath();
    gameState.ctx.arc(gameState.food.x + GRID_SIZE / 2, gameState.food.y + GRID_SIZE / 2, GRID_SIZE / 6, 0, Math.PI * 2);
    gameState.ctx.fill();
}

// 绘制暂停信息
function drawPausedMessage() {
    gameState.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    gameState.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    gameState.ctx.fillStyle = 'white';
    gameState.ctx.font = '30px Arial';
    gameState.ctx.textAlign = 'center';
    gameState.ctx.fillText('游戏暂停', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    gameState.ctx.font = '16px Arial';
    gameState.ctx.fillText('按P键继续', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    gameState.ctx.fillText('按O键重置游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

// 绘制开始提示
function drawStartMessage() {
    gameState.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    gameState.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    gameState.ctx.fillStyle = 'white';
    gameState.ctx.font = '24px Arial';
    gameState.ctx.textAlign = 'center';
    gameState.ctx.fillText('按空格键开始游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

// 更新分数显示
function updateScoreDisplay() {
    domElements.scoreDisplay.textContent = gameState.score;
    
    // 如果当前分数超过最高分，更新最高分
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        domElements.highScoreDisplay.textContent = gameState.highScore;
        saveHighScore();
    }
}

// 保存最高分到本地存储
function saveHighScore() {
    localStorage.setItem('snakeHighScore', gameState.highScore.toString());
}

// 从本地存储加载最高分
function loadHighScore() {
    const saved = localStorage.getItem('snakeHighScore');
    if (saved) {
        gameState.highScore = parseInt(saved, 10);
        domElements.highScoreDisplay.textContent = gameState.highScore;
    }
}

// 开始游戏循环
function startGameLoop() {
    gameState.gameLoop = setInterval(() => {
        if (!gameState.isPaused) {
            moveSnake();
            
            if (checkCollisions()) {
                gameOver();
                return;
            }
            
            drawGame();
        }
    }, gameState.speed);
}

// 开始游戏
function startGame() {
    if (!gameState.isRunning) {
        gameState.isRunning = true;
        gameState.isPaused = false;
        
        // 隐藏游戏结束界面和开始界面
        domElements.gameOverScreen.classList.add('hidden');
        domElements.startScreen.classList.add('hidden');
        
        // 开始游戏循环
        startGameLoop();
    }
}

// 切换暂停/继续
function togglePause() {
    if (gameState.isRunning && domElements.gameOverScreen.classList.contains('hidden')) {
        gameState.isPaused = !gameState.isPaused;
        drawGame();
    }
}

// 重置游戏
function resetGame() {
    // 停止游戏循环
    if (gameState.gameLoop) {
        clearInterval(gameState.gameLoop);
    }
    
    // 重置游戏状态
    gameState.isRunning = false;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.level = 1;
    gameState.foodsEaten = 0;
    gameState.speed = INITIAL_SPEED;
    
    // 更新显示
    domElements.scoreDisplay.textContent = gameState.score;
    domElements.levelDisplay.textContent = gameState.level;
    
    // 隐藏游戏结束界面
    domElements.gameOverScreen.classList.add('hidden');
    // 不再显示开始游戏界面，让游戏直接开始
    
    // 初始化蛇和食物
    initSnake();
    generateFood();
    
    // 绘制游戏
    drawGame();
}

// 游戏结束
function gameOver() {
    // 停止游戏循环
    clearInterval(gameState.gameLoop);
    gameState.isRunning = false;
    
    // 更新最终分数
    domElements.finalScoreDisplay.textContent = gameState.score;
    
    // 根据分数显示不同的评价
    const feedbackElement = document.getElementById('scoreFeedback');
    let feedbackText = '';
    let feedbackClass = '';
    let emoji = '';
    
    if (gameState.score <= 0) {
        feedbackText = '很遗憾，再来一次吧';
        feedbackClass = 'feedback-low';
        emoji = '😢';
    } else if (gameState.score > 0 && gameState.score < 30) {
        feedbackText = '继续加油！';
        feedbackClass = 'feedback-low';
        emoji = '😊';
    } else if (gameState.score >= 30 && gameState.score < 60) {
        feedbackText = '很好';
        feedbackClass = 'feedback-medium';
        emoji = '👍';
    } else if (gameState.score >= 60 && gameState.score < 100) {
        feedbackText = '真棒';
        feedbackClass = 'feedback-high';
        emoji = '👏';
    } else {
        feedbackText = '太厉害了';
        feedbackClass = 'feedback-excellent';
        emoji = '🎉';
    }
    
    // 移除所有可能的评价类
    feedbackElement.className = 'score-feedback';
    // 添加当前评价类
    feedbackElement.classList.add(feedbackClass);
    // 设置评价文本和表情
    feedbackElement.innerHTML = feedbackText + '<span class="emoji">' + emoji + '</span>';
    
    // 显示游戏结束界面
    domElements.gameOverScreen.classList.remove('hidden');
}

// 重新开始游戏
function restartGame() {
    console.log('重新开始游戏 - 开始');
    
    // 首先停止游戏循环
    if (gameState.gameLoop) {
        clearInterval(gameState.gameLoop);
        gameState.gameLoop = null;
        console.log('游戏循环已清除');
    }
    
    // 隐藏游戏结束界面
    domElements.gameOverScreen.classList.add('hidden');
    console.log('游戏结束界面已隐藏');
    
    // 重置游戏状态（完全重置）
    gameState = {
        canvas: gameState.canvas, // 保留对canvas的引用
        ctx: gameState.ctx,       // 保留对context的引用
        snake: [],
        food: null,
        direction: { x: 1, y: 0 }, // 重置为初始方向
        nextDirection: { x: 1, y: 0 },
        score: 0,
        highScore: gameState.highScore, // 保留最高分数
        level: 1,
        foodsEaten: 0,
        speed: INITIAL_SPEED,
        isRunning: false,
        isPaused: false,
        gameLoop: null
    };
    
    // 更新显示
    domElements.scoreDisplay.textContent = gameState.score;
    domElements.levelDisplay.textContent = gameState.level;
    
    // 初始化蛇和食物
    initSnake();
    generateFood();
    console.log('蛇和食物已初始化');
    
    // 隐藏开始界面（避免显示开始按钮）
    domElements.startScreen.classList.add('hidden');
    console.log('开始界面已隐藏');
    
    // 直接启动游戏循环
    console.log('直接启动游戏循环');
    gameState.isRunning = true;
    gameState.isPaused = false;
    
    // 立即绘制游戏
    drawGame();
    
    // 启动游戏循环
    startGameLoop();
    console.log('重新开始游戏 - 完成');
}

// 当页面加载完成时初始化游戏
window.addEventListener('DOMContentLoaded', initGame);