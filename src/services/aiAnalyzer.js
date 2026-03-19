const axios = require('axios');

const AI_CONFIG = {
  provider: process.env.AI_PROVIDER || 'deepseek',
  apiKey: process.env.AI_API_KEY,
  baseUrl: process.env.AI_BASE_URL || 'https://api.deepseek.com',
  model: process.env.AI_MODEL || 'deepseek-chat',
  maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 2000,
  temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7
};

const SYSTEM_PROMPT = `你是一位资深的国际新闻分析师，拥有20年全球时事报道经验。你的分析风格：
- 客观中立，基于事实
- 深入浅出，让普通读者也能理解复杂事件
- 善于挖掘事件背后的深层逻辑和影响
- 语言精炼有力，避免空洞表述

你的分析框架包括：
1. 事件本质：用一句话概括核心事实
2. 前因后果：事件的来龙去脉
3. 影响范围：对政治、经济、社会的多维度影响
4. 未来走向：可能的发展趋势`;

const ANALYSIS_PROMPT_TEMPLATE = `请分析以下新闻：

**标题：** {title}

**来源：** {source}

**发布时间：** {pubDate}

**原始摘要：** {description}

请提供一份深度分析报告，包含以下部分：

## 事件概述
（用2-3句话概括事件核心，让读者快速了解发生了什么）

## 背景解读
（简要说明事件的来龙去脉，帮助读者理解上下文）

## 影响分析
（从多个角度分析此事件可能带来的影响，如政治、经济、社会等方面）

## 后续关注
（指出值得持续关注的要点或可能的发展方向）

要求：
- 分析要有深度，不要泛泛而谈
- 语言简洁有力，避免冗余
- 如果信息不足，基于已知事实进行合理推断，并标注不确定性
- 中文输出`;

const SUMMARY_PROMPT_TEMPLATE = `请为以下新闻生成一个精炼的摘要（100-150字）：

**标题：** {title}

**原始内容：** {description}

要求：
- 提取最关键的信息
- 语言简洁流畅
- 突出新闻价值
- 中文输出`;

const BATCH_ANALYSIS_PROMPT = `以下是今日收集的{count}条重要新闻，请进行综合分析：

{newsList}

请提供：

## 今日新闻综述
（用一段话概括今日全球热点的主要趋势和特点）

## 关键事件梳理
（列出最重要的2-3个事件，每个用2-3句话说明）

## 深度解读
（选择1-2个最具影响力的事件进行深入分析）

## 投资者/关注者提示
（对关心这些事件的人群提供实用建议）

要求：
- 分析要有洞察力，不要简单罗列
- 发现事件之间的关联
- 语言精炼有力
- 中文输出`;

async function callAI(messages) {
  if (!AI_CONFIG.apiKey) {
    console.warn('AI API Key 未配置，将使用默认分析');
    return null;
  }

  try {
    const response = await axios.post(
      `${AI_CONFIG.baseUrl}/v1/chat/completions`,
      {
        model: AI_CONFIG.model,
        messages: messages,
        max_tokens: AI_CONFIG.maxTokens,
        temperature: AI_CONFIG.temperature
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_CONFIG.apiKey}`
        },
        timeout: 60000
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('AI 调用失败:', error.message);
    if (error.response) {
      console.error('错误详情:', error.response.data);
    }
    return null;
  }
}

async function analyzeNews(newsItem) {
  const prompt = ANALYSIS_PROMPT_TEMPLATE
    .replace('{title}', newsItem.title)
    .replace('{source}', newsItem.source)
    .replace('{pubDate}', newsItem.pubDate)
    .replace('{description}', newsItem.description || '暂无详细描述');

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt }
  ];

  return await callAI(messages);
}

async function generateSummary(newsItem) {
  const prompt = SUMMARY_PROMPT_TEMPLATE
    .replace('{title}', newsItem.title)
    .replace('{description}', newsItem.description || '暂无详细描述');

  const messages = [
    { role: 'system', content: '你是一位专业的新闻编辑，擅长撰写简洁有力的新闻摘要。' },
    { role: 'user', content: prompt }
  ];

  return await callAI(messages);
}

async function generateBatchAnalysis(newsList) {
  const newsListStr = newsList.map((news, index) => 
    `${index + 1}. 【${news.title}】\n   来源：${news.source}\n   摘要：${news.description || '暂无'}`
  ).join('\n\n');

  const prompt = BATCH_ANALYSIS_PROMPT
    .replace('{count}', newsList.length)
    .replace('{newsList}', newsListStr);

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt }
  ];

  return await callAI(messages);
}

function isAIEnabled() {
  return !!AI_CONFIG.apiKey;
}

function getAIConfig() {
  return { ...AI_CONFIG, apiKey: AI_CONFIG.apiKey ? '***已配置***' : '未配置' };
}

module.exports = {
  analyzeNews,
  generateSummary,
  generateBatchAnalysis,
  isAIEnabled,
  getAIConfig
};
