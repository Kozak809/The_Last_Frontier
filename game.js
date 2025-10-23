// Игровые константы (берем из внешнего файла)
const TILE_SIZE = GAME_CONSTANTS.TILE_SIZE;
const CANVAS_WIDTH = GAME_CONSTANTS.CANVAS_WIDTH;
const CANVAS_HEIGHT = GAME_CONSTANTS.CANVAS_HEIGHT;
const GRID_WIDTH = Math.floor(CANVAS_WIDTH / TILE_SIZE);
const GRID_HEIGHT = Math.floor(CANVAS_HEIGHT / TILE_SIZE);

// Глобальные переменные игры
let canvas, ctx;
let currentLevel = 1;
let gameState = {
    coins: 100,
    lives: 20,
    currentWave: 1,
    maxWaves: 20,
    enemies: [],
    towers: [],
    projectiles: [],
    particles: [], // Частицы для анимации взрывов
    waveInProgress: false,
    levelCompleted: false,
    paused: false,
    gameGrid: [],
    // Поддержка нескольких порталов спавна
    // Для совместимости с существующим кодом используем индивидуальные пути у врагов
    spawnPoints: [],
    paths: [],
    basePoint: null,
    selectedTile: null,
    showTowerMenu: false,
    towerMenuX: 0,
    towerMenuY: 0,
    hoveredTower: null,
    // Меню действий над башней
    showTowerActionMenu: false,
    towerActionX: 0,
    towerActionY: 0,
    selectedTower: null,
    // ID таймеров текущей волны (чтобы очищать при выходе/перезапуске)
    spawnTimeoutId: null,
    waveEndIntervalId: null,
    // Показан ли результат уровня, чтобы не дублировать
    resultShown: false,
    // Эффект тряски экрана
    screenShake: { intensity: 0, duration: 0, time: 0 }
};

// Все данные теперь загружаются из gameData.js

// Очистить таймеры волны, чтобы избежать автозапуска при возврате в уровень
function clearWaveTimers() {
    if (gameState.spawnTimeoutId) {
        clearTimeout(gameState.spawnTimeoutId);
        gameState.spawnTimeoutId = null;
    }
    if (gameState.waveEndIntervalId) {
        clearInterval(gameState.waveEndIntervalId);
        gameState.waveEndIntervalId = null;
    }
}

// Подсчет звезд по остаткам жизней (динамически от максимума)
function computeStars(remainingLives) {
    const maxLives = GAME_CONSTANTS.STARTING_LIVES;
    const ratio = Math.max(0, Math.min(1, remainingLives / maxLives));
    if (remainingLives <= 0) return 0;
    if (ratio >= 0.75) return 3;
    if (ratio >= 0.5) return 2;
    return 1;
}

// Показ результата: победа/поражение, звезды и возврат в меню
function showResult(isWin) {
    if (gameState.resultShown) return;
    gameState.resultShown = true;
    // Остановить процессы волны и пауза
    clearWaveTimers();
    gameState.waveInProgress = false;
    gameState.levelCompleted = isWin;
    setPaused(true);

    const overlay = document.getElementById('resultOverlay');
    const titleEl = document.getElementById('resultTitle');
    const starsEl = document.getElementById('resultStars');
    if (overlay && titleEl && starsEl) {
        titleEl.textContent = isWin ? 'Победа!' : 'Игра окончена';
        const stars = isWin ? computeStars(gameState.lives) : 0;
        const total = 3;
        let html = '';
        for (let i = 0; i < total; i++) {
            const filled = i < stars ? 'filled' : '';
            html += `<span class="star ${filled}">★</span>`;
        }
        starsEl.innerHTML = html;
        overlay.classList.remove('hidden');
    }

    // Мгновенный возврат в главное меню
    showMenu();
}

// Инициализация игры
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Добавить обработчики событий
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    // Пауза при потере фокуса или скрытии вкладки
    window.addEventListener('blur', () => setPaused(true));
    window.addEventListener('focus', () => setPaused(false));
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) setPaused(true); else setPaused(false);
    });
    // Кнопка подтверждения результата
    const okBtn = document.getElementById('resultOkBtn');
    if (okBtn) {
        okBtn.onclick = () => {
            document.getElementById('resultOverlay').classList.add('hidden');
        };
    }
    
    // Создать карту уровней
    createLevelPath();
    
    // Запуск игрового цикла
    gameLoop();
}

// Включить/выключить паузу
function setPaused(value) {
    gameState.paused = !!value;
}

// Обработка нажатий клавиатуры (Пробел — следующая волна)
function handleKeyDown(event) {
    // Игнорировать, если фокус на input/textarea
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if ((event.code === 'Space' || event.key === ' ') && !gameState.paused) {
        event.preventDefault();
        startNextWave();
    }
}

