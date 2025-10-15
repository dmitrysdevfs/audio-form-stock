/**
 * Timezone utilities for stock market data updates
 * Handles UTC, Eastern Time (ET), and Kyiv time conversions
 */

export interface MarketHours {
  preMarketStart: string; // 4:00 AM ET
  regularMarketStart: string; // 9:30 AM ET
  regularMarketEnd: string; // 4:00 PM ET
  afterHoursEnd: string; // 8:00 PM ET
}

export interface MarketStatus {
  isMarketOpen: boolean;
  isPreMarket: boolean;
  isAfterHours: boolean;
  nextMarketOpen: Date;
  nextMarketClose: Date;
  currentSession: 'pre-market' | 'regular' | 'after-hours' | 'closed';
}

export class TimezoneUtils {
  private static readonly MARKET_HOURS: MarketHours = {
    preMarketStart: '04:00',
    regularMarketStart: '09:30',
    regularMarketEnd: '16:00',
    afterHoursEnd: '20:00',
  };

  /**
   * Get current time in different timezones
   */
  static getCurrentTimes() {
    const now = new Date();

    return {
      utc: now,
      eastern: this.toEasternTime(now),
      kyiv: this.toKyivTime(now),
    };
  }

  /**
   * Get current time in different timezones with formatted strings
   */
  static getCurrentTimesFormatted() {
    const now = new Date();

    return {
      utc: now.toISOString(),
      eastern: this.formatEasternTime(now),
      kyiv: this.formatKyivTime(now),
      system: now.toString(),
    };
  }

