import fs from 'fs/promises';
import path from 'path';

interface AILogEntry {
  timestamp: string;
  requestId: string;
  request: {
    intent: string;
    fieldType: string;
    groupType: string;
    hasScreenshot: boolean;
  };
  response: {
    success: boolean;
    data?: unknown;
    error?: string;
  };
  openAISent?: unknown;      // Exactly what we sent to OpenAI (includes system prompt)
  openAIReceived?: unknown;   // Exactly what we got back from OpenAI
  screenshot?: string;        // Base64 image
  duration?: number;
}

class AILogger {
  private logsDir: string;
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.AI_LOGGING_ENABLED === 'true';
    this.logsDir = path.join(process.cwd(), process.env.AI_LOGS_DIR || 'ai-logs');
  }

  async ensureLogDirectory(): Promise<void> {
    if (!this.enabled) return;
    
    try {
      await fs.mkdir(this.logsDir, { recursive: true });
      
      // Create subdirectories for organization
      await fs.mkdir(path.join(this.logsDir, 'screenshots'), { recursive: true });
      await fs.mkdir(path.join(this.logsDir, 'logs'), { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async logRequest(entry: AILogEntry): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.ensureLogDirectory();

      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logsDir, 'logs', `ai-requests-${date}.jsonl`);

      // Save screenshot separately if present
      if (entry.screenshot) {
        const screenshotFile = path.join(
          this.logsDir, 
          'screenshots', 
          `${entry.requestId}.png`
        );
        
        // Convert base64 to buffer and save
        const imageBuffer = Buffer.from(entry.screenshot, 'base64');
        await fs.writeFile(screenshotFile, imageBuffer);
        
        // Replace screenshot data with file reference in log
        entry = {
          ...entry,
          screenshot: `screenshots/${entry.requestId}.png`
        };
      }

      // Append to log file (JSONL format for easy streaming)
      const logLine = JSON.stringify(entry) + '\n';
      await fs.appendFile(logFile, logLine);

      // Also create a pretty-printed version for easier reading
      const prettyLogFile = path.join(
        this.logsDir,
        'logs',
        `${entry.requestId}-details.json`
      );
      await fs.writeFile(prettyLogFile, JSON.stringify(entry, null, 2));

      console.log(`AI request logged: ${entry.requestId}`);
    } catch (error) {
      console.error('Failed to log AI request:', error);
    }
  }

  async logError(requestId: string, error: unknown): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.ensureLogDirectory();
      
      const errorFile = path.join(
        this.logsDir,
        'logs',
        `${requestId}-error.json`
      );
      
      await fs.writeFile(errorFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error
      }, null, 2));
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  async getRecentLogs(limit: number = 10): Promise<AILogEntry[]> {
    if (!this.enabled) return [];

    try {
      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logsDir, 'logs', `ai-requests-${date}.jsonl`);
      
      const content = await fs.readFile(logFile, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line);
      
      return lines
        .slice(-limit)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean) as AILogEntry[];
    } catch (error) {
      console.error('Failed to read logs:', error);
      return [];
    }
  }

  async createSummaryReport(): Promise<void> {
    if (!this.enabled) return;

    try {
      const logs = await this.getRecentLogs(100);
      
      const summary = {
        totalRequests: logs.length,
        successfulRequests: logs.filter(l => l.response.success).length,
        failedRequests: logs.filter(l => !l.response.success).length,
        averageDuration: logs
          .filter(l => l.duration)
          .reduce((acc, l) => acc + (l.duration || 0), 0) / logs.length || 0,
        fieldTypes: logs.reduce((acc, l) => {
          acc[l.request.fieldType] = (acc[l.request.fieldType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        errors: logs
          .filter(l => !l.response.success)
          .map(l => ({
            requestId: l.requestId,
            timestamp: l.timestamp,
            error: l.response.error
          }))
      };

      const summaryFile = path.join(
        this.logsDir,
        `summary-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      );
      
      await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));
      console.log(`Summary report created: ${summaryFile}`);
    } catch (error) {
      console.error('Failed to create summary report:', error);
    }
  }
}

export const aiLogger = new AILogger();
export type { AILogEntry };