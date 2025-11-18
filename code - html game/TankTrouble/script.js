// 游戏常量
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 450;
const TANK_SIZE = 30;
const BULLET_SIZE = 5;
const WALL_THICKNESS = 20;
const TANK_SPEED = 3;
const BULLET_SPEED = 6;
const MAX_BULLETS = 3;

// 游戏状态
let gameState = {
    isRunning: false,
    canvas: null,
    ctx: null,
    players: [],
    bullets: [],
    walls: [],
    maze: [],
    keys: {},
    scores: [0, 0],
    lastCollisionType: null // 记录最后一次碰撞类型
};

// DOM 元素
let domElements = {
    player1Score: null,
    player2Score: null,
    startScreen: null,
    gameOverScreen: null,
    winnerText: null,
    startBtn: null,
    restartBtn: null
};

// 初始化游戏
function initGame() {
    // 获取DOM元素
    gameState.canvas = document.getElementById('gameCanvas');
    gameState.ctx = gameState.canvas.getContext('2d');
    
    domElements.player1Score = document.getElementById('player1-score');
    domElements.player2Score = document.getElementById('player2-score');
    domElements.startScreen = document.getElementById('start-screen');
    domElements.gameOverScreen = document.getElementById('game-over');
    domElements.winnerText = document.getElementById('winner-text');
    domElements.startBtn = document.getElementById('start-btn');
    domElements.restartBtn = document.getElementById('restart-btn');
    
    // 设置事件监听
    setupEventListeners();
    
    // 生成迷宫
    generateMaze();
}

// 设置事件监听
function setupEventListeners() {
    // 键盘控制
    window.addEventListener('keydown', (e) => {
        gameState.keys[e.key] = true;
        if (e.key === ' ') e.preventDefault(); // 防止空格键滚动
    });
    
    window.addEventListener('keyup', (e) => {
        gameState.keys[e.key] = false;
    });
    
    // 按钮事件
    domElements.startBtn.addEventListener('click', startGame);
    domElements.restartBtn.addEventListener('click', startGame);
}

// 生成随机迷宫
function generateMaze() {
    // 清空现有墙壁
    gameState.walls = [];
    
    // 创建边界墙壁
    gameState.walls.push(
        { x: 0, y: 0, width: CANVAS_WIDTH, height: WALL_THICKNESS }, // 顶部
        { x: 0, y: CANVAS_HEIGHT - WALL_THICKNESS, width: CANVAS_WIDTH, height: WALL_THICKNESS }, // 底部
        { x: 0, y: 0, width: WALL_THICKNESS, height: CANVAS_HEIGHT }, // 左侧
        { x: CANVAS_WIDTH - WALL_THICKNESS, y: 0, width: WALL_THICKNESS, height: CANVAS_HEIGHT } // 右侧
    );
    
    // 生成随机内部墙壁
    const minWallLength = 50;
    const maxWallLength = 150;
    const minWalls = 4; // 增加最小墙壁数量确保有足够的墙壁
    const maxWalls = 8; // 略微增加最大墙壁数量
    const wallCount = Math.floor(Math.random() * (maxWalls - minWalls + 1)) + minWalls;
    
    // 创建安全区域（玩家出生点不会有墙壁）
    const safeZonePadding = 100;
    
    // 统计水平和垂直墙壁数量
    let horizontalWallsCount = 0;
    let verticalWallsCount = 0;
    
    // 强制生成至少一定数量的水平和垂直墙壁
    const minHorizontalWalls = Math.max(1, Math.floor(wallCount * 0.3)); // 至少30%的水平墙壁
    const minVerticalWalls = Math.max(1, Math.floor(wallCount * 0.3));  // 至少30%的垂直墙壁
    
    // 先生成强制数量的水平墙壁
    while (horizontalWallsCount < minHorizontalWalls) {
        if (!addWall(true, minWallLength, maxWallLength, safeZonePadding)) {
            // 如果无法添加更多水平墙壁，跳出循环
            break;
        }
        horizontalWallsCount++;
    }
    
    // 先生成强制数量的垂直墙壁
    while (verticalWallsCount < minVerticalWalls) {
        if (!addWall(false, minWallLength, maxWallLength, safeZonePadding)) {
            // 如果无法添加更多垂直墙壁，跳出循环
            break;
        }
        verticalWallsCount++;
    }
    
    // 生成剩余的墙壁，平衡水平和垂直墙壁数量
    const remainingWalls = wallCount - (horizontalWallsCount + verticalWallsCount);
    for (let i = 0; i < remainingWalls; i++) {
        // 根据已有墙壁数量决定下一个墙壁的方向，保持平衡
        let isHorizontal;
        if (horizontalWallsCount > verticalWallsCount) {
            isHorizontal = false; // 如果水平墙壁多，倾向于生成垂直墙壁
        } else if (verticalWallsCount > horizontalWallsCount) {
            isHorizontal = true; // 如果垂直墙壁多，倾向于生成水平墙壁
        } else {
            isHorizontal = Math.random() > 0.5; // 数量相等时随机决定
        }
        
        if (addWall(isHorizontal, minWallLength, maxWallLength, safeZonePadding)) {
            if (isHorizontal) {
                horizontalWallsCount++;
            } else {
                verticalWallsCount++;
            }
        }
    }
}

