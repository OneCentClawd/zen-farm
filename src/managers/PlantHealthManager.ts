/**
 * 植物健康管理器
 * 根据环境条件计算植物健康状态
 */

import { PlantInstance, PlantConfig, HealthState, GrowthStage, PLANT_CONFIGS } from '../data/PlantData';
import { WeatherData } from './WeatherManager';
import { SoilManager } from './SoilManager';

export class PlantHealthManager {
  
  /**
   * 更新植物状态（每次打开游戏时调用）
   * @param plant 植物实例
   * @param weather 天气数据
   * @param soil 土壤管理器
   * @param hours 经过的小时数
   */
  updatePlant(plant: PlantInstance, weather: WeatherData, soil: SoilManager, hours: number): PlantInstance {
    if (plant.healthState === HealthState.DEAD) {
      return plant; // 已死亡，不再更新
    }
    
    const config = PLANT_CONFIGS[plant.type];
    const days = hours / 24;
    
    // 1. 检查各类胁迫
    this.checkTemperatureStress(plant, config, weather, days);
    this.checkWaterStress(plant, config, soil, days);
    this.checkLightStress(plant, config, weather, days);
    
    // 2. 恢复机制（条件良好时）
    this.checkRecovery(plant, config, weather, soil);
    
    // 3. 更新健康状态
    this.updateHealthState(plant);
    
    // 4. 更新生长进度（受健康影响）
    this.updateGrowth(plant, config, hours);
    
    // 5. 检查自然死亡（寿命）
    this.checkLifespan(plant, config);
    
    return plant;
  }
  
  /**
   * 检查温度胁迫
   */
  private checkTemperatureStress(plant: PlantInstance, config: PlantConfig, weather: WeatherData, days: number) {
    const temp = weather.temperature;
    
    // 高温胁迫
    if (temp > config.tempMax) {
      plant.heatDays += days;
      // 超过致死温度，健康值快速下降
      if (temp >= config.tempLethalHigh) {
        plant.healthValue -= 20 * days;
      } else {
        plant.healthValue -= 5 * days;
      }
    } else {
      plant.heatDays = Math.max(0, plant.heatDays - days * 0.5); // 缓慢恢复
    }
    
    // 低温胁迫
    if (temp < config.tempMin) {
      plant.coldDays += days;
      if (temp <= config.tempLethalLow) {
        plant.healthValue -= 25 * days; // 冻害更严重
      } else {
        plant.healthValue -= 5 * days;
      }
    } else {
      plant.coldDays = Math.max(0, plant.coldDays - days * 0.5);
    }
  }
  
  /**
   * 检查水分胁迫
   */
  private checkWaterStress(plant: PlantInstance, config: PlantConfig, soil: SoilManager, days: number) {
    const moisture = soil.getMoisture();
    
    // 干旱胁迫
    if (moisture < config.moistureMin) {
      plant.droughtDays += days;
      if (plant.droughtDays > config.droughtTolerance) {
        // 超过耐旱极限，健康值下降
        const severity = (plant.droughtDays - config.droughtTolerance) * 10;
        plant.healthValue -= severity * days;
      }
    } else {
      plant.droughtDays = Math.max(0, plant.droughtDays - days);
    }
    
    // 积涝胁迫
    if (moisture > config.moistureMax) {
      plant.floodDays += days;
      if (plant.floodDays > config.floodTolerance) {
        const severity = (plant.floodDays - config.floodTolerance) * 15; // 涝害更致命
        plant.healthValue -= severity * days;
      }
    } else {
      plant.floodDays = Math.max(0, plant.floodDays - days);
    }
  }
  
  /**
   * 检查光照胁迫
   */
  private checkLightStress(plant: PlantInstance, config: PlantConfig, weather: WeatherData, days: number) {
    const sunlight = weather.sunlight;
    
    // 需要高光照的植物在阴天受影响
    if (sunlight < config.lightNeed) {
      plant.darkDays += days;
      if (plant.darkDays > 3) { // 连续3天缺光才有影响
        plant.healthValue -= 3 * days;
      }
    } else {
      plant.darkDays = Math.max(0, plant.darkDays - days * 0.5);
    }
  }
  
  /**
   * 恢复机制
   */
  private checkRecovery(plant: PlantInstance, config: PlantConfig, weather: WeatherData, soil: SoilManager) {
    const temp = weather.temperature;
    const moisture = soil.getMoisture();
    
    // 条件都良好时恢复健康
    const tempOk = temp >= config.tempMin && temp <= config.tempMax;
    const moistureOk = moisture >= config.moistureMin && moisture <= config.moistureMax;
    
    if (tempOk && moistureOk && plant.healthValue < 100) {
      // 每天恢复 5 点健康值
      plant.healthValue = Math.min(100, plant.healthValue + 5);
    }
  }
  
