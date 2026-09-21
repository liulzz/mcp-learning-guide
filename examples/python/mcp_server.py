"""基于官方 Python MCP SDK 2.0 的 stdio 服务端示例。

安装依赖：
    python -m pip install "mcp>=2,<3"

启动服务：
    python examples/python/mcp_server.py

本示例与 MCP 协议修订版 2026-07-28 对齐。SDK API 仍可能演进，因此实际
项目应固定依赖版本，并在升级前查阅官方迁移说明。
"""

from __future__ import annotations

import json
import logging
import sys
from typing import Annotated, Final

from mcp.server import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from pydantic import BaseModel, Field

# stdio 传输将 stdout 专用于 MCP 消息；应用日志必须写入 stderr。
logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s %(name)s: %(message)s",
    stream=sys.stderr,
)
logger = logging.getLogger(__name__)

mcp = MCPServer(
    "catalog-example",
    title="商品目录示例",
    description="演示工具、资源、提示模板、输入校验和错误转换。",
    version="1.0.0",
)

PRODUCTS: Final[dict[str, dict[str, str | int]]] = {
    "notebook": {"name": "笔记本", "unit_price_cents": 1299},
    "pencil": {"name": "铅笔", "unit_price_cents": 199},
}

ProductId = Annotated[
    str,
    Field(
        min_length=1,
        max_length=32,
        pattern=r"^[a-z][a-z0-9_-]*$",
        description="商品标识，例如 notebook 或 pencil。",
    ),
]
Quantity = Annotated[
    int,
    Field(ge=1, le=100, description="购买数量，允许范围为 1 至 100。"),
]


class Quote(BaseModel):
    """工具的结构化输出。"""

    product_id: str
    product_name: str
    quantity: int
    unit_price_cents: int
    total_cents: int
    currency: str = "CNY"


class ProductNotFoundError(LookupError):
    """表示商品目录中不存在指定标识。"""


def _create_quote(product_id: str, quantity: int) -> Quote:
    """执行业务查询；此函数不包含 MCP 协议相关逻辑。"""
    product = PRODUCTS.get(product_id)
    if product is None:
        choices = ", ".join(sorted(PRODUCTS))
        raise ProductNotFoundError(
            f"商品 {product_id!r} 不存在；可用商品标识为：{choices}。"
        )

    unit_price_cents = int(product["unit_price_cents"])
    return Quote(
        product_id=product_id,
        product_name=str(product["name"]),
        quantity=quantity,
        unit_price_cents=unit_price_cents,
        total_cents=unit_price_cents * quantity,
    )


@mcp.tool(
    title="计算商品报价",
    description="按商品标识和数量计算人民币报价；此操作不创建订单。",
)
def calculate_quote(product_id: ProductId, quantity: Quantity = 1) -> Quote:
    """计算结构化报价；参数约束会进入工具的 JSON Schema。"""
    try:
        return _create_quote(product_id, quantity)
    except ProductNotFoundError as exc:
        # 预期的业务错误转换为 ToolError，客户端会得到 isError=true。
        raise ToolError(str(exc)) from exc


@mcp.resource(
    "catalog://products",
    name="product_catalog",
    title="商品目录",
    description="提供当前可查询商品及其人民币分价。",
    mime_type="application/json",
)
def read_product_catalog() -> str:
    """以 JSON 文本形式提供只读目录。"""
    products = [
        {
            "product_id": product_id,
            "name": product["name"],
            "unit_price_cents": product["unit_price_cents"],
            "currency": "CNY",
        }
        for product_id, product in sorted(PRODUCTS.items())
    ]
    return json.dumps({"products": products}, ensure_ascii=False, indent=2)


@mcp.prompt(
    name="review_purchase",
    title="审查购买计划",
    description="生成用于审查购买必要性、成本和风险的提示模板。",
)
def review_purchase(product_id: str, purpose: str = "日常办公") -> str:
    """根据调用方提供的参数构造用户提示。"""
    return (
        "请审查以下购买计划，并分别说明必要性、成本风险和替代方案。\n"
        f"商品标识：{product_id}\n"
        f"用途：{purpose}\n"
        "如果信息不足，请明确列出需要确认的事实；不要假设订单已经创建。"
    )


if __name__ == "__main__":
    # 此日志写入 stderr，不会干扰 stdout 上的 JSON-RPC 消息。
    logger.info("启动 MCP stdio 服务")
    mcp.run(transport="stdio")
