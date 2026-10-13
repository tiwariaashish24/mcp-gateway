# Phone Control MCP

An experimental **Model Context Protocol (MCP) server for controlling an Android phone** from an MCP-compatible client. It exposes phone-control tools through the MCP stdio transport and uses Android Debug Bridge (ADB) to communicate with a connected device over USB or wireless debugging.

> **Project status:** Work in progress. Some device queries are implemented, while other command options are placeholders. Review the feature status below before relying on any action.

## What it does

- **MCP stdio server** built with TypeScript and `@modelcontextprotocol/server`.
- **ADB device discovery** for Android devices whose ADB state is `device`.
- **Launch supported Android apps** by package name.
- **Battery information** through Android's `dumpsys battery`.
- **Device metadata helper** for brand, model, Android release, SDK level, and an estimated USB/Wi-Fi connection type.
- **Android queries** for installed packages, the shared-storage root listing, and media-library photo metadata.
- **Local Wi-Fi HTTP requests** via a tool that supports GET and POST requests.

## Implemented MCP tools

| Tool | Inputs | Current behavior |
| --- | --- | --- |
| `hello_phone` | `message: string` | Returns a test response, confirming that the MCP server received the message. |
| `wifi_request` | `url: URL`, `method?: GET \| POST`, `body?: string` | Sends an HTTP request to a device or service reachable on the local network and returns its status and response body. |
| `phone_battery` | None | Reads battery details from the first connected ADB device and extracts the battery level when available. |
| `phone_open_app` | `app: string` | Opens a supported app on the first connected device. Supported names: `camera`, `chrome`, `whatsapp`, `youtube`, `settings`, `contacts`, `phone`, and `messages`. |
| `android_device` | `command: string`, `value?: string` | Runs one of the Android command cases described below. |

### `android_device` commands

| Command | Status / behavior |
| --- | --- |
| `phone_get_photos` | Queries Android's external image media provider for photo metadata. Actual access depends on Android/device permissions and provider behavior. |
| `phone_list_apps` | Lists installed package identifiers using `pm list packages`. |
| `phone_list_files` | Lists the contents of `/sdcard/`. |
| `phone_get_contacts` | Placeholder: returns a message that the contacts gateway will be connected later. |
| `phone_download_file` | Placeholder: reports the requested path; file transfer is not implemented yet. |
| `phone_open_app` | Placeholder within this generic command; use the dedicated `phone_open_app` tool to actually launch supported apps. |
| `whatsapp_open` | Placeholder; WhatsApp UI control is not implemented. |
| `whatsapp_find_chat` | Placeholder; chat search is not implemented. |
| `whatsapp_read_visible_messages` | Placeholder; reading WhatsApp UI messages is not implemented. |
| `whatsapp_send_message` | Placeholder; sending WhatsApp messages is not implemented. |

The helper in `src/adb/deviceManager.ts` also provides `scanDevices()` and `getActiveDevice()` for reading connected-device metadata. These helpers are present in the codebase; they are not currently registered as separate MCP tools.

## Tech stack

- TypeScript (ES modules, NodeNext)
- Node.js
- Model Context Protocol server SDK: `@modelcontextprotocol/server`
- Zod for input schemas
- Android Debug Bridge (ADB / Android SDK Platform-Tools)
- `tsx` for development and TypeScript compiler (`tsc`) for builds

## Prerequisites

1. **Node.js** installed.
2. **Android SDK Platform-Tools** installed so that `adb` is available.
3. An Android phone with **Developer options** and **USB debugging** enabled for USB, or **Wireless debugging** enabled for a wireless connection.
4. The phone authorized to connect to this computer via ADB.
5. An MCP-compatible host/client configured to launch this server through stdio.

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/tiwariaashish24/mcp-gateway.git
cd mcp-gateway
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure ADB path

The current `src/adb/adbClient.ts` contains a **hard-coded Windows path** to `adb.exe`. Update `ADB_PATH` to match your local Android SDK Platform-Tools installation before running the server.

For example, if ADB is available on your PATH, you can improve portability by changing the implementation to invoke `adb` by name, or by reading the executable path from an environment variable. Do not commit a personal machine-specific path.

### 4. Connect your phone

**USB:**
1. Connect the phone to the computer.
2. Accept the USB debugging authorization prompt on the phone.
3. Check that ADB detects it:

```bash
adb devices
```

**Wireless debugging (Android versions that support it):**
1. Put the phone and computer on a network that allows them to communicate.
2. On the phone, open Developer options → Wireless debugging.
3. Use the pairing/connect address and port shown on the phone. The exact commands depend on the device and Android version. A common workflow is:

```bash
adb pair PHONE_IP:PAIRING_PORT
adb connect PHONE_IP:CONNECT_PORT
adb devices
```

Use the actual IP address and ports shown on your phone; the pairing port and connect port may differ. If you use a legacy TCP/IP workflow, follow the ADB instructions appropriate to your device.

### 5. Start and test the MCP server

You can run the server directly during development, or launch it through the MCP Inspector to test its tools interactively.

#### Option A: Run with MCP Inspector (recommended for testing)