// 辅助函数：添加一个指定方向的墙壁
function addWall(isHorizontal, minWallLength, maxWallLength, safeZonePadding) {
    let wall;
    let retryCount = 0;
    const maxRetries = 30; // 增加最大重试次数，提高成功率
    
    do {
        if (isHorizontal) {
            // 水平墙壁
            const height = WALL_THICKNESS;
            const width = Math.floor(Math.random() * (maxWallLength - minWallLength + 1)) + minWallLength;
            const x = Math.floor(Math.random() * (CANVAS_WIDTH - width - WALL_THICKNESS * 2)) + WALL_THICKNESS;
            const y = Math.floor(Math.random() * (CANVAS_HEIGHT - height - WALL_THICKNESS * 2)) + WALL_THICKNESS;
            
            wall = { x, y, width, height };
        } else {
            // 垂直墙壁
            const width = WALL_THICKNESS;
            const height = Math.floor(Math.random() * (maxWallLength - minWallLength + 1)) + minWallLength;
            const x = Math.floor(Math.random() * (CANVAS_WIDTH - width - WALL_THICKNESS * 2)) + WALL_THICKNESS;
            const y = Math.floor(Math.random() * (CANVAS_HEIGHT - height - WALL_THICKNESS * 2)) + WALL_THICKNESS;
            
            wall = { x, y, width, height };
        }
        
        // 检查墙壁是否在安全区域内
        const inSafeZone = isWallInSafeZone(wall, safeZonePadding);
        
        // 检查墙壁是否与其他墙壁重叠
        let overlapsWithExistingWall = false;
        for (const existingWall of gameState.walls) {
            if (checkRectOverlap(wall, existingWall)) {
                overlapsWithExistingWall = true;
                break;
            }
        }
        
        // 墙壁有效条件：不在安全区域内且不与其他墙壁重叠
        if (!inSafeZone && !overlapsWithExistingWall) {
            gameState.walls.push(wall);
            return true; // 成功添加墙壁
        }
        
        retryCount++;
    } while (retryCount < maxRetries);
    
    return false; // 无法找到有效的墙壁位置
}

// 检查墙壁是否在安全区域内
function isWallInSafeZone(wall, padding) {
    // 左上角安全区域
    const topLeftSafe = {
        x: padding,
        y: padding,
        width: padding,
        height: padding
    };
    
    // 右下角安全区域
    const bottomRightSafe = {
        x: CANVAS_WIDTH - padding * 2,
        y: CANVAS_HEIGHT - padding * 2,
        width: padding,
        height: padding
    };
    
    return checkRectOverlap(wall, topLeftSafe) || checkRectOverlap(wall, bottomRightSafe);
}

// 检查两个矩形是否重叠
function checkRectOverlap(rect1, rect2) {
    return !(
        rect1.x + rect1.width < rect2.x ||
        rect1.x > rect2.x + rect2.width ||
        rect1.y + rect1.height < rect2.y ||
        rect1.y > rect2.y + rect2.height
    );
}

