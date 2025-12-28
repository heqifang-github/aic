#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { getDiff, hasStagedChanges, commit } from '../src/git.js';
import { generateCommitMessage } from '../src/ai.js';
import { getConfig, setConfig, getAllConfig } from '../src/config.js';

const program = new Command();

program
  .name('aic')
  .description('AI 提交信息生成器')
  .version('1.0.0');

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
      if (!getConfig('apiKey')) {
        console.log(chalk.yellow('未检测到 API Key，请先进行配置。'));
        await runConfig();
        if (!getConfig('apiKey')) {
            console.log(chalk.red('API Key 仍然缺失，程序退出。'));
            process.exit(1);
        }
      }

      if (!(await hasStagedChanges())) {
        console.log(chalk.yellow('没有检测到暂存的更改。请先使用 `git add` 暂存您的更改。'));
        process.exit(1);
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