// Создать карту уровней с путем
function createLevelPath() {
    const pathContainer = document.getElementById('levelPath');
    pathContainer.innerHTML = ''; // Очистить контейнер
    
    // Получить все доступные уровни
    const availableLevels = Object.keys(LEVELS).map(key => parseInt(key)).sort((a, b) => a - b);
    
    // Координаты для размещения уровней по пути
    const pathPoints = [
        { x: 50, y: 50 },    // Уровень 1
        { x: 200, y: 80 },   // Уровень 2
        { x: 350, y: 120 },  // Уровень 3
        { x: 480, y: 180 },  // Уровень 4
        { x: 450, y: 280 },  // Уровень 5
        { x: 300, y: 320 },  // Уровень 6
        { x: 150, y: 300 },  // Уровень 7
        { x: 80, y: 200 }    // Уровень 8
    ];
    
    // Создать линии пути между уровнями
    for (let i = 0; i < availableLevels.length - 1; i++) {
        const currentPoint = pathPoints[i];
        const nextPoint = pathPoints[i + 1];
        
        if (currentPoint && nextPoint) {
            const line = document.createElement('div');
            line.className = 'path-line';
            
            // Вычислить позицию и размер линии
            const deltaX = nextPoint.x - currentPoint.x;
            const deltaY = nextPoint.y - currentPoint.y;
            const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
            
            line.style.left = (currentPoint.x + 30) + 'px'; // +30 для центрирования относительно узла
            line.style.top = (currentPoint.y + 30) + 'px';
            line.style.width = length + 'px';
            line.style.height = '4px';
            line.style.transformOrigin = '0 50%';
            line.style.transform = `rotate(${angle}deg)`;
            
            pathContainer.appendChild(line);
        }
    }
    
    // Создать узлы уровней
    availableLevels.forEach((levelNum, index) => {
        const point = pathPoints[index];
        if (!point) return;
        
        const levelNode = document.createElement('div');
        levelNode.className = 'level-node available'; // Пока все уровни доступны
        levelNode.style.left = point.x + 'px';
        levelNode.style.top = point.y + 'px';
        levelNode.textContent = levelNum;
        
        // Добавить информацию об уровне
        const levelInfo = document.createElement('div');
        levelInfo.className = 'level-info';
        const levelData = LEVELS[levelNum];
        levelInfo.textContent = levelData ? levelData.name : `Уровень ${levelNum}`;
        levelNode.appendChild(levelInfo);
        
        // Добавить индикатор сложности (красный череп с рейтингом)
        if (levelData && levelData.difficulty > 1.0) {
            const difficultyRating = getDifficultyRating(levelData.difficulty);
            
            const difficultyContainer = document.createElement('div');
            difficultyContainer.style.position = 'absolute';
            difficultyContainer.style.top = '-8px';
            difficultyContainer.style.right = '-8px';
            difficultyContainer.style.display = 'flex';
            difficultyContainer.style.alignItems = 'center';
            difficultyContainer.style.gap = '2px';
            
            const difficultyIcon = document.createElement('div');
            difficultyIcon.innerHTML = '💀';
            difficultyIcon.style.fontSize = '16px';
            difficultyIcon.style.filter = 'hue-rotate(0deg) saturate(2)';
            
            const difficultyText = document.createElement('div');
            difficultyText.textContent = difficultyRating;
            difficultyText.style.fontSize = '12px';
            difficultyText.style.fontWeight = 'bold';
            difficultyText.style.color = '#ff4444';
            difficultyText.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)';
            
            difficultyContainer.appendChild(difficultyIcon);
            difficultyContainer.appendChild(difficultyText);
            difficultyContainer.title = `Сложность: ${difficultyRating}/5 (x${levelData.difficulty} HP)`;
            
            levelNode.appendChild(difficultyContainer);
        }
        
        // Добавить обработчик клика
        levelNode.addEventListener('click', () => {
            if (levelNode.classList.contains('available')) {
                startLevel(levelNum);
            }
        });
        
        pathContainer.appendChild(levelNode);
    });
}

// Показать меню
function showMenu() {
    document.getElementById('menu').classList.remove('hidden');
    document.getElementById('game').classList.add('hidden');
    
    // Пересоздать карту уровней при возврате в меню
    clearWaveTimers();
    createLevelPath();
}

// Начать уровень
function startLevel(levelNum) {
    currentLevel = levelNum;
    initializeLevel(levelNum);
    
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('game').classList.remove('hidden');
    
    updateUI();
}

// Инициализация уровня
function initializeLevel(levelNum) {
    const level = LEVELS[levelNum];
    gameState.gameGrid = level.grid.map(row => [...row]);
    gameState.coins = GAME_CONSTANTS.STARTING_COINS;
    gameState.lives = GAME_CONSTANTS.STARTING_LIVES;
    gameState.currentWave = 1;
    gameState.maxWaves = (WAVE_DATA[levelNum] && WAVE_DATA[levelNum].length) ? WAVE_DATA[levelNum].length : 0;
    gameState.enemies = [];
    gameState.towers = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.waveInProgress = false;
    gameState.levelCompleted = false;
    gameState.resultShown = false;
    gameState.showTowerMenu = false;
    gameState.hoveredTower = null;
    clearWaveTimers();
    
    // Найти точки спавна и базы
    findSpecialPoints();
    
    // Построить путь
    generatePath();
}

// Найти точки спавна (все) и базу (одну)
function findSpecialPoints() {
    gameState.spawnPoints = [];
    gameState.basePoint = null;
    for (let y = 0; y < gameState.gameGrid.length; y++) {
        for (let x = 0; x < gameState.gameGrid[y].length; x++) {
            const tile = gameState.gameGrid[y][x];
            if (tile === TILE_TYPES.SPAWN) {
                gameState.spawnPoints.push({ x, y });
            } else if (tile === TILE_TYPES.BASE) {
                gameState.basePoint = { x, y };
            }
        }
    }
}

