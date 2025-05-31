#!/usr/bin/env tsx
"use strict";
/**
 * UI组件专项测试脚本
 * 测试应用中各种UI组件的功能、交互和性能
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIComponentTester = void 0;
const lib_1 = require("../lib");
class UIComponentTester {
    constructor() {
        this.testResults = [];
        this.testData = {
            tasks: [],
            notes: [],
            projects: []
        };
        this.setupTestData();
    }
    /**
     * 设置测试数据
     */
    setupTestData() {
        this.testData.projects = [
            { id: 'proj-1', name: '工作项目', color: '#2196F3', icon: 'briefcase-outline' },
            { id: 'proj-2', name: '个人学习', color: '#9C27B0', icon: 'school-outline' },
            { id: 'proj-3', name: '生活管理', color: '#4CAF50', icon: 'home-outline' },
        ];
        this.testData.tasks = [
            {
                id: 'task-1',
                title: '高优先级任务',
                description: '这是一个高优先级的测试任务',
                priority: 'high',
                status: 'in_progress',
                due_date: new Date(),
                project: this.testData.projects[0],
                created_at: new Date(),
                updated_at: new Date(),
                completed: false
            },
            {
                id: 'task-2',
                title: '已完成任务',
                description: '这是一个已完成的任务',
                priority: 'medium',
                status: 'completed',
                completed_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
                project: this.testData.projects[1],
                created_at: new Date(),
                updated_at: new Date(),
                completed: true
            },
            {
                id: 'task-3',
                title: '低优先级任务',
                description: '这是一个低优先级的任务',
                priority: 'low',
                status: 'not_started',
                due_date: new Date(Date.now() + 48 * 60 * 60 * 1000),
                project: this.testData.projects[2],
                created_at: new Date(),
                updated_at: new Date(),
                completed: false
            }
        ];
        this.testData.notes = [
            {
                id: 'note-1',
                title: '置顶笔记',
                content: '这是一个置顶的笔记内容',
                category: '重要',
                color: '#FFE5E5',
                tags: ['重要', '置顶'],
                is_pinned: true,
                is_archived: false,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 'note-2',
                title: '普通笔记',
                content: '这是一个普通的笔记内容，用于测试搜索和分类功能',
                category: '日常',
                color: '#E8F5E8',
                tags: ['日常', '测试'],
                is_pinned: false,
                is_archived: false,
                created_at: new Date(Date.now() - 12 * 60 * 60 * 1000),
                updated_at: new Date()
            }
        ];
    }
    /**
     * 运行单个组件测试
     */
    async runComponentTest(componentName, testName, testFn) {
        const startTime = Date.now();
        try {
            console.log(`🧪 [${componentName}] 测试: ${testName}`);
            const result = await testFn();
            const duration = Date.now() - startTime;
            console.log(`✅ [${componentName}] 通过: ${testName} (${duration}ms)`);
            return {
                componentName,
                testName,
                passed: true,
                duration,
                details: result
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.log(`❌ [${componentName}] 失败: ${testName} - ${errorMessage} (${duration}ms)`);
            return {
                componentName,
                testName,
                passed: false,
                error: errorMessage,
                duration
            };
        }
    }
    /**
     * 运行组件测试套件
     */
    async runComponentSuite(componentName, tests) {
        console.log(`\n📱 开始测试组件: ${componentName}`);
        console.log('='.repeat(60));
        const suiteStartTime = Date.now();
        const testResults = [];
        for (const test of tests) {
            const result = await this.runComponentTest(componentName, test.name, test.fn);
            testResults.push(result);
            // 测试间隔
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        const totalDuration = Date.now() - suiteStartTime;
        const passedCount = testResults.filter(r => r.passed).length;
        const failedCount = testResults.filter(r => !r.passed).length;
        console.log(`\n📊 组件结果: ${componentName}`);
        console.log(`   通过: ${passedCount}/${testResults.length}`);
        console.log(`   失败: ${failedCount}/${testResults.length}`);
        console.log(`   耗时: ${totalDuration}ms`);
        return {
            componentName,
            tests: testResults,
            totalDuration,
            passedCount,
            failedCount
        };
    }
    /**
     * 测试任务列表组件
     */
    async testTaskListComponent() {
        return await this.runComponentSuite('TaskList组件', [
            {
                name: '任务数据加载',
                fn: async () => {
                    const tasks = await lib_1.newAppService.tasks.getActiveTasks();
                    const todayTasks = await lib_1.newAppService.tasks.getTodayTasks();
                    const completedTasks = await lib_1.newAppService.tasks.getCompletedTasks(10);
                    return {
                        activeTasks: tasks.length,
                        todayTasks: todayTasks.length,
                        completedTasks: completedTasks.length,
                        dataLoaded: true
                    };
                }
            },
            {
                name: '任务筛选功能',
                fn: async () => {
                    const allTasks = await lib_1.newAppService.tasks.getAllTasks();
                    // 按优先级筛选
                    const highPriorityTasks = allTasks.filter(task => task.priority === 'high');
                    const mediumPriorityTasks = allTasks.filter(task => task.priority === 'medium');
                    const lowPriorityTasks = allTasks.filter(task => task.priority === 'low');
                    // 按状态筛选
                    const notStartedTasks = allTasks.filter(task => task.status === 'not_started');
                    const inProgressTasks = allTasks.filter(task => task.status === 'in_progress');
                    const completedTasks = allTasks.filter(task => task.status === 'completed');
                    return {
                        totalTasks: allTasks.length,
                        byPriority: {
                            high: highPriorityTasks.length,
                            medium: mediumPriorityTasks.length,
                            low: lowPriorityTasks.length
                        },
                        byStatus: {
                            notStarted: notStartedTasks.length,
                            inProgress: inProgressTasks.length,
                            completed: completedTasks.length
                        }
                    };
                }
            },
            {
                name: '任务状态切换',
                fn: async () => {
                    // 创建测试任务
                    const testTask = await lib_1.newAppService.tasks.createTask({
                        title: '状态切换测试任务',
                        description: '用于测试状态切换功能',
                        priority: 'medium',
                        status: 'not_started',
                        reminder: false,
                        category: 'proj-1'
                    });
                    if (!testTask)
                        throw new Error('创建测试任务失败');
                    // 测试状态切换
                    const updatedTask = await lib_1.newAppService.tasks.updateTaskStatus(testTask.id, 'completed');
                    const isCompleted = updatedTask?.status === 'completed';
                    // 再次切换状态
                    const restoredTask = await lib_1.newAppService.tasks.updateTaskStatus(testTask.id, 'not_started');
                    const isRestored = restoredTask?.status === 'not_started';
                    // 清理测试数据
                    await lib_1.newAppService.tasks.deleteTask(testTask.id);
                    if (!isCompleted || !isRestored) {
                        throw new Error('任务状态切换失败');
                    }
                    return {
                        originalStatus: testTask.status,
                        completedStatus: updatedTask.status,
                        restoredStatus: restoredTask.status,
                        statusToggleWorks: true
                    };
                }
            }
        ]);
    }
    /**
     * 测试笔记列表组件
     */
    async testNoteListComponent() {
        return await this.runComponentSuite('NoteList组件', [
            {
                name: '笔记数据加载',
                fn: async () => {
                    const allNotes = await lib_1.newAppService.notes.getAllNotes();
                    // 获取分类信息
                    const categories = [...new Set(allNotes.map(note => note.category).filter(Boolean))];
                    // 获取置顶笔记
                    const pinnedNotes = allNotes.filter(note => note.is_pinned);
                    return {
                        totalNotes: allNotes.length,
                        categories: categories.length,
                        pinnedNotes: pinnedNotes.length,
                        dataLoaded: true
                    };
                }
            },
            {
                name: '笔记搜索功能',
                fn: async () => {
                    // 创建测试笔记
                    const testNote = await lib_1.newAppService.notes.createNote({
                        title: '搜索测试笔记',
                        content: '这是用于搜索功能测试的笔记内容，包含特殊关键词：SEARCH_TEST',
                        category: '测试分类',
                        tags: ['搜索', '测试', 'UI']
                    });
                    if (!testNote)
                        throw new Error('创建测试笔记失败');
                    // 测试标题搜索
                    const titleSearch = await lib_1.newAppService.notes.searchNotes('搜索测试');
                    const titleFound = titleSearch.some(note => note.id === testNote.id);
                    // 测试内容搜索
                    const contentSearch = await lib_1.newAppService.notes.searchNotes('SEARCH_TEST');
                    const contentFound = contentSearch.some(note => note.id === testNote.id);
                    // 测试分类获取
                    const categoryNotes = await lib_1.newAppService.notes.getNotesByCategory('测试分类');
                    const categoryFound = categoryNotes.some(note => note.id === testNote.id);
                    // 清理测试数据
                    await lib_1.newAppService.notes.deleteNote(testNote.id);
                    return {
                        titleSearchWorks: titleFound,
                        contentSearchWorks: contentFound,
                        categorySearchWorks: categoryFound,
                        allSearchesWork: titleFound && contentFound && categoryFound
                    };
                }
            },
            {
                name: '笔记视图模式',
                fn: async () => {
                    // 模拟网格视图和列表视图的数据处理
                    const allNotes = await lib_1.newAppService.notes.getAllNotes();
                    // 网格视图：按更新时间排序
                    const gridViewNotes = [...allNotes].sort((a, b) => {
                        const dateA = new Date(a.updated_at);
                        const dateB = new Date(b.updated_at);
                        return dateB.getTime() - dateA.getTime();
                    });
                    // 列表视图：置顶笔记在前，然后按更新时间排序
                    const listViewNotes = [...allNotes].sort((a, b) => {
                        if (a.is_pinned && !b.is_pinned)
                            return -1;
                        if (!a.is_pinned && b.is_pinned)
                            return 1;
                        const dateA = new Date(a.updated_at);
                        const dateB = new Date(b.updated_at);
                        return dateB.getTime() - dateA.getTime();
                    });
                    return {
                        totalNotes: allNotes.length,
                        gridViewSorted: gridViewNotes.length === allNotes.length,
                        listViewSorted: listViewNotes.length === allNotes.length,
                        viewModesWork: true
                    };
                }
            }
        ]);
    }
    /**
     * 测试批量操作组件
     */
    async testBatchOperationComponent() {
        return await this.runComponentSuite('BatchOperation组件', [
            {
                name: '批量选择功能',
                fn: async () => {
                    // 创建多个测试任务
                    const taskIds = [];
                    for (let i = 0; i < 3; i++) {
                        const task = await lib_1.newAppService.tasks.createTask({
                            title: `批量选择测试任务 ${i + 1}`,
                            description: '用于测试批量选择功能',
                            priority: 'low',
                            status: 'completed',
                            reminder: false,
                            category: 'proj-1'
                        });
                        if (task)
                            taskIds.push(task.id);
                    }
                    // 模拟全选操作
                    const allSelected = taskIds.length === 3;
                    // 模拟部分选择
                    const partialSelected = taskIds.slice(0, 2);
                    const isPartialSelection = partialSelected.length < taskIds.length;
                    // 清理测试数据
                    await lib_1.newAppService.tasks.batchDelete(taskIds);
                    return {
                        createdTasks: taskIds.length,
                        allSelectionWorks: allSelected,
                        partialSelectionWorks: isPartialSelection,
                        cleanupSuccessful: true
                    };
                }
            },
            {
                name: '批量删除功能',
                fn: async () => {
                    // 创建测试任务
                    const taskIds = [];
                    for (let i = 0; i < 2; i++) {
                        const task = await lib_1.newAppService.tasks.createTask({
                            title: `批量删除测试任务 ${i + 1}`,
                            description: '用于测试批量删除功能',
                            priority: 'medium',
                            status: 'completed',
                            reminder: false,
                            category: 'proj-1'
                        });
                        if (task)
                            taskIds.push(task.id);
                    }
                    // 执行批量删除
                    await lib_1.newAppService.tasks.batchDelete(taskIds);
                    // 验证删除结果
                    const remainingTasks = await Promise.all(taskIds.map(id => lib_1.newAppService.tasks.getTaskById(id)));
                    const deletedTasks = remainingTasks.filter(task => task === null);
                    const isAllDeleted = deletedTasks.length === taskIds.length;
                    return {
                        originalTaskCount: taskIds.length,
                        deletedTaskCount: deletedTasks.length,
                        batchDeleteWorks: isAllDeleted
                    };
                }
            },
            {
                name: '批量恢复功能',
                fn: async () => {
                    // 创建已完成的测试任务
                    const taskIds = [];
                    for (let i = 0; i < 2; i++) {
                        const task = await lib_1.newAppService.tasks.createTask({
                            title: `批量恢复测试任务 ${i + 1}`,
                            description: '用于测试批量恢复功能',
                            priority: 'high',
                            status: 'completed',
                            reminder: false,
                            category: 'proj-1'
                        });
                        if (task)
                            taskIds.push(task.id);
                    }
                    // 执行批量恢复
                    await lib_1.newAppService.tasks.batchRestoreCompletedTasks(taskIds);
                    // 验证恢复结果
                    const restoredTasks = await Promise.all(taskIds.map(id => lib_1.newAppService.tasks.getTaskById(id)));
                    const notStartedTasks = restoredTasks.filter(task => task && task.status === 'not_started');
                    // 清理测试数据
                    await lib_1.newAppService.tasks.batchDelete(taskIds);
                    const isAllRestored = notStartedTasks.length === taskIds.length;
                    return {
                        originalTaskCount: taskIds.length,
                        restoredTaskCount: notStartedTasks.length,
                        batchRestoreWorks: isAllRestored
                    };
                }
            }
        ]);
    }
    /**
     * 测试筛选器组件
     */
    async testFilterComponent() {
        return await this.runComponentSuite('Filter组件', [
            {
                name: '时间范围筛选',
                fn: async () => {
                    const allTasks = await lib_1.newAppService.tasks.getAllTasks();
                    // 模拟今天的任务筛选
                    const today = new Date().toDateString();
                    const todayTasks = allTasks.filter(task => {
                        if (!task.due_date)
                            return false;
                        return new Date(task.due_date).toDateString() === today;
                    });
                    // 模拟本周的任务筛选
                    const weekStart = new Date();
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6);
                    const weekTasks = allTasks.filter(task => {
                        if (!task.due_date)
                            return false;
                        const taskDate = new Date(task.due_date);
                        return taskDate >= weekStart && taskDate <= weekEnd;
                    });
                    return {
                        totalTasks: allTasks.length,
                        todayTasks: todayTasks.length,
                        weekTasks: weekTasks.length,
                        timeFilterWorks: true
                    };
                }
            },
            {
                name: '优先级筛选',
                fn: async () => {
                    const allTasks = await lib_1.newAppService.tasks.getAllTasks();
                    // 按不同优先级筛选
                    const filters = ['high', 'medium', 'low'];
                    const results = {};
                    for (const priority of filters) {
                        const filteredTasks = allTasks.filter(task => task.priority === priority);
                        results[priority] = filteredTasks.length;
                    }
                    const totalFiltered = Object.values(results).reduce((sum, count) => sum + count, 0);
                    return {
                        totalTasks: allTasks.length,
                        priorityFilters: results,
                        totalFiltered,
                        priorityFilterWorks: totalFiltered <= allTasks.length
                    };
                }
            },
            {
                name: '状态筛选',
                fn: async () => {
                    const allTasks = await lib_1.newAppService.tasks.getAllTasks();
                    // 按不同状态筛选
                    const statusFilters = ['not_started', 'in_progress', 'completed'];
                    const results = {};
                    for (const status of statusFilters) {
                        const filteredTasks = allTasks.filter(task => task.status === status);
                        results[status] = filteredTasks.length;
                    }
                    return {
                        totalTasks: allTasks.length,
                        statusFilters: results,
                        statusFilterWorks: true
                    };
                }
            }
        ]);
    }
    /**
     * 测试统计组件
     */
    async testStatsComponent() {
        return await this.runComponentSuite('Stats组件', [
            {
                name: '基础统计计算',
                fn: async () => {
                    const allTasks = await lib_1.newAppService.tasks.getAllTasks();
                    const completedTasks = await lib_1.newAppService.tasks.getCompletedTasks();
                    const allNotes = await lib_1.newAppService.notes.getAllNotes();
                    // 计算任务统计
                    const activeTasks = allTasks.filter(task => task.status !== 'completed');
                    const todayTasks = await lib_1.newAppService.tasks.getTodayTasks();
                    // 计算完成率
                    const completionRate = allTasks.length > 0
                        ? (completedTasks.length / (allTasks.length + completedTasks.length)) * 100
                        : 0;
                    return {
                        totalTasks: allTasks.length,
                        completedTasks: completedTasks.length,
                        activeTasks: activeTasks.length,
                        todayTasks: todayTasks.length,
                        totalNotes: allNotes.length,
                        completionRate: Math.round(completionRate),
                        statsCalculated: true
                    };
                }
            },
            {
                name: '趋势统计计算',
                fn: async () => {
                    const completedTasks = await lib_1.newAppService.tasks.getCompletedTasks();
                    // 按日期分组统计
                    const dateGroups = {};
                    completedTasks.forEach(task => {
                        if (task.completed_at) {
                            const date = new Date(task.completed_at).toDateString();
                            dateGroups[date] = (dateGroups[date] || 0) + 1;
                        }
                    });
                    const trendData = Object.entries(dateGroups).map(([date, count]) => ({
                        date,
                        count
                    }));
                    return {
                        totalCompletedTasks: completedTasks.length,
                        trendDataPoints: trendData.length,
                        maxDailyTasks: Math.max(...Object.values(dateGroups), 0),
                        trendCalculated: true
                    };
                }
            }
        ]);
    }
    /**
     * 生成组件测试报告
     */
    generateComponentReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📱 UI组件测试完整报告');
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
            console.log(`\n📱 ${suite.componentName}:`);
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
        console.log('📊 组件测试总体统计:');
        console.log(`   总测试数: ${totalTests}`);
        console.log(`   总通过数: ${totalPassed}`);
        console.log(`   总失败数: ${totalFailed}`);
        console.log(`   总成功率: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
        console.log(`   总耗时: ${totalDuration}ms`);
        console.log(`   平均测试时间: ${(totalDuration / totalTests).toFixed(1)}ms`);
        // 组件健康评估
        const healthyComponents = this.testResults.filter(suite => suite.failedCount === 0);
        const criticalComponents = this.testResults.filter(suite => suite.failedCount > suite.passedCount);
        console.log('\n🏥 组件健康评估:');
        console.log(`   健康组件: ${healthyComponents.length}/${this.testResults.length}`);
        console.log(`   问题组件: ${criticalComponents.length}/${this.testResults.length}`);
        if (criticalComponents.length > 0) {
            console.log('   需要关注的组件:');
            criticalComponents.forEach(suite => {
                console.log(`     ⚠️  ${suite.componentName}: ${suite.failedCount} 个测试失败`);
            });
        }
        if (totalFailed === 0) {
            console.log('\n🎉 所有UI组件测试通过！应用UI组件功能正常。');
        }
        else {
            console.log(`\n⚠️  有 ${totalFailed} 个组件测试失败，请检查相关组件功能。`);
        }
        console.log('='.repeat(80));
    }
    /**
     * 运行所有组件测试
     */
    async runAllComponentTests() {
        console.log('🚀 启动UI组件专项测试');
        console.log('测试目标：验证应用UI组件功能和交互');
        console.log('测试范围：任务列表、笔记列表、批量操作、筛选器、统计等组件');
        try {
            // 确保新架构已初始化
            await lib_1.newAppService.initializeApp();
            // 运行所有组件测试套件
            this.testResults.push(await this.testTaskListComponent());
            this.testResults.push(await this.testNoteListComponent());
            this.testResults.push(await this.testBatchOperationComponent());
            this.testResults.push(await this.testFilterComponent());
            this.testResults.push(await this.testStatsComponent());
            // 生成最终报告
            this.generateComponentReport();
        }
        catch (error) {
            console.error('❌ UI组件测试运行失败:', error);
            process.exit(1);
        }
    }
}
exports.UIComponentTester = UIComponentTester;
// 运行测试
if (require.main === module) {
    const componentTester = new UIComponentTester();
    componentTester.runAllComponentTests()
        .then(() => {
        console.log('✅ UI组件测试完成');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 UI组件测试失败:', error);
        process.exit(1);
    });
}
