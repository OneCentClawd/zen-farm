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
        canvas.addEventListener && canvas.addEventListener(type, listener, options);
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
  
  // 让 window 引用自己
  mockWindow.window = mockWindow;
  mockWindow.self = mockWindow;
  mockWindow.top = mockWindow;
  mockWindow.parent = mockWindow;
  
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
  
  mockWindow.document = mockDocument;
  
  // 挂载到 GameGlobal（微信小游戏全局对象）
  if (typeof GameGlobal !== 'undefined') {
    GameGlobal.window = mockWindow;
    GameGlobal.document = mockDocument;
    GameGlobal.canvas = canvas;
    GameGlobal.HTMLCanvasElement = canvas.constructor;
    GameGlobal.Image = wx.createImage().constructor;
    GameGlobal.HTMLImageElement = wx.createImage().constructor;
  }
  
  // 不要直接设置 globalThis.window，而是用 Object.defineProperty
  // 如果 window 已存在且只读，就扩展它的属性
  const target = typeof window !== 'undefined' ? window : globalThis;
  
  // 扩展现有 window 的属性（如果可以）
  Object.keys(mockWindow).forEach(key => {
    try {
      if (!(key in target)) {
        Object.defineProperty(target, key, {
          value: mockWindow[key],
          writable: true,
          configurable: true,
        });
      }
    } catch (e) {
      // 某些属性可能无法设置，忽略
    }
  });
  
  // 设置 document
  try {
    if (typeof document === 'undefined') {
      Object.defineProperty(globalThis, 'document', {
        value: mockDocument,
        writable: true,
        configurable: true,
      });
    }
  } catch (e) {}
  
  // 设置其他全局变量
  try {
    Object.defineProperty(globalThis, 'HTMLCanvasElement', {
      value: canvas.constructor,
      writable: true,
      configurable: true,
    });
  } catch (e) {}
  
  try {
    Object.defineProperty(globalThis, 'Image', {
      value: wx.createImage().constructor,
      writable: true,
      configurable: true,
    });
  } catch (e) {}
  
  try {
    Object.defineProperty(globalThis, 'HTMLImageElement', {
      value: wx.createImage().constructor,
      writable: true,
      configurable: true,
    });
  } catch (e) {}
  
  // 导出 canvas 供入口文件使用
  (globalThis as any).__wxCanvas = canvas;
}

export {};