// Отрисовать меню действий башни (улучшить / продать)
function drawTowerActionMenu() {
    if (!gameState.selectedTower) return;

    const menuWidth = 220;
    const menuHeight = 170;
    const menuX = Math.min(gameState.towerActionX, CANVAS_WIDTH - menuWidth);
    const menuY = Math.min(gameState.towerActionY, CANVAS_HEIGHT - menuHeight);

    // Фон меню
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

    // Рамка
    ctx.strokeStyle = '#4a90e2';
    ctx.lineWidth = 2;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

    // Заголовок
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    const t = gameState.selectedTower;
    ctx.fillText(`${TOWER_TYPES[t.type].name} — ур. ${t.level}`, menuX + 10, menuY + 20);

    // Информация — по строкам: текущие и (если можно) новые значения
    ctx.font = '12px Arial';
    ctx.fillStyle = '#ddd';
    const canUpgradeLvl = t.level < 10;
    const nextDamage = Math.round(t.damage * 1.25);
    const nextRange = Math.round(t.range * 1.1);
    const nextFireRate = Math.max(100, Math.round(t.fireRate * 0.9));
    const nextProjSpeed = Math.round((t.projectileSpeed || 5) * 1.1);

    const lineX = menuX + 10;
    let lineY = menuY + 36;
    const lineStep = 16;

    const fmt = (label, cur, next) => canUpgradeLvl ? `${label}: ${cur} → ${next}` : `${label}: ${cur}`;
    ctx.fillText(fmt('Урон', t.damage, nextDamage), lineX, lineY);
    lineY += lineStep;
    ctx.fillText(fmt('Дист', t.range, nextRange), lineX, lineY);
    lineY += lineStep;
    ctx.fillText(fmt('Скорострельность (мс)', t.fireRate, nextFireRate), lineX, lineY);
    lineY += lineStep;
    ctx.fillText(fmt('Скорость снаряда', t.projectileSpeed, nextProjSpeed), lineX, lineY);

    // Кнопка улучшения
    const upgradeCost = canUpgradeLvl ? getUpgradeCost(t) : null;
    const canUpgrade = upgradeCost !== null && gameState.coins >= upgradeCost;
    const upgradeBtnY = menuY + 100;
    ctx.fillStyle = canUpgrade ? 'rgba(74, 144, 226, 0.3)' : 'rgba(100, 100, 100, 0.3)';
    ctx.fillRect(menuX + 10, upgradeBtnY, menuWidth - 20, 30);
    ctx.strokeStyle = canUpgrade ? '#4a90e2' : '#666';
    ctx.lineWidth = 1;
    ctx.strokeRect(menuX + 10, upgradeBtnY, menuWidth - 20, 30);
    ctx.fillStyle = canUpgrade ? 'white' : '#999';
    ctx.fillText(
        canUpgradeLvl ? `Улучшить (${upgradeCost})` : 'Макс. уровень',
        menuX + 15,
        upgradeBtnY + 20
    );

    // Кнопка продажи
    const refund = getSellRefund(t);
    const isFullRefundAvailable = isFullRefund(t);
    const sellBtnY = menuY + 135;
    
    // Цвет кнопки зависит от того, полный ли возврат
    const buttonColor = isFullRefundAvailable ? 'rgba(34, 197, 94, 0.3)' : 'rgba(226, 74, 74, 0.3)';
    const borderColor = isFullRefundAvailable ? '#22c55e' : '#e24a4a';
    
    ctx.fillStyle = buttonColor;
    ctx.fillRect(menuX + 10, sellBtnY, menuWidth - 20, 30);
    ctx.strokeStyle = borderColor;
    ctx.strokeRect(menuX + 10, sellBtnY, menuWidth - 20, 30);
    ctx.fillStyle = 'white';
    
    const sellText = isFullRefundAvailable ? `Продать (+${refund})` : `Продать (+${refund})`;
    ctx.fillText(
        sellText,
        menuX + 15,
        sellBtnY + 20
    );
}

// Построить пути от каждого спавна до базы
function generatePath() {
    // Поддерживаем старое имя функции, но формируем paths для всех спавнов
    gameState.paths = [];
    const directions = [
        { x: 1, y: 0 },  // право
        { x: -1, y: 0 }, // лево
        { x: 0, y: 1 },  // вниз
        { x: 0, y: -1 }  // вверх
    ];
    
    for (const sp of gameState.spawnPoints) {
        const path = [];
        let current = { ...sp };
        path.push({ ...current });
        while (current.x !== gameState.basePoint.x || current.y !== gameState.basePoint.y) {
            let found = false;
            for (let dir of directions) {
                const next = { x: current.x + dir.x, y: current.y + dir.y };
                if (
                    next.x >= 0 && next.x < GRID_WIDTH &&
                    next.y >= 0 && next.y < GRID_HEIGHT &&
                    (gameState.gameGrid[next.y][next.x] === TILE_TYPES.ROAD ||
                     gameState.gameGrid[next.y][next.x] === TILE_TYPES.BASE) &&
                    !path.some(p => p.x === next.x && p.y === next.y)
                ) {
                    path.push(next);
                    current = next;
                    found = true;
                    break;
                }
            }
            if (!found) break;
        }
        gameState.paths.push(path);
    }
}

