/**
 * 微信小游戏入口
 */

// 先加载适配器（必须在 Phaser 之前）
import './adapters/wx-adapter';

// 再加载 Phaser 和游戏
import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';

declare const wx: any;
declare const GameGlobal: any;

// 获取系统信息
const systemInfo = wx.getSystemInfoSync();

// 获取适配器创建的主画布
const mainCanvas = (globalThis as any).__wxCanvas || 
                   (typeof GameGlobal !== 'undefined' && GameGlobal.canvas) ||
                   wx.createCanvas();

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
    noAudio: true,
  },
  input: {
    touch: true,
  },
};

console.log('🌱 创建 Phaser 游戏...');

try {
  const game = new Phaser.Game(config);
  console.log('🌱 佛系种地（微信小游戏）启动成功');
} catch (e) {
  console.error('🌱 Phaser 启动失败:', e);
}
