/**
 * Productivity Mapping Tracker
 * Categorizes applications and websites for productivity scoring
 */

import { BrowserWindow } from 'electron';
import log from 'electron-log';
import { 
  ProductivityActivity,
  ProductivityCategory,
  ProductivityRules,
  ProductivityEventPayload,
  ActivityTrackingError,
  ActivityErrorCodes 
} from '../../shared/types/activity';
import { IPC_CHANNELS } from '../../shared/constants/IPC_CHANNELS';

interface ProductivityStats {
  productiveSeconds: number;
  neutralSeconds: number;
  unproductiveSeconds: number;
  blockedSeconds: number;
  totalSeconds: number;
  score: number; // 0-100
  lastUpdate: number;
}

interface AppProductivityData {
  category: ProductivityCategory;
  timeSpent: number;
  lastActive: number;
  score: number;
}

export class ProductivityTracker {
  private mainWindow: BrowserWindow | null = null;
  private stats: ProductivityStats = {
    productiveSeconds: 0,
    neutralSeconds: 0,
    unproductiveSeconds: 0,
    blockedSeconds: 0,
    totalSeconds: 0,
    score: 0,
    lastUpdate: Date.now()
  };

  private appProductivityMap: Map<string, AppProductivityData> = new Map();
  private domainProductivityMap: Map<string, AppProductivityData> = new Map();
  
