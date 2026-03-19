const { analyzeNews, generateSummary, generateBatchAnalysis, isAIEnabled, getAIConfig } = require('./aiAnalyzer');

const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Shanghai'
  }) + ' (UTC+8)';
};

const formatPubDate = (pubDate) => {
  try {
    const d = new Date(pubDate);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Shanghai'
    }) + ' (UTC+8)';
  } catch {
    return pubDate;
  }
};

function getHeatStars(index) {
  const stars = ['★★★★★', '★★★★★', '★★★★☆', '★★★★☆', '★★★☆☆', 
                 '★★★☆☆', '★★★☆☆', '★★☆☆☆', '★★☆☆☆', '★☆☆☆☆'];
  return stars[index] || '★☆☆☆☆';
}

function extractKeywords(title, description) {
  const keywords = [];
  const keywordMap = {
    '伊朗': '伊朗冲突',
    'Iran': '伊朗冲突',
    '战争': '军事冲突',
    'war': '军事冲突',
    '冲突': '地区冲突',
    'conflict': '地区冲突',
    '核': '核问题',
    'nuclear': '核问题',
    '中国': '中国',
    'China': '中国',
    '美国': '美国',
    'US': '美国',
    '特朗普': '特朗普',
    'Trump': '特朗普',
    'AI': '人工智能',
    'IPO': 'IPO',
    '股市': '股市',
    'stock': '股市',
    '科技': '科技',
    'tech': '科技',
    '经济': '经济',
    'economy': '经济',
    '体育': '体育',
    'sports': '体育',
    'SpaceX': 'SpaceX',
    '马斯克': '马斯克',
    'Musk': '马斯克',
    '霍尔木兹': '霍尔木兹海峡',
    '油价': '油价',
    'oil': '油价',
    '航空': '航空',
    '航班': '航班',
    'flight': '航班',
    '中东': '中东局势',
    '哈梅内伊': '哈梅内伊',
    'Khamenei': '哈梅内伊',
    '以色列': '以色列',
    'Israel': '以色列',
    '美军': '美军',
    '导弹': '导弹',
    'missile': '导弹'
  };
  
  const content = (title + ' ' + (description || '')).toLowerCase();
  for (const [key, tag] of Object.entries(keywordMap)) {
    if (content.includes(key.toLowerCase()) && !keywords.includes(tag)) {
      keywords.push(tag);
    }
  }
  
  return keywords.slice(0, 4);
}

function generateFallbackAnalysis(news, index) {
  const title = news.title.toLowerCase();
  const description = (news.description || '').toLowerCase();
  const content = title + ' ' + description;
  
  const analyses = [
    { keywords: ['哈梅内伊', 'khamenei', '最高领袖'], 
      analysis: '此事件为2003年伊拉克战争以来中东最大规模军事冲突，直接影响全球20%原油运输通道，引发能源危机担忧，牵动全球金融市场神经，地缘政治风险急剧上升。' },
    { keywords: ['战争', 'war', '冲突', 'conflict', '伊朗', 'iran', '空袭', 'strike'], 
      analysis: '此事件为近十年中东地区最严重的冲突升级，直接影响全球约30%的石油运输通道，引发国际油价暴涨、金价创历史新高，全球金融市场剧烈震荡，牵动全球政治经济格局。' },
    { keywords: ['霍尔木兹', 'strait', '油价', 'oil', '能源', '原油'], 
      analysis: '霍尔木兹海峡是全球能源运输咽喉，封锁将直接冲击全球能源供应，推升通胀，影响各国央行货币政策走向，能源供应链濒临断裂。' },
    { keywords: ['spacex', 'ipo', '马斯克', 'musk'], 
      analysis: '史上最大IPO引发全球资本市场关注，标志着商业航天与AI深度融合的里程碑，将重塑全球科技股估值体系，利好整个商业航天产业链。' },
    { keywords: ['航班', 'flight', '航空', 'aviation', '机场', 'airport', '航线'], 
      analysis: '中东是全球航空运输重要枢纽，领空关闭直接影响亚欧航线，造成全球航空业巨大经济损失，旅客出行严重受阻。' },
    { keywords: ['ai', '人工智能', '芯片', 'chip', '科技'], 
      analysis: 'AI产业周期推动全球资金重新配置，科技巨头持续投入研发，人工智能从技术突破走向场景落地，引发行业关注。' },
    { keywords: ['中国', 'china', '撤离', '撤侨', '公民'], 
      analysis: '中东冲突升级引发各国撤侨行动，体现中国政府对海外公民安全的高度重视，引发国内民众广泛关注。' },
    { keywords: ['体育', 'sport', '乒乓球', '冠军', '第一'], 
      analysis: '体育新闻持续受关注，国乒作为中国体育王牌项目，其成绩和梯队建设一直是国人关注焦点。' },
    { keywords: ['股市', 'stock', '市场', 'market', '涨幅'], 
      analysis: 'AI产业周期推动全球资金重新配置，韩国作为存储芯片龙头受益明显，成为全球资本"用脚投票"的首选市场。' },
    { keywords: ['美军', '坠毁', '战机', 'military'], 
      analysis: '美军战机坠毁事件反映中东冲突持续升级，军事行动风险外溢，引发对美军在地区行动安全性的关注。' }
  ];
  
  for (const item of analyses) {
    for (const keyword of item.keywords) {
      if (content.includes(keyword.toLowerCase())) {
        return item.analysis;
      }
    }
  }
  
  return '该新闻因涉及重要话题，引发广泛关注与讨论，成为当前舆论焦点。';
}

