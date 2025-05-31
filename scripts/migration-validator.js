#!/usr/bin/env node

/**
 * 旧架构迁移验证脚本
 * 检测项目中还在使用旧架构的代码
 */

const fs = require('fs');
const path = require('path');

// 旧架构模式检测规则
const OLD_PATTERNS = [
  {
    pattern: /TaskService\.getInstance\(\)/g,
    description: '使用旧的TaskService单例',
    suggestion: '使用 useNewTaskService() Hook'
  },
  {
    pattern: /TaskTimeLogService\.getInstance\(\)/g,
    description: '使用旧的TaskTimeLogService单例',
    suggestion: '使用 newTaskService 中的工作日志方法'
  },
  {
    pattern: /NoteService\.getInstance\(\)/g,
    description: '使用旧的NoteService单例',
    suggestion: '使用 useNewNoteService() Hook'
  },
  {
    pattern: /AppService\.getInstance\(\)/g,
    description: '使用旧的AppService单例',
    suggestion: '使用 newAppService'
  },
  {
    pattern: /import.*from.*task-service/g,
    description: '导入旧的TaskService',
    suggestion: '使用新架构的服务'
  },
  {
    pattern: /from.*note-service/g,
    description: '导入旧的NoteService',
    suggestion: '使用新架构的服务'
  }
];

// 需要检查的文件扩展名
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// 排除的目录
const EXCLUDE_DIRS = ['node_modules', '.git', '.expo', 'dist', 'build'];

/**
 * 递归扫描目录
 */
function scanDirectory(dir, results = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(item)) {
        scanDirectory(fullPath, results);
      }
    } else if (EXTENSIONS.includes(path.extname(item))) {
      results.push(fullPath);
    }
  }
  
  return results;
}

/**
 * 检查文件中的旧架构模式
 */
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];
  
  for (const rule of OLD_PATTERNS) {
    const matches = content.matchAll(rule.pattern);
    for (const match of matches) {
      const lines = content.substring(0, match.index).split('\n');
      const lineNumber = lines.length;
      const lineContent = lines[lines.length - 1] + match[0];
      
      issues.push({
        file: filePath,
        line: lineNumber,
        content: lineContent.trim(),
        description: rule.description,
        suggestion: rule.suggestion
      });
    }
  }
  
  return issues;
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 开始检测旧架构代码...\n');
  
  const projectRoot = process.cwd();
  const files = scanDirectory(projectRoot);
  
  let totalIssues = 0;
  const issuesByFile = {};
  
  for (const file of files) {
    const issues = checkFile(file);
    if (issues.length > 0) {
      const relativePath = path.relative(projectRoot, file);
      issuesByFile[relativePath] = issues;
      totalIssues += issues.length;
    }
  }
  
  // 输出结果
  if (totalIssues === 0) {
    console.log('🎉 恭喜！没有发现使用旧架构的代码');
    console.log('✅ 所有代码已成功迁移到新架构');
  } else {
    console.log(`⚠️  发现 ${totalIssues} 个使用旧架构的地方:\n`);
    
    for (const [file, issues] of Object.entries(issuesByFile)) {
      console.log(`📁 ${file}:`);
      for (const issue of issues) {
        console.log(`  ⚠️  第 ${issue.line} 行: ${issue.description}`);
        console.log(`     代码: ${issue.content}`);
        console.log(`     建议: ${issue.suggestion}\n`);
      }
    }
    
    console.log('📋 迁移建议:');
    console.log('1. 将旧的服务调用替换为新架构的Hook');
    console.log('2. 使用 useNewTaskService() 替代 TaskService.getInstance()');
    console.log('3. 使用 useNewNoteService() 替代 NoteService.getInstance()');
    console.log('4. 参考迁移文档: Docs/旧架构迁移待处理清单.md');
  }
  
  console.log(`\n📊 扫描统计:`);
  console.log(`- 扫描文件: ${files.length}`);
  console.log(`- 发现问题: ${totalIssues}`);
  console.log(`- 涉及文件: ${Object.keys(issuesByFile).length}`);
}

// 运行脚本
main(); 