// Начать следующую волну
function startNextWave() {
    if (gameState.paused || gameState.levelCompleted || gameState.waveInProgress || gameState.currentWave > gameState.maxWaves) return;
    
    gameState.waveInProgress = true;
    const waveData = WAVE_DATA[currentLevel][gameState.currentWave - 1];
    
    let enemyIndex = 0;
    let spawnCycleIndex = 0; // чередование порталов
    // Перед стартом волны гарантированно очистить любые старые таймеры
    clearWaveTimers();
    // Рекурсивный таймер с учетом текущего множителя скорости
    const scheduleNextSpawn = () => {
        if (gameState.paused) {
            // Подождать и попробовать снова, чтобы не терять спавны
            gameState.spawnTimeoutId = setTimeout(scheduleNextSpawn, 100);
            return;
        }
        if (enemyIndex >= getTotalEnemiesInWave(waveData)) {
            return;
        }
        const enemyType = getEnemyTypeForIndex(waveData, enemyIndex);
        const spCount = Math.max(1, gameState.spawnPoints.length);
        const spawnIdx = spawnCycleIndex % spCount;
        spawnEnemy(enemyType, spawnIdx);
        spawnCycleIndex++;
        enemyIndex++;
        gameState.spawnTimeoutId = setTimeout(
            scheduleNextSpawn,
            Math.max(10, GAME_CONSTANTS.ENEMY_SPAWN_INTERVAL / (gameState.speedMultiplier || 1))
        );
    };
    scheduleNextSpawn();
    
    // Проверка окончания волны
    const checkWaveEnd = setInterval(() => {
        // Волна завершена, когда все враги заспавнены и на поле никого нет
        if (enemyIndex >= getTotalEnemiesInWave(waveData) && gameState.enemies.length === 0) {
            clearInterval(checkWaveEnd);
            gameState.waveEndIntervalId = null;
            gameState.waveInProgress = false;
            // Если это была последняя волна — завершить уровень
            if (gameState.currentWave >= gameState.maxWaves) {
                gameState.currentWave = gameState.maxWaves; // не превышать максимум
                showResult(true);
            } else {
                gameState.currentWave++;
            }
            updateUI();
        }
    }, 100);
    gameState.waveEndIntervalId = checkWaveEnd;
}

// Очистить таймеры волны
function clearWaveTimers() {
    if (gameState.spawnTimeoutId) {
        clearTimeout(gameState.spawnTimeoutId);
        gameState.spawnTimeoutId = null;
    }
    if (gameState.waveEndIntervalId) {
        clearInterval(gameState.waveEndIntervalId);
        gameState.waveEndIntervalId = null;
    }
}

// Получить общее количество врагов в волне
function getTotalEnemiesInWave(waveData) {
    return waveData.enemies.reduce((total, group) => total + group.count, 0);
}

// Получить тип врага для индекса
function getEnemyTypeForIndex(waveData, index) {
    let currentIndex = 0;
    for (let group of waveData.enemies) {
        if (index < currentIndex + group.count) {
            return group.type;
        }
        currentIndex += group.count;
    }
    return 'CIRCLE';
}

// Создать врага
function spawnEnemy(type, spawnIdx = 0) {
    const enemyData = ENEMY_TYPES[type];
    // Безопасность индекса
    if (!gameState.spawnPoints || gameState.spawnPoints.length === 0) {
        // Фолбек: если нет точек спавна, не спавним
        return;
    }
    const idx = Math.min(spawnIdx, gameState.spawnPoints.length - 1);
    const sp = gameState.spawnPoints[idx];
    const path = gameState.paths && gameState.paths[idx] ? gameState.paths[idx] : [];
    
    // Применить множитель сложности к здоровью
    const level = LEVELS[currentLevel];
    const difficultyMultiplier = level ? level.difficulty : 1.0;
    const adjustedHealth = Math.round(enemyData.health * difficultyMultiplier);
    
    const enemy = {
        type: type,
        health: adjustedHealth,
        maxHealth: adjustedHealth,
        speed: enemyData.speed,
        reward: enemyData.reward,
        color: enemyData.color,
        shape: enemyData.shape,
        x: sp.x * TILE_SIZE + TILE_SIZE / 2,
        y: sp.y * TILE_SIZE + TILE_SIZE / 2,
        path: path,
        pathIndex: 0,
        progress: 0
    };
    
    gameState.enemies.push(enemy);
}

// Обновить врагов
function updateEnemies() {
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];
        
        // Движение по пути
        const path = enemy.path || [];
        if (enemy.pathIndex < path.length - 1) {
            const currentPoint = path[enemy.pathIndex];
            const nextPoint = path[enemy.pathIndex + 1];
            
            const targetX = nextPoint.x * TILE_SIZE + TILE_SIZE / 2;
            const targetY = nextPoint.y * TILE_SIZE + TILE_SIZE / 2;
            
            const dx = targetX - enemy.x;
            const dy = targetY - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const step = enemy.speed * (gameState.speedMultiplier || 1);
            if (distance < step) {
                enemy.x = targetX;
                enemy.y = targetY;
                enemy.pathIndex++;
            } else {
                enemy.x += (dx / distance) * step;
                enemy.y += (dy / distance) * step;
            }
        } else {
            // Враг достиг базы
            gameState.lives--;
            gameState.enemies.splice(i, 1);
            updateUI();
            
            if (gameState.lives <= 0) {
                showResult(false);
            }
        }
        
        // Проверить, был ли враг убит
        if (enemy.health <= 0) {
            // Создать эффект взрыва
            createExplosionEffect(enemy.x, enemy.y, enemy.color, enemy.shape);
            // Добавить тряску экрана
            addScreenShake(3, 200);
            
            gameState.coins += enemy.reward;
            gameState.enemies.splice(i, 1);
            updateUI();
        }
    }
}

// ============================================
// СИСТЕМА ЧАСТИЦ И ЭФФЕКТОВ
// ============================================

// Создать эффект взрыва при уничтожении врага
function createExplosionEffect(x, y, enemyColor, enemyShape) {
    const particleCount = 8 + Math.random() * 8; // 8-16 частиц
    
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
        const speed = 2 + Math.random() * 4;
        const size = 2 + Math.random() * 4;
        const lifetime = 300 + Math.random() * 200; // 300-500мс
        
        // Цвета частиц зависят от типа врага
        let particleColors = [enemyColor];
        if (enemyShape === 'circle') {
            particleColors = ['#00ff00', '#88ff88', '#ffffff'];
        } else if (enemyShape === 'triangle') {
            particleColors = ['#ffff00', '#ffaa00', '#ffffff'];
        } else if (enemyShape === 'square') {
            particleColors = ['#ff0000', '#ff6666', '#ffffff'];
        }
        
        const particle = {
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: size,
            maxSize: size,
            color: particleColors[Math.floor(Math.random() * particleColors.length)],
            lifetime: lifetime,
            maxLifetime: lifetime,
            gravity: 0.1,
            fade: true
        };
        
        gameState.particles.push(particle);
    }
    
    // Добавить центральную вспышку
    const flashParticle = {
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        size: 20,
        maxSize: 20,
        color: '#ffffff',
        lifetime: 100,
        maxLifetime: 100,
        gravity: 0,
        fade: true,
        flash: true
    };
    
    gameState.particles.push(flashParticle);
}

