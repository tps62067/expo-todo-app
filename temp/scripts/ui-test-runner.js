#!/usr/bin/env tsx
"use strict";
/**
 * UI自动化测试运行器
 * 测试应用中的各种UI组件、导航和用户交互
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UITestRunner = void 0;
const lib_1 = require("../lib");
class UITestRunner {
    constructor() {
        this.testResults = [];
        this.mockData = {
            tasks: [],
            notes: [],
            projects: []
        };
        this.setupMockData();
    }
    /**
     * 设置测试用的模拟数据
     */
    setupMockData() {
        // 模拟项目数据
        this.mockData.projects = [
            { id: 'proj-1', name: '工作项目', color: '#2196F3', icon: 'briefcase-outline' },
            { id: 'proj-2', name: '个人学习', color: '#9C27B0', icon: 'school-outline' },
            { id: 'proj-3', name: '生活管理', color: '#4CAF50', icon: 'home-outline' },
        ];
        // 模拟任务数据
        this.mockData.tasks = [
            {
                id: 'task-1',
                title: '完成UI测试',
                description: '编写并运行UI自动化测试',
                priority: 'high',
                status: 'in_progress',
                due_date: new Date(),
                project: this.mockData.projects[0],
                created_at: new Date(),
                updated_at: new Date(),
                completed: false
            },
            {
                id: 'task-2',
                title: '已完成的测试任务',
                description: '这是一个已完成的任务用于测试',
                priority: 'medium',
                status: 'completed',
                completed_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
                project: this.mockData.projects[1],
                created_at: new Date(),
                updated_at: new Date(),
                completed: true
            }
        ];
        // 模拟笔记数据
        this.mockData.notes = [
            {
                id: 'note-1',
                title: '测试笔记',
                content: '这是一个用于测试的笔记内容',
                category: '测试',
                color: '#FFE5E5',
                tags: ['测试', 'UI'],
                is_pinned: true,
                is_archived: false,
                created_at: new Date(),
                updated_at: new Date()
            }
        ];
    }
    /**
     * 运行单个测试
     */
    async runTest(testName, testFn) {
        const startTime = Date.now();
        try {
            console.log(`🧪 运行测试: ${testName}`);
            const result = await testFn();
            const duration = Date.now() - startTime;
            console.log(`✅ 测试通过: ${testName} (${duration}ms)`);
            return {
                testName,
                passed: true,
                duration,
                details: result
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.log(`❌ 测试失败: ${testName} - ${errorMessage} (${duration}ms)`);
            return {
                testName,
                passed: false,
                error: errorMessage,
                duration
            };
        }
    }
    /**
     * 运行测试套件
     */
    async runTestSuite(suiteName, tests) {
        console.log(`\n📦 开始测试套件: ${suiteName}`);
        console.log('='.repeat(50));
        const suiteStartTime = Date.now();
        const testResults = [];
        for (const test of tests) {
            const result = await this.runTest(test.name, test.fn);
            testResults.push(result);
            // 测试间隔，避免过快执行
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        const totalDuration = Date.now() - suiteStartTime;
        const passedCount = testResults.filter(r => r.passed).length;
        const failedCount = testResults.filter(r => !r.passed).length;
        console.log(`\n📊 套件结果: ${suiteName}`);
        console.log(`   通过: ${passedCount}/${testResults.length}`);
        console.log(`   失败: ${failedCount}/${testResults.length}`);
        console.log(`   耗时: ${totalDuration}ms`);
        return {
            suiteName,
            tests: testResults,
            totalDuration,
            passedCount,
            failedCount
        };
    }
    /**
     * 测试新架构服务
     */
    async testNewArchitectureServices() {
        return await this.runTestSuite('新架构服务测试', [
            {
                name: '应用初始化测试',
                fn: async () => {
                    await lib_1.newAppService.initializeApp();
                    const isInitialized = lib_1.newAppService.isInitialized();
                    if (!isInitialized)
                        throw new Error('应用初始化失败');
                    return { initialized: isInitialized };
                }
            },
            {
                name: '任务服务可用性测试',
                fn: async () => {
                    const taskService = lib_1.newAppService.tasks;
                    const todayTasks = await taskService.getTodayTasks();
                    const allTasks = await taskService.getActiveTasks();
                    return {
                        todayTasksCount: todayTasks.length,
                        allTasksCount: allTasks.length
                    };
                }
            },
            {
                name: '笔记服务可用性测试',
                fn: async () => {
                    const noteService = lib_1.newAppService.notes;
                    const allNotes = await noteService.getAllNotes();
                    return { notesCount: allNotes.length };
                }
            },
            {
                name: '数据库统计测试',
                fn: async () => {
                    const stats = await lib_1.newAppService.database.getStatistics();
                    return stats;
                }
            },
            {
                name: '事件总线测试',
                fn: async () => {
                    const eventBus = lib_1.newAppService.eventBus;
                    const subscribedEvents = eventBus.getSubscribedEvents();
                    return { subscribedEvents };
                }
            }
        ]);
    }
    /**
     * 测试数据操作功能
     */
    async testDataOperations() {
        return await this.runTestSuite('数据操作测试', [
            {
                name: '创建任务测试',
                fn: async () => {
                    const taskData = {
                        title: '测试任务',
                        description: '这是一个测试任务',
                        priority: 'medium',
                        status: 'not_started',
                        reminder: false,
                        category: 'proj-1'
                    };
                    const task = await lib_1.newAppService.tasks.createTask(taskData);
                    if (!task)
                        throw new Error('创建任务失败');
                    // 清理测试数据
                    await lib_1.newAppService.tasks.deleteTask(task.id);
                    return { taskId: task.id, title: task.title };
                }
            },
            {
                name: '任务状态切换测试',
                fn: async () => {
                    // 创建测试任务
                    const task = await lib_1.newAppService.tasks.createTask({
                        title: '状态测试任务',
                        description: '用于测试状态切换',
                        priority: 'low',
                        status: 'not_started',
                        reminder: false,
                        category: 'proj-1'
                    });
                    if (!task)
                        throw new Error('创建测试任务失败');
                    // 测试状态切换
                    const updatedTask = await lib_1.newAppService.tasks.updateTaskStatus(task.id, 'completed');
                    if (updatedTask?.status !== 'completed') {
                        throw new Error('任务状态切换失败');
                    }
                    // 清理测试数据
                    await lib_1.newAppService.tasks.deleteTask(task.id);
                    return {
                        originalStatus: task.status,
                        updatedStatus: updatedTask.status
                    };
                }
            },
            {
                name: '创建笔记测试',
                fn: async () => {
                    const noteData = {
                        title: '测试笔记',
                        content: '这是一个测试笔记内容',
                        category: '测试',
                        color: '#FFE5E5',
                        tags: ['测试'],
                        is_pinned: false
                    };
                    const note = await lib_1.newAppService.notes.createNote(noteData);
                    if (!note)
                        throw new Error('创建笔记失败');
                    // 清理测试数据
                    await lib_1.newAppService.notes.deleteNote(note.id);
                    return { noteId: note.id, title: note.title };
                }
            },
            {
                name: '笔记搜索测试',
                fn: async () => {
                    // 创建测试笔记
                    const note = await lib_1.newAppService.notes.createNote({
                        title: '搜索测试笔记',
                        content: '这是用于搜索测试的内容',
                        category: '测试',
                        tags: ['搜索', '测试']
                    });
                    if (!note)
                        throw new Error('创建测试笔记失败');
                    // 测试搜索功能
                    const searchResults = await lib_1.newAppService.notes.searchNotes('搜索测试');
                    const found = searchResults.some(n => n.id === note.id);
                    // 清理测试数据
                    await lib_1.newAppService.notes.deleteNote(note.id);
                    if (!found)
                        throw new Error('笔记搜索功能失败');
                    return {
                        searchQuery: '搜索测试',
                        resultsCount: searchResults.length,
                        foundTestNote: found
                    };
                }
            }
        ]);
    }
    /**
     * 测试批量操作功能
     */
    async testBatchOperations() {
        return await this.runTestSuite('批量操作测试', [
            {
                name: '批量创建任务测试',
                fn: async () => {
                    const tasks = [];
                    const taskIds = [];
                    // 创建多个测试任务
                    for (let i = 0; i < 3; i++) {
                        const task = await lib_1.newAppService.tasks.createTask({
                            title: `批量测试任务 ${i + 1}`,
                            description: `批量操作测试任务 ${i + 1}`,
                            priority: 'low',
                            status: 'completed',
                            reminder: false,
                            category: 'proj-1'
                        });
                        if (task) {
                            tasks.push(task);
                            taskIds.push(task.id);
                        }
                    }
                    if (tasks.length !== 3)
                        throw new Error('批量创建任务失败');
                    // 测试批量删除
                    await lib_1.newAppService.tasks.batchDelete(taskIds);
                    // 验证删除
                    const remainingTasks = await Promise.all(taskIds.map(id => lib_1.newAppService.tasks.getTaskById(id)));
                    const existingTasks = remainingTasks.filter(t => t !== null);
                    if (existingTasks.length > 0) {
                        throw new Error('批量删除失败，仍有任务存在');
                    }
                    return {
                        createdCount: tasks.length,
                        deletedCount: taskIds.length
                    };
                }
            },
            {
                name: '批量恢复任务测试',
                fn: async () => {
                    const taskIds = [];
                    // 创建已完成的测试任务
                    for (let i = 0; i < 2; i++) {
                        const task = await lib_1.newAppService.tasks.createTask({
                            title: `批量恢复测试任务 ${i + 1}`,
                            description: '用于测试批量恢复功能',
                            priority: 'medium',
                            status: 'completed',
                            reminder: false,
                            category: 'proj-1'
                        });
                        if (task) {
                            taskIds.push(task.id);
                        }
                    }
                    // 测试批量恢复
                    await lib_1.newAppService.tasks.batchRestoreCompletedTasks(taskIds);
                    // 验证恢复结果
                    const restoredTasks = await Promise.all(taskIds.map(id => lib_1.newAppService.tasks.getTaskById(id)));
                    const notStartedTasks = restoredTasks.filter(task => task && task.status === 'not_started');
                    // 清理测试数据
                    await lib_1.newAppService.tasks.batchDelete(taskIds);
                    if (notStartedTasks.length !== taskIds.length) {
                        throw new Error('批量恢复失败');
                    }
                    return {
                        restoredCount: notStartedTasks.length,
                        totalTaskIds: taskIds.length
                    };
                }
            }
        ]);
    }
    /**
     * 测试UI组件模拟功能
     */
    async testUIComponentFeatures() {
        return await this.runTestSuite('UI组件功能测试', [
            {
                name: '筛选器功能模拟测试',
                fn: async () => {
                    // 模拟筛选器功能
                    const allTasks = await lib_1.newAppService.tasks.getAllTasks();
                    // 按优先级筛选
                    const highPriorityTasks = allTasks.filter(task => task.priority === 'high');
                    // 按状态筛选  
                    const completedTasks = allTasks.filter(task => task.status === 'completed');
                    // 按日期筛选（今天）
                    const today = new Date().toDateString();
                    const todayTasks = allTasks.filter(task => {
                        if (!task.due_date)
                            return false;
                        return new Date(task.due_date).toDateString() === today;
                    });
                    return {
                        totalTasks: allTasks.length,
                        highPriorityTasks: highPriorityTasks.length,
                        completedTasks: completedTasks.length,
                        todayTasks: todayTasks.length
                    };
                }
            },
            {
                name: '分页功能模拟测试',
                fn: async () => {
                    // 模拟分页功能
                    const pageSize = 10;
                    const page1Tasks = await lib_1.newAppService.tasks.getCompletedTasks(pageSize);
                    // 检查分页结果
                    const hasMore = page1Tasks.length === pageSize;
                    return {
                        pageSize,
                        page1Count: page1Tasks.length,
                        hasMore
                    };
                }
            },
            {
                name: '搜索功能综合测试',
                fn: async () => {
                    // 创建测试数据
                    const testNote = await lib_1.newAppService.notes.createNote({
                        title: 'UI搜索测试笔记',
                        content: '这是用于UI搜索功能测试的笔记内容',
                        category: 'UI测试',
                        tags: ['UI', '搜索', '测试']
                    });
                    if (!testNote)
                        throw new Error('创建测试笔记失败');
                    // 测试不同搜索条件
                    const titleSearch = await lib_1.newAppService.notes.searchNotes('UI搜索');
                    const contentSearch = await lib_1.newAppService.notes.searchNotes('功能测试');
                    const categorySearch = await lib_1.newAppService.notes.getNotesByCategory('UI测试');
                    // 清理测试数据
                    await lib_1.newAppService.notes.deleteNote(testNote.id);
                    return {
                        titleSearchResults: titleSearch.length,
                        contentSearchResults: contentSearch.length,
                        categorySearchResults: categorySearch.length,
                        testNoteCreated: true
                    };
                }
            },
            {
                name: '统计功能测试',
                fn: async () => {
                    // 获取各种统计数据
                    const todayTasks = await lib_1.newAppService.tasks.getTodayTasks();
                    const allActiveTasks = await lib_1.newAppService.tasks.getActiveTasks();
                    const allCompletedTasks = await lib_1.newAppService.tasks.getCompletedTasks();
                    const allNotes = await lib_1.newAppService.notes.getAllNotes();
                    // 计算统计信息
                    const tasksByPriority = {
                        high: allActiveTasks.filter(t => t.priority === 'high').length,
                        medium: allActiveTasks.filter(t => t.priority === 'medium').length,
                        low: allActiveTasks.filter(t => t.priority === 'low').length
                    };
                    const tasksByStatus = {
                        notStarted: allActiveTasks.filter(t => t.status === 'not_started').length,
                        inProgress: allActiveTasks.filter(t => t.status === 'in_progress').length,
                        completed: allCompletedTasks.length
                    };
                    return {
                        todayTasksCount: todayTasks.length,
                        activeTasksCount: allActiveTasks.length,
                        completedTasksCount: allCompletedTasks.length,
                        notesCount: allNotes.length,
                        tasksByPriority,
                        tasksByStatus
                    };
                }
            }
        ]);
    }
    /**
     * 测试错误处理
     */
    async testErrorHandling() {
        return await this.runTestSuite('错误处理测试', [
            {
                name: '无效任务ID测试',
                fn: async () => {
                    const invalidId = 'invalid-task-id-12345';
                    const task = await lib_1.newAppService.tasks.getTaskById(invalidId);
                    if (task !== null) {
                        throw new Error('应该返回null但返回了任务对象');
                    }
                    return { invalidId, result: 'null as expected' };
                }
            },
            {
                name: '无效笔记ID测试',
                fn: async () => {
                    const invalidId = 'invalid-note-id-12345';
                    const note = await lib_1.newAppService.notes.getNoteById(invalidId);
                    if (note !== null) {
                        throw new Error('应该返回null但返回了笔记对象');
                    }
                    return { invalidId, result: 'null as expected' };
                }
            },
            {
                name: '空搜索查询测试',
                fn: async () => {
                    const emptyResults = await lib_1.newAppService.notes.searchNotes('');
                    const allNotes = await lib_1.newAppService.notes.getAllNotes();
                    // 空搜索应该返回所有笔记或空数组，取决于实现
                    return {
                        emptySearchResults: emptyResults.length,
                        totalNotes: allNotes.length,
                        behavior: emptyResults.length === allNotes.length ? 'returns_all' : 'returns_empty'
                    };
                }
            }
        ]);
    }
    /**
     * 生成测试报告
     */
    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📋 UI测试完整报告');
        console.log('='.repeat(80));
        let totalTests = 0;
        let totalPassed = 0;
        let totalFailed = 0;
        let totalDuration = 0;
        this.testResults.forEach(suite => {
            totalTests += suite.tests.length;
            totalPassed += suite.passedCount;
            totalFailed += suite.failedCount;
            totalDuration += suite.totalDuration;
            console.log(`\n📦 ${suite.suiteName}:`);
            console.log(`   测试数量: ${suite.tests.length}`);
            console.log(`   通过: ${suite.passedCount}`);
            console.log(`   失败: ${suite.failedCount}`);
            console.log(`   成功率: ${((suite.passedCount / suite.tests.length) * 100).toFixed(1)}%`);
            console.log(`   耗时: ${suite.totalDuration}ms`);
            // 显示失败的测试
            const failedTests = suite.tests.filter(t => !t.passed);
            if (failedTests.length > 0) {
                console.log(`   失败测试:`);
                failedTests.forEach(test => {
                    console.log(`     ❌ ${test.testName}: ${test.error}`);
                });
            }
        });
        console.log('\n' + '='.repeat(80));
        console.log('📊 总体统计:');
        console.log(`   总测试数: ${totalTests}`);
        console.log(`   总通过数: ${totalPassed}`);
        console.log(`   总失败数: ${totalFailed}`);
        console.log(`   总成功率: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
        console.log(`   总耗时: ${totalDuration}ms`);
        console.log(`   平均测试时间: ${(totalDuration / totalTests).toFixed(1)}ms`);
        if (totalFailed === 0) {
            console.log('\n🎉 所有UI测试通过！应用UI功能正常。');
        }
        else {
            console.log(`\n⚠️  有 ${totalFailed} 个测试失败，请检查相关功能。`);
        }
        console.log('='.repeat(80));
    }
    /**
     * 运行所有UI测试
     */
    async runAllTests() {
        console.log('🚀 启动UI自动化测试');
        console.log('测试目标：验证应用UI组件和用户交互功能');
        console.log('测试环境：新架构服务');
        try {
            // 运行所有测试套件
            this.testResults.push(await this.testNewArchitectureServices());
            this.testResults.push(await this.testDataOperations());
            this.testResults.push(await this.testBatchOperations());
            this.testResults.push(await this.testUIComponentFeatures());
            this.testResults.push(await this.testErrorHandling());
            // 生成最终报告
            this.generateReport();
        }
        catch (error) {
            console.error('❌ UI测试运行失败:', error);
            process.exit(1);
        }
    }
}
exports.UITestRunner = UITestRunner;
// 运行测试
if (require.main === module) {
    const testRunner = new UITestRunner();
    testRunner.runAllTests()
        .then(() => {
        console.log('✅ UI测试完成');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 UI测试失败:', error);
        process.exit(1);
    });
}
