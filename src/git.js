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
