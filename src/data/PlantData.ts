/**
 * 植物类型枚举
 */
export enum PlantType {
  CLOVER = 'clover',         // 幸运草
  SUNFLOWER = 'sunflower',   // 向日葵
  STRAWBERRY = 'strawberry', // 草莓
  SAKURA = 'sakura'          // 樱花
}

/**
 * 健康状态枚举
 */
export enum HealthState {
  HEALTHY = 'healthy',           // 健康
  MILD_DAMAGE = 'mild_damage',   // 轻微受损
  MODERATE_DAMAGE = 'moderate_damage', // 明显受损
  SEVERE_DAMAGE = 'severe_damage',     // 严重衰弱
  DEAD = 'dead'                  // 死亡
}

/**
 * 生长阶段枚举
 */
export enum GrowthStage {
  SEED = 'seed',         // 种子
  SPROUT = 'sprout',     // 发芽
  SEEDLING = 'seedling', // 幼苗
  GROWING = 'growing',   // 成长
  MATURE = 'mature',     // 成熟
  AGING = 'aging',       // 衰老
  DEAD = 'dead'          // 死亡
}

/**
 * 植物配置数据
 */
export interface PlantConfig {
  type: PlantType;
  name: string;
  emoji: string;
  difficulty: number;           // 难度 1-5
  
  // 温度条件 (°C)
  tempMin: number;              // 最低适宜温度
  tempMax: number;              // 最高适宜温度
  tempLethalLow: number;        // 致死低温
  tempLethalHigh: number;       // 致死高温
  
  // 水分条件 (土壤湿度 %)
  moistureMin: number;          // 最低适宜湿度
  moistureMax: number;          // 最高适宜湿度
  droughtTolerance: number;     // 耐旱能力 (天数)
  floodTolerance: number;       // 耐涝能力 (天数)
  
  // 日照条件
  lightNeed: number;            // 日照需求 0-1 (0=喜阴, 1=全日照)
  
  // 生长周期 (天)
  growthDays: number;           // 从种子到成熟
  lifespanDays: number;         // 总寿命 (-1 表示多年生)
  harvestInterval: number;      // 收获间隔 (天)
  
  // 特殊条件
  needsVernalization?: boolean; // 是否需要春化 (低温处理)
  vernalizationDays?: number;   // 春化所需天数
  vernalizationTemp?: number;   // 春化温度阈值
}

/**
 * 4种植物的配置数据
 */
export const PLANT_CONFIGS: Record<PlantType, PlantConfig> = {
  [PlantType.CLOVER]: {
    type: PlantType.CLOVER,
    name: '幸运草',
    emoji: '🍀',
    difficulty: 1,
    tempMin: 10,
    tempMax: 25,
    tempLethalLow: -5,
    tempLethalHigh: 38,
    moistureMin: 20,
    moistureMax: 70,
    droughtTolerance: 7,      // 耐旱，7天不浇水才有问题
    floodTolerance: 5,        // 相对耐涝
    lightNeed: 0.3,           // 不挑光照
    growthDays: 18,
    lifespanDays: -1,         // 多年生
    harvestInterval: 7,
  },
  
  [PlantType.SUNFLOWER]: {
    type: PlantType.SUNFLOWER,
    name: '向日葵',
    emoji: '🌻',
    difficulty: 2,
    tempMin: 18,
    tempMax: 30,
    tempLethalLow: 0,
    tempLethalHigh: 40,
    moistureMin: 30,
    moistureMax: 60,
    droughtTolerance: 4,
    floodTolerance: 3,
    lightNeed: 0.8,           // 需要充足阳光
    growthDays: 75,
    lifespanDays: 120,        // 一年生
    harvestInterval: 14,
  },
  
  [PlantType.STRAWBERRY]: {
    type: PlantType.STRAWBERRY,
    name: '草莓',
    emoji: '🍓',
    difficulty: 4,
    tempMin: 15,
    tempMax: 25,
    tempLethalLow: -5,
    tempLethalHigh: 35,
    moistureMin: 50,
    moistureMax: 70,
    droughtTolerance: 2,      // 不耐旱
    floodTolerance: 1,        // 极怕涝
    lightNeed: 0.7,
    growthDays: 105,
    lifespanDays: 900,        // 约2-3年
    harvestInterval: 5,
  },
  
  [PlantType.SAKURA]: {
    type: PlantType.SAKURA,
    name: '樱花',
    emoji: '🌸',
    difficulty: 5,
    tempMin: 15,
    tempMax: 25,
    tempLethalLow: -15,       // 休眠期耐寒
    tempLethalHigh: 38,
    moistureMin: 30,
    moistureMax: 60,
    droughtTolerance: 5,
    floodTolerance: 2,
    lightNeed: 0.6,
    growthDays: 365,          // 1年长成 (现实需要3-5年)
    lifespanDays: -1,         // 可活数十年
    harvestInterval: 30,
    needsVernalization: true, // 需要春化
    vernalizationDays: 30,    // 需要30天低温
    vernalizationTemp: 7,     // 7°C以下
  },
};

/**
 * 植物实例数据
 */
export interface PlantInstance {
  id: string;
  type: PlantType;
  plantedAt: number;          // 播种时间戳
  healthState: HealthState;
  healthValue: number;        // 0-100
  growthProgress: number;     // 0-1
  growthStage: GrowthStage;
  lastWateredAt: number;
  harvestCount: number;
  
  // 胁迫累计
  droughtDays: number;        // 连续干旱天数
  floodDays: number;          // 连续积涝天数
  heatDays: number;           // 连续高温天数
  coldDays: number;           // 连续低温天数
  darkDays: number;           // 连续缺光天数
  
  // 樱花专用
  vernalizationProgress?: number; // 春化进度 (天数)
  hasBloomedThisYear?: boolean;   // 今年是否开过花
}
