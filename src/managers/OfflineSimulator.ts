/**
 * 离线模拟引擎
 * 用户离线期间按天补算植物状态
 */

import { PlantInstance, PLANT_CONFIGS } from '../data/PlantData';
import { WeatherData, weatherManager, WeatherManager } from './WeatherManager';
import { SoilManager, SoilState } from './SoilManager';
import { plantHealthManager } from './PlantHealthManager';

export interface SimulationResult {
  plant: PlantInstance;
  soil: SoilState;
  daysSimulated: number;
  weatherLog: Array<{
    date: string;
    weather: WeatherData;
    healthBefore: number;
    healthAfter: number;
  }>;
}

export class OfflineSimulator {
  
  /**
   * 模拟离线期间的植物状态变化
   * @param plant 植物实例
   * @param soil 土壤管理器
   * @param lastOnlineAt 上次在线时间戳
   * @returns 模拟结果
   */
  async simulate(
    plant: PlantInstance,
    soil: SoilManager,
    lastOnlineAt: number
  ): Promise<SimulationResult> {
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysOffline = Math.floor((now - lastOnlineAt) / msPerDay);
    
    // 少于1天不需要补算
    if (daysOffline < 1) {
      return {
        plant,
        soil: soil.getState(),
        daysSimulated: 0,
        weatherLog: [],
      };
    }
    
    // 限制最多补算30天，避免计算量过大
    const daysToSimulate = Math.min(daysOffline, 30);
    
    console.log(`🔄 离线补算: ${daysToSimulate}天`);
    
    // 获取历史天气（使用 past_days 参数）
    let historicalWeather = await weatherManager.fetchHistoricalWeather(daysToSimulate);
    
    // 如果获取失败，用默认天气填充
    if (historicalWeather.length === 0) {
      console.warn('历史天气获取失败，使用默认天气');
      historicalWeather = this.generateDefaultWeather(daysToSimulate);
    }
    
    // 只取需要的天数（API可能返回更多）
    const weatherToUse = historicalWeather.slice(-daysToSimulate);
    
    // 按天模拟
    const weatherLog: SimulationResult['weatherLog'] = [];
    
    for (const dayWeather of weatherToUse) {
      const healthBefore = plant.healthValue;
      
      // 更新土壤（每天24小时）
      soil.update(dayWeather, 24);
      
      // 更新植物
      plant = plantHealthManager.updatePlant(plant, dayWeather, soil, 24);
      
      weatherLog.push({
        date: dayWeather.date || 'unknown',
        weather: dayWeather,
        healthBefore,
        healthAfter: plant.healthValue,
      });
      
      // 如果植物死亡，停止模拟
      if (plant.healthValue <= 0) {
        console.log(`☠️ 植物在 ${dayWeather.date} 死亡`);
        break;
      }
    }
    
    return {
      plant,
      soil: soil.getState(),
      daysSimulated: weatherLog.length,
      weatherLog,
    };
  }
  
  /**
   * 生成默认天气数据（API失败时的后备方案）
   */
  private generateDefaultWeather(days: number): WeatherData[] {
    const results: WeatherData[] = [];
    const baseDate = new Date();
    
    for (let i = days; i > 0; i--) {
      const date = new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000);
      results.push({
        date: WeatherManager.formatDate(date),
        temperature: 20 + Math.random() * 10 - 5, // 15-25°C
        humidity: 50 + Math.random() * 30,        // 50-80%
        precipitation: Math.random() < 0.3 ? Math.random() * 10 : 0, // 30%概率下雨
        weatherCode: Math.random() < 0.7 ? 2 : 61, // 70%多云，30%小雨
        isDay: true,
        sunlight: 0.5 + Math.random() * 0.3,      // 0.5-0.8
        updatedAt: Date.now(),
      });
    }
    
    return results;
  }
  
  /**
   * 生成补算报告（给用户看）
   */
  generateReport(result: SimulationResult): string {
    if (result.daysSimulated === 0) {
      return '欢迎回来！您的植物一切正常~';
    }
    
    const config = PLANT_CONFIGS[result.plant.type];
    const lines: string[] = [];
    
    lines.push(`🔄 离线补算完成（${result.daysSimulated}天）`);
    lines.push('');
    
    // 天气概况
    let rainyDays = 0;
    let hotDays = 0;
    let coldDays = 0;
    
    for (const log of result.weatherLog) {
      if (log.weather.precipitation > 0) rainyDays++;
      if (log.weather.temperature > config.tempMax) hotDays++;
      if (log.weather.temperature < config.tempMin) coldDays++;
    }
    
    lines.push(`☁️ 天气概况: ${rainyDays}天下雨`);
    if (hotDays > 0) lines.push(`🌡️ 高温天数: ${hotDays}天`);
    if (coldDays > 0) lines.push(`❄️ 低温天数: ${coldDays}天`);
    lines.push('');
    
    // 健康变化
    const firstLog = result.weatherLog[0];
    const lastLog = result.weatherLog[result.weatherLog.length - 1];
    const healthChange = lastLog.healthAfter - firstLog.healthBefore;
    
    if (healthChange >= 0) {
      lines.push(`💚 健康值: ${firstLog.healthBefore.toFixed(0)}% → ${lastLog.healthAfter.toFixed(0)}% (+${healthChange.toFixed(0)})`);
    } else {
      lines.push(`💔 健康值: ${firstLog.healthBefore.toFixed(0)}% → ${lastLog.healthAfter.toFixed(0)}% (${healthChange.toFixed(0)})`);
    }
    
    // 状态总结
    if (result.plant.healthValue <= 0) {
      lines.push('');
      lines.push('☠️ 很遗憾，您的植物在离线期间枯死了...');
    } else if (result.plant.healthValue < 50) {
      lines.push('');
      lines.push('⚠️ 植物状态不佳，请及时照料！');
    }
    
    return lines.join('\n');
  }
}

export const offlineSimulator = new OfflineSimulator();
