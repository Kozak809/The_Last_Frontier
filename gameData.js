// ============================================
// КОНФИГУРАЦИЯ ИГРЫ - INFINITODE 2 ANALOG
// ============================================

// ============================================
// ТИПЫ ТАЙЛОВ НА ИГРОВОМ ПОЛЕ
// ============================================
const TILE_TYPES = {
    EMPTY: 0,    // Пустая плитка (можно размещать башни)
    ROAD: 1,     // Дорога (путь для врагов)
    SPAWN: 2,    // Точка спавна врагов
    BASE: 3      // База игрока (цель врагов)
};

// ============================================
// ХАРАКТЕРИСТИКИ ВРАГОВ
// ============================================
const ENEMY_TYPES = {
    CIRCLE: { 
        shape: 'circle',     
        health: 50,          
        speed: 1,            
        reward: 10,          
        color: '#00ff00'     
    },
    
    TRIANGLE: { 
        shape: 'triangle', 
        health: 75, 
        speed: 1.8, 
        reward: 15, 
        color: '#ffff00' 
    },
    
    SQUARE: { 
        shape: 'square', 
        health: 100, 
        speed: 0.6, 
        reward: 20, 
        color: '#ff0000' 
    }
};

// ============================================
// ХАРАКТЕРИСТИКИ БАШЕН
// ============================================
const TOWER_TYPES = {
    BASIC: {
        name: 'Базовая',           
        cost: 20,                  
        damage: 15,                
        range: 81,                 
        fireRate: 1000,            
        color: '#0000ff',          
        projectileColor: '#0000ff', 
        projectileSpeed: 5         
    },
    
    SNIPER: {
        name: 'Снайпер',
        cost: 50,
        damage: 40,                
        range: 121,                
        fireRate: 2000,            
        color: '#FFC300',
        projectileColor: '#FFC300',
        projectileSpeed: 8        
    },
    
    RAPID: {
        name: 'Скорострел',
        cost: 35,
        damage: 8,                 
        range: 61,                 
        fireRate: 300,             
        color: '#7300FF',
        projectileColor: '#7300FF',
        projectileSpeed: 6         
    }
};

// ============================================
// КАРТЫ УРОВНЕЙ
// ============================================
const LEVELS = {
    1: {
        name: "Простой путь",
        description: "Прямая дорога от спавна до базы",
        difficulty: 1.05, // Множитель HP врагов
        grid: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [2,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0], 
            [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,3], 
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ]
    },
    
    2: {
        name: "Извилистый путь",
        description: "Сложная дорога с множеством поворотов",
        difficulty: 1.1, // Множитель HP врагов
        grid: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [2,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 
            [0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0], 
            [0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,3], 
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ]
    },
    
    3: {
        name: "Лабиринт",
        description: "Сложный путь через лабиринт",
        difficulty: 1.15, // Множитель HP врагов
        grid: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [2,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,3],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ]
    },
    
    4: {
        name: "Двойная проблема",
        description: "Два параллельных пути к базе",
        difficulty: 1.25, // Множитель HP врагов
        grid: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,2,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,0],
            [0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,1,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0],
            [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,1,0],
            [0,2,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ]
    }
};