  // Default productivity rules
  private productivityRules: ProductivityRules = {
    productiveApps: [
      'Visual Studio Code',
      'IntelliJ IDEA',
      'WebStorm',
      'Sublime Text',
      'Atom',
      'Vim',
      'Emacs',
      'Eclipse',
      'Xcode',
      'Android Studio',
      'PyCharm',
      'PhpStorm',
      'RubyMine',
      'CLion',
      'DataGrip',
      'GoLand',
      'Rider',
      'AppCode',
      'Terminal',
      'iTerm',
      'Command Prompt',
      'PowerShell',
      'Git',
      'Docker',
      'Postman',
      'Insomnia',
      'TablePlus',
      'Sequel Pro',
      'MongoDB Compass',
      'Robo 3T',
      'Figma',
      'Sketch',
      'Adobe XD',
      'Photoshop',
      'Illustrator'
    ],
    neutralApps: [
      'Finder',
      'File Explorer',
      'Nautilus',
      'Calculator',
      'Calendar',
      'Mail',
      'Outlook',
      'Notes',
      'TextEdit',
      'Notepad',
      'System Preferences',
      'Control Panel',
      'Settings'
    ],
    unproductiveApps: [
      'Netflix',
      'YouTube',
      'Spotify',
      'iTunes',
      'Music',
      'VLC',
      'QuickTime',
      'Games',
      'Steam',
      'Epic Games',
      'Discord',
      'Slack', // Can be productive in work context
      'WhatsApp',
      'Telegram',
      'Signal',
      'Facebook',
      'Instagram',
      'Twitter',
      'TikTok',
      'Snapchat'
    ],
    blockedApps: [
      'Gambling',
      'Adult Content',
      'Malware'
    ],
    productiveDomains: [
      'github.com',
      'stackoverflow.com',
      'developer.mozilla.org',
      'docs.microsoft.com',
      'nodejs.org',
      'reactjs.org',
      'vuejs.org',
      'angular.io',
      'typescript.org',
      'python.org',
      'java.com',
      'oracle.com',
      'mysql.com',
      'postgresql.org',
      'mongodb.com',
      'redis.io',
      'docker.com',
      'kubernetes.io',
      'aws.amazon.com',
      'cloud.google.com',
      'azure.microsoft.com',
      'heroku.com',
      'netlify.com',
      'vercel.com',
      'codepen.io',
      'codesandbox.io',
      'repl.it',
      'leetcode.com',
      'hackerrank.com',
      'codewars.com',
      'freecodecamp.org',
      'coursera.org',
      'udemy.com',
      'pluralsight.com',
      'lynda.com',
      'edx.org',
      'khanacademy.org',
      'medium.com',
      'dev.to',
      'hashnode.com'
    ],
    unproductiveDomains: [
      'facebook.com',
      'instagram.com',
      'twitter.com',
      'tiktok.com',
      'snapchat.com',
      'reddit.com',
      'youtube.com',
      'netflix.com',
      'hulu.com',
      'twitch.tv',
      'gaming.com',
      'steam.com',
      'epicgames.com',
      'news.com',
      'cnn.com',
      'bbc.com',
      'buzzfeed.com',
      'entertainment.com'
    ],
    blockedDomains: [
      'gambling.com',
      'casino.com',
      'adult.com'
    ]
  };

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.loadCustomRules();
  }

  /**
   * Load custom productivity rules from storage
   */
  private async loadCustomRules(): Promise<void> {
    try {
      // In a real implementation, this would load from electron-store
      // For now, we use the default rules
      log.info('Productivity rules loaded');
    } catch (error) {
      log.error('Failed to load productivity rules:', error);
    }
  }

  /**
   * Update productivity tracking for an app
   */
  public updateProductivity(appName: string, seconds: number, domain?: string): void {
    try {
      // Determine category for app
      const appCategory = this.categorizeApp(appName);
      const appScore = this.getScoreForCategory(appCategory);

      // Update app productivity data
      const existingAppData = this.appProductivityMap.get(appName);
      this.appProductivityMap.set(appName, {
        category: appCategory,
        timeSpent: (existingAppData?.timeSpent || 0) + seconds,
        lastActive: Date.now(),
        score: appScore
      });

      // Update domain productivity if provided
      if (domain) {
        const domainCategory = this.categorizeDomain(domain);
        const domainScore = this.getScoreForCategory(domainCategory);
        
        const existingDomainData = this.domainProductivityMap.get(domain);
        this.domainProductivityMap.set(domain, {
          category: domainCategory,
          timeSpent: (existingDomainData?.timeSpent || 0) + seconds,
          lastActive: Date.now(),
          score: domainScore
        });

        // Use domain category if it's more specific than app category
        const finalCategory = this.getBetterCategory(appCategory, domainCategory);
        this.updateStats(finalCategory, seconds);
      } else {
        this.updateStats(appCategory, seconds);
      }

      // Create and emit productivity event
      const activity: ProductivityActivity = {
        id: `productivity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'productivity',
        timestamp: Date.now(),
        appName,
        category: appCategory,
        score: appScore,
        timeSpent: seconds,
        totalProductiveTime: this.stats.productiveSeconds,
        totalUnproductiveTime: this.stats.unproductiveSeconds,
        productivityRatio: this.calculateProductivityRatio()
      };

      this.emitProductivityEvent(activity);

      log.debug(`Productivity updated: ${appName} (${appCategory}) +${seconds}s`);

    } catch (error) {
      log.error('Failed to update productivity:', error);
      throw new ActivityTrackingError(
        'Failed to update productivity',
        ActivityErrorCodes.TRACKING_FAILED,
        error
      );
    }
  }

  /**
   * Categorize an application
   */
  private categorizeApp(appName: string): ProductivityCategory {
    const lowerAppName = appName.toLowerCase();

    // Check productive apps
    if (this.productivityRules.productiveApps.some(app => 
      lowerAppName.includes(app.toLowerCase()) || app.toLowerCase().includes(lowerAppName)
    )) {
      return ProductivityCategory.PRODUCTIVE;
    }

    // Check blocked apps
    if (this.productivityRules.blockedApps.some(app => 
      lowerAppName.includes(app.toLowerCase())
    )) {
      return ProductivityCategory.BLOCKED;
    }

    // Check unproductive apps
    if (this.productivityRules.unproductiveApps.some(app => 
      lowerAppName.includes(app.toLowerCase()) || app.toLowerCase().includes(lowerAppName)
    )) {
      return ProductivityCategory.UNPRODUCTIVE;
    }

    // Check neutral apps
    if (this.productivityRules.neutralApps.some(app => 
      lowerAppName.includes(app.toLowerCase()) || app.toLowerCase().includes(lowerAppName)
    )) {
      return ProductivityCategory.NEUTRAL;
    }

    // Default to neutral for unknown apps
    return ProductivityCategory.NEUTRAL;
  }

  /**
   * Categorize a domain
   */
  private categorizeDomain(domain: string): ProductivityCategory {
    const lowerDomain = domain.toLowerCase();

    // Check productive domains
    if (this.productivityRules.productiveDomains.some(d => 
      lowerDomain.includes(d) || d.includes(lowerDomain)
    )) {
      return ProductivityCategory.PRODUCTIVE;
    }

    // Check blocked domains
    if (this.productivityRules.blockedDomains.some(d => 
      lowerDomain.includes(d)
    )) {
      return ProductivityCategory.BLOCKED;
    }

    // Check unproductive domains
    if (this.productivityRules.unproductiveDomains.some(d => 
      lowerDomain.includes(d) || d.includes(lowerDomain)
    )) {
      return ProductivityCategory.UNPRODUCTIVE;
    }

    // Default to neutral for unknown domains
    return ProductivityCategory.NEUTRAL;
  }

  /**
   * Get better category between app and domain (more specific wins)
   */
  private getBetterCategory(appCategory: ProductivityCategory, domainCategory: ProductivityCategory): ProductivityCategory {
    // Blocked always wins
    if (appCategory === ProductivityCategory.BLOCKED || domainCategory === ProductivityCategory.BLOCKED) {
      return ProductivityCategory.BLOCKED;
    }

    // Productive beats neutral and unproductive
    if (appCategory === ProductivityCategory.PRODUCTIVE || domainCategory === ProductivityCategory.PRODUCTIVE) {
      return ProductivityCategory.PRODUCTIVE;
    }

    // Unproductive beats neutral
    if (appCategory === ProductivityCategory.UNPRODUCTIVE || domainCategory === ProductivityCategory.UNPRODUCTIVE) {
      return ProductivityCategory.UNPRODUCTIVE;
    }

    return ProductivityCategory.NEUTRAL;
  }

  /**
   * Get score for a category
   */
  private getScoreForCategory(category: ProductivityCategory): number {
    switch (category) {
      case ProductivityCategory.PRODUCTIVE:
        return 100;
      case ProductivityCategory.NEUTRAL:
        return 50;
      case ProductivityCategory.UNPRODUCTIVE:
        return 20;
      case ProductivityCategory.BLOCKED:
        return 0;
      default:
        return 50;
    }
  }

  /**
   * Update internal statistics
   */
  private updateStats(category: ProductivityCategory, seconds: number): void {
    switch (category) {
      case ProductivityCategory.PRODUCTIVE:
        this.stats.productiveSeconds += seconds;
        break;
      case ProductivityCategory.NEUTRAL:
        this.stats.neutralSeconds += seconds;
        break;
      case ProductivityCategory.UNPRODUCTIVE:
        this.stats.unproductiveSeconds += seconds;
        break;
      case ProductivityCategory.BLOCKED:
        this.stats.blockedSeconds += seconds;
        break;
    }

    this.stats.totalSeconds += seconds;
    this.stats.score = this.calculateProductivityScore();
    this.stats.lastUpdate = Date.now();
  }

  /**
   * Calculate overall productivity score
   */
  private calculateProductivityScore(): number {
    if (this.stats.totalSeconds === 0) return 0;

    const productiveWeight = 1.0;
    const neutralWeight = 0.5;
    const unproductiveWeight = 0.2;
    const blockedWeight = 0.0;

    const weightedScore = (
      this.stats.productiveSeconds * productiveWeight +
      this.stats.neutralSeconds * neutralWeight +
      this.stats.unproductiveSeconds * unproductiveWeight +
      this.stats.blockedSeconds * blockedWeight
    ) / this.stats.totalSeconds;

    return Math.round(weightedScore * 100);
  }

  /**
   * Calculate productivity ratio
   */
  private calculateProductivityRatio(): number {
    const totalActiveTime = this.stats.productiveSeconds + this.stats.unproductiveSeconds + this.stats.neutralSeconds;
    if (totalActiveTime === 0) return 0;
    
    return this.stats.productiveSeconds / totalActiveTime;
  }

  /**
   * Emit productivity event to renderer
   */
  private emitProductivityEvent(activity: ProductivityActivity): void {
    if (!this.mainWindow) return;

    const payload: ProductivityEventPayload = {
      event: activity,
      dailyStats: {
        productiveTime: this.stats.productiveSeconds,
        unproductiveTime: this.stats.unproductiveSeconds,
        neutralTime: this.stats.neutralSeconds,
        score: this.stats.score
      }
    };

    this.mainWindow.webContents.send(IPC_CHANNELS.MONITORING.PRODUCTIVITY_UPDATE, payload);
  }

  /**
   * Get current productivity statistics
   */
  public getProductivityStats(): ProductivityStats {
    return { ...this.stats };
  }

  /**
   * Get top productive apps
   */
  public getTopProductiveApps(limit = 10): Array<{ name: string; timeSpent: number; category: ProductivityCategory; score: number }> {
    return Array.from(this.appProductivityMap.entries())
      .filter(([_, data]) => data.category === ProductivityCategory.PRODUCTIVE)
      .map(([name, data]) => ({
        name,
        timeSpent: data.timeSpent,
        category: data.category,
        score: data.score
      }))
      .sort((a, b) => b.timeSpent - a.timeSpent)
      .slice(0, limit);
  }

  /**
   * Get top unproductive apps
   */
  public getTopUnproductiveApps(limit = 10): Array<{ name: string; timeSpent: number; category: ProductivityCategory; score: number }> {
    return Array.from(this.appProductivityMap.entries())
      .filter(([_, data]) => data.category === ProductivityCategory.UNPRODUCTIVE)
      .map(([name, data]) => ({
        name,
        timeSpent: data.timeSpent,
        category: data.category,
        score: data.score
      }))
      .sort((a, b) => b.timeSpent - a.timeSpent)
      .slice(0, limit);
  }

  /**
   * Get productivity breakdown by category
   */
  public getProductivityBreakdown(): { [key in ProductivityCategory]: { time: number; percentage: number } } {
    const total = this.stats.totalSeconds;
    
    return {
      [ProductivityCategory.PRODUCTIVE]: {
        time: this.stats.productiveSeconds,
        percentage: total > 0 ? (this.stats.productiveSeconds / total) * 100 : 0
      },
      [ProductivityCategory.NEUTRAL]: {
        time: this.stats.neutralSeconds,
        percentage: total > 0 ? (this.stats.neutralSeconds / total) * 100 : 0
      },
      [ProductivityCategory.UNPRODUCTIVE]: {
        time: this.stats.unproductiveSeconds,
        percentage: total > 0 ? (this.stats.unproductiveSeconds / total) * 100 : 0
      },
      [ProductivityCategory.BLOCKED]: {
        time: this.stats.blockedSeconds,
        percentage: total > 0 ? (this.stats.blockedSeconds / total) * 100 : 0
      }
    };
  }

  /**
   * Reset productivity statistics
   */
  public resetStats(): void {
    this.stats = {
      productiveSeconds: 0,
      neutralSeconds: 0,
      unproductiveSeconds: 0,
      blockedSeconds: 0,
      totalSeconds: 0,
      score: 0,
      lastUpdate: Date.now()
    };
    
    this.appProductivityMap.clear();
    this.domainProductivityMap.clear();
    
    log.info('Productivity statistics reset');
  }

  /**
   * Update productivity rules
   */
  public updateProductivityRules(rules: Partial<ProductivityRules>): void {
    this.productivityRules = {
      ...this.productivityRules,
      ...rules
    };
    
    log.info('Productivity rules updated');
  }

  /**
   * Get current productivity rules
   */
  public getProductivityRules(): ProductivityRules {
    return { ...this.productivityRules };
  }

  /**
   * Check if an app is productive
   */
  public isAppProductive(appName: string): boolean {
    return this.categorizeApp(appName) === ProductivityCategory.PRODUCTIVE;
  }

  /**
   * Check if a domain is productive
   */
  public isDomainProductive(domain: string): boolean {
    return this.categorizeDomain(domain) === ProductivityCategory.PRODUCTIVE;
  }
}
