const axios = require('axios');

async function sendToWeCom(webhookUrl, content) {
  const payload = {
    msgtype: 'markdown',
    markdown: {
      content: content
    }
  };

  try {
    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.data.errcode === 0) {
      console.log('企业微信推送成功');
      return { success: true };
    } else {
      console.error('企业微信推送失败:', response.data);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.error('企业微信推送异常:', error.message);
    return { success: false, error: error.message };
  }
}

async function sendNewsNotification(webhookUrl, newsList, reportFilename) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  let content = `## 📰 全球热点新闻速览\n`;
  content += `> ${dateStr}\n\n`;
  
  newsList.forEach((news, index) => {
    const rank = index + 1;
    const emoji = rank <= 3 ? '🔥' : '📌';
    content += `${emoji} **${rank}. ${news.title}**\n`;
    content += `> 来源：${news.source}\n\n`;
  });

  content += `\n---\n`;
  content += `📊 共收录 **${newsList.length}** 条热点新闻\n`;
  content += `📁 完整报告已保存至：\`${reportFilename}\`\n`;
  content += `\n_由 Daily News Collector 自动推送_`;

  return await sendToWeCom(webhookUrl, content);
}

async function sendTestNotification(webhookUrl) {
  let content = `## ✅ 推送测试成功\n\n`;
  content += `> Daily News Collector 已成功连接企业微信机器人\n\n`;
  content += `📅 测试时间：${new Date().toLocaleString('zh-CN')}\n`;
  content += `⏰ 定时任务：每天早上 8:00 自动推送新闻\n\n`;
  content += `_配置成功，请等待明早的新闻推送_`;

  return await sendToWeCom(webhookUrl, content);
}

module.exports = {
  sendToWeCom,
  sendNewsNotification,
  sendTestNotification
};