// ============================================
// КОНФИГУРАЦИЯ ВОЛН ВРАГОВ
// ============================================
const WAVE_DATA = {
    1: [
        { enemies: [{ type: 'CIRCLE', count: 5 }] },                                    
        { enemies: [{ type: 'CIRCLE', count: 8 }] },                                    
        { enemies: [{ type: 'CIRCLE', count: 6 }, { type: 'TRIANGLE', count: 2 }] },   
        { enemies: [{ type: 'TRIANGLE', count: 5 }] },                                  
        { enemies: [{ type: 'CIRCLE', count: 10 }, { type: 'TRIANGLE', count: 3 }] },  
        { enemies: [{ type: 'SQUARE', count: 2 }] },                                    
        { enemies: [{ type: 'CIRCLE', count: 8 }, { type: 'SQUARE', count: 2 }] },     
        { enemies: [{ type: 'TRIANGLE', count: 6 }, { type: 'SQUARE', count: 2 }] },   
        { enemies: [{ type: 'CIRCLE', count: 12 }, { type: 'TRIANGLE', count: 4 }] },  
        { enemies: [{ type: 'SQUARE', count: 4 }] },                                    
        { enemies: [{ type: 'CIRCLE', count: 15 }, { type: 'TRIANGLE', count: 5 }, { type: 'SQUARE', count: 2 }] }, 
        { enemies: [{ type: 'TRIANGLE', count: 8 }, { type: 'SQUARE', count: 3 }] },   
        { enemies: [{ type: 'CIRCLE', count: 20 }, { type: 'SQUARE', count: 3 }] },    
        { enemies: [{ type: 'TRIANGLE', count: 10 }, { type: 'SQUARE', count: 4 }] },  
        { enemies: [{ type: 'CIRCLE', count: 18 }, { type: 'TRIANGLE', count: 8 }, { type: 'SQUARE', count: 3 }] }, 
        { enemies: [{ type: 'SQUARE', count: 6 }] },                                    
        { enemies: [{ type: 'CIRCLE', count: 25 }, { type: 'TRIANGLE', count: 10 }] }, 
        { enemies: [{ type: 'TRIANGLE', count: 12 }, { type: 'SQUARE', count: 6 }] },  
        { enemies: [{ type: 'CIRCLE', count: 30 }, { type: 'TRIANGLE', count: 12 }, { type: 'SQUARE', count: 5 }] },
        { enemies: [{ type: 'SQUARE', count: 10 }] } 
    ],
    
    2: [
        { enemies: [{ type: 'CIRCLE', count: 8 }] },                                    
        { enemies: [{ type: 'TRIANGLE', count: 6 }] },                                  
        { enemies: [{ type: 'CIRCLE', count: 10 }, { type: 'TRIANGLE', count: 4 }] },  
        { enemies: [{ type: 'SQUARE', count: 3 }] },                                    
        { enemies: [{ type: 'CIRCLE', count: 12 }, { type: 'SQUARE', count: 3 }] },            
        { enemies: [{ type: 'TRIANGLE', count: 8 }, { type: 'SQUARE', count: 3 }] },   
        { enemies: [{ type: 'CIRCLE', count: 15 }, { type: 'TRIANGLE', count: 6 }] },  
        { enemies: [{ type: 'SQUARE', count: 5 }] },                                    
        { enemies: [{ type: 'CIRCLE', count: 18 }, { type: 'TRIANGLE', count: 8 }, { type: 'SQUARE', count: 3 }] }, 
        { enemies: [{ type: 'TRIANGLE', count: 12 }, { type: 'SQUARE', count: 4 }] },  
        { enemies: [{ type: 'CIRCLE', count: 22 }, { type: 'SQUARE', count: 5 }] },    
        { enemies: [{ type: 'TRIANGLE', count: 15 }, { type: 'SQUARE', count: 5 }] },  
        { enemies: [{ type: 'CIRCLE', count: 25 }, { type: 'TRIANGLE', count: 10 }, { type: 'SQUARE', count: 4 }] }, 
        { enemies: [{ type: 'SQUARE', count: 8 }] },                                    
        { enemies: [{ type: 'CIRCLE', count: 30 }, { type: 'TRIANGLE', count: 12 }] }, 
        { enemies: [{ type: 'TRIANGLE', count: 18 }, { type: 'SQUARE', count: 7 }] },  
        { enemies: [{ type: 'CIRCLE', count: 35 }, { type: 'TRIANGLE', count: 15 }, { type: 'SQUARE', count: 6 }] }, 
        { enemies: [{ type: 'SQUARE', count: 10 }] },                                   
        { enemies: [{ type: 'CIRCLE', count: 40 }, { type: 'TRIANGLE', count: 18 }, { type: 'SQUARE', count: 8 }] }, 
        { enemies: [{ type: 'TRIANGLE', count: 25 }, { type: 'SQUARE', count: 15 }] }  
    ],
    
    3: [
        { enemies: [{ type: 'CIRCLE', count: 10 }] },
        { enemies: [{ type: 'TRIANGLE', count: 8 }] },
        { enemies: [{ type: 'CIRCLE', count: 12 }, { type: 'TRIANGLE', count: 6 }] },
        { enemies: [{ type: 'SQUARE', count: 4 }] },
        { enemies: [{ type: 'CIRCLE', count: 15 }, { type: 'SQUARE', count: 4 }] },
        { enemies: [{ type: 'TRIANGLE', count: 10 }, { type: 'SQUARE', count: 4 }] },
        { enemies: [{ type: 'CIRCLE', count: 18 }, { type: 'TRIANGLE', count: 8 }] },
        { enemies: [{ type: 'SQUARE', count: 6 }] },
        { enemies: [{ type: 'CIRCLE', count: 20 }, { type: 'TRIANGLE', count: 10 }, { type: 'SQUARE', count: 4 }] },
        { enemies: [{ type: 'TRIANGLE', count: 15 }, { type: 'SQUARE', count: 5 }] },
        { enemies: [{ type: 'CIRCLE', count: 25 }, { type: 'SQUARE', count: 6 }] },
        { enemies: [{ type: 'TRIANGLE', count: 18 }, { type: 'SQUARE', count: 6 }] },
        { enemies: [{ type: 'CIRCLE', count: 30 }, { type: 'TRIANGLE', count: 12 }, { type: 'SQUARE', count: 5 }] },
        { enemies: [{ type: 'SQUARE', count: 10 }] },
        { enemies: [{ type: 'CIRCLE', count: 35 }, { type: 'TRIANGLE', count: 15 }] },
        { enemies: [{ type: 'TRIANGLE', count: 20 }, { type: 'SQUARE', count: 8 }] },
        { enemies: [{ type: 'CIRCLE', count: 40 }, { type: 'TRIANGLE', count: 18 }, { type: 'SQUARE', count: 7 }] },
        { enemies: [{ type: 'SQUARE', count: 12 }] },
        { enemies: [{ type: 'CIRCLE', count: 45 }, { type: 'TRIANGLE', count: 20 }, { type: 'SQUARE', count: 9 }] },
        { enemies: [{ type: 'TRIANGLE', count: 30 }, { type: 'SQUARE', count: 20 }] }
    ],
    
    4: [
        { enemies: [{ type: 'CIRCLE', count: 15 }] },
        { enemies: [{ type: 'TRIANGLE', count: 12 }] },
        { enemies: [{ type: 'CIRCLE', count: 18 }, { type: 'TRIANGLE', count: 8 }] },
        { enemies: [{ type: 'SQUARE', count: 6 }] },
        { enemies: [{ type: 'CIRCLE', count: 20 }, { type: 'SQUARE', count: 5 }] },
        { enemies: [{ type: 'TRIANGLE', count: 15 }, { type: 'SQUARE', count: 6 }] },
        { enemies: [{ type: 'CIRCLE', count: 25 }, { type: 'TRIANGLE', count: 10 }] },
        { enemies: [{ type: 'SQUARE', count: 8 }] },
        { enemies: [{ type: 'CIRCLE', count: 30 }, { type: 'TRIANGLE', count: 12 }, { type: 'SQUARE', count: 6 }] },
        { enemies: [{ type: 'TRIANGLE', count: 18 }, { type: 'SQUARE', count: 7 }] },
        { enemies: [{ type: 'CIRCLE', count: 35 }, { type: 'SQUARE', count: 8 }] },
        { enemies: [{ type: 'TRIANGLE', count: 22 }, { type: 'SQUARE', count: 8 }] },
        { enemies: [{ type: 'CIRCLE', count: 40 }, { type: 'TRIANGLE', count: 15 }, { type: 'SQUARE', count: 7 }] },
        { enemies: [{ type: 'SQUARE', count: 12 }] },
        { enemies: [{ type: 'CIRCLE', count: 45 }, { type: 'TRIANGLE', count: 18 }] },
        { enemies: [{ type: 'TRIANGLE', count: 25 }, { type: 'SQUARE', count: 10 }] },
        { enemies: [{ type: 'CIRCLE', count: 50 }, { type: 'TRIANGLE', count: 20 }, { type: 'SQUARE', count: 9 }] },
        { enemies: [{ type: 'SQUARE', count: 15 }] },
        { enemies: [{ type: 'CIRCLE', count: 55 }, { type: 'TRIANGLE', count: 25 }, { type: 'SQUARE', count: 12 }] },
        { enemies: [{ type: 'TRIANGLE', count: 35 }, { type: 'SQUARE', count: 25 }] }
    ]
};

// ============================================
// ИГРОВЫЕ КОНСТАНТЫ
// ============================================
const GAME_CONSTANTS = {
    TILE_SIZE: 40,              
    CANVAS_WIDTH: 800,          
    CANVAS_HEIGHT: 600,         
    
    // Стартовые ресурсы игрока
    STARTING_COINS: 100,        // Начальные монеты
    STARTING_LIVES: 20,         // Начальные жизни
    
    // Настройки волн
    ENEMY_SPAWN_INTERVAL: 800,  // Интервал между спавном врагов (мс)
    
    // Настройки снарядов
    PROJECTILE_SPEED: 5         // Скорость полета снарядов
};
