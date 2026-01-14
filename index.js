#!/usr/bin/env node

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ICONIFY_API = "https://api.iconify.design";

// 创建 MCP 服务器
const server = new Server(
  {
    name: "iconify-png-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 定义工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_icons",
        description: "搜索图标",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "搜索关键词" },
            limit: { type: "number", description: "返回数量限制", default: 20 },
            prefix: { type: "string", description: "图标集前缀，如 mdi、tabler" },
          },
          required: ["query"],
        },
      },
      {
        name: "get_icon_svg",
        description: "获取图标的 SVG 代码",
        inputSchema: {
          type: "object",
          properties: {
            icon: { type: "string", description: "图标名称，格式: prefix:name，如 mdi:home" },
            size: { type: "number", description: "图标尺寸", default: 24 },
            color: { type: "string", description: "图标颜色，如 #000000", default: "currentColor" },
          },
          required: ["icon"],
        },
      },
      {
        name: "download_icon_png",
        description: "下载图标为 PNG 文件",
        inputSchema: {
          type: "object",
          properties: {
            icon: { type: "string", description: "图标名称，格式: prefix:name，如 mdi:home" },
            size: { type: "number", description: "PNG 尺寸（像素）", default: 64 },
            color: { type: "string", description: "图标颜色，如 #000000", default: "#000000" },
            savePath: { type: "string", description: "保存路径，如 C:/icons/home.png" },
          },
          required: ["icon", "savePath"],
        },
      },
      {
        name: "get_all_icon_sets",
        description: "获取所有可用的图标集",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});


// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "search_icons": {
        const { query, limit = 20, prefix } = args;
        let url = `${ICONIFY_API}/search?query=${encodeURIComponent(query)}&limit=${limit}`;
        if (prefix) {
          url += `&prefix=${prefix}`;
        }
        const response = await fetch(url);
        const data = await response.json();
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "get_icon_svg": {
        const { icon, size = 24, color = "currentColor" } = args;
        const [prefix, iconName] = icon.split(":");
        if (!prefix || !iconName) {
          throw new Error("图标格式错误，应为 prefix:name，如 mdi:home");
        }
        let url = `${ICONIFY_API}/${prefix}/${iconName}.svg?width=${size}&height=${size}`;
        if (color !== "currentColor") {
          url += `&color=${encodeURIComponent(color)}`;
        }
        const response = await fetch(url);
        const svg = await response.text();
        return {
          content: [{ type: "text", text: svg }],
        };
      }

      case "download_icon_png": {
        const { icon, size = 64, color = "#000000", savePath } = args;
        const [prefix, iconName] = icon.split(":");
        if (!prefix || !iconName) {
          throw new Error("图标格式错误，应为 prefix:name，如 mdi:home");
        }
        
        // 获取 SVG
        const url = `${ICONIFY_API}/${prefix}/${iconName}.svg?width=${size}&height=${size}&color=${encodeURIComponent(color)}`;
        const response = await fetch(url);
        const svg = await response.text();
        
        if (svg.includes("404") || !svg.includes("<svg")) {
          throw new Error(`图标 ${icon} 不存在`);
        }

        // 确保目录存在
        const dir = path.dirname(savePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // 使用 sharp 将 SVG 转换为 PNG
        await sharp(Buffer.from(svg))
          .resize(size, size)
          .png()
          .toFile(savePath);

        return {
          content: [{ type: "text", text: `PNG 图标已保存到: ${savePath}` }],
        };
      }

      case "get_all_icon_sets": {
        const response = await fetch(`${ICONIFY_API}/collections`);
        const data = await response.json();
        // 只返回图标集名称和数量
        const summary = Object.entries(data).map(([key, value]) => ({
          prefix: key,
          name: value.name,
          total: value.total,
        }));
        return {
          content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
        };
      }

      default:
        throw new Error(`未知工具: ${name}`);
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `错误: ${error.message}` }],
      isError: true,
    };
  }
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Iconify PNG MCP Server 已启动");
}

main().catch(console.error);
