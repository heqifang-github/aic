# AIC - AI Git 提交信息生成助手

`aic` 是一个基于 AI 的命令行工具，能够根据您的 Git 暂存区（staged）更改，自动生成简洁、专业的 Git 提交信息（Commit Message）。

它默认支持 **通义千问 (Qwen)** 模型，并强制生成符合 [Conventional Commits](https://www.conventionalcommits.org/) 规范的**中文**提交信息。

## 特性

*   🚀 **一键生成**: 只需运行 `aic`，即可自动分析代码变更并生成备注。
*   🇨🇳 **中文优化**: 默认生成中文提交信息，符合国内开发习惯。
*   📝 **规范化**: 遵循 Angular 提交规范 (feat, fix, docs, refactor 等)。
*   🔧 **高度可配**: 支持自定义 API Key、Base URL 和模型名称。
*   interactive **交互式体验**: 提供提交、编辑、重新生成等选项。

## 安装

您可以使用 npm 进行全局安装，以便在任何项目中使用：

```bash
npm install -g aic
```

或者在当前目录进行链接测试（开发模式）：

```bash
npm link
```

## 配置

首次使用前，您需要配置 AI 服务的 API Key。默认配置适配阿里云百炼（DashScope）的 Qwen 模型。

运行以下命令进行配置：

```bash
aic config
```

根据提示输入相关信息：

*   **API Key**: 您的 API 密钥（必填）。对于 Qwen，请在阿里云百炼控制台获取。
*   **Base URL**: API 基础地址。默认为 `https://dashscope.aliyuncs.com/compatible-mode/v1` (兼容 OpenAI 格式)。
*   **Model**: 模型名称。默认为 `qwen-plus`。

## 使用方法

1.  **暂存更改**
    在使用 `aic` 之前，请确保您已经使用 `git add` 将想要提交的文件添加到了暂存区。

    ```bash
    git add .
    ```

2.  **生成提交信息**
    在终端中运行：

    ```bash
    aic
    ```

    AI 将会自动分析 `git diff --cached` 的内容，并生成一条建议的提交信息。

3.  **交互选择**
    程序会显示生成的信息，并提供以下选项：

    *   **使用此信息提交**: 直接使用生成的备注进行 `git commit`。
    *   **编辑信息**: 在提交前手动修改生成的备注。
    *   **重新生成**: 如果对结果不满意，可以让 AI 重新生成。
    *   **取消**: 退出程序，不进行任何操作。

## 常见问题

**Q: 为什么提示 "No staged changes found"?**
A: `aic` 仅分析已暂存（Staged）的更改。请先运行 `git add <file>` 添加文件。

**Q: 如何切换到其他 AI 模型（如 GPT-4）？**
A: 运行 `aic config`，修改 Base URL 为 `https://api.openai.com/v1`，并将 Model 修改为 `gpt-4` 即可。

**Q: 生成的信息不准确怎么办？**
A: 您可以选择“重新生成”，或者选择“编辑信息”进行手动修正。AI 的准确度依赖于 Diff 的清晰程度。

## 许可证

ISC
