import { execa } from 'execa';

export const getDiff = async () => {
  try {
    // 获取所有类型的暂存区变更，包括新增、修改、删除、重命名等
    // 使用 --staged 是 --cached 的别名，更语义化
    const { stdout } = await execa('git', [
      'diff', 
      '--staged',  // 等同于 --cached
      '--diff-algorithm=minimal',  // 使用最小差异算法
      '--find-renames',  // 检测重命名
      '--find-copies'  // 检测复制
    ]);
    return stdout;
  } catch (error) {
    throw new Error('Failed to get git diff. Make sure you are in a git repository.');
  }
};

export const commit = async (message) => {
  try {
    await execa('git', ['commit', '-m', message], { stdio: 'inherit' });
  } catch (error) {
    throw new Error('Failed to commit changes.');
  }
};

export const hasStagedChanges = async () => {
  try {
    // 使用 git diff --cached --name-status 检测所有类型的暂存变更
    // 包括：新增(A)、修改(M)、删除(D)、重命名(R)、复制(C)等
    const { stdout } = await execa('git', ['diff', '--cached', '--name-status']);
    
    // 同时检查新添加但未跟踪的文件（git add 的新文件）
    const { stdout: addedFiles } = await execa('git', ['diff', '--cached', '--diff-filter=A', '--name-only']);
    
    return stdout.trim().length > 0 || addedFiles.trim().length > 0;
  } catch (error) {
    return false;
  }
};

export const hasWorkingChanges = async () => {
  try {
    // 检测工作区变更（未暂存的修改）
    const { stdout } = await execa('git', ['status', '--porcelain']);
    return stdout.trim().length > 0;
  } catch (error) {
    return false;
  }
};

export const getWorkingChanges = async () => {
  try {
    // 获取工作区变更的详细信息
    const { stdout } = await execa('git', ['status', '--short']);
    return stdout;
  } catch (error) {
    return '';
  }
};

export const stageAllChanges = async () => {
  try {
    // 暂存所有变更（包括新增、修改、删除的文件）
    await execa('git', ['add', '-A'], { stdio: 'inherit' });
    return true;
  } catch (error) {
    throw new Error('Failed to stage changes.');
  }
};

/**
 * 将文件列表转换为树形结构
 * @param {string} gitStatusOutput - git status --short 的输出
 * @returns {string} 树形结构的字符串
 */
export const formatChangesAsTree = (gitStatusOutput) => {
  if (!gitStatusOutput.trim()) return '';

  const lines = gitStatusOutput.trim().split('\n');
  const tree = {};
  
  // 解析每一行，构建树形数据结构
  lines.forEach(line => {
    const match = line.match(/^(..?)\s+(.+)$/);
    if (!match) return;
    
    let status = match[1].trim();
    let filePath = match[2].trim();
    
    // 处理重命名情况: "old_path -> new_path"
    // 对于重命名，我们只显示新路径
    if (filePath.includes(' -> ')) {
      const parts = filePath.split(' -> ');
      filePath = parts[1].trim();  // 取新路径
      status = 'R';  // 确保状态为 R
    }
    
    const parts = filePath.split('/');
    
    let current = tree;
    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = {
          isFile: index === parts.length - 1,
          status: index === parts.length - 1 ? status : null,
          children: {}
        };
      }
      current = current[part].children;
    });
  });

  // 递归渲染树形结构
  const renderTree = (node, prefix = '', isLast = true) => {
    const entries = Object.entries(node);
    let result = '';
    
    entries.forEach(([name, data], index) => {
      const isLastEntry = index === entries.length - 1;
      const connector = isLastEntry ? '└─ ' : '├─ ';
      const childPrefix = isLastEntry ? '  ' : '│ ';
      
      // 添加状态标记
      let statusIcon = '';
      if (data.isFile && data.status) {
        switch (data.status) {
          case 'M': statusIcon = '📝 '; break;  // 修改
          case 'A': statusIcon = '✨ '; break;  // 新增
          case 'D': statusIcon = '🗑️  '; break;  // 删除
          case 'R': statusIcon = '🔄 '; break;  // 重命名
          case 'C': statusIcon = '📋 '; break;  // 复制
          case '??': statusIcon = '❓ '; break; // 未跟踪
          default: statusIcon = data.status + ' ';
        }
      } else if (!data.isFile) {
        statusIcon = '📁 ';  // 文件夹
      }
      
      result += prefix + connector + statusIcon + name + '\n';
      
      // 递归处理子节点
      if (Object.keys(data.children).length > 0) {
        result += renderTree(data.children, prefix + childPrefix, isLastEntry);
      }
    });
    
    return result;
  };

  return '\n' + renderTree(tree);
};
