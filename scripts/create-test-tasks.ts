import { Priority, TaskStatus } from '../lib/models/types';
import { DatabaseService } from '../lib/services/database-service';

// 测试项目数据
const testProjects = [
  { name: '工作项目', color: '#2196F3', icon: 'briefcase-outline' },
  { name: '个人学习', color: '#9C27B0', icon: 'school-outline' },
  { name: '生活管理', color: '#4CAF50', icon: 'home-outline' },
  { name: '健康计划', color: '#FF9800', icon: 'heart-outline' },
  { name: '兴趣爱好', color: '#E91E63', icon: 'music-note-outline' },
  { name: '社交活动', color: '#00BCD4', icon: 'account-group-outline' },
  { name: '财务管理', color: '#795548', icon: 'cash-outline' },
];

// 测试任务模板
const taskTemplates = [
  // 工作相关
  { title: '完成项目方案设计', description: '设计新产品的技术方案和架构图', category: '工作项目' },
  { title: '参加团队周会', description: '讨论本周工作进展和下周计划', category: '工作项目' },
  { title: '代码审查任务', description: '审查团队成员提交的代码变更', category: '工作项目' },
  { title: '编写技术文档', description: '完善API文档和使用说明', category: '工作项目' },
  { title: '客户需求沟通', description: '与客户讨论新功能需求和时间安排', category: '工作项目' },
  { title: '性能优化分析', description: '分析系统性能瓶颈并制定优化方案', category: '工作项目' },
  { title: 'Bug修复处理', description: '修复生产环境发现的紧急问题', category: '工作项目' },
  
  // 学习相关
  { title: '学习React Native开发', description: '掌握移动应用开发的基本概念和实践', category: '个人学习' },
  { title: '阅读技术书籍', description: '完成《设计模式》一书的阅读', category: '个人学习' },
  { title: '观看在线课程', description: '完成数据结构与算法课程的学习', category: '个人学习' },
  { title: '练习编程题目', description: '在LeetCode上完成10道算法题', category: '个人学习' },
  { title: '学习英语口语', description: '参加在线英语口语练习课程', category: '个人学习' },
  { title: '研究新技术', description: '调研AI大语言模型的应用场景', category: '个人学习' },
  
  // 生活相关
  { title: '购买生活用品', description: '采购本周所需的日用品和食材', category: '生活管理' },
  { title: '整理房间', description: '清理卧室和书桌，整理衣物', category: '生活管理' },
  { title: '缴纳水电费', description: '完成本月水电燃气费的缴纳', category: '生活管理' },
  { title: '预约体检', description: '联系医院预约年度健康体检', category: '生活管理' },
  { title: '维修家电', description: '联系师傅维修故障的洗衣机', category: '生活管理' },
  { title: '规划旅行', description: '制定下个月的旅行计划和预算', category: '生活管理' },
  
  // 健康相关
  { title: '晨跑锻炼', description: '完成30分钟的晨跑运动', category: '健康计划' },
  { title: '瑜伽练习', description: '参加瑜伽课程，提高身体柔韧性', category: '健康计划' },
  { title: '营养膳食', description: '准备营养均衡的健康午餐', category: '健康计划' },
  { title: '体重记录', description: '记录每日体重变化和饮食情况', category: '健康计划' },
  { title: '冥想放松', description: '进行15分钟的冥想和放松练习', category: '健康计划' },
  { title: '睡眠管理', description: '保证8小时充足睡眠，改善睡眠质量', category: '健康计划' },
  
  // 兴趣爱好
  { title: '学习吉他', description: '练习新的吉他曲目和技巧', category: '兴趣爱好' },
  { title: '绘画创作', description: '完成一幅风景水彩画作品', category: '兴趣爱好' },
  { title: '摄影外拍', description: '到公园进行摄影创作和练习', category: '兴趣爱好' },
  { title: '烹饪新菜', description: '尝试制作新的菜品和甜点', category: '兴趣爱好' },
  { title: '阅读小说', description: '完成一本喜欢的小说阅读', category: '兴趣爱好' },
  { title: '手工制作', description: '完成DIY手工艺品制作项目', category: '兴趣爱好' },
  
  // 社交活动
  { title: '朋友聚餐', description: '与老朋友聚餐聊天，增进感情', category: '社交活动' },
  { title: '参加聚会', description: '参加同事的生日聚会活动', category: '社交活动' },
  { title: '家庭聚会', description: '回家与家人共进晚餐', category: '社交活动' },
  { title: '社区活动', description: '参与小区组织的公益活动', category: '社交活动' },
  { title: '网络社交', description: '在社交媒体上与朋友互动交流', category: '社交活动' },
  { title: '约会活动', description: '与另一半看电影约会', category: '社交活动' },
  
  // 财务相关
  { title: '记账整理', description: '整理本月的收支记录和账单', category: '财务管理' },
  { title: '投资分析', description: '分析投资组合的表现和调整策略', category: '财务管理' },
  { title: '保险续费', description: '完成医疗保险和车险的续费', category: '财务管理' },
  { title: '预算规划', description: '制定下个月的消费预算计划', category: '财务管理' },
  { title: '理财学习', description: '学习新的理财知识和投资策略', category: '财务管理' },
  { title: '税务申报', description: '准备和提交个人所得税申报', category: '财务管理' },
];

