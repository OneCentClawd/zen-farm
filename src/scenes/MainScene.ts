import Phaser from 'phaser';
import { PlantType, PlantInstance, PLANT_CONFIGS, GrowthStage, HealthState } from '../data/PlantData';
import { weatherManager, WeatherData } from '../managers/WeatherManager';
import { SoilManager } from '../managers/SoilManager';
import { plantHealthManager } from '../managers/PlantHealthManager';
import { gameStateManager, GameState } from '../managers/GameStateManager';
import { offlineSimulator } from '../managers/OfflineSimulator';

export class MainScene extends Phaser.Scene {
  // UI 元素
  private weatherText!: Phaser.GameObjects.Text;
  private soilText!: Phaser.GameObjects.Text;
  private plantEmoji!: Phaser.GameObjects.Text;
  private infoText!: Phaser.GameObjects.Text;
  private healthText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private notificationText!: Phaser.GameObjects.Text;
  
  // 游戏数据
  private currentPlant: PlantInstance | null = null;
  private soilManager!: SoilManager;
  private weather!: WeatherData;
  
  constructor() {
    super({ key: 'MainScene' });
  }
  
  async create() {
    const { width, height } = this.cameras.main;
    
    // 初始化管理器
    this.soilManager = new SoilManager();
    
    // 尝试加载存档
    const savedState = gameStateManager.load();
    
    if (savedState && savedState.plant) {
      // 有存档，进行离线补算
      console.log('📂 检测到存档，进行离线补算...');
      
      // 恢复位置
      if (savedState.location) {
        weatherManager.setLocation(savedState.location.lat, savedState.location.lon);
      }
      
      // 恢复土壤状态
      this.soilManager.loadState(savedState.soil);
      
      // 进行离线补算
      const result = await offlineSimulator.simulate(
        savedState.plant,
        this.soilManager,
        savedState.lastOnlineAt
      );
      
      this.currentPlant = result.plant;
      this.soilManager.loadState(result.soil);
      
      // 显示补算报告
      const report = offlineSimulator.generateReport(result);
      console.log(report);
      
      // 延迟显示通知
      if (result.daysSimulated > 0) {
        this.time.delayedCall(500, () => {
          this.showNotification(report, 5000);
        });
      }
    } else {
      // 无存档，创建新植物
      this.currentPlant = plantHealthManager.createPlant(PlantType.CLOVER);
    }
    
    // 获取当前天气
    this.weather = await weatherManager.fetchWeather();
    
    // 绘制 UI
    this.drawBackground();
    this.drawWeatherBar();
    this.drawPlantArea();
    this.drawInfoPanel();
    this.drawButtons();
    this.drawNotificationArea();
    
    // 更新显示
    this.updateDisplay();
    
    // 定时保存（每30秒）
    this.time.addEvent({
      delay: 30000,
      callback: () => this.saveGame(),
      loop: true,
    });
    
    // 定时更新（每分钟模拟 1 小时游戏时间，仅测试用）
    this.time.addEvent({
      delay: 60000,
      callback: () => this.simulateTime(1),
      loop: true,
    });
    
    // 初始保存
    this.saveGame();
    
    console.log('🌱 佛系种地 - 场景加载完成');
  }
  
  /**
   * 保存游戏
   */
  private saveGame() {
    if (!this.currentPlant) return;
    
    const state: GameState = {
      version: 1,
      lastOnlineAt: Date.now(),
      plant: this.currentPlant,
      soil: this.soilManager.getState(),
      location: weatherManager.getLocation(),
    };
    
    gameStateManager.save(state);
  }
  