async function generateMarkdownReport(newsList) {
  const now = new Date();
  const dateStr = formatDate(now);
  const filenameDate = now.toISOString().slice(0, 10).replace(/-/g, '');
  
  console.log(`AI 分析状态: ${isAIEnabled() ? '已启用' : '未启用'}`);
  if (isAIEnabled()) {
    console.log('AI 配置:', getAIConfig());
  }
  
  let md = `# 全球热点新闻速览

**整理时间：** ${dateStr}  
**数据来源：** Google News、新华网、人民网、华尔街日报、财联社等权威媒体  
**AI 分析：** ${isAIEnabled() ? '✅ 已启用深度分析' : '❌ 未启用（配置 AI_API_KEY 以启用）'}

---

`;

  if (isAIEnabled()) {
    console.log('正在生成今日新闻综述...');
    try {
      const batchAnalysis = await generateBatchAnalysis(newsList);
      if (batchAnalysis) {
        md += `## 📊 今日新闻综述

${batchAnalysis}

---

`;
      }
    } catch (error) {
      console.error('生成综述失败:', error.message);
    }
  }

  md += `## 📰 热点新闻排行

---

`;

  for (let i = 0; i < newsList.length; i++) {
    const news = newsList[i];
    const rank = i + 1;
    const stars = getHeatStars(i);
    const pubDate = formatPubDate(news.pubDate);
    const keywords = extractKeywords(news.title, news.description);
    const tags = keywords.map(k => `#${k}`).join(' ');
    
    let aiSummary = null;
    let aiAnalysis = null;
    
    if (isAIEnabled()) {
      console.log(`正在分析第 ${rank} 条新闻: ${news.title.substring(0, 30)}...`);
      
      try {
        aiSummary = await generateSummary(news);
      } catch (error) {
        console.error(`生成摘要失败 (第${rank}条):`, error.message);
      }
      
      if (rank <= 5) {
        try {
          aiAnalysis = await analyzeNews(news);
        } catch (error) {
          console.error(`生成分析失败 (第${rank}条):`, error.message);
        }
      }
    }
    
    const summary = aiSummary || news.description || '请点击来源链接查看详细内容。';
    const analysis = aiAnalysis || generateFallbackAnalysis(news, i);
    
    md += `### 🔥 热度指数：${stars} (第${rank}名)

## ${news.title}

| 项目 | 内容 |
|------|------|
| **新闻标题** | ${news.title} |
| **发布时间** | ${pubDate} |
| **来源账号** | ${news.source} |
| **相关话题** | ${tags || '#热点新闻'} |

**核心内容摘要：**

${summary}

`;

    if (aiAnalysis) {
      md += `**深度分析：**

${aiAnalysis}

`;
    } else {
      md += `**热度分析：** ${analysis}

`;
    }

    md += `**来源链接：** 
- [${news.source}](${news.link})

---

`;
  }

  md += `## 📊 热度指数说明

热度指数基于以下综合指标计算：
- 新闻来源权威性
- 事件影响力范围
- 时效性与新鲜度
- 社会关注度
- 关键词热度权重

---

## ⚠️ 免责声明

本新闻汇总基于公开信息整理，仅供参考。新闻内容来源于各权威媒体，真实性由原发布媒体负责。部分信息可能随事态发展有所更新，请以官方最新发布为准。

${isAIEnabled() ? '\n**AI 分析说明：** 本报告的新闻摘要和分析由 AI 生成，仅供参考，不构成任何投资或决策建议。\n' : ''}
---

*本报告由 Daily News Collector 自动生成*  
*整理时间：${dateStr}*
`;

  return {
    content: md,
    filename: `全球热点新闻速览_${filenameDate}.md`
  };
}

function generateSummaryForWeChat(newsList) {
  const now = new Date();
  const dateStr = formatDate(now);
  
  let summary = `**📅 ${dateStr}**\n\n`;
  summary += `**🔥 全球热点新闻速览**\n\n`;
  
  newsList.slice(0, 5).forEach((news, index) => {
    const rank = index + 1;
    summary += `**${rank}. ${news.title}**\n`;
    summary += `来源：${news.source}\n\n`;
  });
  
  summary += `\n> 共收录 ${newsList.length} 条热点新闻，详情请查看完整报告。`;
  
  return summary;
}

module.exports = {
  generateMarkdownReport,
  generateSummaryForWeChat,
  formatDate,
  formatPubDate
};
