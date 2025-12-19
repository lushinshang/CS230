#!/usr/bin/env node
/**
 * apply_links.js
 *
 * 讀取 data/playlist.json 並把前 10 支影片的 watch 連結套到 notes/lessonN.html 中的 YouTube 按鈕。
 *
 * 使用方法：
 *   node scripts/apply_links.js
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'playlist.json');
if (!fs.existsSync(dataPath)) {
  console.error('請先產生 data/playlist.json（使用 fetch_playlist_puppeteer.js）');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const items = data.items || [];

for (let i = 0; i < 10; i++) {
  const lesson = i + 1;
  const filePath = path.join(__dirname, '..', 'notes', `lesson${lesson}.html`);
  if (!fs.existsSync(filePath)) {
    console.warn('未找到', filePath, '跳過');
    continue;
  }
  let html = fs.readFileSync(filePath, 'utf8');
  const item = items[i];
  if (!item || !item.id) {
    console.warn('第', lesson, '堂無對應影片資料，跳過');
    continue;
  }
  const videoUrl = `https://www.youtube.com/watch?v=${item.id}`;

  // 將第一個包含 'btn-yt' 的 a 標籤的 href 替換
  const newHtml = html.replace(/(<a[^>]+class="[^"]*btn-yt[^"]*"[^>]*href=")[^"]*("[^>]*>)/i, `$1${videoUrl}$2`);
  if (newHtml === html) {
    // 若沒有匹配到，嘗試更簡單的替換：尋找 🎬 YouTube 播放清單 文字附近的 href
    const fallback = html.replace(/(<a[^>]+href=")https?:\/\/[^\"]+("[^>]*>\s*🎬\s*YouTube[^<]*<\/a>)/i, `$1${videoUrl}$2`);
    if (fallback === html) {
      console.warn('無法在', filePath, '找到可替換的 YouTube 連結，請手動檢查');
    } else {
      fs.writeFileSync(filePath, fallback, 'utf8');
      console.log('更新', filePath, '→', videoUrl);
    }
  } else {
    fs.writeFileSync(filePath, newHtml, 'utf8');
    console.log('更新', filePath, '→', videoUrl);
  }
}

console.log('完成套用連結。');
