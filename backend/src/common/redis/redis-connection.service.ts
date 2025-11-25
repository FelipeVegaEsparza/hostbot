import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisConnectionService implements OnModuleInit {
  private readonly logger = new Logger(RedisConnectionService.name);
  private redisClient: Redis;
  private connectionAttempts = 0;
  private readonly maxRetries = 5;
  private readonly retryDelay = 2000; // 2 seconds

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  private async connect(): Promise<void> {
    const redisHost = this.configService.get('REDIS_HOST') || 'localhost';
    const redisPort = this.configService.get('REDIS_PORT') || 6379;
    const redisPassword = this.configService.get('REDIS_PASSWORD');
    const redisUrl = this.configService.get('REDIS_URL');

    this.logger.log(`Attempting to connect to Redis at ${redisHost}:${redisPort}`);

    try {
      // Create Redis client with retry strategy
      this.redisClient = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword || undefined,
        retryStrategy: (times) => {
          if (times > this.maxRetries) {
            this.logger.error(
              `Failed to connect to Redis after ${this.maxRetries} attempts`,
            );
            return null; // Stop retrying
          }
          const delay = Math.min(times * this.retryDelay, 10000);
          this.logger.warn(
            `Redis connection attempt ${times} failed. Retrying in ${delay}ms...`,
          );
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
      });

      // Set up event listeners
      this.redisClient.on('connect', () => {
        this.connectionAttempts++;
        this.logger.log(
          `✅ Redis connection established (attempt ${this.connectionAttempts})`,
        );
      });

      this.redisClient.on('ready', () => {
        this.logger.log('✅ Redis client is ready to accept commands');
      });

      this.redisClient.on('error', (error) => {
        this.logger.error(`❌ Redis connection error: ${error.message}`, error.stack);
      });

      this.redisClient.on('close', () => {
        this.logger.warn('⚠️ Redis connection closed');
      });

      this.redisClient.on('reconnecting', () => {
        this.logger.log('🔄 Reconnecting to Redis...');
      });

      // Test the connection with PING
      await this.ping();
    } catch (error) {
      this.logger.error(
        `❌ Failed to initialize Redis connection: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async ping(): Promise<number> {
    try {
      const startTime = Date.now();
      const result = await this.redisClient.ping();
      const latency = Date.now() - startTime;

      if (result === 'PONG') {
        this.logger.log(`✅ Redis PING successful (latency: ${latency}ms)`);
        return latency;
      } else {
        throw new Error(`Unexpected PING response: ${result}`);
      }
    } catch (error) {
      this.logger.error(`❌ Redis PING failed: ${error.message}`);
      throw error;
    }
  }

  async getConnectionStatus(): Promise<{
    connected: boolean;
    status: string;
    latency?: number;
  }> {
    try {
      const status = this.redisClient.status;
      const connected = status === 'ready' || status === 'connect';

      if (connected) {
        const latency = await this.ping();
        return { connected: true, status, latency };
      }

      return { connected: false, status };
    } catch (error) {
      return { connected: false, status: 'error' };
    }
  }

  getClient(): Redis {
    return this.redisClient;
  }

  async disconnect(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.log('Redis connection closed gracefully');
    }
  }
}
