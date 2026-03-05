import Phaser from 'phaser';
import { PlantType, PLANT_CONFIGS, GrowthStage } from '../data/PlantData';

export class MainScene extends Phaser.Scene {
  private soil!: Phaser.GameObjects.Rectangle;
  private plant!: Phaser.GameObjects.Text;
  private infoText!: Phaser.GameObjects.Text;
  
  constructor() {
    super({ key: 'MainScene' });
  }
  
  create() {
    const { width, height } = this.cameras.main;
    
    // 天空背景
    this.add.rectangle(width / 2, height / 2, width, height, 0x87CEEB);
    
    // 地面
    this.add.rectangle(width / 2, height - 50, width, 100, 0x8B4513);
    
    // 土壤/地块
    this.soil = this.add.rectangle(width / 2, height - 100, 120, 30, 0x654321);
    this.soil.setStrokeStyle(2, 0x4a3520);
    
    // 植物 (先用 emoji 占位)
    const config = PLANT_CONFIGS[PlantType.CLOVER];
    this.plant = this.add.text(width / 2, height - 150, config.emoji, {
      fontSize: '64px',
    });
    this.plant.setOrigin(0.5);
    
    // 信息文本
    this.infoText = this.add.text(width / 2, 50, `${config.name}\n难度: ${'★'.repeat(config.difficulty)}`, {
      fontSize: '20px',
      color: '#333333',
      align: 'center',
    });
    this.infoText.setOrigin(0.5, 0);
    
    // 状态栏
    this.add.text(20, 20, '☀️ 26°C  💧62%  🌤 晴', {
      fontSize: '16px',
      color: '#333333',
    });
    
    // 浇水按钮
    const waterBtn = this.add.text(width / 2 - 80, height - 30, '💧浇水', {
      fontSize: '18px',
      backgroundColor: '#4a90d9',
      padding: { x: 10, y: 5 },
    });
    waterBtn.setOrigin(0.5);
    waterBtn.setInteractive();
    waterBtn.on('pointerdown', () => {
      this.showWaterEffect();
    });
    
    // 换种按钮
    const replantBtn = this.add.text(width / 2 + 80, height - 30, '🔄换种', {
      fontSize: '18px',
      backgroundColor: '#d9a04a',
      padding: { x: 10, y: 5 },
    });
    replantBtn.setOrigin(0.5);
    replantBtn.setInteractive();
    replantBtn.on('pointerdown', () => {
      this.showPlantSelector();
    });
    
    console.log('🌱 佛系种地 - 场景加载完成');
  }
  
  private showWaterEffect() {
    // 简单的浇水动画
    const { width, height } = this.cameras.main;
    const drops: Phaser.GameObjects.Text[] = [];
    
    for (let i = 0; i < 5; i++) {
      const drop = this.add.text(
        width / 2 + Phaser.Math.Between(-30, 30),
        height - 200,
        '💧',
        { fontSize: '16px' }
      );
      drops.push(drop);
      
      this.tweens.add({
        targets: drop,
        y: height - 110,
        alpha: 0,
        duration: 500,
        delay: i * 100,
        onComplete: () => drop.destroy(),
      });
    }
  }
  
  private showPlantSelector() {
    // TODO: 显示植物选择界面
    console.log('显示植物选择器');
  }
}
