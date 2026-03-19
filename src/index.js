require('dotenv').config();
const cron = require('node-cron');
const path = require('path');
const { collectAllNews } = require('./services/newsCollector');
const { generateMarkdownReport, generateSummaryForWeChat } = require('./services/reportGenerator');
const { sendNewsNotification, sendTestNotification } = require('./services/wechatPusher');
const { saveReport } = require('./utils/helpers');

const WECOM_WEBHOOK = process.env.WECOM_WEBHOOK;
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 8 * * *';
const NEWS_OUTPUT_DIR = path.resolve(process.env.NEWS_OUTPUT_DIR || './news_reports');

async function runNewsCollection() {
  console.log('\n========================================');
  console.log('开始执行新闻收集任务');
  console.log(`时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('========================================\n');

  try {
    const newsList = await collectAllNews();
    
    if (newsList.length === 0) {
      console.error('未收集到任何新闻');
      return;
    }

    const report = generateMarkdownReport(newsList);
    const savedPath = saveReport(report.content, report.filename, NEWS_OUTPUT_DIR);
    
    if (WECOM_WEBHOOK) {
      await sendNewsNotification(WECOM_WEBHOOK, newsList, report.filename);
    } else {
      console.warn('未配置企业微信 Webhook，跳过推送');
    }

    console.log('\n========================================');
    console.log('新闻收集任务完成');
    console.log(`报告路径: ${savedPath}`);
    console.log('========================================\n');
    
  } catch (error) {
    console.error('新闻收集任务失败:', error);
  }
}

function startScheduler() {
  console.log('========================================');
  console.log('Daily News Collector 启动中...');
  console.log(`定时任务: ${CRON_SCHEDULE} (每天 8:00)`);
  console.log(`输出目录: ${NEWS_OUTPUT_DIR}`);
  console.log(`微信推送: ${WECOM_WEBHOOK ? '已配置' : '未配置'}`);
  console.log('========================================\n');

  cron.schedule(CRON_SCHEDULE, runNewsCollection, {
    timezone: 'Asia/Shanghai'
  });

  console.log('✅ 定时任务已启动，等待执行...\n');
  console.log('按 Ctrl+C 停止服务');
}

async function runTest() {
  console.log('运行测试模式...\n');
  
  if (WECOM_WEBHOOK) {
    console.log('测试企业微信推送...');
    await sendTestNotification(WECOM_WEBHOOK);
  }
  
  console.log('\n测试新闻收集...');
  await runNewsCollection();
}

const args = process.argv.slice(2);
if (args.includes('--test')) {
  runTest().catch(console.error);
} else {
  startScheduler();
}

process.on('SIGINT', () => {
  console.log('\n服务已停止');
  process.exit(0);
});