// Добавить тряску экрана
function addScreenShake(intensity, duration) {
    gameState.screenShake.intensity = intensity;
    gameState.screenShake.duration = duration;
    gameState.screenShake.time = 0;
}

// Обновить частицы
function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const particle = gameState.particles[i];
        
        // Обновить позицию
        particle.x += particle.vx * (gameState.speedMultiplier || 1);
        particle.y += particle.vy * (gameState.speedMultiplier || 1);
        
        // Применить гравитацию
        particle.vy += particle.gravity * (gameState.speedMultiplier || 1);
        
        // Уменьшить время жизни
        particle.lifetime -= 16 * (gameState.speedMultiplier || 1); // ~16мс на кадр
        
        // Эффект затухания
        if (particle.fade) {
            const lifeRatio = particle.lifetime / particle.maxLifetime;
            particle.size = particle.maxSize * lifeRatio;
        }
        
        // Удалить мертвые частицы
        if (particle.lifetime <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}

// Обновить тряску экрана
function updateScreenShake() {
    if (gameState.screenShake.duration > 0) {
        gameState.screenShake.time += 16 * (gameState.speedMultiplier || 1);
        if (gameState.screenShake.time >= gameState.screenShake.duration) {
            gameState.screenShake.intensity = 0;
            gameState.screenShake.duration = 0;
            gameState.screenShake.time = 0;
        }
    }
}

// Отрисовать частицы
function drawParticles() {
    ctx.save();
    
    for (let particle of gameState.particles) {
        const lifeRatio = particle.lifetime / particle.maxLifetime;
        
        ctx.globalAlpha = particle.flash ? 1 : lifeRatio;
        ctx.fillStyle = particle.color;
        
        if (particle.flash) {
            // Эффект вспышки
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            // Обычные частицы
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    ctx.restore();
}

// Обработка клика по канвасу
function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    
    // Проверить, кликнули ли на меню башен
    if (gameState.showTowerMenu) {
        const menuClicked = checkTowerMenuClick(x, y);
        if (!menuClicked) {
            gameState.showTowerMenu = false;
        }
        return;
    }
    // Проверить, кликнули ли по меню действий башни
    if (gameState.showTowerActionMenu) {
        const actionClicked = checkTowerActionMenuClick(x, y);
        if (!actionClicked) {
            gameState.showTowerActionMenu = false;
            gameState.selectedTower = null;
        }
        return;
    }
    
    // Проверить, можно ли разместить башню на этой плитке
    if (tileX >= 0 && tileX < GRID_WIDTH && tileY >= 0 && tileY < GRID_HEIGHT) {
        const tileType = gameState.gameGrid[tileY][tileX];
        
        // Проверить, есть ли уже башня на этой плитке
        const existingTower = gameState.towers.find(tower => 
            tower.gridX === tileX && tower.gridY === tileY
        );
        
        if (existingTower) {
            // Показать меню действий башни (улучшить/продать)
            gameState.selectedTower = existingTower;
            gameState.showTowerActionMenu = true;
            gameState.towerActionX = x;
            gameState.towerActionY = y;
        } else if (tileType === TILE_TYPES.EMPTY && !existingTower) {
            // Показать меню выбора башни
            gameState.selectedTile = { x: tileX, y: tileY };
            gameState.showTowerMenu = true;
            gameState.towerMenuX = x;
            gameState.towerMenuY = y;
        }
    }
}

// Обработка движения мыши — определение наведенной башни
function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Радиус хитбокса соответствует визуальному радиусу башни (15)
    const towerVisualRadius = 15;
    let hovered = null;

    for (let tower of gameState.towers) {
        const dx = x - tower.x;
        const dy = y - tower.y;
        if (Math.sqrt(dx * dx + dy * dy) <= towerVisualRadius) {
            hovered = tower;
            break;
        }
    }

    gameState.hoveredTower = hovered;
}

// Проверить клик по меню башен
function checkTowerMenuClick(x, y) {
    const menuWidth = 200;
    const menuHeight = 120;
    const menuX = Math.min(gameState.towerMenuX, CANVAS_WIDTH - menuWidth);
    const menuY = Math.min(gameState.towerMenuY, CANVAS_HEIGHT - menuHeight);
    
    if (x >= menuX && x <= menuX + menuWidth && y >= menuY && y <= menuY + menuHeight) {
        // Параметры кнопок должны совпадать с drawTowerMenu()
        const buttonHeight = 25;
        const verticalGap = 5;
        const firstButtonTop = menuY + 30; // смещение как при отрисовке
        const leftPadding = menuX + 10;
        const rightPadding = menuX + menuWidth - 10;

        // Проверяем, попали ли по горизонтали в область кнопок
        const withinX = x >= leftPadding && x <= rightPadding;

        if (withinX && y >= firstButtonTop) {
            const towerTypes = Object.keys(TOWER_TYPES);
            const totalButtonsHeight = towerTypes.length * buttonHeight + (towerTypes.length - 1) * verticalGap;
            const lastButtonBottom = firstButtonTop + totalButtonsHeight;

            if (y <= lastButtonBottom) {
                const buttonIndex = Math.floor((y - firstButtonTop) / (buttonHeight + verticalGap));
                if (buttonIndex >= 0 && buttonIndex < towerTypes.length) {
                    const towerType = towerTypes[buttonIndex];
                    placeTower(towerType);
                }
            }
        }
        
        gameState.showTowerMenu = false;
        return true;
    }
    
    return false;
}

