import { execa } from 'execa';

export const getDiff = async () => {
  try {
    const { stdout } = await execa('git', ['diff', '--cached']);
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
    const { stdout } = await execa('git', ['diff', '--cached', '--name-only']);
    return stdout.trim().length > 0;
  } catch (error) {
    return false;
  }
};