// 开始游戏
function startGame() {
    // 隐藏开始和结束界面
    domElements.startScreen.classList.add('hidden');
    domElements.gameOverScreen.classList.add('hidden');
    
    // 重置游戏状态
    gameState.isRunning = true;
    gameState.bullets = [];
    gameState.lastCollisionType = null; // 重置碰撞类型标志
    
    // 创建玩家坦克
    gameState.players = [
        {
            x: 0, y: 0, // 初始值，稍后会通过resetPlayerPosition设置
            width: TANK_SIZE, height: TANK_SIZE,
            angle: 0,
            color: '#3498db',
            bullets: [],
            canShoot: true,
            shootCooldown: 0
        },
        {
            x: 0, y: 0, // 初始值，稍后会通过resetPlayerPosition设置
            width: TANK_SIZE, height: TANK_SIZE,
            angle: 0,
            color: '#e74c3c',
            bullets: [],
            canShoot: true,
            shootCooldown: 0
        }
    ];
    
    // 生成新的随机迷宫
    generateMaze();
    
    // 先设置玩家1的位置
    resetPlayerPosition(gameState.players[0]);
    // 然后设置玩家2的位置，确保不会与玩家1重叠
    resetPlayerPosition(gameState.players[1]);
    
    // 清空所有键盘输入状态，防止游戏开始时坦克意外移动
    gameState.keys = {};
    
    // 确保分数显示正确
    updateScoreDisplay();
    
    // 启动游戏循环
    requestAnimationFrame(gameLoop);
}

// 游戏循环
function gameLoop() {
    if (!gameState.isRunning) return;
    
    // 清空画布
    gameState.ctx.fillStyle = '#7f8c8d';
    gameState.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 更新和绘制玩家
    updatePlayers();
    drawPlayers();
    
    // 更新和绘制子弹
    updateBullets();
    drawBullets();
    
    // 绘制墙壁
    drawWalls();
    
    // 检测碰撞
    checkCollisions();
    
    // 继续游戏循环
    requestAnimationFrame(gameLoop);
}

// 更新玩家状态
function updatePlayers() {
    // 玩家1控制
    const p1 = gameState.players[0];
    
    if (gameState.keys['w']) {
        moveTank(p1, p1.angle);
    }
    if (gameState.keys['s']) {
        moveTank(p1, p1.angle + Math.PI);
    }
    if (gameState.keys['a']) {
        p1.angle -= 0.05;
    }
    if (gameState.keys['d']) {
        p1.angle += 0.05;
    }
    if (gameState.keys[' '] && p1.canShoot && p1.bullets.length < MAX_BULLETS) {
        shootBullet(p1);
    }
    
    // 玩家2控制
    const p2 = gameState.players[1];
    
    if (gameState.keys['i']) {
        moveTank(p2, p2.angle);
    }
    if (gameState.keys['k']) {
        moveTank(p2, p2.angle + Math.PI);
    }
    if (gameState.keys['j']) {
        p2.angle -= 0.05;
    }
    if (gameState.keys['l']) {
        p2.angle += 0.05;
    }
    if (gameState.keys['Enter'] && p2.canShoot && p2.bullets.length < MAX_BULLETS) {
        shootBullet(p2);
    }
    
    // 更新射击冷却
    updateShootCooldown();
}

// 移动坦克
function moveTank(tank, angle) {
    const newX = tank.x + Math.cos(angle) * TANK_SPEED;
    const newY = tank.y + Math.sin(angle) * TANK_SPEED;
    
    // 保存当前位置
    const oldX = tank.x;
    const oldY = tank.y;
    
    // 尝试移动
    tank.x = newX;
    tank.y = newY;
    
    // 检测墙壁碰撞
    if (checkWallCollision(tank)) {
        // 如果碰撞，恢复原来的位置
        tank.x = oldX;
        tank.y = oldY;
    }
    
    // 检测坦克之间的碰撞
    for (const otherTank of gameState.players) {
        if (otherTank !== tank && checkTankCollision(tank, otherTank)) {
            tank.x = oldX;
            tank.y = oldY;
            break;
        }
    }
}

