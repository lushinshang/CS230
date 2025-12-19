#!/usr/bin/env node
/**
 * fetch_playlist_puppeteer.js
 *
 * 使用 Puppeteer 抓取 YouTube 播放清單前 N 支影片的標題與影片 ID，輸出 JSON 至 data/playlist.json
 *
 * 使用方法：
 *   npm install puppeteer
 *   node scripts/fetch_playlist_puppeteer.js <PLAYLIST_ID> [N]
 * 範例：
 *   node scripts/fetch_playlist_puppeteer.js PLoROMvodv4rNRRGdS0rBbXOUGA0wjdh1X 10
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function fetchPlaylist(playlistId, limit = 10) {
  const url = `https://www.youtube.com/playlist?list=${playlistId}`;
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  await page.setViewport({width: 1200, height: 800});
  await page.goto(url, {waitUntil: 'networkidle2'});

  // 等待播放清單項目載入
  await page.waitForSelector('ytd-playlist-video-renderer', {timeout: 15000}).catch(()=>{});

  const items = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('ytd-playlist-video-renderer'));
    return nodes.map(n => {
      const a = n.querySelector('a.yt-simple-endpoint') || n.querySelector('a#video-title');
      const titleEl = n.querySelector('#video-title');
      const title = titleEl ? titleEl.textContent.trim() : (a ? a.textContent.trim() : '');
      const href = a ? a.getAttribute('href') : null;
      // href 格式可能為 /watch?v=VIDEO_ID&list=...
      let id = null;
      if (href) {
        const m = href.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        if (m) id = m[1];
      }
      return {title, href, id};
    });
  });

  await browser.close();

  const filtered = items.filter(it => it.id).slice(0, limit);
  return filtered;
}

async function main() {
  const playlistId = process.argv[2];
  const limit = parseInt(process.argv[3] || '10', 10);
  if (!playlistId) {
    console.error('Usage: node scripts/fetch_playlist_puppeteer.js <PLAYLIST_ID> [N]');
    process.exit(1);
  }

  console.log('Fetching playlist', playlistId, 'limit', limit);
  const items = await fetchPlaylist(playlistId, limit);
  const outDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, {recursive:true});
  const outPath = path.join(outDir, 'playlist.json');
  fs.writeFileSync(outPath, JSON.stringify({playlistId, items}, null, 2), 'utf8');
  console.log('Wrote', outPath);
}

main().catch(err => {console.error(err);process.exit(1)});
