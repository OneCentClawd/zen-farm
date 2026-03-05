import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';

/**
 * 佛系种地 - Zen Farm
 * 真实模拟种植的微信小游戏
 */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 375,   // 微信小游戏常见宽度
  height: 667,  // 微信小游戏常见高度
  parent: 'game',
  backgroundColor: '#87CEEB',
  scene: [MainScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

// 创建游戏实例
const game = new Phaser.Game(config);

console.log('🌱 佛系种地启动');

export default game;
