/**
 * Schedule service for managing stock data updates based on market hours and Kyiv timezone
 */

import { TimezoneUtils } from '../utils/timezoneUtils.js';
import { PolygonService } from './polygonService.js';

export interface UpdateSchedule {
  isScheduled: boolean;
  nextUpdate: Date;
  reason: string;
  marketStatus: string;
  kyivTime: string;
  easternTime: string;
}

export class ScheduleService {
  private polygonService: PolygonService;

  constructor() {
    this.polygonService = new PolygonService();
  }

  /**
   * Get current update schedule information
   */
  getUpdateSchedule(): UpdateSchedule {
    const schedule = this.polygonService.getOptimalUpdateSchedule();
    const times = this.polygonService.getCurrentTimes();
    const marketStatus = this.polygonService.getMarketStatus();

    return {
      isScheduled: schedule.shouldUpdate,
      nextUpdate: schedule.nextUpdateTime,
      reason: schedule.reason,
      marketStatus: marketStatus.currentSession,
      kyivTime: TimezoneUtils.formatKyivTime(times.kyiv),
      easternTime: TimezoneUtils.formatEasternTime(times.eastern),
    };
  }

  /**
   * Check if update should be performed now
   */
  shouldUpdateNow(forceUpdate = false): {
    shouldUpdate: boolean;
    reason: string;
    nextUpdate?: Date;
    marketInfo: string;
  } {
    const schedule = this.polygonService.getOptimalUpdateSchedule();
    const marketStatus = this.polygonService.getMarketStatus();

    let shouldUpdate = schedule.shouldUpdate;
    let reason = schedule.reason;

    if (forceUpdate) {
      shouldUpdate = true;
      reason = 'Force update requested';
    }

    const marketInfo = `Market: ${marketStatus.currentSession} | Open: ${marketStatus.isMarketOpen} | Pre: ${marketStatus.isPreMarket} | After: ${marketStatus.isAfterHours}`;

    return {
      shouldUpdate,
      reason,
      nextUpdate: schedule.nextUpdateTime,
      marketInfo,
    };
  }

  /**
   * Get detailed market and timezone information
   */
  getDetailedInfo(): {
    timezones: {
      utc: string;
      eastern: string;
      kyiv: string;
      system: string;
    };
    market: {
      status: string;
      isOpen: boolean;
      isPreMarket: boolean;
      isAfterHours: boolean;
      nextOpen: string;
      nextClose: string;
    };
    schedule: {
      shouldUpdate: boolean;
      reason: string;
      nextUpdate: string;
    };
  } {
    const times = this.polygonService.getCurrentTimesFormatted();
    const marketStatus = this.polygonService.getMarketStatus();
    const schedule = this.polygonService.getOptimalUpdateSchedule();

    return {
      timezones: {
        utc: times.utc,
        eastern: times.eastern,
        kyiv: times.kyiv,
        system: times.system,
      },
      market: {
        status: marketStatus.currentSession,
        isOpen: marketStatus.isMarketOpen,
        isPreMarket: marketStatus.isPreMarket,
        isAfterHours: marketStatus.isAfterHours,
        nextOpen: TimezoneUtils.formatKyivTime(marketStatus.nextMarketOpen),
        nextClose: TimezoneUtils.formatKyivTime(marketStatus.nextMarketClose),
      },
      schedule: {
        shouldUpdate: schedule.shouldUpdate,
        reason: schedule.reason,
        nextUpdate: schedule.nextUpdateTime
          ? TimezoneUtils.formatKyivTime(schedule.nextUpdateTime)
          : 'N/A',
      },
    };
  }

  /**
   * Calculate optimal batch processing schedule
   */
  getBatchSchedule(totalBatches: number): {
    recommendedBatches: number;
    timeBetweenBatches: number;
    totalEstimatedTime: string;
    nextBatchTime?: Date;
    sessionInfo: string;
  } {
    const marketStatus = this.polygonService.getMarketStatus();
    const schedule = this.polygonService.getOptimalUpdateSchedule();

    let timeBetweenBatches = 18000; // 18 seconds default
    let recommendedBatches = totalBatches;
    let sessionInfo = '';

    // Adjust based on market session
    switch (marketStatus.currentSession) {
      case 'regular':
        // Regular market hours: fastest updates
        timeBetweenBatches = 15000; // 15 seconds
        recommendedBatches = totalBatches;
        sessionInfo = 'Regular market hours - high frequency updates';
        break;

      case 'pre-market':
        // Pre-market: moderate updates
        timeBetweenBatches = 30000; // 30 seconds
        recommendedBatches = Math.min(totalBatches, 8);
        sessionInfo = 'Pre-market hours - moderate frequency updates';
        break;

      case 'after-hours':
        // After-hours: moderate updates
        timeBetweenBatches = 30000; // 30 seconds
        recommendedBatches = Math.min(totalBatches, 8);
        sessionInfo = 'After-hours trading - moderate frequency updates';
        break;

      case 'closed':
        // Market closed: minimal updates
        timeBetweenBatches = 60000; // 1 minute
        recommendedBatches = Math.min(totalBatches, 3);
        sessionInfo = 'Market closed - minimal updates';
        break;

      default:
        sessionInfo = 'Unknown market session';
    }

    const totalEstimatedTime = Math.round(
      (timeBetweenBatches * recommendedBatches) / 1000 / 60
    );
    const nextBatchTime = schedule.nextUpdateTime;

    return {
      recommendedBatches,
      timeBetweenBatches,
      totalEstimatedTime: `${totalEstimatedTime} minutes`,
      nextBatchTime,
      sessionInfo,
    };
  }

