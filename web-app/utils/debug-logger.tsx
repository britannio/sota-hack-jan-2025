// utils/debug-logger.ts
class DebugLogger {
    private static instance: DebugLogger;
    private isEnabled: boolean = true;
    private logHistory: Array<{type: string; message: string; data?: any}> = [];
    private listeners: Array<(log: {type: string; message: string; data?: any}) => void> = [];
  
    private constructor() {}
  
    static getInstance(): DebugLogger {
      if (!DebugLogger.instance) {
        DebugLogger.instance = new DebugLogger();
      }
      return DebugLogger.instance;
    }
  
    enable() {
      this.isEnabled = true;
    }
  
    disable() {
      this.isEnabled = false;
    }
  
    addListener(listener: (log: {type: string; message: string; data?: any}) => void) {
      this.listeners.push(listener);
    }
  
    removeListener(listener: (log: {type: string; message: string; data?: any}) => void) {
      this.listeners = this.listeners.filter(l => l !== listener);
    }
  
    private log(type: string, message: string, data?: any) {
      if (!this.isEnabled) return;
  
      const logEntry = { type, message, data };
      this.logHistory.push(logEntry);
      
      // Always log to console
      switch (type) {
        case 'error':
          console.error(message, data);
          break;
        case 'warn':
          console.warn(message, data);
          break;
        default:
          console.log(`[${type}]`, message, data);
      }
  
      // Notify listeners
      this.listeners.forEach(listener => listener(logEntry));
    }
  
    info(message: string, data?: any) {
      this.log('info', message, data);
    }
  
    error(message: string, data?: any) {
      this.log('error', message, data);
    }
  
    warn(message: string, data?: any) {
      this.log('warn', message, data);
    }
  
    debug(message: string, data?: any) {
      this.log('debug', message, data);
    }
  
    getHistory() {
      return [...this.logHistory];
    }
  
    clearHistory() {
      this.logHistory = [];
    }
  }
  
  export const logger = DebugLogger.getInstance();
  
  // React hook for debug logging
  import { useEffect, useRef } from 'react';
  
  export const useDebugLog = (componentName: string) => {
    const componentLogger = useRef({
      info: (message: string, data?: any) => 
        logger.info(`[${componentName}] ${message}`, data),
      error: (message: string, data?: any) => 
        logger.error(`[${componentName}] ${message}`, data),
      warn: (message: string, data?: any) => 
        logger.warn(`[${componentName}] ${message}`, data),
      debug: (message: string, data?: any) => 
        logger.debug(`[${componentName}] ${message}`, data),
    });
  
    useEffect(() => {
      logger.info(`${componentName} mounted`);
      return () => {
        logger.info(`${componentName} unmounted`);
      };
    }, [componentName]);
  
    return componentLogger.current;
  };