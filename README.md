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

## Codex / Claude Code installation

This package supports both Codex and Claude Code. The plugin entry point is
`skills/fetch-web/SKILL.md`; the root `SKILL.md` remains the standalone source.

For Codex, add the public `eruto-skills` marketplace in the plugin UI using
`https://github.com/eruto-skills/marketplace`, then install `fetch-web`.
To install as a standalone user skill instead:

```bash
mkdir -p ~/.agents/skills
git clone https://github.com/eruto-skills/fetch-web.git ~/.agents/skills/fetch-web
```

On Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE/.agents/skills" | Out-Null
git clone https://github.com/eruto-skills/fetch-web.git "$env:USERPROFILE/.agents/skills/fetch-web"
```

In Codex, select the installed skill by name or invoke `$fetch-web` with a task.
In Claude Code:

```text
/plugin marketplace add eruto-skills/marketplace
/plugin install fetch-web@eruto-skills
```

The instructions use the tools available in the current host. Scripts are resolved
from the actual skill directory, rather than a fixed author path. Additional browser,
Python, or format-specific dependencies are described in `SKILL.md` and the references;
installing the plugin alone does not install those external programs.

## Maintaining the plugin package

Edit the root `SKILL.md` and its supporting resources, then run:

```bash
node scripts/package-plugin.mjs
node scripts/package-plugin.mjs --check
```

Commit the generated `skills/` files with the source changes. CI checks that both
layouts match, including the Claude manifest. Do not edit generated files directly.