// 优先级权重 (影响随机分配概率)
const priorityWeights: { priority: Priority; weight: number }[] = [
  { priority: 'low', weight: 50 },      // 50% 低优先级
  { priority: 'medium', weight: 35 },   // 35% 中优先级  
  { priority: 'high', weight: 15 },     // 15% 高优先级
];

// 随机选择函数
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// 按权重随机选择优先级
function getRandomPriority(): Priority {
  const totalWeight = priorityWeights.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of priorityWeights) {
    random -= item.weight;
    if (random <= 0) {
      return item.priority;
    }
  }
  return 'low'; // 默认返回低优先级
}

// 生成随机日期（过去90天内）
function getRandomCompletedDate(): Date {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 90); // 0-89天前
  const hoursAgo = Math.floor(Math.random() * 24); // 0-23小时前
  const minutesAgo = Math.floor(Math.random() * 60); // 0-59分钟前
  
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  date.setMinutes(date.getMinutes() - minutesAgo);
  
  return date;
}

// 生成随机创建日期（完成日期之前的1-30天）
function getRandomCreatedDate(completedDate: Date): Date {
  const daysBefore = Math.floor(Math.random() * 30) + 1; // 1-30天前创建
  const date = new Date(completedDate);
  date.setDate(date.getDate() - daysBefore);
  return date;
}

// 生成随机任务用时（15分钟到8小时）
function getRandomDuration(): number {
  const minMinutes = 15;
  const maxMinutes = 8 * 60; // 8小时
  return Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
}

