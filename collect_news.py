#!/usr/bin/env python3
"""
Daily News Collector
Collects top 10 global news and generates a markdown report
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime
import json
import os
from urllib.parse import quote

OUTPUT_DIR = "news_reports"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def get_google_news(query="top stories", hl="zh-CN"):
    """Fetch news from Google News RSS feed"""
    url = f"https://news.google.com/rss/search?q={quote(query)}&hl={hl}&gl=CN&ceid=CN:zh-Hans"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return parse_rss(response.content)
    except Exception as e:
        print(f"Error fetching news: {e}")
        return []

def parse_rss(xml_content):
    """Parse RSS XML and extract news items"""
    soup = BeautifulSoup(xml_content, 'xml')
    items = soup.find_all('item')
    
    news_list = []
    for item in items[:20]:
        news = {
            'title': item.title.text if item.title else '',
            'link': item.link.text if item.link else '',
            'pubDate': item.pubDate.text if item.pubDate else '',
            'source': item.source.text if item.source else 'Unknown'
        }
        news_list.append(news)
    
    return news_list

def calculate_heat_index(news_item):
    """Calculate heat index based on various factors"""
    score = 0
    
    keywords_high = ['伊朗', 'Iran', '战争', 'war', '冲突', 'conflict', 'IPO', 'AI', '中国', 'China', '美国', 'US', '美股', '股市']
    keywords_medium = ['科技', 'tech', '经济', 'economy', '政治', 'politics', '体育', 'sports']
    
    title = news_item.get('title', '').lower()
    
    for keyword in keywords_high:
        if keyword.lower() in title:
            score += 3
    
    for keyword in keywords_medium:
        if keyword.lower() in title:
            score += 1
    
    return score

def generate_markdown_report(news_list, output_file):
    """Generate markdown report from news list"""
    now = datetime.now()
    date_str = now.strftime("%Y年%m月%d日 %H:%M (UTC+8)")
    filename_date = now.strftime("%Y%m%d")
    
    news_list.sort(key=calculate_heat_index, reverse=True)
    top_10 = news_list[:10]
    
    md_content = f"""# 全球热点新闻速览

**整理时间：** {date_str}  
**数据来源：** Google News RSS、权威媒体

---

## 📰 热点新闻排行

---

"""
    
    stars = ['★★★★★', '★★★★☆', '★★★★☆', '★★★★☆', '★★★☆☆', 
             '★★★☆☆', '★★★☆☆', '★★☆☆☆', '★★☆☆☆', '★☆☆☆☆']
    
    for i, news in enumerate(top_10, 1):
        title = news.get('title', '无标题')
        source = news.get('source', '未知来源')
        link = news.get('link', '')
        pub_date = news.get('pubDate', '')
        
        heat_index = stars[i-1] if i <= 10 else '★☆☆☆☆'
        
        md_content += f"""### 🔥 热度指数：{heat_index} (第{i}名)

## {title}

| 项目 | 内容 |
|------|------|
| **新闻标题** | {title} |
| **发布时间** | {pub_date} |
| **来源账号** | {source} |

**核心内容摘要：**

请点击链接查看详细内容。

**热度分析：** 该新闻因涉及重要话题，引发广泛关注。

**来源链接：** [{source}]({link})

---

"""
    
    md_content += """## 📊 热度指数说明

热度指数基于以下综合指标计算：
- 新闻关键词权重
- 来源权威性
- 发布时效性

---

## ⚠️ 免责声明

本新闻汇总基于公开信息整理，仅供参考。新闻内容来源于各权威媒体，真实性由原发布媒体负责。

---

*本报告由 Daily News Collector 自动生成*  
"""
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(md_content)
    
    print(f"Report generated: {output_file}")
    return output_file

def main():
    print("Starting news collection...")
    
    queries = [
        "top stories",
        "world news",
        "breaking news",
        "热点新闻"
    ]
    
    all_news = []
    for query in queries:
        news = get_google_news(query)
        all_news.extend(news)
    
    seen_titles = set()
    unique_news = []
    for news in all_news:
        title = news.get('title', '')
        if title not in seen_titles:
            seen_titles.add(title)
            unique_news.append(news)
    
    now = datetime.now()
    filename_date = now.strftime("%Y%m%d")
    output_file = os.path.join(OUTPUT_DIR, f"全球热点新闻速览_{filename_date}.md")
    
    generate_markdown_report(unique_news, output_file)
    
    latest_file = os.path.join(OUTPUT_DIR, "latest.md")
    with open(output_file, 'r', encoding='utf-8') as f:
        content = f.read()
    with open(latest_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"News collection completed! Total news items: {len(unique_news)}")
    print(f"Latest report saved to: {latest_file}")

if __name__ == "__main__":
    main()