  /**
   * Parse timezone formatted string to Date object
   */
  private static parseTimezoneString(timezoneString: string): Date {
    const parts = timezoneString.split(', ');
    if (parts.length !== 2) {
      throw new Error('Invalid timezone conversion');
    }

    const datePart = parts[0] || '';
    const timePart = parts[1] || '';
    const dateComponents = datePart.split('/');
    const timeComponents = timePart.split(':');

    if (dateComponents.length !== 3 || timeComponents.length !== 3) {
      throw new Error('Invalid date/time format');
    }

    const month = dateComponents[0] || '01';
    const day = dateComponents[1] || '01';
    const year = dateComponents[2] || '2025';
    const hour = timeComponents[0] || '00';
    const minute = timeComponents[1] || '00';
    const second = timeComponents[2] || '00';

    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    );
  }

  /**
   * Convert UTC time to Eastern Time (ET)
   * Handles both EST (UTC-5) and EDT (UTC-4) automatically
   */
  static toEasternTime(utcDate: Date): Date {
    // Use JavaScript's built-in timezone handling
    const easternTimeString = utcDate.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    return this.parseTimezoneString(easternTimeString);
  }

  /**
   * Convert UTC time to Kyiv time (EET/EEST)
   * Handles both EET (UTC+2) and EEST (UTC+3) automatically
   */
  static toKyivTime(utcDate: Date): Date {
    // Use JavaScript's built-in timezone handling for Kyiv
    const kyivTimeString = utcDate.toLocaleString('en-US', {
      timeZone: 'Europe/Kyiv',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    // Parse the string to get Kyiv time components
    const parts = kyivTimeString.split(', ');
    if (parts.length !== 2) {
      throw new Error('Invalid timezone conversion');
    }

    const datePart = parts[0] || '';
    const timePart = parts[1] || '';
    const dateComponents = datePart.split('/');
    const timeComponents = timePart.split(':');

    if (dateComponents.length !== 3 || timeComponents.length !== 3) {
      throw new Error('Invalid date/time format');
    }

    const month = dateComponents[0] || '01';
    const day = dateComponents[1] || '01';
    const year = dateComponents[2] || '2025';
    const hour = timeComponents[0] || '00';
    const minute = timeComponents[1] || '00';
    const second = timeComponents[2] || '00';

    // Create Date object with Kyiv time components
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    );
  }

  /**
   * Convert Eastern Time to Kyiv time
   */
  static easternToKyiv(easternDate: Date): Date {
    const utc = this.easternToUTC(easternDate);
    return this.toKyivTime(utc);
  }

  /**
   * Convert Eastern Time to UTC
   */
  static easternToUTC(easternDate: Date): Date {
    // Create a date in Eastern timezone and convert to UTC
    const easternTimeString = easternDate.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    // Parse as if it's UTC, then adjust for timezone offset
    const tempDate = new Date(easternTimeString);
    const offset =
      easternDate.getTimezoneOffset() - this.getEasternOffset(easternDate);
    return new Date(tempDate.getTime() + offset * 60000);
  }

  /**
   * Get Eastern timezone offset for a given date
   */
  private static getEasternOffset(date: Date): number {
    // Use JavaScript's built-in timezone handling
    const easternTime = new Date(
      date.toLocaleString('en-US', { timeZone: 'America/New_York' })
    );
    const utcTime = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));

    // Calculate offset in minutes
    const offsetMs = easternTime.getTime() - utcTime.getTime();
    return Math.round(offsetMs / (1000 * 60));
  }

  /**
   * Check if date is during daylight saving time in Eastern timezone
   */
  private static isDaylightSavingTime(date: Date): boolean {
    // Use JavaScript's built-in timezone handling
    const easternTime = new Date(
      date.toLocaleString('en-US', { timeZone: 'America/New_York' })
    );
    const utcTime = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));

    // If Eastern time is 4 hours behind UTC, it's EDT (DST)
    // If Eastern time is 5 hours behind UTC, it's EST (no DST)
    const offsetHours =
      (easternTime.getTime() - utcTime.getTime()) / (1000 * 60 * 60);
    return offsetHours === -4;
  }

  /**
   * Check if date falls on weekend
   */
  static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  }

  /**
   * Check if we should sleep until market opens
   */
  static shouldSleepUntilMarketOpen(marketStatus: MarketStatus): boolean {
    if (marketStatus.currentSession !== 'closed') {
      return false;
    }

    const timeToOpen =
      marketStatus.nextMarketOpen.getTime() - new Date().getTime();
    const thirtyMinutesBeforeOpen = timeToOpen - 30 * 60 * 1000;

    return thirtyMinutesBeforeOpen > 0;
  }

  /**
   * Get market status for current time
   */
  static getMarketStatus(): MarketStatus {
    const now = new Date();
    const easternTime = this.toEasternTime(now);

    const currentTime = easternTime.toTimeString().slice(0, 5); // HH:MM format

    // Market is closed on weekends
    if (this.isWeekend(easternTime)) {
      const nextMonday = this.getNextMonday(easternTime);
      const nextMarketOpen = this.getMarketOpenTime(nextMonday);
      const nextMarketClose = this.getMarketCloseTime(nextMonday);

      return {
        isMarketOpen: false,
        isPreMarket: false,
        isAfterHours: false,
        nextMarketOpen,
        nextMarketClose,
        currentSession: 'closed',
      };
    }

    // Check market sessions
    const isPreMarket =
      currentTime >= this.MARKET_HOURS.preMarketStart &&
      currentTime < this.MARKET_HOURS.regularMarketStart;

    const isRegularMarket =
      currentTime >= this.MARKET_HOURS.regularMarketStart &&
      currentTime < this.MARKET_HOURS.regularMarketEnd;

    const isAfterHours =
      currentTime >= this.MARKET_HOURS.regularMarketEnd &&
      currentTime < this.MARKET_HOURS.afterHoursEnd;

    const isMarketOpen = isPreMarket || isRegularMarket || isAfterHours;

    let currentSession: 'pre-market' | 'regular' | 'after-hours' | 'closed';
    if (isPreMarket) currentSession = 'pre-market';
    else if (isRegularMarket) currentSession = 'regular';
    else if (isAfterHours) currentSession = 'after-hours';
    else currentSession = 'closed';

    // Calculate next market open/close
    let nextMarketOpen: Date;
    let nextMarketClose: Date;

    if (currentSession === 'closed') {
      nextMarketOpen = this.getNextMarketOpen(easternTime);
      nextMarketClose = this.getNextMarketClose(easternTime);
    } else {
      nextMarketOpen = this.getNextMarketOpen(easternTime);
      nextMarketClose = this.getNextMarketClose(easternTime);
    }

    return {
      isMarketOpen,
      isPreMarket,
      isAfterHours,
      nextMarketOpen,
      nextMarketClose,
      currentSession,
    };
  }

  /**
   * Get next Monday date
   */
  private static getNextMonday(date: Date): Date {
    const nextMonday = new Date(date);
    const daysUntilMonday = (8 - date.getDay()) % 7;
    nextMonday.setDate(
      date.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday)
    );
    return nextMonday;
  }

  /**
   * Get market open time for a given date
   */
  private static getMarketOpenTime(date: Date): Date {
    const marketOpen = new Date(date);
    const timeParts = this.MARKET_HOURS.regularMarketStart
      .split(':')
      .map(Number);
    const hours = timeParts[0] || 9;
    const minutes = timeParts[1] || 30;
    marketOpen.setHours(hours, minutes, 0, 0);
    return this.easternToUTC(marketOpen);
  }

  /**
   * Get market close time for a given date
   */
  private static getMarketCloseTime(date: Date): Date {
    const marketClose = new Date(date);
    const timeParts = this.MARKET_HOURS.regularMarketEnd.split(':').map(Number);
    const hours = timeParts[0] || 16;
    const minutes = timeParts[1] || 0;
    marketClose.setHours(hours, minutes, 0, 0);
    return this.easternToUTC(marketClose);
  }

  /**
   * Get next market open time
   */
  private static getNextMarketOpen(currentEasternTime: Date): Date {
    const today = new Date(currentEasternTime);
    const currentTime = today.toTimeString().slice(0, 5);

    // If before 9:30 AM today, market opens today
    if (currentTime < this.MARKET_HOURS.regularMarketStart) {
      return this.getMarketOpenTime(today);
    }

    // Otherwise, next market open is tomorrow (or Monday if weekend)
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // If tomorrow is weekend, get next Monday
    if (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
      return this.getMarketOpenTime(this.getNextMonday(tomorrow));
    }

    return this.getMarketOpenTime(tomorrow);
  }

  /**
   * Get next market close time
   */
  private static getNextMarketClose(currentEasternTime: Date): Date {
    const today = new Date(currentEasternTime);
    const currentTime = today.toTimeString().slice(0, 5);

    // If before 4:00 PM today, market closes today
    if (currentTime < this.MARKET_HOURS.regularMarketEnd) {
      return this.getMarketCloseTime(today);
    }

    // Otherwise, next market close is tomorrow (or Monday if weekend)
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // If tomorrow is weekend, get next Monday
    if (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
      return this.getMarketCloseTime(this.getNextMonday(tomorrow));
    }

    return this.getMarketCloseTime(tomorrow);
  }

  /**
   * Get optimal update schedule based on market status and Kyiv time
   */
  static getOptimalUpdateSchedule(): {
    shouldUpdate: boolean;
    nextUpdateTime: Date;
    reason: string;
    marketStatus: MarketStatus;
  } {
    const marketStatus = this.getMarketStatus();
    const kyivTime = this.toKyivTime(new Date());

    // During regular market hours: update every 15 minutes
    if (marketStatus.currentSession === 'regular') {
      const nextUpdate = new Date(kyivTime.getTime() + 15 * 60 * 1000);
      return {
        shouldUpdate: true,
        nextUpdateTime: nextUpdate,
        reason: 'Regular market hours - frequent updates',
        marketStatus,
      };
    }

    // During pre-market: update every 30 minutes
    if (marketStatus.currentSession === 'pre-market') {
      const nextUpdate = new Date(kyivTime.getTime() + 30 * 60 * 1000);
      return {
        shouldUpdate: true,
        nextUpdateTime: nextUpdate,
        reason: 'Pre-market hours - moderate updates',
        marketStatus,
      };
    }

    // During after-hours: update every 30 minutes
    if (marketStatus.currentSession === 'after-hours') {
      const nextUpdate = new Date(kyivTime.getTime() + 30 * 60 * 1000);
      return {
        shouldUpdate: true,
        nextUpdateTime: nextUpdate,
        reason: 'After-hours trading - moderate updates',
        marketStatus,
      };
    }

    // Market is closed: check if we should sleep until market opens
    if (marketStatus.currentSession === 'closed') {
      const timeToOpen =
        marketStatus.nextMarketOpen.getTime() - new Date().getTime();
      const thirtyMinutesBeforeOpen = timeToOpen - 30 * 60 * 1000;

      // If more than 30 minutes until open, sleep until 30 minutes before
      if (thirtyMinutesBeforeOpen > 0) {
        return {
          shouldUpdate: false,
          nextUpdateTime: new Date(
            new Date().getTime() + thirtyMinutesBeforeOpen
          ),
          reason: 'Market closed - sleeping until 30 minutes before open',
          marketStatus,
        };
      }

      // Less than 30 minutes until open, start updating
      const nextUpdate = new Date(kyivTime.getTime() + 5 * 60 * 1000); // Every 5 minutes
      return {
        shouldUpdate: true,
        nextUpdateTime: nextUpdate,
        reason: 'Market opening soon - preparing for updates',
        marketStatus,
      };
    }

    return {
      shouldUpdate: false,
      nextUpdateTime: marketStatus.nextMarketOpen,
      reason: 'No updates needed',
      marketStatus,
    };
  }

  /**
   * Format time for display in Kyiv timezone
   */
  static formatKyivTime(date: Date): string {
    return date.toLocaleString('uk-UA', {
      timeZone: 'Europe/Kyiv',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  /**
   * Format time for display in Eastern timezone
   */
  static formatEasternTime(date: Date): string {
    return date.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}
