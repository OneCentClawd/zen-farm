/**
 * 微信小游戏适配器
 * 让 Phaser 在微信小游戏环境中运行
 */

declare const wx: any;
declare const GameGlobal: any;
declare const requestAnimationFrame: any;
declare const cancelAnimationFrame: any;

// 检测是否在微信小游戏环境
const isWxGame = typeof wx !== 'undefined' && typeof wx.createCanvas === 'function';

if (isWxGame) {
  const canvas = wx.createCanvas();
  const systemInfo = wx.getSystemInfoSync();
  
  // 微信小游戏的 window 是只读的，需要通过 GameGlobal 来扩展
  const gameGlobal = typeof GameGlobal !== 'undefined' ? GameGlobal : {};
  
  // 模拟的 window 对象属性
  const windowProps = {
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
    location: { href: '', protocol: 'https:', hostname: 'localhost' },
  };
  
  // 扩展到 GameGlobal 而不是覆盖 window
  Object.keys(windowProps).forEach(key => {
    if (!(key in gameGlobal)) {
      (gameGlobal as any)[key] = (windowProps as any)[key];
    }
  });
  
  // 模拟 document
  const mockDocument = {
    createElement: (tag: string) => {
      if (tag === 'canvas') return wx.createCanvas();
      if (tag === 'img') return wx.createImage();
      return {};
    },
    getElementById: () => canvas,
    body: { 
      appendChild: (node: any) => node, 
      removeChild: (node: any) => node 
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  
  // 通过 GameGlobal 暴露
  if (typeof (globalThis as any).document === 'undefined') {
    (globalThis as any).document = mockDocument;
  }
  
  // HTMLCanvasElement 和 Image
  if (typeof (globalThis as any).HTMLCanvasElement === 'undefined') {
    (globalThis as any).HTMLCanvasElement = canvas.constructor;
  }
  if (typeof (globalThis as any).Image === 'undefined') {
    (globalThis as any).Image = wx.createImage().constructor;
  }
}

export {};
