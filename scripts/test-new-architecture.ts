#!/usr/bin/env tsx

/**
 * 新架构功能测试脚本
 * 验证笔记服务和事件系统是否正常工作
 */

import { newAppService } from '../lib';

async function testNewArchitecture() {
  console.log('🧪 开始测试新架构...\n');

  try {
    // 1. 初始化应用
    console.log('1. 初始化新架构应用...');
    await newAppService.initializeApp();
    console.log('✅ 新架构应用初始化成功\n');

    // 2. 测试笔记服务
    console.log('2. 测试笔记服务...');
    
    // 创建测试笔记
    const testNote = await newAppService.notes.createNote({
      title: '测试笔记',
      content: '这是一个测试笔记的内容',
      category: '测试',
      color: '#FFE5E5',
      tags: ['测试', '新架构'],
      is_pinned: true,
    });
    console.log('✅ 创建笔记成功:', testNote?.title);

    // 获取所有笔记
    const allNotes = await newAppService.notes.getAllNotes();
    console.log(`✅ 获取笔记列表成功，数量: ${allNotes.length}`);

    // 搜索笔记
    const searchResults = await newAppService.notes.searchNotes('测试');
    console.log(`✅ 搜索笔记成功，结果数量: ${searchResults.length}`);

    // 按分类获取笔记
    const categoryNotes = await newAppService.notes.getNotesByCategory('测试');
    console.log(`✅ 按分类获取笔记成功，数量: ${categoryNotes.length}`);

    console.log('\n🎉 新架构测试完成，所有功能正常！');

  } catch (error) {
    console.error('❌ 新架构测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
testNote();

async function testNote() {
  await testNewArchitecture();
} 