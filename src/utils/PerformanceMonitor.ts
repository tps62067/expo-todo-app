/**
 * 性能监控工具
 * 用于监控和记录应用的性能指标
 */
class PerformanceMonitor {
  private metrics = {
    renderTime: [] as number[],
    listScrollFPS: [] as number[],
    memoryUsage: [] as number[],
    imageLoadTime: [] as number[],
    componentMountTime: [] as number[],
    apiResponseTime: [] as number[],
  };
  
  private isEnabled = __DEV__; // 只在开发环境启用
  
  /**
   * 测量渲染时间
   */
  measureRenderTime<T>(operation: () => T, componentName: string): T {
    if (!this.isEnabled) return operation();
    
    const start = performance.now();
    const result = operation();
    const duration = performance.now() - start;
    
    this.metrics.renderTime.push(duration);
    console.log(`[Performance] ${componentName} render time: ${duration.toFixed(2)}ms`);
    
    // 警告渲染时间过长
    if (duration > 16) { // 超过一帧时间
      console.warn(`[Performance] Slow render detected in ${componentName}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }
  
  /**
   * 测量组件挂载时间
   */
  measureComponentMount(componentName: string, startTime: number): void {
    if (!this.isEnabled) return;
    
    const duration = performance.now() - startTime;
    this.metrics.componentMountTime.push(duration);
    console.log(`[Performance] ${componentName} mount time: ${duration.toFixed(2)}ms`);
    
    if (duration > 100) {
      console.warn(`[Performance] Slow component mount: ${componentName} took ${duration.toFixed(2)}ms`);
    }
  }
  
  /**
   * 测量API响应时间
   */
  measureApiResponse(apiName: string, startTime: number): void {
    if (!this.isEnabled) return;
    
    const duration = performance.now() - startTime;
    this.metrics.apiResponseTime.push(duration);
    console.log(`[Performance] API ${apiName} response time: ${duration.toFixed(2)}ms`);
    
    if (duration > 3000) {
      console.warn(`[Performance] Slow API response: ${apiName} took ${duration.toFixed(2)}ms`);
    }
  }
  
  /**
   * 测量滚动FPS
   */
  measureScrollFPS(callback: (fps: number) => void): () => void {
    if (!this.isEnabled) return () => {};
    
    let frameCount = 0;
    let lastTime = performance.now();
    let isRunning = true;
    
    const measureFrame = () => {
      if (!isRunning) return;
      
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = frameCount;
        callback(fps);
        this.metrics.listScrollFPS.push(fps);
        
        if (fps < 45) {
          console.warn(`[Performance] Low scroll FPS detected: ${fps}fps`);
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFrame);
    };
    
    requestAnimationFrame(measureFrame);
    
    // 返回停止函数
    return () => {
      isRunning = false;
    };
  }
  
  /**
   * 记录内存使用情况
   */
  recordMemoryUsage(): void {
    if (!this.isEnabled) return;
    
    // @ts-ignore - performance.memory 在某些环境中可能不存在
    if (performance.memory) {
      // @ts-ignore
      const memoryInfo = performance.memory;
      const usedMemory = memoryInfo.usedJSHeapSize / 1024 / 1024; // MB
      
      this.metrics.memoryUsage.push(usedMemory);
      console.log(`[Performance] Memory usage: ${usedMemory.toFixed(2)}MB`);
      
      if (usedMemory > 100) {
        console.warn(`[Performance] High memory usage detected: ${usedMemory.toFixed(2)}MB`);
      }
    }
  }
  
  /**
   * 测量图片加载时间
   */
  measureImageLoad(imageUrl: string, startTime: number): void {
    if (!this.isEnabled) return;
    
    const duration = performance.now() - startTime;
    this.metrics.imageLoadTime.push(duration);
    console.log(`[Performance] Image load time for ${imageUrl}: ${duration.toFixed(2)}ms`);
    
    if (duration > 2000) {
      console.warn(`[Performance] Slow image load: ${imageUrl} took ${duration.toFixed(2)}ms`);
    }
  }
  
  /**
   * 获取平均性能指标
   */
  getAverageMetrics() {
    return {
      avgRenderTime: this.average(this.metrics.renderTime),
      avgScrollFPS: this.average(this.metrics.listScrollFPS),
      avgMemoryUsage: this.average(this.metrics.memoryUsage),
      avgImageLoadTime: this.average(this.metrics.imageLoadTime),
      avgComponentMountTime: this.average(this.metrics.componentMountTime),
      avgApiResponseTime: this.average(this.metrics.apiResponseTime),
    };
  }
  
  /**
   * 获取性能报告
   */
  getPerformanceReport() {
    const averages = this.getAverageMetrics();
    const report = {
      summary: averages,
      details: {
        renderTimes: {
          count: this.metrics.renderTime.length,
          min: Math.min(...this.metrics.renderTime),
          max: Math.max(...this.metrics.renderTime),
          p95: this.percentile(this.metrics.renderTime, 95),
        },
        scrollFPS: {
          count: this.metrics.listScrollFPS.length,
          min: Math.min(...this.metrics.listScrollFPS),
          max: Math.max(...this.metrics.listScrollFPS),
          p5: this.percentile(this.metrics.listScrollFPS, 5), // 5th percentile for FPS (lower is worse)
        },
        memoryUsage: {
          count: this.metrics.memoryUsage.length,
          min: Math.min(...this.metrics.memoryUsage),
          max: Math.max(...this.metrics.memoryUsage),
          p95: this.percentile(this.metrics.memoryUsage, 95),
        },
      },
      warnings: this.getPerformanceWarnings(),
    };
    
    return report;
  }
  
  /**
   * 获取性能警告
   */
  private getPerformanceWarnings(): string[] {
    const warnings: string[] = [];
    const averages = this.getAverageMetrics();
    
    if (averages.avgRenderTime > 16) {
      warnings.push(`Average render time (${averages.avgRenderTime.toFixed(2)}ms) exceeds 16ms target`);
    }
    
    if (averages.avgScrollFPS < 55) {
      warnings.push(`Average scroll FPS (${averages.avgScrollFPS.toFixed(1)}) is below 55fps target`);
    }
    
    if (averages.avgMemoryUsage > 80) {
      warnings.push(`Average memory usage (${averages.avgMemoryUsage.toFixed(2)}MB) is high`);
    }
    
    if (averages.avgApiResponseTime > 2000) {
      warnings.push(`Average API response time (${averages.avgApiResponseTime.toFixed(2)}ms) is slow`);
    }
    
    return warnings;
  }
  
  /**
   * 清除所有指标
   */
  clearMetrics(): void {
    this.metrics = {
      renderTime: [],
      listScrollFPS: [],
      memoryUsage: [],
      imageLoadTime: [],
      componentMountTime: [],
      apiResponseTime: [],
    };
  }
  
  /**
   * 开始性能监控会话
   */
  startSession(sessionName: string): void {
    if (!this.isEnabled) return;
    
    console.group(`[Performance] Starting session: ${sessionName}`);
    this.clearMetrics();
    this.recordMemoryUsage();
  }
  
  /**
   * 结束性能监控会话
   */
  endSession(sessionName: string): void {
    if (!this.isEnabled) return;
    
    this.recordMemoryUsage();
    const report = this.getPerformanceReport();
    
    console.log(`[Performance] Session summary for ${sessionName}:`, report.summary);
    
    if (report.warnings.length > 0) {
      console.warn(`[Performance] Performance warnings:`, report.warnings);
    }
    
    console.groupEnd();
  }
  
  /**
   * 计算数组平均值
   */
  private average(arr: number[]): number {
    return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }
  
  /**
   * 计算百分位数
   */
  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

export const performanceMonitor = new PerformanceMonitor();

// 导出性能监控Hook
export function usePerformanceMonitor(componentName: string) {
  const startTime = performance.now();
  
  React.useEffect(() => {
    performanceMonitor.measureComponentMount(componentName, startTime);
  }, [componentName, startTime]);
  
  return {
    measureRender: (operation: () => any) => 
      performanceMonitor.measureRenderTime(operation, componentName),
    measureApiCall: (apiName: string, apiStartTime: number) =>
      performanceMonitor.measureApiResponse(apiName, apiStartTime),
  };
}

// React导入（如果需要使用Hook）
import React from 'react';
