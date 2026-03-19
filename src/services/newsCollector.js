const axios = require('axios');
const xml2js = require('xml2js');

const NEWS_SOURCES = [
  { type: 'rss', name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { type: 'rss', name: 'CNN World', url: 'http://rss.cnn.com/rss/edition_world.rss' },
  { type: 'rss', name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { type: 'rss', name: 'NHK World', url: 'https://www3.nhk.or.jp/rss/news/cat0.xml' },
  { type: 'rss', name: 'France24', url: 'https://www.france24.com/en/rss' }
];

const HEAT_KEYWORDS = {
  high: ['伊朗', 'Iran', '战争', 'war', '冲突', 'conflict', '核', 'nuclear', '中国', 'China', '美国', 'US', '特朗普', 'Trump', 'AI', 'IPO', '股市', 'stock', '疫情', 'pandemic', '导弹', 'missile', '军事', 'military', '哈梅内伊', 'Khamenei'],
  medium: ['科技', 'tech', '经济', 'economy', '政治', 'politics', '体育', 'sports', '外交', 'diploma', '总统', 'president', 'SpaceX', '马斯克', 'Musk']
};

async function fetchRSSFeed(url, sourceName) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml'
  };

  try {
    const response = await axios.get(url, { 
      headers, 
      timeout: 15000,
      validateStatus: (status) => status < 500
    });
    
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(response.data);
    
    let items = [];
    
    if (result.rss && result.rss.channel && result.rss.channel.item) {
      items = Array.isArray(result.rss.channel.item) 
        ? result.rss.channel.item 
        : [result.rss.channel.item];
    } else if (result.feed && result.feed.entry) {
      items = Array.isArray(result.feed.entry) 
        ? result.feed.entry 
        : [result.feed.entry];
    }

    return items.map(item => {
      let description = '';
      if (item.description) {
        description = item.description;
        description = description.replace(/<[^>]*>/g, '').trim();
        if (description.length > 200) {
          description = description.substring(0, 200) + '...';
        }
      }
      
      return {
        title: item.title || (item.title && item.title._) || '',
        link: item.link || (item.link && item.link.href) || item.guid || '',
        pubDate: item.pubDate || item.published || item.updated || '',
        source: sourceName,
        description: description
      };
    }).filter(news => news.title);
    
  } catch (error) {
    console.error(`获取 ${sourceName} 失败:`, error.message);
    return [];
  }
}

async function fetchGoogleNewsRSS(query, hl = 'zh-CN', gl = 'CN') {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=${hl}&gl=${gl}&ceid=${gl}:${hl}`;
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml'
  };

  try {
    const response = await axios.get(url, { headers, timeout: 15000 });
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);
    
    if (!result.rss || !result.rss.channel || !result.rss.channel[0].item) {
      return [];
    }

    return result.rss.channel[0].item.map(item => {
      let description = '';
      if (item.description && item.description[0]) {
        description = item.description[0].replace(/<[^>]*>/g, '').trim();
        if (description.length > 200) {
          description = description.substring(0, 200) + '...';
        }
      }
      
      return {
        title: item.title ? item.title[0] : '',
        link: item.link ? item.link[0] : '',
        pubDate: item.pubDate ? item.pubDate[0] : '',
        source: item.source ? (item.source[0]._ || item.source[0]) : 'Google News',
        description: description
      };
    });
  } catch (error) {
    console.error(`获取 Google News "${query}" 失败:`, error.message);
    return [];
  }
}

function calculateHeatIndex(newsItem) {
  let score = 0;
  const title = (newsItem.title || '').toLowerCase();
  const description = (newsItem.description || '').toLowerCase();
  const content = title + ' ' + description;
  
  HEAT_KEYWORDS.high.forEach(keyword => {
    if (content.includes(keyword.toLowerCase())) {
      score += 3;
    }
  });
  
  HEAT_KEYWORDS.medium.forEach(keyword => {
    if (content.includes(keyword.toLowerCase())) {
      score += 1;
    }
  });
  
  const pubDate = new Date(newsItem.pubDate);
  const now = new Date();
  const hoursDiff = (now - pubDate) / (1000 * 60 * 60);
  
  if (hoursDiff < 6) score += 3;
  else if (hoursDiff < 12) score += 2;
  else if (hoursDiff < 24) score += 1;
  
  return score;
}

async function collectAllNews() {
  console.log('开始收集新闻...');
  
  const allNewsPromises = NEWS_SOURCES.map(source => 
    fetchRSSFeed(source.url, source.name)
  );
  
  const googleNewsPromises = [
    fetchGoogleNewsRSS('Iran conflict', 'en-US', 'US'),
    fetchGoogleNewsRSS('Middle East war', 'en-US', 'US'),
    fetchGoogleNewsRSS('world news', 'en-US', 'US'),
    fetchGoogleNewsRSS('热点新闻', 'zh-CN', 'CN')
  ];
  
  const allPromises = [...allNewsPromises, ...googleNewsPromises];
  const newsResults = await Promise.all(allPromises);
  const allNews = newsResults.flat();
  
  const seenTitles = new Set();
  const uniqueNews = allNews.filter(news => {
    const normalizedTitle = news.title.toLowerCase().trim().substring(0, 50);
    if (seenTitles.has(normalizedTitle)) {
      return false;
    }
    seenTitles.add(normalizedTitle);
    return true;
  });
  
  uniqueNews.forEach(news => {
    news.heatIndex = calculateHeatIndex(news);
  });
  
  uniqueNews.sort((a, b) => b.heatIndex - a.heatIndex);
  
  console.log(`共收集到 ${uniqueNews.length} 条新闻`);
  return uniqueNews.slice(0, 10);
}

module.exports = {
  collectAllNews,
  calculateHeatIndex
};
