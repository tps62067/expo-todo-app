#!/usr/bin/env node

/**
 * 任务日志和时间功能测试脚本
 * 验证新架构中工作日志功能的正确性
 */

const fs = require('fs');
const path = require('path');

// 检查相关文件是否存在
console.log('🔍 任务日志功能测试脚本');
console.log('==========================================\n');

// 1. 检查核心文件是否存在
console.log('1. 检查核心文件...');
const coreFiles = [
  'lib/services/NewTaskService.ts',
  'lib/database/task-time-log-dao.ts', 
  'lib/container/ServiceRegistry.ts',
  'app/hooks/useNewTaskService.ts',
  'app/task/[id].tsx'
];

let allFilesExist = true;
for (const file of coreFiles) {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - 文件不存在`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.log('\n❌ 一些核心文件缺失，请检查项目结构');
  process.exit(1);
}

// 2. 检查依赖注入配置
console.log('\n2. 检查依赖注入配置...');
const serviceRegistryPath = 'lib/container/ServiceRegistry.ts';
const serviceRegistryContent = fs.readFileSync(serviceRegistryPath, 'utf-8');

const checks = [
  {
    name: 'TaskTimeLogDAO 注册',
    pattern: /taskTimeLogDAO[^}]*databaseService/s,
    description: 'TaskTimeLogDAO 应该依赖 databaseService'
  },
  {
    name: 'NewTaskService 依赖',
    pattern: /taskService[^}]*taskRepository[^}]*projectRepository[^}]*taskTimeLogDAO[^}]*eventBus/s,
    description: 'NewTaskService 应该包含 taskTimeLogDAO 依赖'
  }
];

for (const check of checks) {
  if (check.pattern.test(serviceRegistryContent)) {
    console.log(`  ✅ ${check.name}`);
  } else {
    console.log(`  ❌ ${check.name} - ${check.description}`);
  }
}

// 3. 检查 NewTaskService 工作日志方法
console.log('\n3. 检查 NewTaskService 工作日志方法...');
const newTaskServicePath = 'lib/services/NewTaskService.ts';
const newTaskServiceContent = fs.readFileSync(newTaskServicePath, 'utf-8');

const methods = [
  'getTaskWorkLogs',
  'addWorkLog', 
  'startWorkTimer',
  'stopWorkTimer',
  'getActiveTimer',
  'getWorkLogSummary',
  'deleteWorkLog'
];

for (const method of methods) {
  if (newTaskServiceContent.includes(`async ${method}(`)) {
    console.log(`  ✅ ${method} 方法存在`);
  } else {
    console.log(`  ❌ ${method} 方法缺失`);
  }
}

// 4. 检查构造函数依赖注入
console.log('\n4. 检查构造函数依赖注入...');
const constructorPattern = /constructor\s*\(\s*private\s+taskRepository[^}]+private\s+taskTimeLogDAO[^}]+\)/;
if (constructorPattern.test(newTaskServiceContent)) {
  console.log('  ✅ NewTaskService 构造函数包含 taskTimeLogDAO');
} else {
  console.log('  ❌ NewTaskService 构造函数缺少 taskTimeLogDAO');
}

// 5. 检查是否移除了错误的全局访问方式
console.log('\n5. 检查是否移除了错误的全局访问...');
const badPatterns = [
  'global as any',
  'DatabaseService.getInstance()',
  'newAppService?.database'
];

let foundBadPatterns = false;
for (const pattern of badPatterns) {
  if (newTaskServiceContent.includes(pattern)) {
    console.log(`  ❌ 发现错误模式: ${pattern}`);
    foundBadPatterns = true;
  }
}

if (!foundBadPatterns) {
  console.log('  ✅ 没有发现错误的全局访问模式');
}

// 6. 检查 Hook 中的方法导出
console.log('\n6. 检查 Hook 中的方法导出...');
const hookPath = 'app/hooks/useNewTaskService.ts';
const hookContent = fs.readFileSync(hookPath, 'utf-8');

const hookMethods = [
  'getTaskWorkLogs',
  'addWorkLog',
  'startWorkTimer',
  'stopWorkTimer', 
  'getActiveTimer',
  'getWorkLogSummary',
  'deleteWorkLog'
];

for (const method of hookMethods) {
  if (hookContent.includes(`${method}`) && hookContent.includes(`${method},`)) {
    console.log(`  ✅ ${method} 已导出`);
  } else {
    console.log(`  ❌ ${method} 未正确导出`);
  }
}

// 7. 检查任务详情页面的实现
console.log('\n7. 检查任务详情页面的实现...');
const taskDetailPath = 'app/task/[id].tsx';
const taskDetailContent = fs.readFileSync(taskDetailPath, 'utf-8');

const uiChecks = [
  {
    name: '使用新架构工作日志',
    pattern: /newTaskService\.getTaskWorkLogs/,
    description: '任务详情页面应该使用新架构的工作日志方法'
  },
  {
    name: '移除旧 TimeLogService',
    pattern: /TimeLogService\.getInstance/,
    description: '不应该再使用旧的 TimeLogService',
    shouldNotExist: true
  },
  {
    name: '工作日志计时器',
    pattern: /handleTimerToggle|newTaskService\.startWorkTimer|newTaskService\.stopWorkTimer/,
    description: '应该包含计时器功能'
  }
];

for (const check of uiChecks) {
  const found = check.pattern.test(taskDetailContent);
  if (check.shouldNotExist) {
    if (!found) {
      console.log(`  ✅ ${check.name}`);
    } else {
      console.log(`  ❌ ${check.name} - ${check.description}`);
    }
  } else {
    if (found) {
      console.log(`  ✅ ${check.name}`);
    } else {
      console.log(`  ❌ ${check.name} - ${check.description}`);
    }
  }
}

// 8. 生成测试建议
console.log('\n8. 手动测试建议...');
console.log('==========================================');
console.log('建议进行以下手动测试来验证功能:');
console.log('');
console.log('📱 用户界面测试:');
console.log('  1. 打开任意任务详情页面');
console.log('  2. 检查工作记录部分是否正常显示');
console.log('  3. 尝试点击"开始计时"按钮');
console.log('  4. 验证计时器是否正常工作');
console.log('  5. 尝试添加工作日志');
console.log('  6. 检查工作日志列表是否正常显示');
console.log('');
console.log('🔧 功能测试:');
console.log('  1. 启动计时器后，检查是否显示"暂停计时"');
console.log('  2. 暂停计时器后，检查工作日志是否自动创建');
console.log('  3. 手动添加工作日志，检查是否保存成功');
console.log('  4. 检查今日工作时间和总工作时间统计');
console.log('  5. 尝试删除工作日志');
console.log('');
console.log('⚠️ 错误检查:');
console.log('  1. 查看控制台，确认没有"数据库服务未初始化"错误');
console.log('  2. 查看控制台，确认没有"获取工作日志失败"错误');
console.log('  3. 确认所有工作日志相关操作都能正常完成');

console.log('\n✅ 测试脚本执行完成');
console.log('=========================================='); 