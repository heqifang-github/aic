#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getDiff, hasStagedChanges, commit, hasWorkingChanges, getWorkingChanges, stageAllChanges, formatChangesAsTree } from '../src/git.js';
import { generateCommitMessage } from '../src/ai.js';
import { getConfig, setConfig, getAllConfig } from '../src/config.js';

// 获取 package.json 的路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const program = new Command();

program
  .name('aic')
  .description('Git提交信息AI生成器')
  .version(packageJson.version);

const runConfig = async () => {
  const currentConfig = getAllConfig();
  console.log(chalk.blue('当前配置:'));
  console.log(currentConfig);

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'apiKey',
      message: '请输入 API Key:',
      default: currentConfig.apiKey,
    },
    {
      type: 'input',
      name: 'baseURL',
      message: '请输入 Base URL:',
      default: currentConfig.baseURL,
    },
    {
      type: 'input',
      name: 'model',
      message: '请输入模型名称:',
      default: currentConfig.model,
    },
  ]);

  setConfig('apiKey', answers.apiKey);
  setConfig('baseURL', answers.baseURL);
  setConfig('model', answers.model);

  console.log(chalk.green('配置已保存!'));
};

program
  .command('config')
  .description('设置配置')
  .action(runConfig);

program
  .action(async () => {
    try {
      // 显示版本号和当前使用的模型
      console.log(chalk.magenta(`\n✨ AIC v${packageJson.version}`));
      const currentModel = getConfig('model') || 'qwen-plus';
      const baseURL = getConfig('baseURL') || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
      console.log(chalk.cyan(`🤖 当前模型: ${chalk.bold(currentModel)}`));
      console.log(chalk.gray(`   服务地址: ${baseURL}\n`));

      if (!getConfig('apiKey')) {
        console.log(chalk.yellow('未检测到 API Key，请先进行配置。'));
        await runConfig();
        if (!getConfig('apiKey')) {
            console.log(chalk.red('API Key 仍然缺失，程序退出。'));
            process.exit(1);
        }
      }

      // 检查是否有暂存的变更
      const hasStaged = await hasStagedChanges();
      const hasWorking = await hasWorkingChanges();

      // 如果没有任何变更
      if (!hasStaged && !hasWorking) {
        console.log(chalk.yellow('没有检测到任何更改。'));
        process.exit(1);
      }

      // 如果有工作区变更（无论是否有暂存区变更）
      if (hasWorking) {
        console.log(chalk.blue('检测到以下未暂存的更改：'));
        const changes = await getWorkingChanges();
        
        // 使用树形结构展示
        const treeView = formatChangesAsTree(changes);
        console.log(treeView);

        const { shouldStage } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'shouldStage',
            message: '是否要暂存这些更改并继续？',
            default: true,
          },
        ]);

        if (shouldStage) {
          console.log(chalk.blue('正在暂存所有更改...'));
          await stageAllChanges();
          console.log(chalk.green('✓ 已暂存所有更改'));
        } else if (!hasStaged) {
          // 如果选择不暂存，且暂存区也没有变更，则退出
          console.log(chalk.yellow('操作已取消。请手动使用 `git add` 暂存您想要提交的更改。'));
          process.exit(1);
        } else {
          // 如果选择不暂存，但暂存区有变更，则继续处理暂存区的内容
          console.log(chalk.blue('将仅对已暂存的变更生成提交信息...'));
        }
      }

      console.log(chalk.blue('正在生成提交信息...'));

      const diff = await getDiff();
      let message = await generateCommitMessage(diff);

      while (true) {
        console.log(chalk.green('\n生成的提交信息:'));
        console.log(chalk.bold(message));
        console.log();

        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: '请选择操作:',
            choices: [
              { name: '使用此信息提交', value: 'commit' },
              { name: '编辑信息', value: 'edit' },
              { name: '重新生成', value: 'regenerate' },
              { name: '取消', value: 'cancel' },
            ],
          },
        ]);

        if (action === 'commit') {
          await commit(message);
          console.log(chalk.green('提交成功!'));
          break;
        } else if (action === 'edit') {
          const { newMessage } = await inquirer.prompt([
            {
              type: 'editor',
              name: 'newMessage',
              message: '编辑提交信息:',
              default: message,
            },
          ]);
          message = newMessage.trim();
        } else if (action === 'regenerate') {
          console.log(chalk.blue('正在重新生成...'));
          message = await generateCommitMessage(diff);
        } else {
          console.log(chalk.yellow('操作已取消。'));
          break;
        }
      }

    } catch (error) {
      console.error(chalk.red('发生错误:', error.message));
      process.exit(1);
    }
  });

program.parse(process.argv);
