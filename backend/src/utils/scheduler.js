import cron from 'node-cron';
import dataSyncService from '../services/dataSync.js';

class CronScheduler {
  constructor() {
    this.jobs = [];
  }

  /**
   * Start daily sync at 2 AM
   */
  startDailySync() {
    // Run at 2:00 AM every day
    const job = cron.schedule('0 2 * * *', async () => {
      console.log('Starting scheduled daily sync...');
      try {
        const result = await dataSyncService.syncAllClients();
        console.log('Daily sync completed:', result);
      } catch (error) {
        console.error('Daily sync failed:', error);
      }
    });

    this.jobs.push(job);
    console.log('Daily sync scheduled at 2:00 AM');
  }

  /**
   * Start hourly sync (optional, for more frequent updates)
   */
  startHourlySync() {
    // Run at the start of every hour
    const job = cron.schedule('0 * * * *', async () => {
      console.log('Starting scheduled hourly sync...');
      try {
        const result = await dataSyncService.syncAllClients();
        console.log('Hourly sync completed:', result);
      } catch (error) {
        console.error('Hourly sync failed:', error);
      }
    });

    this.jobs.push(job);
    console.log('Hourly sync scheduled');
  }

  /**
   * Start all scheduled tasks
   */
  startAll() {
    this.startDailySync();
    // Uncomment the line below if you want hourly syncs
    // this.startHourlySync();
  }

  /**
   * Stop all scheduled tasks
   */
  stopAll() {
    this.jobs.forEach(job => job.stop());
    console.log('All scheduled tasks stopped');
  }
}

export default new CronScheduler();
