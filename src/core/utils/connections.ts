import { createClient } from 'redis';
import { Sequelize } from 'sequelize';
import { config } from '../config';
import { logger } from 'kv-logger';

export const sequelize = new Sequelize(
    config.db.database,
    config.db.username,
    config.db.password,
    config.db,
);

export const redisClient = createClient({
    socket: {
        host: config.redis.host,
        port: config.redis.port,
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                return new Error('Retry count exhausted');
            }

            return retries * 100;
        },
    },
    password: config.redis.password,
    database: config.redis.db,
});
redisClient.on('error', (err) => {
    logger.error(`redis client error: ${err && err.message ? err.message : err}`);
});

// 不 rethrow：redis 不可用时服务仍可启动（登录限流降级），
// 避免 connect() 的 rejected promise 变成未捕获异常导致进程退出。
export const redisReady = redisClient.connect().catch((err) => {
    logger.error(`redis initial connect failed: ${err && err.message ? err.message : err}`);
});
