import OpenAI from 'openai';
import { getConfig } from './config.js';

export const generateCommitMessage = async (diff) => {
  const apiKey = getConfig('apiKey');
  const baseURL = getConfig('baseURL');
  const model = getConfig('model');

  if (!apiKey) {
    throw new Error('API Key is missing. Please run `aic config` to set it.');
  }

  const openai = new OpenAI({
    apiKey,
    baseURL,
  });

  const prompt = `
你是一个专业的软件工程师。请根据以下的 Git diff 内容生成一个简洁、专业的提交信息（Commit Message）。
请遵循 Angular Commit Message 规范，格式为：<type>(<scope>): <subject>。
type 包括：feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert。
scope 是可选的。
subject 是对变更的简短描述。
请只输出提交信息本身，不要包含其他解释或 Markdown 代码块标记。
语言强制使用中文。

Diff 内容:
${diff}
`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: model,
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    throw new Error('Failed to generate commit message: ' + error.message);
  }
};
