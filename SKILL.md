# fetch-web

Web ページのコンテンツを Markdown で取得するユーティリティ。他スキルから参照される共通フェッチ戦略。

## フェッチ戦略（優先順）

### 1. r.jina.ai（主）

```bash
curl -s 'https://r.jina.ai/<URL>'
```

Jina AI のリーダー API。URL の前に `r.jina.ai/` を付けるだけでページを clean Markdown に変換して返す。JS レンダリングも Jina 側が処理するため headless Chrome 不要。ほとんどの公開ページで動作する。

### 2. headless Chrome（フォールバック）

```bash
node C:/@projects/eruto-skills/fetch-web/scripts/fetch-page.js "<URL>"
```

Agent subagent 経由で実行:

```
Agent(subagent_type="general-purpose", prompt="Run `node C:/@projects/eruto-skills/fetch-web/scripts/fetch-page.js \"<URL>\"` and return the extracted content.")
```

r.jina.ai が失敗した場合（レート制限、Jina がブロックされるサイト等）に使う。ローカルの Chrome でレンダリングするため、セッション不要の JS ヘビーサイトに有効。

依存: Google Chrome（標準パスを自動検出）、puppeteer-core + turndown（`npm install` in `scripts/`）

### 3. direct curl（最終手段）

```bash
curl -s -A 'Mozilla/5.0' '<URL>'
```

JS レンダリング不要のシンプルな HTML サイトのみ有効。

## 失敗時の対応

全手段が失敗した場合はユーザーに報告する。ソースをサイレントに落とさない。

複数 URL を同時取得する場合は Agent subagent を並列で起動する。

## 既知のブロックサイト

r.jina.ai・fetch-page.js の両方が困難なサイト: WebMD, Cleveland Clinic, Healthline, Planned Parenthood

ソース固有の API フォールバック（Wikipedia MediaWiki API、note.com API v3、PubMed E-utilities 等）は [research-note/references/source-acquisition.md](../research-note/references/source-acquisition.md) を参照。

## 依存関係

- `curl` — Windows 11 に標準搭載
- Google Chrome — fetch-page.js が標準パスで自動検出
- `puppeteer-core` + `turndown` — `scripts/` 内で `npm install`