  /**
   * Get market hours information for display
   */
  getMarketHoursInfo(): {
    preMarket: string;
    regularMarket: string;
    afterHours: string;
    timezone: string;
  } {
    return {
      preMarket: '4:00 AM - 9:30 AM ET',
      regularMarket: '9:30 AM - 4:00 PM ET',
      afterHours: '4:00 PM - 8:00 PM ET',
      timezone: 'Eastern Time (ET)',
    };
  }

  /**
   * Get session-specific update recommendations
   */
  getSessionRecommendations(): {
    currentSession: string;
    updateFrequency: string;
    recommendedBatches: number;
    timeBetweenBatches: number;
    isOptimalTime: boolean;
    nextSessionChange: string;
  } {
    const marketStatus = this.polygonService.getMarketStatus();
    const batchSchedule = this.getBatchSchedule(10);

    let updateFrequency = '';
    let isOptimalTime = false;
    let nextSessionChange = '';

    switch (marketStatus.currentSession) {
      case 'regular':
        updateFrequency = 'Every 15 minutes';
        isOptimalTime = true;
        nextSessionChange = `After-hours starts at ${TimezoneUtils.formatKyivTime(
          marketStatus.nextMarketClose
        )}`;
        break;

      case 'pre-market':
        updateFrequency = 'Every 30 minutes';
        isOptimalTime = false;
        nextSessionChange = `Regular market starts at ${TimezoneUtils.formatKyivTime(
          marketStatus.nextMarketOpen
        )}`;
        break;

      case 'after-hours':
        updateFrequency = 'Every 30 minutes';
        isOptimalTime = false;
        nextSessionChange = `Market closes at ${TimezoneUtils.formatKyivTime(
          marketStatus.nextMarketClose
        )}`;
        break;

      case 'closed':
        updateFrequency = 'Minimal updates';
        isOptimalTime = false;
        nextSessionChange = `Market opens at ${TimezoneUtils.formatKyivTime(
          marketStatus.nextMarketOpen
        )}`;
        break;

      default:
        updateFrequency = 'Unknown';
        isOptimalTime = false;
        nextSessionChange = 'Unknown';
    }

    return {
      currentSession: marketStatus.currentSession,
      updateFrequency,
      recommendedBatches: batchSchedule.recommendedBatches,
      timeBetweenBatches: batchSchedule.timeBetweenBatches,
      isOptimalTime,
      nextSessionChange,
    };
  }

  /**
   * Log comprehensive schedule information
   */
  logScheduleInfo(): void {
    const info = this.getDetailedInfo();
    const batchSchedule = this.getBatchSchedule(10);
    const marketHours = this.getMarketHoursInfo();
    const sessionRecommendations = this.getSessionRecommendations();

    console.log('\n=== SCHEDULE SERVICE INFORMATION ===');
    console.log('TIMEZONES:');
    console.log(`  UTC: ${info.timezones.utc}`);
    console.log(`  Eastern: ${info.timezones.eastern}`);
    console.log(`  Kyiv: ${info.timezones.kyiv}`);
    console.log(`  System: ${info.timezones.system}`);

    console.log('\nMARKET STATUS:');
    console.log(`  Status: ${info.market.status}`);
    console.log(`  Open: ${info.market.isOpen}`);
    console.log(`  Pre-Market: ${info.market.isPreMarket}`);
    console.log(`  After Hours: ${info.market.isAfterHours}`);
    console.log(`  Next Open: ${info.market.nextOpen}`);
    console.log(`  Next Close: ${info.market.nextClose}`);

    console.log('\nUPDATE SCHEDULE:');
    console.log(`  Should Update: ${info.schedule.shouldUpdate}`);
    console.log(`  Reason: ${info.schedule.reason}`);
    console.log(`  Next Update: ${info.schedule.nextUpdate}`);

    console.log('\nSESSION RECOMMENDATIONS:');
    console.log(`  Current Session: ${sessionRecommendations.currentSession}`);
    console.log(
      `  Update Frequency: ${sessionRecommendations.updateFrequency}`
    );
    console.log(`  Is Optimal Time: ${sessionRecommendations.isOptimalTime}`);
    console.log(
      `  Next Session Change: ${sessionRecommendations.nextSessionChange}`
    );

    console.log('\nBATCH PROCESSING:');
    console.log(`  Session Info: ${batchSchedule.sessionInfo}`);
    console.log(`  Recommended Batches: ${batchSchedule.recommendedBatches}`);
    console.log(
      `  Time Between Batches: ${batchSchedule.timeBetweenBatches}ms`
    );
    console.log(`  Estimated Total Time: ${batchSchedule.totalEstimatedTime}`);

    console.log('\nMARKET HOURS:');
    console.log(`  Pre-Market: ${marketHours.preMarket}`);
    console.log(`  Regular Market: ${marketHours.regularMarket}`);
    console.log(`  After Hours: ${marketHours.afterHours}`);
    console.log(`  Timezone: ${marketHours.timezone}`);
    console.log('=====================================\n');
  }
}
