/**
 * 微信小游戏适配器
 * 让 Phaser 在微信小游戏环境中运行
 * 必须在 import Phaser 之前加载
 */

declare const wx: any;
declare const GameGlobal: any;

// 检测是否在微信小游戏环境
const isWxGame = typeof wx !== 'undefined' && typeof wx.createCanvas === 'function';

if (isWxGame) {
  const canvas = wx.createCanvas();
  const systemInfo = wx.getSystemInfoSync();
  
  // 创建模拟的 window 对象
  const mockWindow: any = {
    // 画布相关
    canvas: canvas,
    innerWidth: systemInfo.windowWidth,
    innerHeight: systemInfo.windowHeight,
    devicePixelRatio: systemInfo.pixelRatio,
    
    // 屏幕
    screen: { 
      width: systemInfo.windowWidth, 
      height: systemInfo.windowHeight,
      availWidth: systemInfo.windowWidth,
      availHeight: systemInfo.windowHeight,
    },
    
    // 触摸支持 - Phaser 需要这个
    ontouchstart: null,
    ontouchmove: null,
    ontouchend: null,
    
    // 事件
    addEventListener: (type: string, listener: any, options?: any) => {
      if (type === 'touchstart' || type === 'touchmove' || type === 'touchend' || type === 'touchcancel') {
        wx.onTouchStart && canvas.addEventListener(type, listener, options);
      }
    },
    removeEventListener: (type: string, listener: any) => {
      canvas.removeEventListener && canvas.removeEventListener(type, listener);
    },
    
    // 定时器
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    requestAnimationFrame: typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : (cb: any) => setTimeout(cb, 16),
    cancelAnimationFrame: typeof cancelAnimationFrame !== 'undefined' ? cancelAnimationFrame : clearTimeout,
    
    // 性能
    performance: wx.getPerformance ? wx.getPerformance() : { now: () => Date.now() },
    
    // 导航
    navigator: { 
      userAgent: 'wechat-minigame',
      platform: systemInfo.platform,
      language: systemInfo.language || 'zh-CN',
    },
    
    // 位置
    location: { 
      href: 'game.js', 
      protocol: 'https:', 
      hostname: 'localhost',
      pathname: '/',
      search: '',
      hash: '',
    },
    
    // URL 支持
    URL: class {
      constructor(url: string) { return { href: url }; }
    },
    
    // Blob 支持
    Blob: class {
      constructor(parts: any[], options?: any) { return {}; }
    },
    
    // Focus
    focus: () => {},
    scrollTo: () => {},
    
    // 存储
    localStorage: {
      getItem: (key: string) => {
        try { return wx.getStorageSync(key); } catch (e) { return null; }
      },
      setItem: (key: string, value: string) => {
        try { wx.setStorageSync(key, value); } catch (e) {}
      },
      removeItem: (key: string) => {
        try { wx.removeStorageSync(key); } catch (e) {}
      },
    },
  };
  
  // 模拟 document
  const mockDocument: any = {
    createElement: (tag: string) => {
      if (tag === 'canvas') {
        const c = wx.createCanvas();
        c.style = {};
        return c;
      }
      if (tag === 'img' || tag === 'IMG') {
        return wx.createImage();
      }
      // 返回一个假的 DOM 元素
      return { 
        style: {},
        appendChild: () => {},
        removeChild: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
      };
    },
    getElementById: (id: string) => canvas,
    getElementsByTagName: (tag: string) => [],
    body: { 
      appendChild: (node: any) => node, 
      removeChild: (node: any) => node,
      style: {},
    },
    documentElement: {
      style: {},
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    createElementNS: (ns: string, tag: string) => mockDocument.createElement(tag),
    hidden: false,
    visibilityState: 'visible',
  };
  
  // 挂载到 GameGlobal（微信小游戏全局对象）
  if (typeof GameGlobal !== 'undefined') {
    GameGlobal.window = mockWindow;
    GameGlobal.document = mockDocument;
    GameGlobal.HTMLCanvasElement = canvas.constructor;
    GameGlobal.Image = wx.createImage().constructor;
    GameGlobal.HTMLImageElement = wx.createImage().constructor;
    
    // 让 window 引用自己
    GameGlobal.window.window = GameGlobal.window;
    GameGlobal.window.document = mockDocument;
    GameGlobal.window.self = GameGlobal.window;
    GameGlobal.window.top = GameGlobal.window;
    GameGlobal.window.parent = GameGlobal.window;
  }
  
  // 同时设置到 globalThis
  (globalThis as any).window = mockWindow;
  (globalThis as any).document = mockDocument;
  (globalThis as any).HTMLCanvasElement = canvas.constructor;
  (globalThis as any).Image = wx.createImage().constructor;
  (globalThis as any).HTMLImageElement = wx.createImage().constructor;
  (globalThis as any).canvas = canvas;
}

export {};
