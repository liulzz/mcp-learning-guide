# MCP Learning Guide — project brief

## Objective

Create a public, single-page Chinese tutorial for learning Model Context Protocol (MCP) in the LLM context. The material must progress from basic concepts to protocol details, implementation, testing, security, and production concerns. It must contain concrete examples and code.

## Authoritative sources

Use the official MCP website and repositories as the primary references:

- https://modelcontextprotocol.io/docs/2026-07-28/getting-started/intro
- https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture
- https://modelcontextprotocol.io/specification/2026-07-28
- https://modelcontextprotocol.io/docs/2026-07-28/develop/build-server
- https://modelcontextprotocol.io/docs/2026-07-28/develop/build-client
- https://modelcontextprotocol.io/docs/2026-07-28/tools/inspector
- https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization
- https://github.com/modelcontextprotocol/python-sdk
- https://github.com/modelcontextprotocol/typescript-sdk

State clearly that the tutorial is aligned with protocol revision `2026-07-28`, while SDK APIs may continue to evolve.

## Required tutorial coverage

1. Prerequisites and learning path.
2. Precise MCP definition, scope, and limitations.
3. Host, client, server, transport, data layer, and trust boundary.
4. JSON-RPC request, response, notification, error, and capability negotiation.
5. Server primitives: tools, resources, resource templates, prompts.
6. Client primitives: sampling, elicitation, roots, and user consent.
7. Stdio and Streamable HTTP transports, including their applicable scenarios.
8. A minimal raw JSON-RPC exchange.
9. A Python MCP server example.
10. A TypeScript MCP server example.
11. A simplified MCP client decision cycle.
12. MCP Inspector usage and debugging guidance.
13. Authorization for HTTP transport, OAuth 2.1, least privilege, and token audience validation.
14. Prompt injection, tool descriptions as untrusted input, destructive actions, and audit logs.
15. Production design: idempotency, timeouts, retries, pagination, structured output, observability, versioning, and compatibility.
16. Common misconceptions and a decision guide for tools versus resources versus prompts.
17. Exercises from introductory to advanced levels.
18. Glossary, checklist, and official references.

## Language rules

- Chinese text must be precise and technical.
- Do not use metaphorical expressions or physical-action verbs in a figurative sense. In particular, avoid “接、跑、打、落、补、收” as figurative verbs. Professional terms such as “接口”, “连接”, “接收”, “回调”, and “数据包” are allowed only where technically necessary.
- Avoid expressions such as “跑起来”, “打通”, “落地”, “补齐”, “收口”, “一把梭”, “开箱即用”. Prefer “启动”, “建立通信”, “实现”, “完善”, “确定边界”, and other literal technical language.
- Use logical connectors actively, including “但是”, “因此”, “那么”, “同时”, “此外”, “如果……那么……”, and “因为……所以……”. Do not insert connectors where no logical relation exists.
- Every sentence must be reviewed individually before the assigned file is finalized. Do not use search-and-replace or bulk replacement to revise prose.

## UI and accessibility

- Default to a light theme, with an optional dark theme.
- Use semantic HTML and visible keyboard focus.
- Provide a persistent chapter navigation on desktop and a compact navigation on mobile.
- Include reading progress, active chapter indication, code-copy controls, and a back-to-top control.
- Do not use external JavaScript frameworks or runtime CDN dependencies.
- The page must remain usable when JavaScript is disabled.
- Follow responsive design and `prefers-reduced-motion`.

## DOM contract

`index.html` must reference `assets/styles.css` and `assets/app.js` with relative paths. Use these selectors:

- `#reading-progress` for the fixed reading progress element.
- `#site-nav` for chapter navigation.
- `main article section[id]` for tutorial sections.
- `.code-block` around code examples.
- `.copy-code` for copy buttons.
- `#theme-toggle` for the theme control.
- `#back-to-top` for the back-to-top control.
- `[data-nav-target]` for navigation links whose value is a section id.
- `html[data-theme="dark"]` for the optional dark theme.

## File ownership

Each implementation subagent owns exactly one file and must not modify any other path:

- `index.html`
- `assets/styles.css`
- `assets/app.js`
- `examples/python/mcp_server.py`
- `examples/typescript/server.ts`
- `README.md`

A later review agent may read all files but must not edit any file. The parent agent performs any necessary targeted edits after reading the complete files.