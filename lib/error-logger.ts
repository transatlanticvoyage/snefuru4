interface LogParams {
  category: string;
  message: string;
  details?: any;
  stack_trace?: string;
  batch_id?: string;
  plan_id?: string;
  job_id?: string;
  user_id?: string;
}

class ErrorLogger {
  private baseUrl: string;

  constructor() {
    // Use current origin for API calls
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  }

  private async log(level: 'error' | 'warning' | 'info' | 'debug', params: LogParams) {
    try {
      const response = await fetch(`${this.baseUrl}/api/error-logs/add-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          ...params
        })
      });
      
      if (!response.ok) {
        console.error(`Failed to log ${level}:`, await response.text());
      }
    } catch (err) {
      console.error(`Failed to send ${level} log to API:`, err);
    }
  }

  async error(params: LogParams) {
    console.error(`[ERROR] [${params.category}] ${params.message}`, params.details);
    return this.log('error', params);
  }

  async warning(params: LogParams) {
    console.warn(`[WARNING] [${params.category}] ${params.message}`, params.details);
    return this.log('warning', params);
  }

  async info(params: LogParams) {
    console.info(`[INFO] [${params.category}] ${params.message}`, params.details);
    return this.log('info', params);
  }

  async debug(params: LogParams) {
    console.debug(`[DEBUG] [${params.category}] ${params.message}`, params.details);
    return this.log('debug', params);
  }

  // Convenience method for catching and logging errors with stack traces
  async logError(error: Error | unknown, params: Omit<LogParams, 'stack_trace'>) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    return this.error({
      ...params,
      message: params.message || errorObj.message,
      details: { 
        ...params.details, 
        errorName: errorObj.name,
        originalMessage: errorObj.message 
      },
      stack_trace: errorObj.stack
    });
  }

  // Convenience method for background job logging
  async logJobError(error: Error | unknown, jobId: string, category: string = 'background_job') {
    return this.logError(error, {
      category,
      message: `Job ${jobId} failed`,
      job_id: jobId
    });
  }

  // Convenience method for image generation logging
  async logImageError(error: Error | unknown, planId: string, batchId?: string) {
    return this.logError(error, {
      category: 'image_generation',
      message: `Image generation failed for plan ${planId}`,
      plan_id: planId,
      batch_id: batchId
    });
  }

  // Convenience method for API logging
  async logApiError(error: Error | unknown, endpoint: string, params?: any) {
    return this.logError(error, {
      category: 'api_error',
      message: `API error at ${endpoint}`,
      details: { endpoint, params }
    });
  }

  // Method to log system events
  async logSystemEvent(message: string, details?: any, level: 'info' | 'debug' = 'info') {
    return this.log(level, {
      category: 'system',
      message,
      details
    });
  }

  // Method to log performance metrics
  async logPerformance(operation: string, duration: number, details?: any) {
    return this.info({
      category: 'performance',
      message: `${operation} completed in ${duration}ms`,
      details: { operation, duration, ...details }
    });
  }

  // Method to log user actions
  async logUserAction(action: string, userId?: string, details?: any) {
    return this.info({
      category: 'user_action',
      message: `User action: ${action}`,
      details: { action, ...details },
      user_id: userId
    });
  }
}

// Export singleton instance
export const logger = new ErrorLogger();

// Export convenience functions for direct use
export const logError = (error: Error | unknown, params: Omit<LogParams, 'stack_trace'>) => 
  logger.logError(error, params);

export const logJobError = (error: Error | unknown, jobId: string, category?: string) => 
  logger.logJobError(error, jobId, category);

export const logImageError = (error: Error | unknown, planId: string, batchId?: string) => 
  logger.logImageError(error, planId, batchId);

export const logApiError = (error: Error | unknown, endpoint: string, params?: any) => 
  logger.logApiError(error, endpoint, params);

export const logSystemEvent = (message: string, details?: any, level?: 'info' | 'debug') => 
  logger.logSystemEvent(message, details, level);

export const logPerformance = (operation: string, duration: number, details?: any) => 
  logger.logPerformance(operation, duration, details);

export const logUserAction = (action: string, userId?: string, details?: any) => 
  logger.logUserAction(action, userId, details); 