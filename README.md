# Daily News Collector 📰

每天早上8点自动收集全球热点新闻并生成报告，支持 AI 深度分析。

## 功能特点

- 🤖 自动化：每天早上8点(北京时间)自动运行
- 🌍 全球视野：收集全球热点新闻
- 📊 热度排序：按热度指数自动排序
- 📝 Markdown格式：清晰易读的报告格式
- 🧠 AI深度分析：支持 DeepSeek/OpenAI 等模型，生成专业新闻分析
- ☁️ 云端运行：GitHub Actions 自动执行，无需本地电脑

## 项目结构

```
daily-news-collector/
├── .github/
│   └── workflows/
│       └── daily-news.yml    # GitHub Actions 工作流
├── src/
│   ├── index.js              # 主入口
│   ├── services/
│   │   ├── newsCollector.js  # 新闻收集
│   │   ├── reportGenerator.js # 报告生成
│   │   ├── aiAnalyzer.js     # AI 分析服务
│   │   └── wechatPusher.js   # 微信推送
│   └── utils/
│       └── helpers.js        # 工具函数
├── news_reports/             # 生成的新闻报告目录
├── .env.example              # 环境变量示例
├── ecosystem.config.js       # PM2 配置
└── README.md
```

## 快速开始

### 本地运行

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置 AI_API_KEY

# 3. 运行测试
npm run test

# 4. 启动定时任务
npm start
```

### GitHub Actions 部署

1. Fork 本仓库
2. 进入 Settings → Secrets and variables → Actions
3. 添加以下 Secrets:
   - `AI_API_KEY`: AI 服务的 API Key
   - `WECOM_WEBHOOK`: (可选) 企业微信 Webhook
4. 启用 GitHub Actions

## AI 分析配置

支持多种 AI 服务提供商：

### DeepSeek (推荐)

```env
AI_PROVIDER=deepseek
AI_API_KEY=your_deepseek_api_key
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-chat
```

### OpenAI

```env
AI_PROVIDER=openai
AI_API_KEY=your_openai_api_key
AI_BASE_URL=https://api.openai.com
AI_MODEL=gpt-4
```

### 自定义兼容服务

支持任何兼容 OpenAI API 格式的服务，只需修改 `AI_BASE_URL`。

## AI 分析功能

启用 AI 后，报告将包含：

- **今日新闻综述** - AI 生成的每日热点趋势分析
- **深度新闻摘要** - 每条新闻的精炼摘要
- **专业分析报告** - 前5条新闻的深度分析，包括：
  - 事件概述
  - 背景解读
  - 影响分析
  - 后续关注

## 报告示例

```markdown
# 全球热点新闻速览

**整理时间：** 2024年3月3日 上午8:00 (UTC+8)
**AI 分析：** ✅ 已启用深度分析

## 📊 今日新闻综述

今日全球热点聚焦中东局势...

## 📰 热点新闻排行

### 🔥 热度指数：★★★★★ (第1名)

## [新闻标题]

**核心内容摘要：**
AI 生成的精炼摘要...

**深度分析：**

### 事件概述
...

### 背景解读
...

### 影响分析
...

### 后续关注
...
```

## 自定义配置

### 修改执行时间

编辑 `.env` 文件：

```env
CRON_SCHEDULE=0 8 * * *
```

### 修改新闻来源

编辑 `src/services/newsCollector.js` 中的 `NEWS_SOURCES` 和搜索关键词。

### AI 参数调优

```env
AI_MAX_TOKENS=2000      # 最大输出长度
AI_TEMPERATURE=0.7      # 创造性程度 (0-1)
```

## 技术栈

- Node.js 16+
- axios - HTTP 请求
- xml2js - RSS 解析
- node-cron - 定时任务
- dotenv - 环境变量

## License

MIT License
