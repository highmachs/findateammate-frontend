import winston from 'winston';
// import DailyRotateFile from 'winston-daily-rotate-file';
// import path from 'path';

// const logDir = path.join(process.cwd(), 'logs');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create transports
const transports: winston.transport[] = [
  // Console transport for development
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
      })
    )
  })
];

// Add file transports for production
if (process.env.NODE_ENV === 'production') {
  // Disabled file logging due to Docker permission issues
  // TODO: Fix /app/logs/ permissions in Dockerfile
  /*
  // Error logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat
    })
  );

  // Combined logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat
    })
  );

  // Access logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '20m',
      maxFiles: '7d',
      format: logFormat
    })
  );
  */
}

// Create logger instance
export const productionLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false
});

// Request logging middleware
export function requestLogger(req: any, res: any, next: any) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    productionLogger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  
  next();
}

// Error logging middleware
export function errorLogger(err: any, req: any, _res: any, next: any) {
  productionLogger.error('Application Error', {
    error: err?.message || 'Unknown error',
    stack: err?.stack || 'No stack trace available',
    method: req?.method,
    url: req?.url,
    ip: req?.ip,
    userId: req?.user?.id
  });
  next(err);
}
