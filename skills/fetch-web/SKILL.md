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

## 実行環境の扱い

この手順の Read / Bash / WebSearch / Agent / Skill は操作の種類を表す。
Claude Codeでは対応するツールを使い、Codexでは提供されているファイル読取・シェル・Web検索・画像表示ツールを使う。
別スキルを使うときは、利用可能なスキル一覧から名前と実際の SKILL.md の場所を確認して読む。
スキルが未導入なら、その工程に必要な依存として案内し、実行したことにしない。
サブエージェントは提供されているAPIと実行権限に従う。
使えない場合、取得作業は自分で順に行い、独立レビューが必要な工程は未実施として報告する。
スクリプトと参照資料は、この SKILL.md のあるディレクトリを基準に絶対パスへ解決する。
作業先プロジェクトの cwd や隣のプラグインの配置を、スキルの配置場所と取り違えない。

Web ページのコンテンツを Markdown で取得するユーティリティ。他スキルから参照される共通フェッチ戦略。

## フェッチ戦略（優先順）

### 1. r.jina.ai（主）

```bash
curl -s 'https://r.jina.ai/<URL>'
```

Jina AI のリーダー API。URL の前に `r.jina.ai/` を付けるだけでページを clean Markdown に変換して返す。JS レンダリングも Jina 側が処理するため headless Chrome 不要。ほとんどの公開ページで動作する。

### 2. headless Chrome（フォールバック）

スクリプトの実体はこの SKILL.md と同じディレクトリ配下の scripts/fetch-page.js。
その実際の絶対パスを確認して、利用側プロジェクトから呼び出す。

```bash
node "<skill-directory>/scripts/fetch-page.js" "<URL>"
```

取得は自分で実行できる。
複数ページを分担する場合は利用可能なサブエージェントAPIを使い、必要な内容の要約を返させる。
Claude専用の Agent(subagent_type=...) をCodexに送らない。

r.jina.ai が失敗した場合（レート制限、Jina がブロックされるサイト等）に使う。ローカルの Chrome でレンダリングするため、セッション不要の JS ヘビーサイトに有効。

依存: Google Chrome（標準パスを自動検出）、puppeteer-core + turndown（`npm install` in `scripts/`）

### 3. direct curl（最終手段）

```bash
curl -s -A 'Mozilla/5.0' '<URL>'
```

JS レンダリング不要のシンプルな HTML サイトのみ有効。

## 失敗時の対応

全手段が失敗した場合はユーザーに報告する。ソースをサイレントに落とさない。

複数 URL は、サブエージェントが利用可能で許可されていれば並列取得し、なければ自分で順に取得する。

## Twitter/X は fxtwitter API を使う（Jina・fetch-page.js より先）

X（`x.com` / `twitter.com`）はログインウォールで r.jina.ai が失敗し、fetch-page.js でもログイン画面の断片しか取れないことがある。**最初から fxtwitter API を使う**:

```bash
curl -s 'https://api.fxtwitter.com/{user}/status/{id}'
```

レスポンス JSON に本文・画像 URL・引用・リプライ先・**X Article 全文**（`article.content.blocks`）まで全て含まれる。

- **画像**: 本文の理解に画像が要らないなら**保存しない**。要るときは JSON の画像 URL を `curl -sL "{image_url}" -o <scratchpad>/tweet.jpg` で保存し、利用可能な画像表示ツールで開いて見る
- **フォールバック**（fxtwitter が HTTP エラー・空レスポンスの場合）: oEmbed `curl -s 'https://publish.twitter.com/oembed?url=https://x.com/{user}/status/{id}'` → それでも駄目なら fetch-page.js（Agent 経由）→ ユーザーに内容の共有を依頼
- **やってはいけない**: x.com を直接フェッチ（ログインウォール）／nitter・xcancel 等の代替フロントエンド（X Article 非対応）／Web 検索で X Article 本文を探す（インデックスされにくい）／複数の手段を順に試して時間を浪費する（fxtwitter → oEmbed → fetch-page.js → ユーザー、の順で止める）

> このセクションが X 取得の正典。利用側プロジェクトに X 取得ルールを置く場合は、内容を複製せずここへの参照にする。

## Jina を最初からスキップするサイト

上記の X のほか、Jina がログインウォールで失敗するサイトは失敗してから切り替えず、最初からフォールバック（fetch-page.js を Agent 経由）を使う。

## 既知のブロックサイト

r.jina.ai・fetch-page.js の両方が困難なサイト: WebMD, Cleveland Clinic, Healthline, Planned Parenthood

ソース固有の API フォールバック（Wikipedia MediaWiki API、note.com API v3、PubMed E-utilities 等）は 利用可能な research-note スキルの references/source-acquisition.md を参照。未導入なら一次情報の公式APIを確認して使い、それも取得できなければ未取得として報告する。

## 依存関係

- `curl` — Windows 11 に標準搭載
- Google Chrome — fetch-page.js が標準パスで自動検出
- `puppeteer-core` + `turndown` — `scripts/` 内で `npm install`