// 生成随机ID
function generateId(): string {
  return 'test_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 创建测试任务数据
 */
export async function createTestTasks(count: number = 100): Promise<void> {
  console.log(`开始创建 ${count} 个测试任务...`);
  
  try {
    // 初始化数据库服务
    const dbService = DatabaseService.getInstance();
    await dbService.init();
    
    // 首先创建测试项目
    console.log('创建测试项目...');
    const projectIds: string[] = [];
    
    for (const projectData of testProjects) {
      const existingProjects = await dbService.projectDAO.searchByName(projectData.name);
      
      if (existingProjects.length === 0) {
        const project = await dbService.projectDAO.createProject({
          name: projectData.name,
          color: projectData.color,
          icon: projectData.icon,
          sort_order: 0,
          is_shared: 0
        });
        projectIds.push(project.id);
        console.log(`创建项目: ${projectData.name} (ID: ${project.id})`);
      } else {
        projectIds.push(existingProjects[0].id);
        console.log(`使用现有项目: ${projectData.name} (ID: ${existingProjects[0].id})`);
      }
    }
    
    // 创建测试任务
    console.log(`开始创建 ${count} 个已完成任务...`);
    const createdTasks: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const template = getRandomItem(taskTemplates);
      const priority = getRandomPriority();
      const completedDate = getRandomCompletedDate();
      const createdDate = getRandomCreatedDate(completedDate);
      const duration = getRandomDuration();
      
      // 查找对应的项目ID
      const projectIndex = testProjects.findIndex(p => p.name === template.category);
      const projectId = projectIds[projectIndex] || projectIds[0];
      
      // 为任务标题添加序号以避免重复
      const taskTitle = `${template.title} #${i + 1}`;
      
      try {
        const task = await dbService.taskDAO.create({
          title: taskTitle,
          description: template.description,
          priority,
          status: 'completed' as TaskStatus,
          due_date: createdDate.toISOString(), // 设置为创建日期的当天
          completed_at: completedDate.toISOString(),
          project_id: projectId,
          actual_duration_minutes: duration,
          is_recurring: 0,
          sort_order: 0
        });
        
        createdTasks.push(task.id);
        
        if ((i + 1) % 10 === 0) {
          console.log(`已创建 ${i + 1}/${count} 个任务...`);
        }
      } catch (error) {
        console.error(`创建任务失败 (${i + 1}/${count}):`, error);
      }
    }
    
    console.log(`✅ 成功创建 ${createdTasks.length} 个测试任务!`);
    console.log(`📊 数据分布:`);
    console.log(`   - 项目数量: ${testProjects.length}`);
    console.log(`   - 时间跨度: 过去90天`);
    console.log(`   - 优先级分布: 高15% / 中35% / 低50%`);
    console.log(`   - 任务用时: 15分钟 - 8小时`);
    
    // 显示按项目分组的统计
    console.log(`\n📋 按项目分组统计:`);
    for (let i = 0; i < testProjects.length; i++) {
      const projectId = projectIds[i];
      const tasksInProject = await dbService.taskDAO.findByProjectId(projectId);
      const completedTasks = tasksInProject.filter(task => task.status === 'completed');
      console.log(`   - ${testProjects[i].name}: ${completedTasks.length} 个已完成任务`);
    }
    
  } catch (error) {
    console.error('❌ 创建测试任务失败:', error);
    throw error;
  }
}

/**
 * 清理测试数据
 */
export async function cleanupTestTasks(): Promise<void> {
  console.log('开始清理测试数据...');
  
  try {
    const dbService = DatabaseService.getInstance();
    await dbService.init();
    
    // 删除以 test_ 开头的任务
    const allTasks = await dbService.taskDAO.findAll();
    const testTasks = allTasks.filter(task => task.id.startsWith('test_'));
    
    for (const task of testTasks) {
      await dbService.taskDAO.hardDelete(task.id);
    }
    
    console.log(`✅ 已清理 ${testTasks.length} 个测试任务`);
    
    // 清理测试项目（只删除没有其他任务的项目）
    for (const projectData of testProjects) {
      const projects = await dbService.projectDAO.searchByName(projectData.name);
      for (const project of projects) {
        const projectTasks = await dbService.taskDAO.findByProjectId(project.id);
        if (projectTasks.length === 0) {
          await dbService.projectDAO.hardDelete(project.id);
          console.log(`清理空项目: ${project.name}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 清理测试数据失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const count = parseInt(args[1]) || 100;
  
  if (command === 'create') {
    createTestTasks(count)
      .then(() => {
        console.log('🎉 测试数据创建完成!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('💥 创建失败:', error);
        process.exit(1);
      });
  } else if (command === 'cleanup') {
    cleanupTestTasks()
      .then(() => {
        console.log('🧹 测试数据清理完成!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('💥 清理失败:', error);
        process.exit(1);
      });
  } else {
    console.log('用法:');
    console.log('  npm run test:tasks create [数量]  - 创建测试任务');
    console.log('  npm run test:tasks cleanup       - 清理测试数据');
    console.log('');
    console.log('示例:');
    console.log('  npm run test:tasks create 100   - 创建100个测试任务');
    console.log('  npm run test:tasks create 50    - 创建50个测试任务');
    console.log('  npm run test:tasks cleanup       - 清理所有测试数据');
  }
} 