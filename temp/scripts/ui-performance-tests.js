#!/usr/bin/env tsx
"use strict";
/**
 * UI性能测试脚本
 * 测试UI组件的渲染性能、内存使用、响应时间等指标
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIPerformanceTester = void 0;
const lib_1 = require("../lib");
class UIPerformanceTester {
    constructor() {
        this.testResults = [];
        this.performanceThresholds = {
            dataLoading: 1000, // 1秒
            listRendering: 500, // 500ms
            searching: 300, // 300ms
            statusToggle: 200, // 200ms
            batchOperation: 2000, // 2秒
            memoryPerTask: 1024, // 1KB per task
            memoryPerNote: 512 // 512B per note
        };
        // 初始化性能监控
        this.setupPerformanceMonitoring();
    }
    /**
     * 设置性能监控
     */
    setupPerformanceMonitoring() {
        // 启用垃圾回收监控（如果可用）
        if (global.gc) {
            console.log('🗑️  垃圾回收监控已启用');
        }
    }
    /**
     * 获取内存使用情况
     */
    getMemoryUsage() {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            return process.memoryUsage().heapUsed;
        }
        return 0;
    }
    /**
     * 强制垃圾回收
     */
    forceGarbageCollection() {
        if (global.gc) {
            global.gc();
        }
    }
    /**
     * 评估性能指标
     */
    evaluateMetric(value, threshold, lowerIsBetter = true) {
        if (lowerIsBetter) {
            if (value <= threshold * 0.7)
                return 'good';
            if (value <= threshold)
                return 'warning';
            return 'critical';
        }
        else {
            if (value >= threshold * 1.3)
                return 'good';
            if (value >= threshold)
                return 'warning';
            return 'critical';
        }
    }
    /**
     * 运行单个性能测试
     */
    async runPerformanceTest(testName, testFn) {
        // 准备测试环境
        this.forceGarbageCollection();
        const memoryBefore = this.getMemoryUsage();
        const startTime = performance.now();
        const nodeStartTime = Date.now();
        try {
            console.log(`⚡ 性能测试: ${testName}`);
            const result = await testFn();
            const endTime = performance.now();
            const nodeEndTime = Date.now();
            const duration = endTime - startTime;
            const nodeDuration = nodeEndTime - nodeStartTime;
            // 测量内存使用
            this.forceGarbageCollection();
            const memoryAfter = this.getMemoryUsage();
            const memoryDelta = memoryAfter - memoryBefore;
            // 生成性能指标
            const metrics = [
                {
                    name: '响应时间',
                    value: Math.round(duration),
                    unit: 'ms',
                    status: this.evaluateMetric(duration, this.performanceThresholds.dataLoading),
                    threshold: this.performanceThresholds.dataLoading
                },
                {
                    name: '内存使用',
                    value: Math.round(memoryDelta / 1024),
                    unit: 'KB',
                    status: this.evaluateMetric(Math.abs(memoryDelta), 1024 * 100), // 100KB threshold
                    threshold: 100
                }
            ];
            // 添加测试特定的指标
            if (result.metrics) {
                metrics.push(...result.metrics);
            }
            const passed = metrics.every(m => m.status !== 'critical');
            console.log(`${passed ? '✅' : '❌'} ${testName}: ${Math.round(duration)}ms, 内存: ${Math.round(memoryDelta / 1024)}KB`);
            return {
                testName,
                passed,
                metrics,
                duration: nodeDuration,
                memoryUsage: {
                    before: memoryBefore,
                    after: memoryAfter,
                    delta: memoryDelta
                },
                details: result
            };
        }
        catch (error) {
            const endTime = performance.now();
            const duration = endTime - startTime;
            console.log(`❌ ${testName} 失败: ${error} (${Math.round(duration)}ms)`);
            return {
                testName,
                passed: false,
                metrics: [{
                        name: '响应时间',
                        value: Math.round(duration),
                        unit: 'ms',
                        status: 'critical'
                    }],
                duration: Date.now() - nodeStartTime,
                details: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }
    /**
     * 运行性能测试套件
     */
    async runPerformanceSuite(suiteName, tests) {
        console.log(`\n⚡ 开始性能测试套件: ${suiteName}`);
        console.log('='.repeat(70));
        const suiteStartTime = Date.now();
        const testResults = [];
        for (const test of tests) {
            const result = await this.runPerformanceTest(test.name, test.fn);
            testResults.push(result);
            // 测试间隔，让系统稳定
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        const totalDuration = Date.now() - suiteStartTime;
        const averageResponseTime = testResults.reduce((sum, test) => sum + test.duration, 0) / testResults.length;
        const memoryLeaks = testResults.filter(test => test.memoryUsage && test.memoryUsage.delta > 1024 * 1024 // 1MB
        ).length;
        // 计算总体评分
        const criticalTests = testResults.filter(test => test.metrics.some(metric => metric.status === 'critical')).length;
        const warningTests = testResults.filter(test => test.metrics.some(metric => metric.status === 'warning')).length;
        const overallScore = Math.max(0, 100 - (criticalTests * 30) - (warningTests * 10));
        console.log(`\n📊 套件结果: ${suiteName}`);
        console.log(`   总耗时: ${totalDuration}ms`);
        console.log(`   平均响应时间: ${Math.round(averageResponseTime)}ms`);
        console.log(`   内存泄漏: ${memoryLeaks} 个测试`);
        console.log(`   总体评分: ${overallScore}/100`);
        return {
            suiteName,
            tests: testResults,
            totalDuration,
            averageResponseTime,
            memoryLeaks,
            overallScore
        };
    }
    /**
     * 测试数据加载性能
     */
    async testDataLoadingPerformance() {
        return await this.runPerformanceSuite('数据加载性能', [
            {
                name: '任务列表加载',
                fn: async () => {
                    const startTime = performance.now();
                    const tasks = await lib_1.newAppService.tasks.getActiveTasks();
                    const loadTime = performance.now() - startTime;
                    return {
                        taskCount: tasks.length,
                        loadTime: Math.round(loadTime),
                        metrics: [{
                                name: '加载时间',
                                value: Math.round(loadTime),
                                unit: 'ms',
                                status: this.evaluateMetric(loadTime, this.performanceThresholds.dataLoading),
                                threshold: this.performanceThresholds.dataLoading
                            }]
                    };
                }
            },
            {
                name: '今日任务加载',
                fn: async () => {
                    const startTime = performance.now();
                    const todayTasks = await lib_1.newAppService.tasks.getTodayTasks();
                    const loadTime = performance.now() - startTime;
                    return {
                        todayTaskCount: todayTasks.length,
                        loadTime: Math.round(loadTime),
                        metrics: [{
                                name: '加载时间',
                                value: Math.round(loadTime),
                                unit: 'ms',
                                status: this.evaluateMetric(loadTime, this.performanceThresholds.dataLoading),
                                threshold: this.performanceThresholds.dataLoading
                            }]
                    };
                }
            },
            {
                name: '已完成任务加载',
                fn: async () => {
                    const startTime = performance.now();
                    const completedTasks = await lib_1.newAppService.tasks.getCompletedTasks(50);
                    const loadTime = performance.now() - startTime;
                    return {
                        completedTaskCount: completedTasks.length,
                        loadTime: Math.round(loadTime),
                        metrics: [{
                                name: '加载时间',
                                value: Math.round(loadTime),
                                unit: 'ms',
                                status: this.evaluateMetric(loadTime, this.performanceThresholds.dataLoading),
                                threshold: this.performanceThresholds.dataLoading
                            }]
                    };
                }
            },
            {
                name: '笔记列表加载',
                fn: async () => {
                    const startTime = performance.now();
                    const notes = await lib_1.newAppService.notes.getAllNotes();
                    const loadTime = performance.now() - startTime;
                    return {
                        noteCount: notes.length,
                        loadTime: Math.round(loadTime),
                        metrics: [{
                                name: '加载时间',
                                value: Math.round(loadTime),
                                unit: 'ms',
                                status: this.evaluateMetric(loadTime, this.performanceThresholds.dataLoading),
                                threshold: this.performanceThresholds.dataLoading
                            }]
                    };
                }
            }
        ]);
    }
    /**
     * 测试搜索性能
     */
    async testSearchPerformance() {
        return await this.runPerformanceSuite('搜索性能', [
            {
                name: '笔记搜索性能',
                fn: async () => {
                    // 创建测试笔记
                    const testNote = await lib_1.newAppService.notes.createNote({
                        title: '性能测试笔记',
                        content: '这是用于性能测试的笔记内容，包含各种关键词用于搜索测试',
                        category: '性能测试',
                        tags: ['性能', '测试', '搜索']
                    });
                    if (!testNote)
                        throw new Error('创建测试笔记失败');
                    const searchTerms = ['性能', '测试', '笔记', '关键词'];
                    const searchTimes = [];
                    for (const term of searchTerms) {
                        const startTime = performance.now();
                        await lib_1.newAppService.notes.searchNotes(term);
                        const searchTime = performance.now() - startTime;
                        searchTimes.push(searchTime);
                    }
                    // 清理测试数据
                    await lib_1.newAppService.notes.deleteNote(testNote.id);
                    const averageSearchTime = searchTimes.reduce((sum, time) => sum + time, 0) / searchTimes.length;
                    const maxSearchTime = Math.max(...searchTimes);
                    return {
                        searchTermsCount: searchTerms.length,
                        averageSearchTime: Math.round(averageSearchTime),
                        maxSearchTime: Math.round(maxSearchTime),
                        metrics: [
                            {
                                name: '平均搜索时间',
                                value: Math.round(averageSearchTime),
                                unit: 'ms',
                                status: this.evaluateMetric(averageSearchTime, this.performanceThresholds.searching),
                                threshold: this.performanceThresholds.searching
                            },
                            {
                                name: '最大搜索时间',
                                value: Math.round(maxSearchTime),
                                unit: 'ms',
                                status: this.evaluateMetric(maxSearchTime, this.performanceThresholds.searching),
                                threshold: this.performanceThresholds.searching
                            }
                        ]
                    };
                }
            }
        ]);
    }
    /**
     * 测试批量操作性能
     */
    async testBatchOperationPerformance() {
        return await this.runPerformanceSuite('批量操作性能', [
            {
                name: '批量创建任务性能',
                fn: async () => {
                    const batchSize = 10;
                    const taskIds = [];
                    const startTime = performance.now();
                    for (let i = 0; i < batchSize; i++) {
                        const task = await lib_1.newAppService.tasks.createTask({
                            title: `批量性能测试任务 ${i + 1}`,
                            description: '用于批量操作性能测试',
                            priority: 'medium',
                            status: 'not_started',
                            reminder: false,
                            category: 'proj-1'
                        });
                        if (task)
                            taskIds.push(task.id);
                    }
                    const createTime = performance.now() - startTime;
                    // 清理测试数据
                    const deleteStartTime = performance.now();
                    await lib_1.newAppService.tasks.batchDelete(taskIds);
                    const deleteTime = performance.now() - deleteStartTime;
                    const avgCreateTime = createTime / batchSize;
                    return {
                        batchSize,
                        totalCreateTime: Math.round(createTime),
                        avgCreateTime: Math.round(avgCreateTime),
                        deleteTime: Math.round(deleteTime),
                        metrics: [
                            {
                                name: '批量创建时间',
                                value: Math.round(createTime),
                                unit: 'ms',
                                status: this.evaluateMetric(createTime, this.performanceThresholds.batchOperation),
                                threshold: this.performanceThresholds.batchOperation
                            },
                            {
                                name: '平均创建时间',
                                value: Math.round(avgCreateTime),
                                unit: 'ms/项',
                                status: this.evaluateMetric(avgCreateTime, 200), // 200ms per item
                                threshold: 200
                            },
                            {
                                name: '批量删除时间',
                                value: Math.round(deleteTime),
                                unit: 'ms',
                                status: this.evaluateMetric(deleteTime, 1000), // 1s for batch delete
                                threshold: 1000
                            }
                        ]
                    };
                }
            },
            {
                name: '批量状态更新性能',
                fn: async () => {
                    const batchSize = 5;
                    const taskIds = [];
                    // 创建测试任务
                    for (let i = 0; i < batchSize; i++) {
                        const task = await lib_1.newAppService.tasks.createTask({
                            title: `状态更新性能测试任务 ${i + 1}`,
                            description: '用于状态更新性能测试',
                            priority: 'low',
                            status: 'not_started',
                            reminder: false,
                            category: 'proj-1'
                        });
                        if (task)
                            taskIds.push(task.id);
                    }
                    // 测试批量状态更新
                    const startTime = performance.now();
                    for (const taskId of taskIds) {
                        await lib_1.newAppService.tasks.updateTaskStatus(taskId, 'completed');
                    }
                    const updateTime = performance.now() - startTime;
                    // 清理测试数据
                    await lib_1.newAppService.tasks.batchDelete(taskIds);
                    const avgUpdateTime = updateTime / batchSize;
                    return {
                        batchSize,
                        totalUpdateTime: Math.round(updateTime),
                        avgUpdateTime: Math.round(avgUpdateTime),
                        metrics: [
                            {
                                name: '批量更新时间',
                                value: Math.round(updateTime),
                                unit: 'ms',
                                status: this.evaluateMetric(updateTime, 1000), // 1s for batch update
                                threshold: 1000
                            },
                            {
                                name: '平均更新时间',
                                value: Math.round(avgUpdateTime),
                                unit: 'ms/项',
                                status: this.evaluateMetric(avgUpdateTime, this.performanceThresholds.statusToggle),
                                threshold: this.performanceThresholds.statusToggle
                            }
                        ]
                    };
                }
            }
        ]);
    }
    /**
     * 测试内存使用性能
     */
    async testMemoryPerformance() {
        return await this.runPerformanceSuite('内存使用性能', [
            {
                name: '大量数据加载内存测试',
                fn: async () => {
                    const initialMemory = this.getMemoryUsage();
                    // 加载所有数据
                    const tasks = await lib_1.newAppService.tasks.getAllTasks();
                    const notes = await lib_1.newAppService.notes.getAllNotes();
                    const afterLoadMemory = this.getMemoryUsage();
                    const loadMemoryDelta = afterLoadMemory - initialMemory;
                    // 计算每项数据的内存使用
                    const memoryPerTask = tasks.length > 0 ? loadMemoryDelta / tasks.length : 0;
                    const memoryPerNote = notes.length > 0 ? loadMemoryDelta / notes.length : 0;
                    // 强制垃圾回收
                    this.forceGarbageCollection();
                    const afterGCMemory = this.getMemoryUsage();
                    const memoryLeakage = afterGCMemory - initialMemory;
                    return {
                        taskCount: tasks.length,
                        noteCount: notes.length,
                        loadMemoryUsage: Math.round(loadMemoryDelta / 1024), // KB
                        memoryPerTask: Math.round(memoryPerTask),
                        memoryPerNote: Math.round(memoryPerNote),
                        memoryLeakage: Math.round(memoryLeakage / 1024), // KB
                        metrics: [
                            {
                                name: '数据加载内存',
                                value: Math.round(loadMemoryDelta / 1024),
                                unit: 'KB',
                                status: this.evaluateMetric(loadMemoryDelta / 1024, 1024), // 1MB threshold
                                threshold: 1024
                            },
                            {
                                name: '内存泄漏',
                                value: Math.round(memoryLeakage / 1024),
                                unit: 'KB',
                                status: this.evaluateMetric(Math.abs(memoryLeakage) / 1024, 100), // 100KB threshold
                                threshold: 100
                            }
                        ]
                    };
                }
            }
        ]);
    }
    /**
     * 生成性能测试报告
     */
    generatePerformanceReport() {
        console.log('\n' + '='.repeat(80));
        console.log('⚡ UI性能测试完整报告');
        console.log('='.repeat(80));
        let totalTests = 0;
        let totalPassedTests = 0;
        let totalDuration = 0;
        let overallScores = [];
        this.testResults.forEach(suite => {
            totalTests += suite.tests.length;
            totalPassedTests += suite.tests.filter(t => t.passed).length;
            totalDuration += suite.totalDuration;
            overallScores.push(suite.overallScore);
            console.log(`\n⚡ ${suite.suiteName}:`);
            console.log(`   测试数量: ${suite.tests.length}`);
            console.log(`   通过测试: ${suite.tests.filter(t => t.passed).length}`);
            console.log(`   平均响应时间: ${Math.round(suite.averageResponseTime)}ms`);
            console.log(`   内存泄漏: ${suite.memoryLeaks} 个测试`);
            console.log(`   性能评分: ${suite.overallScore}/100`);
            // 显示性能警告
            const criticalTests = suite.tests.filter(test => test.metrics.some(metric => metric.status === 'critical'));
            if (criticalTests.length > 0) {
                console.log(`   ⚠️  性能问题:`);
                criticalTests.forEach(test => {
                    const criticalMetrics = test.metrics.filter(m => m.status === 'critical');
                    criticalMetrics.forEach(metric => {
                        console.log(`     🔴 ${test.testName}: ${metric.name} ${metric.value}${metric.unit} (阈值: ${metric.threshold}${metric.unit})`);
                    });
                });
            }
        });
        const averageScore = overallScores.reduce((sum, score) => sum + score, 0) / overallScores.length;
        const passRate = (totalPassedTests / totalTests) * 100;
        console.log('\n' + '='.repeat(80));
        console.log('📊 性能测试总体统计:');
        console.log(`   总测试数: ${totalTests}`);
        console.log(`   通过率: ${passRate.toFixed(1)}%`);
        console.log(`   总耗时: ${totalDuration}ms`);
        console.log(`   平均性能评分: ${Math.round(averageScore)}/100`);
        // 性能等级评估
        let performanceGrade = 'F';
        if (averageScore >= 90)
            performanceGrade = 'A+';
        else if (averageScore >= 80)
            performanceGrade = 'A';
        else if (averageScore >= 70)
            performanceGrade = 'B';
        else if (averageScore >= 60)
            performanceGrade = 'C';
        else if (averageScore >= 50)
            performanceGrade = 'D';
        console.log(`   性能等级: ${performanceGrade}`);
        // 性能建议
        console.log('\n💡 性能优化建议:');
        if (averageScore < 70) {
            console.log('   - 考虑实现数据分页加载以减少初始加载时间');
            console.log('   - 添加数据缓存机制以提高重复访问性能');
            console.log('   - 优化搜索算法，考虑使用索引');
        }
        if (averageScore < 80) {
            console.log('   - 实现虚拟化列表以处理大量数据');
            console.log('   - 考虑使用Web Workers处理复杂计算');
        }
        console.log('='.repeat(80));
    }
    /**
     * 运行所有性能测试
     */
    async runAllPerformanceTests() {
        console.log('🚀 启动UI性能测试');
        console.log('测试目标：评估UI组件的性能表现');
        console.log('测试指标：响应时间、内存使用、吞吐量');
        try {
            // 确保新架构已初始化
            await lib_1.newAppService.initializeApp();
            // 运行所有性能测试套件
            this.testResults.push(await this.testDataLoadingPerformance());
            this.testResults.push(await this.testSearchPerformance());
            this.testResults.push(await this.testBatchOperationPerformance());
            this.testResults.push(await this.testMemoryPerformance());
            // 生成最终报告
            this.generatePerformanceReport();
        }
        catch (error) {
            console.error('❌ UI性能测试运行失败:', error);
            process.exit(1);
        }
    }
}
exports.UIPerformanceTester = UIPerformanceTester;
// 运行测试
if (require.main === module) {
    const performanceTester = new UIPerformanceTester();
    performanceTester.runAllPerformanceTests()
        .then(() => {
        console.log('✅ UI性能测试完成');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 UI性能测试失败:', error);
        process.exit(1);
    });
}
