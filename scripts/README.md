使用說明：擷取播放清單並套用到筆記頁面

先安裝 Node.js 與 npm。接著：

1) 安裝 Puppeteer

```bash
npm install puppeteer
```

2) 抓取播放清單（本例抓前 10 支）

```bash
node scripts/fetch_playlist_puppeteer.js PLoROMvodv4rNRRGdS0rBbXOUGA0wjdh1X 10
```

執行後會在 `data/playlist.json` 產生結果。

3) 套用連結到 `notes/lessonN.html`

```bash
node scripts/apply_links.js
```

備註：
- 若 YouTube 對你所在地/環境有防爬或需要登入，Puppeteer 仍可透過模擬瀏覽器抓取（若需要登入，需額外處理）。
- 若你有 YouTube Data API 金鑰，也可以改為使用官方 API 擷取播放清單項目。