  /**
   * 更新健康状态
   */
  private updateHealthState(plant: PlantInstance) {
    plant.healthValue = Math.max(0, Math.min(100, plant.healthValue));
    
    if (plant.healthValue <= 0) {
      plant.healthState = HealthState.DEAD;
      plant.growthStage = GrowthStage.DEAD;
    } else if (plant.healthValue < 25) {
      plant.healthState = HealthState.SEVERE_DAMAGE;
    } else if (plant.healthValue < 50) {
      plant.healthState = HealthState.MODERATE_DAMAGE;
    } else if (plant.healthValue < 75) {
      plant.healthState = HealthState.MILD_DAMAGE;
    } else {
      plant.healthState = HealthState.HEALTHY;
    }
  }
  
  /**
   * 更新生长进度
   */
  private updateGrowth(plant: PlantInstance, config: PlantConfig, hours: number) {
    if (plant.healthState === HealthState.DEAD) return;
    
    // 生长速度受健康影响
    let growthRate = 1.0;
    if (plant.healthState === HealthState.MILD_DAMAGE) growthRate = 0.7;
    if (plant.healthState === HealthState.MODERATE_DAMAGE) growthRate = 0.3;
    if (plant.healthState === HealthState.SEVERE_DAMAGE) growthRate = 0;
    
    // 计算生长进度
    const daysElapsed = hours / 24;
    const progressPerDay = 1 / config.growthDays;
    plant.growthProgress += progressPerDay * daysElapsed * growthRate;
    plant.growthProgress = Math.min(1, plant.growthProgress);
    
    // 更新生长阶段
    this.updateGrowthStage(plant);
  }
  
  /**
   * 更新生长阶段
   */
  private updateGrowthStage(plant: PlantInstance) {
    const progress = plant.growthProgress;
    
    if (plant.healthState === HealthState.DEAD) {
      plant.growthStage = GrowthStage.DEAD;
    } else if (plant.healthState === HealthState.SEVERE_DAMAGE) {
      plant.growthStage = GrowthStage.AGING;
    } else if (progress >= 1) {
      plant.growthStage = GrowthStage.MATURE;
    } else if (progress >= 0.7) {
      plant.growthStage = GrowthStage.GROWING;
    } else if (progress >= 0.4) {
      plant.growthStage = GrowthStage.SEEDLING;
    } else if (progress >= 0.2) {
      plant.growthStage = GrowthStage.SPROUT;
    } else {
      plant.growthStage = GrowthStage.SEED;
    }
  }
  
  /**
   * 检查寿命
   */
  private checkLifespan(plant: PlantInstance, config: PlantConfig) {
    if (config.lifespanDays < 0) return; // 多年生
    
    const now = Date.now();
    const daysAlive = (now - plant.plantedAt) / (1000 * 60 * 60 * 24);
    
    if (daysAlive >= config.lifespanDays) {
      plant.healthState = HealthState.DEAD;
      plant.growthStage = GrowthStage.DEAD;
    } else if (daysAlive >= config.lifespanDays * 0.8) {
      // 进入衰老期
      if (plant.growthStage === GrowthStage.MATURE) {
        plant.growthStage = GrowthStage.AGING;
      }
    }
  }
  
  /**
   * 创建新植物实例
   */
  createPlant(type: PlantInstance['type']): PlantInstance {
    return {
      id: `plant_${Date.now()}`,
      type,
      plantedAt: Date.now(),
      healthState: HealthState.HEALTHY,
      healthValue: 100,
      growthProgress: 0,
      growthStage: GrowthStage.SEED,
      lastWateredAt: Date.now(),
      harvestCount: 0,
      droughtDays: 0,
      floodDays: 0,
      heatDays: 0,
      coldDays: 0,
      darkDays: 0,
    };
  }
  
  /**
   * 获取健康状态 emoji
   */
  getHealthEmoji(state: HealthState): string {
    switch (state) {
      case HealthState.HEALTHY: return '🟢';
      case HealthState.MILD_DAMAGE: return '🟡';
      case HealthState.MODERATE_DAMAGE: return '🟠';
      case HealthState.SEVERE_DAMAGE: return '🔴';
      case HealthState.DEAD: return '⚫';
    }
  }
  
  /**
   * 获取健康状态描述
   */
  getHealthDescription(state: HealthState): string {
    switch (state) {
      case HealthState.HEALTHY: return '健康';
      case HealthState.MILD_DAMAGE: return '轻微受损';
      case HealthState.MODERATE_DAMAGE: return '明显受损';
      case HealthState.SEVERE_DAMAGE: return '严重衰弱';
      case HealthState.DEAD: return '已枯死';
    }
  }
}

export const plantHealthManager = new PlantHealthManager();