// Проверить клик по меню действий башни (улучшение/продажа)
function checkTowerActionMenuClick(x, y) {
    const menuWidth = 220;
    const menuHeight = 170;
    const menuX = Math.min(gameState.towerActionX, CANVAS_WIDTH - menuWidth);
    const menuY = Math.min(gameState.towerActionY, CANVAS_HEIGHT - menuHeight);

    if (x >= menuX && x <= menuX + menuWidth && y >= menuY && y <= menuY + menuHeight) {
        // Кнопки расположены вертикально: Upgrade, Sell
        const buttonHeight = 30;
        const upgradeBtnY = menuY + 100;
        const sellBtnY = menuY + 135;

        const withinUpgrade = y >= upgradeBtnY && y <= upgradeBtnY + buttonHeight;
        const withinSell = y >= sellBtnY && y <= sellBtnY + buttonHeight;
        const withinX = x >= menuX + 10 && x <= menuX + menuWidth - 10;

        if (withinX && withinUpgrade) {
            if (gameState.selectedTower) upgradeTower(gameState.selectedTower);
            gameState.showTowerActionMenu = false;
            gameState.selectedTower = null;
            return true;
        }
        if (withinX && withinSell) {
            if (gameState.selectedTower) sellTower(gameState.selectedTower);
            gameState.showTowerActionMenu = false;
            gameState.selectedTower = null;
            return true;
        }
        return true;
    }
    return false;
}

// Разместить башню
function placeTower(towerType) {
    const towerData = TOWER_TYPES[towerType];
    
    if (gameState.coins >= towerData.cost) {
        const tower = {
            type: towerType,
            gridX: gameState.selectedTile.x,
            gridY: gameState.selectedTile.y,
            x: gameState.selectedTile.x * TILE_SIZE + TILE_SIZE / 2,
            y: gameState.selectedTile.y * TILE_SIZE + TILE_SIZE / 2,
            damage: towerData.damage,
            range: towerData.range,
            fireRate: towerData.fireRate,
            lastFired: 0,
            color: towerData.color,
            projectileColor: towerData.projectileColor,
            projectileSpeed: towerData.projectileSpeed || 5,
            target: null,
            level: 1,
            spentCoins: towerData.cost,
            shotsFired: 0 // Счетчик выстрелов
        };
        
        gameState.towers.push(tower);
        gameState.coins -= towerData.cost;
        updateUI();
    }
}

// Подсчет стоимости улучшения башни
function getUpgradeCost(tower) {
    const baseCost = TOWER_TYPES[tower.type].cost;
    // Стоимость растет линейно: 75% базы * текущий уровень
    return Math.round(baseCost * 0.75 * tower.level);
}

// Подсчет возврата при продаже
function getSellRefund(tower) {
    // Если башня не сделала ни одного выстрела - возврат полной стоимости
    if (tower.shotsFired === 0) {
        return tower.spentCoins;
    }
    // Иначе 50% от вложенных средств
    return Math.floor(tower.spentCoins * 0.5);
}

// Проверить, можно ли получить полный возврат за башню
function isFullRefund(tower) {
    return tower.shotsFired === 0;
}

// Получить рейтинг сложности от 1 до 5 на основе множителя HP
function getDifficultyRating(difficultyMultiplier) {
    if (difficultyMultiplier <= 1.0) return 1;
    if (difficultyMultiplier <= 1.05) return 1;
    if (difficultyMultiplier <= 1.1) return 2;
    if (difficultyMultiplier <= 1.15) return 3;
    if (difficultyMultiplier <= 1.2) return 4;
    return 5; // 1.25 и выше
}

// Улучшить башню
function upgradeTower(tower) {
    const cost = getUpgradeCost(tower);
    const maxLevel = 10;
    if (tower.level >= maxLevel) return; // достигнут максимум
    if (gameState.coins < cost) return;   // не хватает монет

    // Списать монеты и увеличить вложения
    gameState.coins -= cost;
    tower.spentCoins += cost;

    tower.level += 1;
    tower.damage = Math.round(tower.damage * 1.25);
    tower.range = Math.round(tower.range * 1.1);
    tower.fireRate = Math.max(100, Math.round(tower.fireRate * 0.9));
    tower.projectileSpeed = Math.round((tower.projectileSpeed || 5) * 1.1);

    updateUI();
}

// Продать башню
function sellTower(tower) {
    const refund = getSellRefund(tower);
    gameState.coins += refund;
    // Удалить башню с поля
    const idx = gameState.towers.indexOf(tower);
    if (idx !== -1) {
        gameState.towers.splice(idx, 1);
    }
    updateUI();
}

// Обновить башни
function updateTowers() {
    const currentTime = Date.now();
    
    for (let tower of gameState.towers) {
        // Найти ближайшего врага в радиусе
        let closestEnemy = null;
        let closestDistance = tower.range;
        
        for (let enemy of gameState.enemies) {
            const distance = Math.sqrt(
                Math.pow(enemy.x - tower.x, 2) + Math.pow(enemy.y - tower.y, 2)
            );
            
            if (distance <= closestDistance) {
                closestEnemy = enemy;
                closestDistance = distance;
            }
        }
        
        tower.target = closestEnemy;
        
        // Стрелять, если есть цель и прошло достаточно времени
        const fireInterval = Math.max(50, tower.fireRate / (gameState.speedMultiplier || 1));
        if (tower.target && currentTime - tower.lastFired >= fireInterval) {
            fireProjectile(tower, tower.target);
            tower.lastFired = currentTime;
            tower.shotsFired++; // Увеличить счетчик выстрелов
        }
    }
}

