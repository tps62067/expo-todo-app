#!/usr/bin/env ts-node

/**
 * 架构迁移验证脚本
 * 验证新架构是否正常工作
 */

import { newAppService } from '../lib';

async function testMigration() {
  console.log('🚀 开始测试新架构迁移...');
  
  try {
    // 1. 测试应用初始化
    console.log('1. 测试应用初始化...');
    await newAppService.initializeApp();
    console.log('✅ 应用初始化成功');
    
    // 2. 测试任务服务
    console.log('2. 测试任务服务...');
    const testTask = await newAppService.tasks.createTask({
      title: '迁移测试任务',
      description: '验证新架构功能',
      priority: 'medium',
      status: 'not_started',
      reminder: false,
      category: 'default-project'
    });
    console.log('✅ 任务创建成功:', testTask?.title);
    
    const allTasks = await newAppService.tasks.getAllTasks();
    console.log(`✅ 获取任务列表成功，共 ${allTasks.length} 个任务`);
    
    // 3. 测试笔记服务
    console.log('3. 测试笔记服务...');
    const testNote = await newAppService.notes.createNote({
      title: '迁移测试笔记',
      content: '验证新架构笔记功能',
      category: '测试分类'
    });
    console.log('✅ 笔记创建成功:', testNote?.title);
    
    const allNotes = await newAppService.notes.getAllNotes();
    console.log(`✅ 获取笔记列表成功，共 ${allNotes.length} 个笔记`);
    
    // 4. 测试数据库直接访问
    console.log('4. 测试数据库直接访问...');
    const taskRepository = newAppService.taskRepository;
    const activeTasks = await taskRepository.findActive();
    console.log(`✅ Repository 访问成功，活跃任务 ${activeTasks.length} 个`);
    
    // 5. 测试事件总线
    console.log('5. 测试事件总线...');
    const eventBus = newAppService.eventBus;
    const subscribedEvents = eventBus.getSubscribedEvents();
    console.log(`✅ 事件总线正常，已订阅事件: ${subscribedEvents.join(', ')}`);
    
    console.log('\n🎉 新架构迁移测试全部通过！');
    console.log('📊 迁移统计:');
    console.log(`   - 任务总数: ${allTasks.length}`);
    console.log(`   - 笔记总数: ${allNotes.length}`);
    console.log(`   - 活跃任务: ${activeTasks.length}`);
    console.log(`   - 订阅事件: ${subscribedEvents.length}`);
    
  } catch (error) {
    console.error('❌ 迁移测试失败:', error);
    throw error;
  }
}

// 运行测试
if (require.main === module) {
  testMigration()
    .then(() => {
      console.log('✅ 迁移验证完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 迁移验证失败:', error);
      process.exit(1);
    });
}

export { testMigration };

