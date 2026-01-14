# Iconify PNG MCP Server

一个支持 PNG 下载的 Iconify MCP 服务器。

## 功能

- search_icons: 搜索图标
- get_icon_svg: 获取图标 SVG 代码
- download_icon_png: 下载图标为 PNG 文件
- get_all_icon_sets: 获取所有可用图标集

## 安装

```bash
npm install -g iconify-png-mcp
```

或者使用 npx 直接运行:

```bash
npx iconify-png-mcp
```

## MCP 配置

```json
{
  "mcpServers": {
    "iconify": {
      "command": "npx",
      "args": ["-y", "iconify-png-mcp"],
      "autoApprove": ["search_icons", "get_icon_svg", "download_icon_png", "get_all_icon_sets"]
    }
  }
}
```

## 使用示例

下载 PNG 图标:
- icon: mdi:home
- size: 64
- color: #000000
- savePath: C:/icons/home.png

## License

MIT
