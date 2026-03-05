/**
 * 微信小游戏适配器
 * 让 Phaser 在微信小游戏环境中运行
 */

declare const wx: any;
declare const requestAnimationFrame: any;
declare const cancelAnimationFrame: any;

// 检测是否在微信小游戏环境
const isWxGame = typeof wx !== 'undefined' && typeof wx.createCanvas === 'function';

if (isWxGame) {
  const canvas = wx.createCanvas();
  const systemInfo = wx.getSystemInfoSync();
  
  (globalThis as any).window = {
    canvas: canvas,
    innerWidth: systemInfo.windowWidth,
    innerHeight: systemInfo.windowHeight,
    devicePixelRatio: systemInfo.pixelRatio,
    addEventListener: () => {},
    removeEventListener: () => {},
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    requestAnimationFrame: requestAnimationFrame,
    cancelAnimationFrame: cancelAnimationFrame,
    performance: wx.getPerformance ? wx.getPerformance() : { now: () => Date.now() },
    screen: { width: systemInfo.windowWidth, height: systemInfo.windowHeight },
    navigator: { userAgent: 'wechat-minigame' },
    location: { href: '', protocol: 'https:', hostname: 'localhost' } as any,
  };
  
  (globalThis as any).document = {
    createElement: (tag: string) => {
      if (tag === 'canvas') return wx.createCanvas();
      if (tag === 'img') return wx.createImage();
      return {};
    },
    getElementById: () => canvas,
    body: { 
      appendChild: (node: any) => node, 
      removeChild: (node: any) => node 
    } as any,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  
  (globalThis as any).HTMLCanvasElement = canvas.constructor;
  (globalThis as any).Image = wx.createImage().constructor;
}

export {};
