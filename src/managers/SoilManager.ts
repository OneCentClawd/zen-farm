/**
 * 土壤管理器 - 管理土壤湿度
 * 湿度受浇水、降水、蒸发影响
 */

import { WeatherData } from './WeatherManager';

export interface SoilState {
  moisture: number;        // 土壤湿度 0-100%
  lastUpdatedAt: number;   // 上次更新时间
  lastWateredAt: number;   // 上次浇水时间
}

export class SoilManager {
  private moisture: number = 50; // 初始湿度 50%
  private lastUpdatedAt: number = Date.now();
  private lastWateredAt: number = Date.now();
  
  /**
   * 加载保存的状态
   */
  loadState(state: SoilState) {
    this.moisture = state.moisture;
    this.lastUpdatedAt = state.lastUpdatedAt;
    this.lastWateredAt = state.lastWateredAt;
  }
  
  /**
   * 获取当前状态
   */
  getState(): SoilState {
    return {
      moisture: this.moisture,
      lastUpdatedAt: this.lastUpdatedAt,
      lastWateredAt: this.lastWateredAt,
    };
  }
  
  /**
   * 浇水
   * @param amount 浇水量，默认 20%
   */
  water(amount: number = 20) {
    this.moisture = Math.min(100, this.moisture + amount);
    this.lastWateredAt = Date.now();
    this.lastUpdatedAt = Date.now();
  }
  
  /**
   * 根据天气更新湿度
   * @param weather 天气数据
   * @param hours 经过的小时数
   */
  update(weather: WeatherData, hours: number) {
    // 1. 降水增加湿度
    if (weather.precipitation > 0) {
      // 每 mm 降水增加约 5% 湿度
      const rainAdd = weather.precipitation * 5 * hours;
      this.moisture = Math.min(100, this.moisture + rainAdd);
    }
    
    // 2. 蒸发减少湿度
    // 蒸发速率受温度、日照、空气湿度影响
    const evaporationRate = this.calculateEvaporationRate(weather);
    const evaporationLoss = evaporationRate * hours;
    this.moisture = Math.max(0, this.moisture - evaporationLoss);
    
    this.lastUpdatedAt = Date.now();
  }
  
  /**
   * 计算蒸发速率 (%/小时)
   */
  private calculateEvaporationRate(weather: WeatherData): number {
    // 基础蒸发率: 0.5%/小时
    let rate = 0.5;
    
    // 温度影响: 每升高 10°C，蒸发率增加 50%
    const tempFactor = Math.max(0.5, 1 + (weather.temperature - 20) / 20);
    rate *= tempFactor;
    
    // 日照影响: 晴天蒸发快
    rate *= (0.5 + weather.sunlight * 0.5);
    
    // 空气湿度影响: 空气干燥蒸发快
    const humidityFactor = 1.5 - weather.humidity / 100;
    rate *= humidityFactor;
    
    // 下雨时几乎不蒸发
    if (weather.precipitation > 0) {
      rate *= 0.1;
    }
    
    return rate;
  }
  
  /**
   * 获取当前湿度
   */
  getMoisture(): number {
    return this.moisture;
  }
  
  /**
   * 湿度状态描述
   */
  getMoistureStatus(): string {
    if (this.moisture < 20) return '干旱';
    if (this.moisture < 40) return '偏干';
    if (this.moisture < 60) return '适中';
    if (this.moisture < 80) return '湿润';
    return '积涝';
  }
  
  /**
   * 湿度条显示
   */
  getMoistureBar(): string {
    const filled = Math.round(this.moisture / 20);
    return '💧'.repeat(filled) + '○'.repeat(5 - filled);
  }
  
  /**
   * 判断是否需要浇水（基于植物需求）
   */
  needsWater(moistureMin: number): boolean {
    return this.moisture < moistureMin;
  }
  
  /**
   * 判断是否积涝
   */
  isFlooded(moistureMax: number): boolean {
    return this.moisture > moistureMax;
  }
}
