# fetch-web

> Claude Code skill — Fetch web page content as Markdown

Web ページのコンテンツを Markdown で取得する共通フェッチユーティリティ。他スキルから参照される共通戦略として設計されており、r.jina.ai → headless Chrome → direct curl の順でフォールバックする。

## フェッチ戦略

1. **r.jina.ai**（主）— `curl -s 'https://r.jina.ai/<URL>'`
2. **headless Chrome**（フォールバック）— `node scripts/fetch-page.js "<URL>"`
3. **direct curl**（最終手段）— JS レンダリング不要のシンプルな HTML のみ

## Installation

```
/plugin install fetch-web@eruto-skills
```

## Dependencies

- `curl` — Windows 11 標準搭載
- Google Chrome — fetch-page.js が標準パスで自動検出
- `puppeteer-core` + `turndown` — `npm install` in `scripts/`

## License

MIT