From the project root, run:

```bash
npx @modelcontextprotocol/inspector npm run dev
```

The Inspector starts its web interface and launches the project using the `dev` script (`tsx src/index.ts`). Open the Inspector URL shown in the terminal, connect to the server if prompted, and use the tool panel to test tools such as `hello_phone`, `phone_battery`, `phone_open_app`, and `android_device`.

You normally **do not need to run a second `npm run dev` at the same time** when using this command: the Inspector starts the server process for you.

#### Option B: Run the MCP server directly

To start the server without the Inspector, run:

```bash
npm run dev
```

Use this option when an MCP-compatible client is configured to launch the server, or when you only need to start the stdio server process. It may appear to wait without showing an interactive interface; that is expected for an MCP stdio server.

Compile TypeScript into `dist/`:

```bash
npm run build
```

Run the compiled server:

```bash
npm start
```

The server uses **stdio** for MCP communication. When launched by an MCP host, its stdout is reserved for protocol messages; startup diagnostics are written to stderr.

## Configure an MCP client

Configure your MCP-compatible application to launch the project using the absolute paths for your system. For a local development setup, the general shape is:

```json
{
  "mcpServers": {
    "phone-control": {
      "command": "npx",
      "args": ["tsx", "C:/path/to/mcp-gateway/src/index.ts"]
    }
  }
}
```

Replace the example path with the actual absolute path on your computer. The configuration format and location depend on your MCP client. You may instead build the project and configure the client to run `node` with the compiled `dist/index.js` path.

## Example tool calls

These are conceptual examples of the arguments an MCP client can submit to the corresponding tools.

**Test the server**
```json
{ "message": "Hello from my MCP client" }
```
Tool: `hello_phone`

**Open WhatsApp**
```json
{ "app": "whatsapp" }
```
Tool: `phone_open_app`

**Get battery details**
```json
{}
```
Tool: `phone_battery`

**List installed packages**
```json
{ "command": "phone_list_apps" }
```
Tool: `android_device`

**List files at the shared-storage root**
```json
{ "command": "phone_list_files" }
```
Tool: `android_device`

**Query photo metadata**
```json
{ "command": "phone_get_photos" }
```
Tool: `android_device`

## Project structure

```text
mcp-gateway/
├── src/
│   ├── adb/
│   │   ├── adbClient.ts       # ADB command execution and device discovery
│   │   └── deviceManager.ts   # Device metadata helper functions
│   ├── bluetooth/
│   │   ├── bluetoothManager.ts
│   │   └── phoneProtocol.ts
│   ├── tools/
│   │   ├── androidDevice.ts   # Generic Android command tool
│   │   ├── phoneBattery.ts    # Reserved/empty module
│   │   ├── phoneInfo.ts       # Reserved/empty module
│   │   └── phoneOpenApp.ts    # Launch supported apps
│   └── index.ts               # MCP server and tool registrations
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

The Bluetooth module files and the separate `phoneBattery.ts` / `phoneInfo.ts` modules are currently empty in the repository. The implemented battery tool is registered directly in `src/index.ts`.

## Security and privacy notes

- Only connect devices you own or have explicit permission to manage.
- ADB can grant powerful access to the phone. Keep USB/Wireless debugging disabled when you do not need it, and revoke debugging authorizations on shared computers.
- The `wifi_request` tool can make GET/POST requests to URLs provided by the caller. Use it only with trusted endpoints on networks you control; avoid exposing this MCP server to untrusted clients.
- Review each action before using it with an AI agent. Contact access, file downloads, and WhatsApp UI operations are not complete in the current implementation.
- Do not store credentials, tokens, private messages, or personal device data in source control.

## Troubleshooting

**No Android device is connected**
- Run `adb devices` in a terminal and confirm the phone is listed as `device`, not `unauthorized` or `offline`.
- Accept the authorization prompt on the phone.
- Check the configured `ADB_PATH` in `src/adb/adbClient.ts`.

**The server cannot find ADB**
- Correct the hard-coded path, or update the code to use an ADB executable available on your PATH.

**An app is not supported**
- The dedicated `phone_open_app` tool accepts only the app names listed above. Other apps need their package identifiers added to the `appPackages` mapping in `src/tools/phoneOpenApp.ts`.

**A device query fails**
- Ensure the relevant Android command/provider is supported on your device and Android version. OEM behavior and permissions can vary.

## Roadmap

- [ ] Make ADB path configurable and portable across operating systems.
- [ ] Expose device discovery and device information through dedicated MCP tools.
- [ ] Implement contact retrieval and file transfer.
- [ ] Implement WhatsApp actions safely and reliably, with clear confirmation before sending messages.
- [ ] Add Bluetooth transport/control logic (the current Bluetooth source files are empty).
- [ ] Add tests and document supported Android versions and client configuration examples.

## Contributing

Contributions are welcome. Create a feature branch, make a focused change, build the project with `npm run build`, and open a pull request describing the behavior changed and how it was tested.

## License

This project currently declares the **ISC** license in `package.json`. See the repository's license information for the authoritative terms.
