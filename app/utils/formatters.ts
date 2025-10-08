/**
 * Utility functions for formatting financial data
 */

/**
 * Formats market capitalization value with currency symbol and commas
 * @param value - Market cap value in dollars
 * @returns Formatted string with currency symbol after amount (e.g., "3,000,000,000 $")
 */
export const formatMarketCap = (value: number): string => {
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} $`;
};

/**
 * Formats stock price with USD suffix
 * @param value - Stock price value
 * @returns Formatted string (e.g., "150.25 USD")
 */
export const formatPrice = (value: number): string => `${value.toFixed(2)} USD`;

/**
 * Formats percentage change with appropriate sign
 * @param value - Percentage change value
 * @returns Formatted string with sign (e.g., "+1.45%" or "-2.33%")
 */
export const formatChangePercentage = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};