// Выстрелить снарядом
function fireProjectile(tower, target) {
    const projectile = {
        x: tower.x,
        y: tower.y,
        targetX: target.x,
        targetY: target.y,
        target: target,
        damage: tower.damage,
        speed: tower.projectileSpeed || 5,
        color: tower.projectileColor
    };
    
    gameState.projectiles.push(projectile);
}

// Обновить снаряды
function updateProjectiles() {
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const projectile = gameState.projectiles[i];
        
        // Движение к цели
        const dx = projectile.targetX - projectile.x;
        const dy = projectile.targetY - projectile.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const step = projectile.speed * (gameState.speedMultiplier || 1);
        if (distance < step) {
            // Попадание
            if (projectile.target && gameState.enemies.includes(projectile.target)) {
                projectile.target.health -= projectile.damage;
            }
            gameState.projectiles.splice(i, 1);
        } else {
            // Движение
            projectile.x += (dx / distance) * step;
            projectile.y += (dy / distance) * step;
            
            // Обновить целевую позицию, если цель движется
            if (projectile.target && gameState.enemies.includes(projectile.target)) {
                projectile.targetX = projectile.target.x;
                projectile.targetY = projectile.target.y;
            }
        }
    }
}

// Утилита: скругленный прямоугольник
function drawRoundedRect(ctx, x, y, w, h, r) {
    const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// Отрисовка игры
function render() {
    // Применить тряску экрана
    ctx.save();
    if (gameState.screenShake.intensity > 0) {
        const shakeX = (Math.random() - 0.5) * gameState.screenShake.intensity * 2;
        const shakeY = (Math.random() - 0.5) * gameState.screenShake.intensity * 2;
        ctx.translate(shakeX, shakeY);
    }
    
    // Очистить канвас
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Отрисовать сетку
    drawGrid();
    
    // Отрисовать башни
    drawTowers();
    
    // Отрисовать снаряды
    drawProjectiles();
    
    // Отрисовать врагов
    drawEnemies();
    
    // Отрисовать частицы (поверх всего остального)
    drawParticles();

    // HUD: Монеты + Волна + Жизни (в ряд, слева направо) — стилизовано
    ctx.save();
    ctx.font = 'bold 14px Arial';
    ctx.textBaseline = 'top';
    const padX = 10, padY = 6, boxH = 24, gap = 16, radius = 6;
    let hudX = 8, hudY = 8;

    const drawHUDBox = (labelText) => {
        const w = ctx.measureText(labelText).width;
        // Тень
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        // Фон
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        drawRoundedRect(ctx, hudX, hudY, w + padX * 2, boxH, radius);
        ctx.fill();
        // Обводка
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = 'rgba(74,144,226,0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Текст
        ctx.fillStyle = 'white';
        ctx.fillText(labelText, hudX + padX, hudY + (boxH - 14) / 2);
        // Сдвиг вправо
        hudX += w + padX * 2 + gap;
    };

    // Монеты
    drawHUDBox(`Монеты: ${gameState.coins}`);
    // Волна
    const shownWave = Math.min(gameState.currentWave, gameState.maxWaves || 0);
    drawHUDBox(`Волна: ${shownWave} / ${gameState.maxWaves}`);
    // Жизни
    drawHUDBox(`Жизни: ${gameState.lives}`);
    ctx.restore();
    
    // Отрисовать меню башен
    if (gameState.showTowerMenu) {
        drawTowerMenu();
    }
    // Отрисовать меню действий башни
    if (gameState.showTowerActionMenu) {
        drawTowerActionMenu();
    }

    // Пауза — затемнение и текст
    if (gameState.paused) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Пауза', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.textAlign = 'start';
    }

    // Завершение уровня — затемнение и текст
    // Победный/проигрышный экран теперь реализован как HTML-оверлей
    
    // Восстановить трансформацию после тряски экрана
    ctx.restore();
}

// Отрисовать сетку
function drawGrid() {
    for (let y = 0; y < gameState.gameGrid.length; y++) {
        for (let x = 0; x < gameState.gameGrid[y].length; x++) {
            const tileType = gameState.gameGrid[y][x];
            const posX = x * TILE_SIZE;
            const posY = y * TILE_SIZE;
            
            switch (tileType) {
                case TILE_TYPES.EMPTY:
                    ctx.fillStyle = '#2c2c54';
                    break;
                case TILE_TYPES.ROAD:
                    ctx.fillStyle = '#40407a';
                    break;
                case TILE_TYPES.SPAWN:
                    ctx.fillStyle = '#00d2d3';
                    break;
                case TILE_TYPES.BASE:
                    ctx.fillStyle = '#ff9ff3';
                    break;
            }
            
            ctx.fillRect(posX, posY, TILE_SIZE, TILE_SIZE);
            
            // Границы тайлов
            ctx.strokeStyle = '#16213e';
            ctx.lineWidth = 1;
            ctx.strokeRect(posX, posY, TILE_SIZE, TILE_SIZE);
        }
    }
}

