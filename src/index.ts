import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import { shell, getDevices } from "./adb/adbClient.js";
import { phoneOpenApp, phoneOpenAppSchema } from "./tools/phoneOpenApp.js";
import { androidDevice, androidDeviceSchema } from "./tools/androidDevice.js";

const server = new McpServer({
  name: "phone-control-mcp",
  version: "1.0.0",
});

server.registerTool(
  "hello_phone",
  {
    description: "Test communication with the phone control MCP server",
    inputSchema: z.object({
      message: z.string(),
    }),
  },
  async ({ message }) => {
    return {
      content: [
        {
          type: "text",
          text: `Phone MCP received: ${message}`,
        },
      ],
    };
  }
);

server.registerTool(
  "wifi_request",
  {
    description: "Send an HTTP request to a device available on the local Wi-Fi network",
    inputSchema: z.object({
      url: z.string().url(),
      method: z.enum(["GET", "POST"]).default("GET"),
      body: z.string().optional(),
    }),
  },
  async ({ url, method, body }) => {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: method === "POST" ? body : undefined,
      });
      const responseText = await response.text();
      return {
        content: [
          {
            type: "text",
            text: `HTTP ${response.status}\n${responseText}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Wi-Fi request failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "phone_battery",
  {
    description: "Get the current battery information from the connected Android phone",
    inputSchema: z.object({}),
  },
  async () => {
    try {
      const devices = await getDevices();
      if (devices.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No Android device is currently connected to ADB.\n\nConnect the phone through USB or Wi-Fi ADB and try again.",
            },
          ],
          isError: true,
        };
      }
      const device = devices[0];
      const { stdout } = await shell(device.serial, ["dumpsys", "battery"]);
      const levelMatch = stdout.match(/level:\s*(\d+)/);
      const batteryLevel = levelMatch ? `${levelMatch[1]}%` : "Unknown";
      return {
        content: [
          {
            type: "text",
            text: `Device: ${device.serial}\nBattery: ${batteryLevel}\n\n${stdout}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to get phone battery: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "phone_open_app",
  {
    description: "Open an application on the connected Android phone",
    inputSchema: phoneOpenAppSchema,
  },
  phoneOpenApp
);

server.registerTool(
  "android_device",
  {
    description: "Control and retrieve information from the connected Android phone",
    inputSchema: androidDeviceSchema,
  },
  androidDevice
);

serveStdio(() => server);

console.error("Phone Control MCP Server started");