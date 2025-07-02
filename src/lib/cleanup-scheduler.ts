// Utility functions for scheduling and running data cleanup

export interface CleanupResult {
  success: boolean;
  deletedCount: number;
  cutoffDate: string;
  message: string;
  error?: string;
}

/**
 * Runs the cleanup API endpoint to delete old submissions
 * This can be called from various triggers (cron, manual, etc.)
 */
export async function runCleanupTask(): Promise<CleanupResult> {
  try {
    // Get the base URL for the API call
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const cleanupUrl = `${baseUrl}/api/cleanup-old-submissions`;

    console.log('Running TM30 submissions cleanup task...');

    const response = await fetch(cleanupUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (result.success) {
      console.log(`Cleanup completed: ${result.message}`);
      return {
        success: true,
        deletedCount: result.deletedCount,
        cutoffDate: result.cutoffDate,
        message: result.message
      };
    } else {
      console.error('Cleanup failed:', result.error);
      return {
        success: false,
        deletedCount: 0,
        cutoffDate: '',
        message: result.error || 'Unknown error',
        error: result.details
      };
    }
  } catch (error) {
    console.error('Error running cleanup task:', error);
    return {
      success: false,
      deletedCount: 0,
      cutoffDate: '',
      message: 'Failed to run cleanup task',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Checks what records would be deleted without actually deleting them
 */
export async function previewCleanup(): Promise<{ success: boolean; recordsFound?: number; error?: string; details?: string }> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const previewUrl = `${baseUrl}/api/cleanup-old-submissions`;

    const response = await fetch(previewUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await response.json();
  } catch (error) {
    console.error('Error previewing cleanup:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Simple interval-based scheduler (for development)
 * In production, you'd use a proper cron service like Vercel Cron or external cron
 */
export function startCleanupScheduler(intervalHours = 24) {
  const intervalMs = intervalHours * 60 * 60 * 1000; // Convert hours to milliseconds

  console.log(`Starting TM30 cleanup scheduler (runs every ${intervalHours} hours)`);

  // Run immediately on startup
  setTimeout(runCleanupTask, 5000); // Wait 5 seconds after startup

  // Then run on schedule
  const intervalId = setInterval(() => {
    runCleanupTask();
  }, intervalMs);

  // Return the interval ID so it can be cleared if needed
  return intervalId;
}

/**
 * One-time cleanup for manual execution
 */
export async function manualCleanup(): Promise<CleanupResult> {
  console.log('Running manual TM30 submissions cleanup...');
  return await runCleanupTask();
}
