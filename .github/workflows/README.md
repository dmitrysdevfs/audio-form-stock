# GitHub Actions Workflows

## Overview

This directory contains GitHub Actions workflows for automating stock data updates and keeping the Render server alive.

## Workflows

### 1. Daily Stock Update (`update-stocks.yml`)

Updates stock data from Polygon.io API daily after market close.

**Schedule:** 6:00 PM EST (23:00 UTC) every day

**Process:**

- Wakes up Render server
- Processes 7 batches of 50 companies each (330 total)
- Each batch takes ~10 minutes (50 companies × 12 seconds rate limit)
- Total runtime: ~70 minutes
- Verifies update completion

**Manual Trigger:** Can be triggered manually via GitHub Actions UI

### 2. Keep Alive (`keep-alive.yml`)

Pings the Render server every 10 minutes during business hours to prevent it from sleeping.

**Schedule:** Every 10 minutes from 9 AM - 6 PM EST (14:00-23:00 UTC)

**Process:**

- Sends health check request to server
- Logs response code
- Prevents Render free plan from sleeping during active hours

## Configuration

### Required Secrets

Add these secrets in GitHub repository settings (Settings → Secrets → Actions):

1. `RENDER_URL` - Your Render deployment URL (e.g., `https://your-app.onrender.com`)

### Rate Limiting

Polygon.io free plan limits:

- 3 API calls per minute (conservative approach)
- 22 seconds between calls (implemented in backend)
- 10 companies per batch = ~3.7 minutes per batch
- 330 companies = 33 batches = ~2 hours total

## Usage

### Manual Trigger

1. Go to GitHub repository → Actions tab
2. Select "Daily Stock Update" workflow
3. Click "Run workflow" button
4. Select branch and click "Run workflow"

### Monitoring

- Check Actions tab for workflow runs
- View logs for each step
- Check Render logs for backend processing details

## Notes

- Render free plan spins down after 15 minutes of inactivity
- Keep-alive workflow prevents this during business hours
- Daily update runs after market close (6 PM EST)
- Each batch processes 50 companies with proper rate limiting
- Errors are logged but don't stop the workflow
