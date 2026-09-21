# MCP Learning Guide

面向中文读者的 Model Context Protocol（MCP）单页教程，内容从基础概念逐步扩展到协议细节、服务端与客户端实现、测试、安全和生产设计。教程适合已经了解大语言模型基本概念，并希望系统理解 MCP 协议及其工程边界的开发者。

本项目以官方 MCP 文档和官方 SDK 仓库为主要依据。示例用于解释协议与实现方法，不代表特定 SDK API 的长期稳定承诺。

## 教程定位

教程强调以下目标：

- 准确定义 MCP 的用途、适用范围和限制。
- 区分 host、client、server、transport、data layer 和 trust boundary 的职责。
- 结合原始 JSON-RPC 消息与 SDK 示例解释协议行为。
- 同时讨论功能实现、用户授权、安全边界和生产环境要求。
- 提供 Python、TypeScript、MCP Inspector 和分级练习等实践材料。

教程不是 MCP SDK 的完整 API 手册，也不替代具体 host 产品的配置文档。不同 SDK 和 host 对功能的支持程度可能不同，因此实际项目还需要核对对应版本的官方说明。

## 章节覆盖

单页教程包含以下内容：

1. 前置知识与建议学习顺序。
2. MCP 的精确定义、适用范围与限制。
3. host、client、server、transport、data layer 与 trust boundary。
4. JSON-RPC 请求、响应、通知、错误和能力协商。
5. 服务端 primitives：tools、resources、resource templates 与 prompts。
6. 客户端 primitives：sampling、elicitation、roots 与用户同意。
7. stdio 和 Streamable HTTP transport，以及各自的适用场景。
8. 最小原始 JSON-RPC 交互示例。
9. Python MCP server 示例。
10. TypeScript MCP server 示例。
11. 简化的 MCP client 决策循环。
12. MCP Inspector 的使用方法与调试建议。
13. HTTP transport 授权、OAuth 2.1、最小权限与 token audience 校验。
14. prompt injection、将工具描述视为不可信输入、破坏性操作确认与审计日志。
15. 生产设计，包括幂等性、超时、重试、分页、结构化输出、可观测性、版本管理与兼容性。
16. 常见误解，以及 tools、resources 与 prompts 的选择依据。
17. 从入门到高级的练习。
18. 术语表、检查清单与官方参考资料。

## 目标目录结构

项目约定采用以下结构：

```text
mcp-learning-guide/
├── index.html                     # 单页中文教程
├── assets/
│   ├── styles.css                 # 响应式布局、明暗主题与可访问性样式
│   └── app.js                     # 导航、阅读进度、代码复制和主题控制
├── examples/
│   ├── python/
│   │   └── mcp_server.py          # Python MCP server 示例
│   └── typescript/
│       └── server.ts              # TypeScript MCP server 示例
├── research/
│   └── PROJECT_BRIEF.md           # 项目规范与内容要求
└── README.md                      # 仓库说明
```

网页应使用相对路径引用静态资源，不依赖外部 JavaScript 框架或运行时 CDN。核心内容在 JavaScript 禁用时仍应可读。

## 本地预览

在仓库根目录启动静态 HTTP 服务：

```bash
python3 -m http.server 8000
```

然后访问：

```text
http://localhost:8000/
```

结束预览时，在启动服务的终端中按 `Ctrl+C`。直接打开 `index.html` 也可以查看基础内容，但是使用本地 HTTP 服务更接近 GitHub Pages 的资源加载方式。

## GitHub Pages 地址与占位规则

预期 GitHub 仓库为 `liulzz/mcp-learning-guide`，预期页面地址为：

```text
https://liulzz.github.io/mcp-learning-guide/
```

该地址目前只表示预期发布位置，不表示部署已经完成。在 GitHub Pages 已启用并且上述地址经过实际访问验证之前，README、仓库描述或其他文档中的发布状态必须标记为“待发布”或“尚未验证”。只有在部署成功且页面可以访问之后，才可以将状态改为“已发布”；预期地址本身不需要因状态变化而替换。

## 官方参考资料

本教程优先采用以下官方资料：

- [MCP 简介](https://modelcontextprotocol.io/docs/2026-07-28/getting-started/intro)
- [MCP 架构](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)
- [MCP Specification `2026-07-28`](https://modelcontextprotocol.io/specification/2026-07-28)
- [构建 MCP server](https://modelcontextprotocol.io/docs/2026-07-28/develop/build-server)
- [构建 MCP client](https://modelcontextprotocol.io/docs/2026-07-28/develop/build-client)
- [MCP Inspector](https://modelcontextprotocol.io/docs/2026-07-28/tools/inspector)
- [Authorization specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

## 版本声明

教程内容与 MCP 协议修订版 `2026-07-28` 对齐。MCP SDK 的 API、类型定义和推荐用法可能继续变化，因此使用示例代码前应核对对应 SDK 仓库的当前文档、发布说明和版本要求。协议修订版与 SDK 软件包版本不是同一个版本体系，不能仅根据版本号形式推断兼容性。

## 语言与风格约束

- 中文说明必须准确、技术化，并明确区分规范要求、实现选择与建议做法。
- 除必要的专业术语外，不使用隐喻表达，也不把物理动作动词用于抽象过程。
- 避免“跑起来”“打通”“落地”“补齐”“收口”“一把梭”和“开箱即用”等表达；使用“启动”“建立通信”“实现”“完善”和“确定边界”等字面含义明确的技术表述。
- “接口”“连接”“接收”“回调”和“数据包”等词仅在技术含义必要时使用。
- 仅在存在真实逻辑关系时使用“但是”“因此”“那么”“同时”“此外”以及“如果……那么……”等连接形式。
- 代码、命令、协议字段、URL 和标识符保持原始拼写，不进行中文化改写。
- 每个句子在提交前单独审阅，不通过批量搜索替换调整正文措辞。