// 发射子弹
function shootBullet(tank) {
    const bulletX = tank.x + Math.cos(tank.angle) * (tank.width / 2 + BULLET_SIZE);
    const bulletY = tank.y + Math.sin(tank.angle) * (tank.height / 2 + BULLET_SIZE);
    
    const bullet = {
        x: bulletX,
        y: bulletY,
        width: BULLET_SIZE,
        height: BULLET_SIZE,
        angle: tank.angle,
        owner: tank
    };
    
    tank.bullets.push(bullet);
    gameState.bullets.push(bullet);
    
    // 设置射击冷却
    tank.canShoot = false;
    tank.shootCooldown = 30; // 约0.5秒（假设60FPS）
}

// 更新射击冷却
function updateShootCooldown() {
    for (const player of gameState.players) {
        if (!player.canShoot) {
            player.shootCooldown--;
            if (player.shootCooldown <= 0) {
                player.canShoot = true;
                player.shootCooldown = 0;
            }
        }
    }
}

// 更新子弹
function updateBullets() {
    // 移除已经离开画布的子弹或达到最大反弹次数的子弹
    gameState.bullets = gameState.bullets.filter(bullet => {
        // 初始化反弹次数
        if (bullet.bounceCount === undefined) {
            bullet.bounceCount = 0;
        }
        
        // 最大反弹次数
        const MAX_BOUNCES = 5;
        
        // 保存原来的位置，用于碰撞后恢复
        const oldX = bullet.x;
        const oldY = bullet.y;
        
        // 更新子弹位置
        bullet.x += Math.cos(bullet.angle) * BULLET_SPEED;
        bullet.y += Math.sin(bullet.angle) * BULLET_SPEED;
        
        // 检查墙壁碰撞实现反弹
        let hasCollided = false;
        for (const wall of gameState.walls) {
            // 检查子弹与当前墙壁的碰撞
            if (
                bullet.x + bullet.width / 2 > wall.x &&
                bullet.x - bullet.width / 2 < wall.x + wall.width &&
                bullet.y + bullet.height / 2 > wall.y &&
                bullet.y - bullet.height / 2 < wall.y + wall.height
            ) {
                hasCollided = true;
                
                // 计算子弹与墙壁的碰撞方向
                // 计算子弹中心点到墙壁各边的距离
                const distToLeft = bullet.x - (wall.x - bullet.width / 2);
                const distToRight = (wall.x + wall.width + bullet.width / 2) - bullet.x;
                const distToTop = bullet.y - (wall.y - bullet.height / 2);
                const distToBottom = (wall.y + wall.height + bullet.height / 2) - bullet.y;
                
                // 找出最小距离的边，即为碰撞边
                const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
                
                // 根据碰撞边计算反弹角度
                if (minDist === distToLeft || minDist === distToRight) {
                    // 左右边碰撞 - 水平反弹
                    bullet.angle = Math.PI - bullet.angle;
                    // 将子弹位置推回墙壁外
                    if (minDist === distToLeft) {
                        bullet.x = wall.x - bullet.width / 2;
                    } else {
                        bullet.x = wall.x + wall.width + bullet.width / 2;
                    }
                } else if (minDist === distToTop || minDist === distToBottom) {
                    // 上下边碰撞 - 垂直反弹
                    bullet.angle = -bullet.angle;
                    // 将子弹位置推回墙壁外
                    if (minDist === distToTop) {
                        bullet.y = wall.y - bullet.height / 2;
                    } else {
                        bullet.y = wall.y + wall.height + bullet.height / 2;
                    }
                }
                
                // 确保角度在0到2π之间
                bullet.angle = ((bullet.angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
                
                // 增加反弹计数
                bullet.bounceCount++;
                
                // 如果超过最大反弹次数，移除子弹
                if (bullet.bounceCount >= MAX_BOUNCES) {
                    if (bullet.owner) {
                        const ownerIndex = bullet.owner.bullets.findIndex(b => b === bullet);
                        if (ownerIndex !== -1) {
                            bullet.owner.bullets.splice(ownerIndex, 1);
                        }
                    }
                    return false;
                }
                
                break; // 避免多次碰撞检测
            }
        }
        
        // 检查是否离开画布
        const isOutOfBounds = (
            bullet.x < 0 || bullet.x > CANVAS_WIDTH ||
            bullet.y < 0 || bullet.y > CANVAS_HEIGHT
        );
        
        // 从拥有者的子弹列表中移除
        if (isOutOfBounds && bullet.owner) {
            const ownerIndex = bullet.owner.bullets.findIndex(b => b === bullet);
            if (ownerIndex !== -1) {
                bullet.owner.bullets.splice(ownerIndex, 1);
            }
        }
        
        return !isOutOfBounds;
    });
}

// 绘制玩家
function drawPlayers() {
    for (const player of gameState.players) {
        gameState.ctx.save();
        
        // 移动到坦克中心并旋转
        gameState.ctx.translate(player.x, player.y);
        gameState.ctx.rotate(player.angle);
        
        // 绘制坦克主体
        gameState.ctx.fillStyle = player.color;
        gameState.ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
        
        // 绘制坦克炮塔
        gameState.ctx.fillStyle = '#34495e';
        gameState.ctx.fillRect(0, -player.width / 4, player.width / 2, player.width / 2);
        
        gameState.ctx.restore();
    }
}

// 绘制子弹
function drawBullets() {
    for (const bullet of gameState.bullets) {
        gameState.ctx.fillStyle = '#f39c12';
        gameState.ctx.beginPath();
        gameState.ctx.arc(bullet.x, bullet.y, bullet.width / 2, 0, Math.PI * 2);
        gameState.ctx.fill();
    }
}

// 绘制墙壁
function drawWalls() {
    gameState.ctx.fillStyle = '#2c3e50';
    for (const wall of gameState.walls) {
        gameState.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    }
}

// 检测墙壁碰撞
function checkWallCollision(obj) {
    for (const wall of gameState.walls) {
        if (
            obj.x + obj.width / 2 > wall.x &&
            obj.x - obj.width / 2 < wall.x + wall.width &&
            obj.y + obj.height / 2 > wall.y &&
            obj.y - obj.height / 2 < wall.y + wall.height
        ) {
            return true;
        }
    }
    return false;
}

// 检测坦克碰撞
function checkTankCollision(tank1, tank2) {
    return (
        tank1.x + tank1.width / 2 > tank2.x - tank2.width / 2 &&
        tank1.x - tank1.width / 2 < tank2.x + tank2.width / 2 &&
        tank1.y + tank1.height / 2 > tank2.y - tank2.height / 2 &&
        tank1.y - tank1.height / 2 < tank2.y + tank2.height / 2
    );
}

// 检测子弹碰撞
function checkCollisions() {
    // 如果游戏已经结束，不再进行碰撞检测
    if (!gameState.isRunning) return;
    
    // 遍历所有子弹
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const bullet = gameState.bullets[i];
        
        // 检查与每个坦克的碰撞
        for (const player of gameState.players) {
            // 简单的矩形碰撞检测
            if (
                bullet.x + bullet.width / 2 > player.x - player.width / 2 &&
                bullet.x - bullet.width / 2 < player.x + player.width / 2 &&
                bullet.y + bullet.height / 2 > player.y - player.height / 2 &&
                bullet.y - bullet.height / 2 < player.y + player.height / 2
            ) {
                // 子弹碰到自己时自己死亡，对方获胜
                // 先移除子弹，避免多次触发碰撞
                if (bullet.owner) {
                    const ownerBulletIndex = bullet.owner.bullets.findIndex(b => b === bullet);
                    if (ownerBulletIndex !== -1) {
                        bullet.owner.bullets.splice(ownerBulletIndex, 1);
                    }
                }
                gameState.bullets.splice(i, 1);
                
                // 确定获胜者：如果子弹击中的是自己，则对方获胜；否则，子弹所有者获胜
                let winnerIndex;
                
                // 设置碰撞类型标志
                if (player === bullet.owner) {
                    // 子弹击中自己，对方获胜
                    winnerIndex = gameState.players.findIndex(p => p !== bullet.owner);
                    gameState.lastCollisionType = 'selfDestruction';
                } else {
                    // 子弹击中对方，子弹所有者获胜
                    winnerIndex = gameState.players.findIndex(p => p === bullet.owner);
                    gameState.lastCollisionType = 'normal';
                }
                
                if (winnerIndex !== -1) {
                    // 更新分数
                    gameState.scores[winnerIndex]++;
                    updateScoreDisplay();
                    
                    // 立即结束游戏
                    endGameWithWinner(winnerIndex);
                    return; // 立即退出函数，结束游戏
                }
            }
        }
    }
}

// 设置获胜者并结束游戏
function endGameWithWinner(winnerIndex) {
    gameState.isRunning = false;
    
    // 显示游戏结束界面
    // 获取失败的玩家索引
    const loserIndex = winnerIndex === 0 ? 1 : 0;
    
    // 判断是否是玩家被自己的子弹击中
    const isSelfDestruction = gameState.lastCollisionType === 'selfDestruction';
    
    if (isSelfDestruction) {
        // 如果是自己击中自己，显示"玩家X击败了自己"
        domElements.winnerText.textContent = `玩家${loserIndex + 1}击败了自己！玩家${winnerIndex + 1}获胜！`;
    } else {
        // 正常情况下显示"玩家X击败了对方"
        domElements.winnerText.textContent = `玩家${winnerIndex + 1}击败了对方！获胜！`;
    }
    
    domElements.gameOverScreen.classList.remove('hidden');
    
    // 清空子弹
    gameState.bullets = [];
    for (const player of gameState.players) {
        player.bullets = [];
    }
    
    // 重置碰撞类型标志
    gameState.lastCollisionType = null;
}

// 生成随机玩家位置
function resetPlayerPosition(player) {
    const isPlayer1 = gameState.players[0] === player;
    const maxRetries = 30; // 增加最大重试次数
    let retryCount = 0;
    let validPosition = false;
    
    // 定义玩家出生区域，确保两个玩家有足够的安全距离
    const player1Area = {
        minX: WALL_THICKNESS + 50,
        maxX: 250,
        minY: WALL_THICKNESS + 50,
        maxY: 250
    };
    
    const player2Area = {
        minX: CANVAS_WIDTH - 250,
        maxX: CANVAS_WIDTH - WALL_THICKNESS - 50,
        minY: CANVAS_HEIGHT - 250,
        maxY: CANVAS_HEIGHT - WALL_THICKNESS - 50
    };
    
    do {
        retryCount++;
        
        if (isPlayer1) {
            // 玩家1在左上角随机区域
            player.x = Math.floor(Math.random() * (player1Area.maxX - player1Area.minX)) + player1Area.minX;
            player.y = Math.floor(Math.random() * (player1Area.maxY - player1Area.minY)) + player1Area.minY;
            player.angle = Math.random() * Math.PI * 2; // 随机角度
        } else {
            // 玩家2在右下角随机区域
            player.x = Math.floor(Math.random() * (player2Area.maxX - player2Area.minX)) + player2Area.minX;
            player.y = Math.floor(Math.random() * (player2Area.maxY - player2Area.minY)) + player2Area.minY;
            player.angle = Math.random() * Math.PI * 2; // 随机角度
        }
        
        // 检查墙壁碰撞
        const wallCollision = checkWallCollision(player);
        
        // 检查坦克之间的碰撞
        let tankCollision = false;
        for (const otherPlayer of gameState.players) {
            if (otherPlayer !== player && checkTankCollision(player, otherPlayer)) {
                tankCollision = true;
                break;
            }
        }
        
        // 位置有效条件：不与墙壁碰撞且不与其他坦克碰撞
        validPosition = !wallCollision && !tankCollision;
        
    } while (retryCount < maxRetries && !validPosition);
    
    // 如果多次尝试后仍然无法找到有效位置，使用默认位置
    if (retryCount >= maxRetries && !validPosition) {
        if (isPlayer1) {
            player.x = 150;
            player.y = 150;
            player.angle = Math.PI / 4; // 朝向中央区域
        } else {
            player.x = 450;
            player.y = 300;
            player.angle = 5 * Math.PI / 4; // 朝向中央区域
        }
    }
}

// 更新分数显示
function updateScoreDisplay() {
    domElements.player1Score.textContent = gameState.scores[0];
    domElements.player2Score.textContent = gameState.scores[1];
}

// 注意：计时功能已删除，游戏现在只会在玩家击中对方时结束

// 当页面加载完成时初始化游戏
window.addEventListener('DOMContentLoaded', initGame);