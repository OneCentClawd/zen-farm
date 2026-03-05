/**
 * 微信小游戏入口
 * 简化版 - 手动适配
 */

declare const wx: any;
declare const GameGlobal: any;

// 在 GameGlobal 上设置必要的全局对象
const _canvas = wx.createCanvas();
const _systemInfo = wx.getSystemInfoSync();

// 微信小游戏环境下，GameGlobal 是可写的
GameGlobal.canvas = _canvas;
GameGlobal.document = {
  createElement: (tag: string) => {
    if (tag === 'canvas') {
      const c = wx.createCanvas();
      c.style = {};
      return c;
    }
    if (tag === 'img' || tag === 'IMG') return wx.createImage();
    return { style: {}, appendChild: () => {}, removeChild: () => {} };
  },
  getElementById: () => _canvas,
  getElementsByTagName: () => [],
  body: { appendChild: () => {}, removeChild: () => {}, style: {} },
  documentElement: { style: {} },
  addEventListener: () => {},
  removeEventListener: () => {},
  createElementNS: (ns: string, tag: string) => GameGlobal.document.createElement(tag),
  hidden: false,
  visibilityState: 'visible',
};

GameGlobal.window = {
  canvas: _canvas,
  innerWidth: _systemInfo.windowWidth,
  innerHeight: _systemInfo.windowHeight,
  devicePixelRatio: _systemInfo.pixelRatio,
  screen: { width: _systemInfo.windowWidth, height: _systemInfo.windowHeight },
  ontouchstart: true,
  ontouchmove: true,
  ontouchend: true,
  addEventListener: (type: string, fn: any) => _canvas.addEventListener?.(type, fn),
  removeEventListener: (type: string, fn: any) => _canvas.removeEventListener?.(type, fn),
  setTimeout, clearTimeout, setInterval, clearInterval,
  requestAnimationFrame: typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : (cb: any) => setTimeout(cb, 16),
  cancelAnimationFrame: typeof cancelAnimationFrame !== 'undefined' ? cancelAnimationFrame : clearTimeout,
  performance: wx.getPerformance?.() || { now: () => Date.now() },
  navigator: { userAgent: 'wechat-minigame', platform: _systemInfo.platform },
  location: { href: '', protocol: 'https:', hostname: 'localhost' },
  localStorage: {
    getItem: (k: string) => { try { return wx.getStorageSync(k); } catch { return null; } },
    setItem: (k: string, v: string) => { try { wx.setStorageSync(k, v); } catch {} },
    removeItem: (k: string) => { try { wx.removeStorageSync(k); } catch {} },
  },
  document: GameGlobal.document,
  Image: wx.createImage().constructor,
  HTMLCanvasElement: _canvas.constructor,
};

// 让 window 引用自己
GameGlobal.window.window = GameGlobal.window;
GameGlobal.window.self = GameGlobal.window;
GameGlobal.window.top = GameGlobal.window;

GameGlobal.Image = wx.createImage().constructor;
GameGlobal.HTMLCanvasElement = _canvas.constructor;
GameGlobal.HTMLImageElement = wx.createImage().constructor;

// 现在加载 Phaser（它会使用 GameGlobal 上的对象）
import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';

console.log('🌱 画布:', _canvas.width, 'x', _canvas.height);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  canvas: _canvas,
  width: _systemInfo.windowWidth,
  height: _systemInfo.windowHeight,
  backgroundColor: '#87CEEB',
  scene: [MainScene],
  scale: { mode: Phaser.Scale.NONE },
  render: { antialias: true },
  audio: { noAudio: true },
  input: { touch: true },
};

console.log('🌱 创建 Phaser 游戏...');
const game = new Phaser.Game(config);
console.log('🌱 启动成功');