// Отрисовать врагов
function drawEnemies() {
    for (let enemy of gameState.enemies) {
        ctx.fillStyle = enemy.color;

        const size = 12;
        const x = enemy.x;
        const y = enemy.y;

        switch (enemy.shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();

                // Обводка для круга
                ctx.strokeStyle = '#004400';
                ctx.lineWidth = 2;
                ctx.stroke();
                break;

            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(x, y - size);
                ctx.lineTo(x - size, y + size);
                ctx.lineTo(x + size, y + size);
                ctx.closePath();
                ctx.fill();

                // Обводка для треугольника
                ctx.strokeStyle = '#444400';
                ctx.lineWidth = 2;
                ctx.stroke();
                break;

            case 'square':
                ctx.fillRect(x - size, y - size, size * 2, size * 2);

                // Обводка для квадрата
                ctx.strokeStyle = '#440000';
                ctx.lineWidth = 2;
                ctx.strokeRect(x - size, y - size, size * 2, size * 2);
                break;
        }

        // Полоска здоровья
        const healthBarWidth = 20;
        const healthBarHeight = 4;
        const healthPercent = enemy.health / enemy.maxHealth;

        ctx.fillStyle = '#333';
        ctx.fillRect(x - healthBarWidth/2, y - size - 8, healthBarWidth, healthBarHeight);

        ctx.fillStyle = healthPercent > 0.5 ? '#4ecdc4' : healthPercent > 0.25 ? '#feca57' : '#ff6b6b';
        ctx.fillRect(x - healthBarWidth/2, y - size - 8, healthBarWidth * healthPercent, healthBarHeight);
    }
}

// Отрисовать башни
function drawTowers() {
    for (let tower of gameState.towers) {
        // Радиус атаки (для выбранной плитки или наведенной башни)
        if ((gameState.selectedTile && 
            tower.gridX === gameState.selectedTile.x && 
            tower.gridY === gameState.selectedTile.y) ||
            tower === gameState.hoveredTower) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Башня
        ctx.fillStyle = tower.color;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Ствол башни (направлен на цель)
        if (tower.target) {
            const angle = Math.atan2(tower.target.y - tower.y, tower.target.x - tower.x);
            const barrelLength = 20;
            
            ctx.strokeStyle = tower.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(tower.x, tower.y);
            ctx.lineTo(
                tower.x + Math.cos(angle) * barrelLength,
                tower.y + Math.sin(angle) * barrelLength
            );
            ctx.stroke();
        }
        
        // Центр башни
        ctx.fillStyle = '#2c2c54';
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Отрисовать снаряды
function drawProjectiles() {
    for (let projectile of gameState.projectiles) {
        ctx.fillStyle = projectile.color;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Отрисовать меню башен
function drawTowerMenu() {
    const menuWidth = 200;
    const menuHeight = 120;
    const menuX = Math.min(gameState.towerMenuX, CANVAS_WIDTH - menuWidth);
    const menuY = Math.min(gameState.towerMenuY, CANVAS_HEIGHT - menuHeight);
    
    // Фон меню
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
    
    // Рамка
    ctx.strokeStyle = '#4a90e2';
    ctx.lineWidth = 2;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);
    
    // Заголовок
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText('Выберите башню:', menuX + 10, menuY + 20);
    
    // Кнопки башен
    const towerTypes = Object.keys(TOWER_TYPES);
    const buttonHeight = 25;
    
    for (let i = 0; i < towerTypes.length; i++) {
        const towerType = towerTypes[i];
        const towerData = TOWER_TYPES[towerType];
        const buttonY = menuY + 30 + i * (buttonHeight + 5);
        
        // Фон кнопки
        const canAfford = gameState.coins >= towerData.cost;
        ctx.fillStyle = canAfford ? 'rgba(74, 144, 226, 0.3)' : 'rgba(100, 100, 100, 0.3)';
        ctx.fillRect(menuX + 10, buttonY, menuWidth - 20, buttonHeight);
        
        // Рамка кнопки
        ctx.strokeStyle = canAfford ? '#4a90e2' : '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(menuX + 10, buttonY, menuWidth - 20, buttonHeight);
        
        // Текст кнопки
        ctx.fillStyle = canAfford ? 'white' : '#999';
        ctx.font = '12px Arial';
        ctx.fillText(
            `${towerData.name} (${towerData.cost} монет)`,
            menuX + 15,
            buttonY + 17
        );
    }
}

// Обновить UI
function updateUI() {
    // HTML-счётчики снизу убраны — всё рисуется на HUD. Оставляем только кнопки.
    const nextWaveBtn = document.getElementById('nextWaveBtn');
    if (nextWaveBtn) {
        const finished = gameState.levelCompleted || gameState.currentWave > gameState.maxWaves;
        nextWaveBtn.disabled = gameState.waveInProgress || finished;
        nextWaveBtn.textContent = finished ? 'Уровень пройден!' : 'Следующая волна';
    }
    // Обновить кнопку скорости, если существует
    updateSpeedButtonLabel();
}

// Игровой цикл
function gameLoop() {
    if (!gameState.paused) {
        updateEnemies();
        updateTowers();
        updateProjectiles();
        updateParticles();
        updateScreenShake();
    }
    render();
    requestAnimationFrame(gameLoop);
}

// Инициализация при загрузке страницы
window.onload = init;

// ==============================
// УСКОРЕНИЕ ИГРЫ 
// ==============================
// Текущий множитель скорости (по умолчанию x1)
gameState.speedMultiplier = 1;

function toggleSpeed() {
    // Циклическое переключение скоростей: x1 -> x2 -> x4 -> x1
    if (gameState.speedMultiplier === 1) {
        gameState.speedMultiplier = 2;
    } else if (gameState.speedMultiplier === 2) {
        gameState.speedMultiplier = 4;
    } else {
        gameState.speedMultiplier = 1;
    }
    updateSpeedButtonLabel();
}

function updateSpeedButtonLabel() {
    const speedBtn = document.getElementById('speedBtn');
    if (speedBtn) {
        const mul = gameState.speedMultiplier || 1;
        speedBtn.textContent = `Скорость x${mul}`;
    }
}
