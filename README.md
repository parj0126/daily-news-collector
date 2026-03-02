# Daily News Collector 📰

每天早上8点自动收集全球热点新闻并生成报告。

## 功能特点

- 🤖 自动化：每天早上8点(北京时间)自动运行
- 🌍 全球视野：收集全球热点新闻
- 📊 热度排序：按热度指数自动排序
- 📝 Markdown格式：清晰易读的报告格式
- ☁️ 云端运行：GitHub Actions 自动执行，无需本地电脑

## 项目结构

```
daily-news-collector/
├── .github/
│   └── workflows/
│       └── daily-news.yml    # GitHub Actions 工作流
├── collect_news.py           # 新闻收集脚本
├── requirements.txt          # Python 依赖
├── news_reports/             # 生成的新闻报告目录
│   ├── latest.md            # 最新报告
│   └── 全球热点新闻速览_YYYYMMDD.md
└── README.md
```

## 使用方法

### 1. Fork 本仓库

点击右上角 Fork 按钮，将仓库复制到你的账号下。

### 2. 启用 GitHub Actions

进入仓库的 Settings → Actions → General，确保 Actions 权限已启用。

### 3. 查看报告

- 每天早上8点后，查看 `news_reports/latest.md` 获取最新报告
- 或在 Actions 页面下载 artifact

### 手动触发

在 Actions 页面选择 "Daily News Collector" 工作流，点击 "Run workflow" 可手动触发。

## 报告内容

每份报告包含：
- 📰 热点新闻排行（Top 10）
- 🔥 热度指数评分
- 📅 发布时间和来源
- 🔗 原文链接

## 技术栈

- Python 3.11
- requests - HTTP 请求
- BeautifulSoup4 - XML/HTML 解析
- GitHub Actions - 自动化执行

## 自定义配置

### 修改执行时间

编辑 `.github/workflows/daily-news.yml` 中的 cron 表达式：

```yaml
schedule:
  - cron: '0 0 * * *'  # UTC 时间，北京时间8点
```

### 添加新闻来源

编辑 `collect_news.py` 中的 `queries` 列表：

```python
queries = [
    "top stories",
    "world news",
    "breaking news",
    "热点新闻",
    # 添加你感兴趣的关键词
]
```

## License

MIT License
