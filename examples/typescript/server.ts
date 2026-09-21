import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

// 依赖安装：npm install @modelcontextprotocol/server zod
// 开发依赖安装：npm install --save-dev typescript tsx @types/node
// 启动命令：npx tsx examples/typescript/server.ts
// 本示例面向 MCP 2026-07-28；SDK API 可能继续变化，请以已安装版本的文档为准。

const server = new McpServer({
  name: "arithmetic-learning-server",
  version: "1.0.0",
});

const divisionOutputSchema = z.object({
  ok: z.boolean().describe("操作是否成功"),
  result: z.number().nullable().describe("成功时的商，失败时为 null"),
  error: z
    .object({
      code: z.enum(["DIVISION_BY_ZERO", "NON_FINITE_RESULT"]),
      message: z.string(),
      details: z.object({
        dividend: z.number(),
        divisor: z.number(),
      }),
    })
    .nullable()
    .describe("失败时的结构化错误，成功时为 null"),
});

server.registerTool(
  "divide_numbers",
  {
    title: "数值除法",
    description: "计算两个有限数值的商，并以结构化对象表示成功结果或错误。",
    inputSchema: z.object({
      dividend: z.number().finite().describe("被除数"),
      divisor: z.number().finite().describe("除数"),
    }),
    outputSchema: divisionOutputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ dividend, divisor }) => {
    if (divisor === 0) {
      const output = {
        ok: false,
        result: null,
        error: {
          code: "DIVISION_BY_ZERO" as const,
          message: "除数不能为零。",
          details: { dividend, divisor },
        },
      };

      return {
        isError: true,
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }

    const quotient = dividend / divisor;
    if (!Number.isFinite(quotient)) {
      const output = {
        ok: false,
        result: null,
        error: {
          code: "NON_FINITE_RESULT" as const,
          message: "计算结果不是有限数值。",
          details: { dividend, divisor },
        },
      };

      return {
        isError: true,
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }

    const output = {
      ok: true,
      result: quotient,
      error: null,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
      structuredContent: output,
    };
  },
);

server.registerResource(
  "server-overview",
  "guide://arithmetic-learning-server/overview",
  {
    title: "算术服务说明",
    description: "说明示例服务提供的能力及其错误约定。",
    mimeType: "application/json",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(
          {
            server: "arithmetic-learning-server",
            tool: "divide_numbers",
            prompt: "explain_division",
            errorContract: {
              isError: true,
              structuredContent: {
                ok: false,
                result: null,
                error: {
                  code: "稳定的机器可读错误码",
                  message: "适合向用户显示的错误说明",
                  details: "与错误相关的输入数据",
                },
              },
            },
          },
          null,
          2,
        ),
      },
    ],
  }),
);

server.registerPrompt(
  "explain_division",
  {
    title: "解释除法",
    description: "生成用于解释一次除法计算的提示消息。",
    argsSchema: z.object({
      dividend: z.string().min(1).describe("被除数的文本表示"),
      divisor: z.string().min(1).describe("除数的文本表示"),
    }),
  },
  ({ dividend, divisor }) => ({
    description: `解释 ${dividend} 除以 ${divisor} 的计算过程`,
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: [
            `请解释 ${dividend} 除以 ${divisor} 的计算过程。`,
            "请先判断除数是否为零，然后给出公式、结果和必要的精度说明。",
            "如果输入无法解释为数值，请明确说明原因，不要推测缺失信息。",
          ].join("\n"),
        },
      },
    ],
  }),
);

async function main(): Promise<void> {
  // stdio 传输使用 stdout 发送 JSON-RPC 消息，因此不得向 stdout 写入诊断日志。
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`MCP 服务启动失败：${message}\n`);
  process.exitCode = 1;
});