  /**
   * 绘制通知区域
   */
  private drawNotificationArea() {
    const { width, height } = this.cameras.main;
    
    this.notificationText = this.add.text(width / 2, height / 2, '', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: { x: 15, y: 10 },
      align: 'center',
      wordWrap: { width: width - 60 },
    });
    this.notificationText.setOrigin(0.5);
    this.notificationText.setVisible(false);
    this.notificationText.setDepth(100);
  }
  
  /**
   * 显示通知
   */
  private showNotification(text: string, duration: number = 3000) {
    this.notificationText.setText(text);
    this.notificationText.setVisible(true);
    
    this.time.delayedCall(duration, () => {
      this.notificationText.setVisible(false);
    });
  }
  
  /**
   * 绘制背景
   */
  private drawBackground() {
    const { width, height } = this.cameras.main;
    
    // 天空渐变
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xE0F7FF, 0xE0F7FF, 1);
    sky.fillRect(0, 0, width, height - 120);
    
    // 地面
    this.add.rectangle(width / 2, height - 60, width, 120, 0x8B4513);
  }
  
  /**
   * 绘制天气状态栏
   */
  private drawWeatherBar() {
    const { width } = this.cameras.main;
    
    // 背景条
    this.add.rectangle(width / 2, 25, width - 20, 40, 0x000000, 0.3)
      .setStrokeStyle(1, 0x333333);
    
    // 天气文本
    this.weatherText = this.add.text(width / 2, 25, '', {
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5);
  }
  
  /**
   * 绘制植物区域
   */
  private drawPlantArea() {
    const { width, height } = this.cameras.main;
    
    // 土壤
    this.add.rectangle(width / 2, height - 130, 150, 40, 0x654321)
      .setStrokeStyle(3, 0x4a3520);
    
    // 土壤湿度显示
    this.soilText = this.add.text(width / 2, height - 90, '', {
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5);
    
    // 植物 emoji
    this.plantEmoji = this.add.text(width / 2, height - 200, '', {
      fontSize: '80px',
    }).setOrigin(0.5);
  }
  
  /**
   * 绘制信息面板
   */
  private drawInfoPanel() {
    const { width, height } = this.cameras.main;
    const panelY = 80;
    
    // 背景
    this.add.rectangle(width / 2, panelY + 60, width - 40, 140, 0x000000, 0.2)
      .setStrokeStyle(1, 0x333333);
    
    // 植物信息
    this.infoText = this.add.text(30, panelY, '', {
      fontSize: '18px',
      color: '#333333',
      lineSpacing: 8,
    });
    
    // 健康状态
    this.healthText = this.add.text(30, panelY + 60, '', {
      fontSize: '16px',
      color: '#333333',
    });
    
    // 进度条
    this.progressBar = this.add.graphics();
  }
  
  /**
   * 绘制操作按钮
   */
  private drawButtons() {
    const { width, height } = this.cameras.main;
    const btnY = height - 35;
    
    // 浇水按钮
    const waterBtn = this.createButton(width / 2 - 100, btnY, '💧 浇水', 0x4a90d9);
    waterBtn.on('pointerdown', () => this.onWater());
    
    // 换种按钮
    const replantBtn = this.createButton(width / 2 + 100, btnY, '🔄 换种', 0xd9a04a);
    replantBtn.on('pointerdown', () => this.onReplant());
  }
  
  /**
   * 创建按钮
   */
  private createButton(x: number, y: number, text: string, color: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    
    const bg = this.add.rectangle(0, 0, 90, 35, color, 0.9)
      .setStrokeStyle(2, 0xffffff);
    
    const label = this.add.text(0, 0, text, {
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5);
    
    container.add([bg, label]);
    container.setSize(90, 35);
    container.setInteractive();
    
    // 按下效果
    container.on('pointerdown', () => bg.setScale(0.95));
    container.on('pointerup', () => bg.setScale(1));
    container.on('pointerout', () => bg.setScale(1));
    
    return container;
  }
  
  /**
   * 更新显示
   */
  private updateDisplay() {
    if (!this.currentPlant) return;
    
    const config = PLANT_CONFIGS[this.currentPlant.type];
    const weather = this.weather;
    
    // 天气栏
    const emoji = weatherManager.getWeatherEmoji();
    const desc = weatherManager.getWeatherDescription();
    this.weatherText.setText(`${emoji} ${weather.temperature.toFixed(0)}°C  ${desc}  日照:${(weather.sunlight * 100).toFixed(0)}%`);
    
    // 土壤湿度
    const moistureBar = this.soilManager.getMoistureBar();
    const moistureStatus = this.soilManager.getMoistureStatus();
    this.soilText.setText(`${moistureBar} ${this.soilManager.getMoisture().toFixed(0)}% ${moistureStatus}`);
    
    // 植物 emoji (根据生长阶段变化大小)
    const stage = this.currentPlant.growthStage;
    let scale = 0.3;
    if (stage === GrowthStage.SPROUT) scale = 0.5;
    if (stage === GrowthStage.SEEDLING) scale = 0.7;
    if (stage === GrowthStage.GROWING) scale = 0.85;
    if (stage === GrowthStage.MATURE) scale = 1.0;
    if (stage === GrowthStage.AGING) scale = 0.9;
    if (stage === GrowthStage.DEAD) scale = 0.5;
    
    this.plantEmoji.setText(stage === GrowthStage.DEAD ? '🥀' : config.emoji);
    this.plantEmoji.setScale(scale);
    
    // 颜色变化 (受损时发黄)
    if (this.currentPlant.healthState === HealthState.MILD_DAMAGE) {
      this.plantEmoji.setAlpha(0.9);
    } else if (this.currentPlant.healthState === HealthState.MODERATE_DAMAGE) {
      this.plantEmoji.setAlpha(0.7);
    } else if (this.currentPlant.healthState === HealthState.SEVERE_DAMAGE) {
      this.plantEmoji.setAlpha(0.5);
    } else {
      this.plantEmoji.setAlpha(1);
    }
    
    // 信息面板
    const daysAlive = Math.floor((Date.now() - this.currentPlant.plantedAt) / (1000 * 60 * 60 * 24));
    this.infoText.setText(`${config.emoji} ${config.name}\n难度: ${'★'.repeat(config.difficulty)}${'☆'.repeat(5 - config.difficulty)}\n已种植: ${daysAlive} 天`);
    
    // 健康状态
    const healthEmoji = plantHealthManager.getHealthEmoji(this.currentPlant.healthState);
    const healthDesc = plantHealthManager.getHealthDescription(this.currentPlant.healthState);
    this.healthText.setText(`状态: ${healthEmoji} ${healthDesc} (${this.currentPlant.healthValue.toFixed(0)}%)`);
    
    // 进度条
    this.drawProgressBar();
  }
  
  /**
   * 绘制进度条
   */
  private drawProgressBar() {
    if (!this.currentPlant) return;
    
    const { width } = this.cameras.main;
    const barX = 30;
    const barY = 175;
    const barWidth = width - 60;
    const barHeight = 15;
    
    this.progressBar.clear();
    
    // 背景
    this.progressBar.fillStyle(0x333333, 0.3);
    this.progressBar.fillRoundedRect(barX, barY, barWidth, barHeight, 5);
    
    // 进度
    const progress = this.currentPlant.growthProgress;
    const fillWidth = barWidth * progress;
    
    // 颜色根据健康状态
    let color = 0x4CAF50; // 绿色
    if (this.currentPlant.healthState === HealthState.MILD_DAMAGE) color = 0xCDDC39;
    if (this.currentPlant.healthState === HealthState.MODERATE_DAMAGE) color = 0xFF9800;
    if (this.currentPlant.healthState === HealthState.SEVERE_DAMAGE) color = 0xF44336;
    
    this.progressBar.fillStyle(color, 1);
    this.progressBar.fillRoundedRect(barX, barY, fillWidth, barHeight, 5);
    
    // 进度文字
    const progressText = this.add.text(width / 2, barY + barHeight / 2, `${(progress * 100).toFixed(0)}%`, {
      fontSize: '12px',
      color: '#ffffff',
    }).setOrigin(0.5);
    
    // 下一帧删除（避免重复）
    this.time.delayedCall(100, () => progressText.destroy());
  }
  
  /**
   * 浇水
   */
  private onWater() {
    this.soilManager.water(20);
    this.showWaterEffect();
    this.updateDisplay();
    console.log('浇水 +20%');
  }
  
  /**
   * 浇水动画
   */
  private showWaterEffect() {
    const { width, height } = this.cameras.main;
    
    for (let i = 0; i < 5; i++) {
      const drop = this.add.text(
        width / 2 + Phaser.Math.Between(-40, 40),
        height - 250,
        '💧',
        { fontSize: '20px' }
      );
      
      this.tweens.add({
        targets: drop,
        y: height - 130,
        alpha: 0,
        duration: 600,
        delay: i * 80,
        onComplete: () => drop.destroy(),
      });
    }
  }
  
  /**
   * 换种
   */
  private onReplant() {
    // TODO: 显示植物选择界面
    // 临时：循环切换植物
    const types = [PlantType.CLOVER, PlantType.SUNFLOWER, PlantType.STRAWBERRY, PlantType.SAKURA];
    const currentIndex = types.indexOf(this.currentPlant!.type);
    const nextIndex = (currentIndex + 1) % types.length;
    
    this.currentPlant = plantHealthManager.createPlant(types[nextIndex]);
    this.soilManager = new SoilManager(); // 重置土壤
    this.updateDisplay();
    
    console.log('换种:', PLANT_CONFIGS[types[nextIndex]].name);
  }
  
  /**
   * 模拟时间流逝
   */
  private simulateTime(hours: number) {
    if (!this.currentPlant) return;
    
    // 更新土壤
    this.soilManager.update(this.weather, hours);
    
    // 更新植物
    this.currentPlant = plantHealthManager.updatePlant(
      this.currentPlant,
      this.weather,
      this.soilManager,
      hours
    );
    
    this.updateDisplay();
  }
}
