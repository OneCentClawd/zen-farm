/**
 * 微信小游戏入口
 */

// 先加载适配器
import './adapters/wx-adapter';

// 再加载 Phaser 和游戏
import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';

declare const wx: any;

// 获取微信画布和系统信息
const canvas = wx.createCanvas();
const systemInfo = wx.getSystemInfoSync();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  canvas: canvas,
  width: systemInfo.windowWidth,
  height: systemInfo.windowHeight,
  backgroundColor: '#87CEEB',
  scene: [MainScene],
  scale: {
    mode: Phaser.Scale.NONE,
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
};

// 创建游戏
const game = new Phaser.Game(config);

console.log('🌱 佛系种地（微信小游戏）启动');

export default game;
