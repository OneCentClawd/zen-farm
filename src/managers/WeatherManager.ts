/**
 * 天气管理器 - 接入 Open-Meteo API
 * 获取用户当地真实天气数据，包括历史天气用于离线补算
 */

export interface WeatherData {
  temperature: number;      // 气温 °C
  humidity: number;         // 空气湿度 %
  precipitation: number;    // 降水量 mm
  weatherCode: number;      // 天气代码
  isDay: boolean;           // 是否白天
  sunlight: number;         // 日照强度 0-1
  updatedAt: number;        // 更新时间戳
  date?: string;            // 日期 YYYY-MM-DD（历史天气用）
}

/**
 * 天气代码对应日照强度
 * WMO Weather interpretation codes
 */
const WEATHER_SUNLIGHT: Record<number, number> = {
  0: 1.0,    // 晴
  1: 0.9,    // 大部晴
  2: 0.7,    // 多云
  3: 0.4,    // 阴天
  45: 0.3,   // 雾
  48: 0.2,   // 冻雾
  51: 0.4,   // 毛毛雨
  53: 0.3,   // 中雨
  55: 0.2,   // 大雨
  61: 0.3,   // 小雨
  63: 0.2,   // 中雨
  65: 0.1,   // 大雨
  71: 0.3,   // 小雪
  73: 0.2,   // 中雪
  75: 0.1,   // 大雪
  80: 0.2,   // 阵雨
  81: 0.15,  // 中阵雨
  82: 0.1,   // 强阵雨
  95: 0.05,  // 雷暴
  96: 0.05,  // 冰雹雷暴
  99: 0.05,  // 强冰雹雷暴
};

/**
 * 天气代码对应中文描述
 */
const WEATHER_DESC: Record<number, string> = {
  0: '晴',
  1: '大部晴',
  2: '多云',
  3: '阴天',
  45: '雾',
  48: '冻雾',
  51: '毛毛雨',
  53: '中雨',
  55: '大雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  80: '阵雨',
  81: '中阵雨',
  82: '强阵雨',
  95: '雷暴',
  96: '冰雹',
  99: '强冰雹',
};

/**
 * 天气代码对应 emoji
 */
const WEATHER_EMOJI: Record<number, string> = {
  0: '☀️',
  1: '🌤',
  2: '⛅',
  3: '☁️',
  45: '🌫️',
  48: '🌫️',
  51: '🌧️',
  53: '🌧️',
  55: '🌧️',
  61: '🌧️',
  63: '🌧️',
  65: '🌧️',
  71: '🌨️',
  73: '🌨️',
  75: '🌨️',
  80: '🌦️',
  81: '🌦️',
  82: '🌦️',
  95: '⛈️',
  96: '⛈️',
  99: '⛈️',
};

export class WeatherManager {
  private currentWeather: WeatherData | null = null;
  private latitude: number = 39.9; // 默认北京
  private longitude: number = 116.4;
  
  /**
   * 设置位置
   */
  setLocation(lat: number, lon: number) {
    this.latitude = lat;
    this.longitude = lon;
  }
  
  getLocation() {
    return { lat: this.latitude, lon: this.longitude };
  }
  
  /**
   * 从 Open-Meteo 获取当前天气
   */
  async fetchWeather(): Promise<WeatherData> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.latitude}&longitude=${this.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,is_day&timezone=auto`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      const weatherCode = data.current.weather_code || 0;
      
      this.currentWeather = {
        temperature: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        precipitation: data.current.precipitation || 0,
        weatherCode: weatherCode,
        isDay: data.current.is_day === 1,
        sunlight: WEATHER_SUNLIGHT[weatherCode] ?? 0.5,
        updatedAt: Date.now(),
      };
      
      return this.currentWeather;
    } catch (error) {
      console.error('获取天气失败:', error);
      return this.getDefaultWeather();
    }
  }
  
  /**
   * 获取历史天气（用于离线补算）
   * @param startDate 开始日期 YYYY-MM-DD
   * @param endDate 结束日期 YYYY-MM-DD
   * @returns 每天的天气数据数组
   */
  async fetchHistoricalWeather(startDate: string, endDate: string): Promise<WeatherData[]> {
    // Open-Meteo Archive API (免费)
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${this.latitude}&longitude=${this.longitude}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_mean,relative_humidity_2m_mean,precipitation_sum,weather_code&timezone=auto`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.daily || !data.daily.time) {
        console.warn('历史天气数据格式错误');
        return [];
      }
      
      const results: WeatherData[] = [];
      const { time, temperature_2m_mean, relative_humidity_2m_mean, precipitation_sum, weather_code } = data.daily;
      
      for (let i = 0; i < time.length; i++) {
        const code = weather_code[i] || 0;
        results.push({
          date: time[i],
          temperature: temperature_2m_mean[i] ?? 20,
          humidity: relative_humidity_2m_mean[i] ?? 60,
          precipitation: precipitation_sum[i] ?? 0,
          weatherCode: code,
          isDay: true, // 日均数据，默认白天
          sunlight: WEATHER_SUNLIGHT[code] ?? 0.5,
          updatedAt: Date.now(),
        });
      }
      
      return results;
    } catch (error) {
      console.error('获取历史天气失败:', error);
      return [];
    }
  }
  
  /**
   * 默认天气（离线或获取失败时使用）
   */
  getDefaultWeather(): WeatherData {
    return {
      temperature: 20,
      humidity: 60,
      precipitation: 0,
      weatherCode: 2,
      isDay: true,
      sunlight: 0.7,
      updatedAt: Date.now(),
    };
  }
  
  /**
   * 获取当前天气
   */
  getCurrentWeather(): WeatherData {
    return this.currentWeather || this.getDefaultWeather();
  }
  
  /**
   * 获取天气描述
   */
  getWeatherDescription(): string {
    const weather = this.getCurrentWeather();
    return WEATHER_DESC[weather.weatherCode] || '未知';
  }
  
  /**
   * 获取天气 emoji
   */
  getWeatherEmoji(): string {
    const weather = this.getCurrentWeather();
    return WEATHER_EMOJI[weather.weatherCode] || '🌤';
  }
  
  /**
   * 判断是否下雨/下雪
   */
  isPrecipitating(): boolean {
    const weather = this.getCurrentWeather();
    return weather.weatherCode >= 51;
  }
  
  /**
   * 格式化日期为 YYYY-MM-DD
   */
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

// 单例
export const weatherManager = new WeatherManager();
