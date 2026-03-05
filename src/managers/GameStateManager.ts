/**
 * 游戏状态管理器
 * 负责保存和加载游戏数据
 */

import { PlantInstance } from '../data/PlantData';
import { SoilState } from './SoilManager';

export interface GameState {
  version: number;                    // 存档版本
  lastOnlineAt: number;               // 上次在线时间
  plant: PlantInstance | null;        // 当前植物
  soil: SoilState;                    // 土壤状态
  location: { lat: number; lon: number }; // 用户位置
}

const STORAGE_KEY = 'zen_farm_save';
const CURRENT_VERSION = 1;

export class GameStateManager {
  
  /**
   * 保存游戏状态
   */
  save(state: GameState): void {
    state.version = CURRENT_VERSION;
    state.lastOnlineAt = Date.now();
    
    const json = JSON.stringify(state);
    
    // 微信小游戏环境
    if (typeof wx !== 'undefined' && wx.setStorageSync) {
      try {
        wx.setStorageSync(STORAGE_KEY, json);
        console.log('💾 游戏保存成功（微信）');
      } catch (e) {
        console.error('微信存储失败:', e);
      }
    } 
    // 浏览器环境
    else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, json);
      console.log('💾 游戏保存成功（浏览器）');
    }
  }
  
  /**
   * 加载游戏状态
   */
  load(): GameState | null {
    let json: string | null = null;
    
    // 微信小游戏环境
    if (typeof wx !== 'undefined' && wx.getStorageSync) {
      try {
        json = wx.getStorageSync(STORAGE_KEY);
      } catch (e) {
        console.error('微信读取存储失败:', e);
      }
    }
    // 浏览器环境
    else if (typeof localStorage !== 'undefined') {
      json = localStorage.getItem(STORAGE_KEY);
    }
    
    if (!json) {
      console.log('📭 无存档');
      return null;
    }
    
    try {
      const state = JSON.parse(json) as GameState;
      console.log(`📂 加载存档 v${state.version}, 上次在线: ${new Date(state.lastOnlineAt).toLocaleString()}`);
      return state;
    } catch (e) {
      console.error('存档解析失败:', e);
      return null;
    }
  }
  
  /**
   * 清除存档
   */
  clear(): void {
    if (typeof wx !== 'undefined' && wx.removeStorageSync) {
      try {
        wx.removeStorageSync(STORAGE_KEY);
      } catch (e) {
        console.error('微信清除存储失败:', e);
      }
    } else if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    console.log('🗑️ 存档已清除');
  }
  
  /**
   * 获取离线时长（小时）
   */
  getOfflineHours(state: GameState): number {
    const now = Date.now();
    return (now - state.lastOnlineAt) / (1000 * 60 * 60);
  }
  
  /**
   * 获取离线时长（天）
   */
  getOfflineDays(state: GameState): number {
    return this.getOfflineHours(state) / 24;
  }
}

// 声明微信全局变量
declare const wx: any;

export const gameStateManager = new GameStateManager();
