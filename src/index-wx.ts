/**
 * 微信小游戏入口
 */

// 先加载适配器
import './adapters/wx-adapter';

// 再加载 Phaser 和游戏
import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';

declare const wx: any;
declare const canvas: any; // 适配器里创建的主画布

// 获取系统信息
const systemInfo = wx.getSystemInfoSync();

// 使用适配器里创建的 canvas（这是微信的主画布）
// 微信小游戏第一个 wx.createCanvas() 是主画布，会显示在屏幕上
const mainCanvas = typeof canvas !== 'undefined' ? canvas : wx.createCanvas();

console.log('🌱 画布尺寸:', mainCanvas.width, 'x', mainCanvas.height);
console.log('🌱 屏幕尺寸:', systemInfo.windowWidth, 'x', systemInfo.windowHeight);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  canvas: mainCanvas,
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
  audio: {
    noAudio: true, // 暂时禁用音频
  },
};

// 创建游戏
console.log('🌱 创建 Phaser 游戏...');
const game = new Phaser.Game(config);

console.log('🌱 佛系种地（微信小游戏）启动成功');

export default game;
