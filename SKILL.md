---
name: fetch-web
description: >
  WebページのコンテンツをMarkdownで取得する共通フェッチユーティリティ。
  r.jina.ai（主）→ headless Chrome with Puppeteer（フォールバック）→ direct curl（最終手段）の順で試みる。
  他スキルから参照される共通戦略として設計されているが、URLのMarkdown取得が必要な場面ではどこでも使える。
  「このURLの内容を取得して」「URLをMarkdownで」「ページをフェッチ」などで使う。
user-invocable: true
allowed-tools: Bash
argument-hint: "<URL>"
---

# fetch-web

Web ページのコンテンツを Markdown で取得するユーティリティ。他スキルから参照される共通フェッチ戦略。

## フェッチ戦略（優先順）

### 1. r.jina.ai（主）

```bash
curl -s 'https://r.jina.ai/<URL>'
```

Jina AI のリーダー API。URL の前に `r.jina.ai/` を付けるだけでページを clean Markdown に変換して返す。JS レンダリングも Jina 側が処理するため headless Chrome 不要。ほとんどの公開ページで動作する。

### 2. headless Chrome（フォールバック）

スクリプトの実体はこのスキル配下の `scripts/fetch-page.js`。実行時の作業ディレクトリは利用側プロジェクトなので、**スキルを置いた場所の絶対パスで呼ぶ**。以下のパスは**作者環境の既定値**なので、他環境では自分の配置に読み替える。

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

## Twitter/X は fxtwitter API を使う（Jina・fetch-page.js より先）

X（`x.com` / `twitter.com`）はログインウォールで r.jina.ai が失敗し、fetch-page.js でもログイン画面の断片しか取れないことがある。**最初から fxtwitter API を使う**:

```bash
curl -s 'https://api.fxtwitter.com/{user}/status/{id}'
```

レスポンス JSON に本文・画像 URL・引用・リプライ先・**X Article 全文**（`article.content.blocks`）まで全て含まれる。

- **画像**: 本文の理解に画像が要らないなら**保存しない**。要るときは JSON の画像 URL を `curl -sL "{image_url}" -o <scratchpad>/tweet.jpg` で保存し、Read で開いて見る
- **フォールバック**（fxtwitter が HTTP エラー・空レスポンスの場合）: oEmbed `curl -s 'https://publish.twitter.com/oembed?url=https://x.com/{user}/status/{id}'` → それでも駄目なら fetch-page.js（Agent 経由）→ ユーザーに内容の共有を依頼
- **やってはいけない**: x.com を直接フェッチ（ログインウォール）／nitter・xcancel 等の代替フロントエンド（X Article 非対応）／Web 検索で X Article 本文を探す（インデックスされにくい）／複数の手段を順に試して時間を浪費する（fxtwitter → oEmbed → fetch-page.js → ユーザー、の順で止める）

> このセクションが X 取得の正典。利用側プロジェクトに X 取得ルールを置く場合は、内容を複製せずここへの参照にする。

## Jina を最初からスキップするサイト

上記の X のほか、Jina がログインウォールで失敗するサイトは失敗してから切り替えず、最初からフォールバック（fetch-page.js を Agent 経由）を使う。

## 既知のブロックサイト

r.jina.ai・fetch-page.js の両方が困難なサイト: WebMD, Cleveland Clinic, Healthline, Planned Parenthood

ソース固有の API フォールバック（Wikipedia MediaWiki API、note.com API v3、PubMed E-utilities 等）は [research-note/references/source-acquisition.md](../research-note/references/source-acquisition.md) を参照。

## 依存関係

- `curl` — Windows 11 に標準搭載
- Google Chrome — fetch-page.js が標準パスで自動検出
- `puppeteer-core` + `turndown` — `scripts/` 内で `npm install`
