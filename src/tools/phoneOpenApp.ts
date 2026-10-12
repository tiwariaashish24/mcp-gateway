import * as z from "zod/v4";
import { getDevices, shell } from "../adb/adbClient.js";

const appPackages: Record<string, string> = {
  camera: "com.oplus.camera",
  chrome: "com.android.chrome",
  whatsapp: "com.whatsapp",
  youtube: "com.google.android.youtube",
  settings: "com.android.settings",
  contacts: "com.android.contacts",
  phone: "com.android.dialer",
  messages: "com.google.android.apps.messaging",
};

export const phoneOpenAppSchema = z.object({
  app: z.string(),
});

export async function phoneOpenApp({
  app,
}: z.infer<typeof phoneOpenAppSchema>) {
  try {
    const appName = app.toLowerCase().trim();

    const packageName = appPackages[appName];

    if (!packageName) {
      return {
        content: [
          {
            type: "text" as const,
            text:
              `Unknown app: ${app}\n\n` +
              `Supported apps:\n` +
              Object.keys(appPackages).join(", "),
          },
        ],
        isError: true,
      };
    }

    const devices = await getDevices();

    if (devices.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No Android device is currently connected to ADB.",
          },
        ],
        isError: true,
      };
    }

    const device = devices[0];

    const { stdout, stderr } = await shell(device.serial, [
      "monkey",
      "-p",
      packageName,
      "1",
    ]);

    return {
      content: [
        {
          type: "text" as const,
          text:
            `Opened ${appName}\n` +
            `Device: ${device.serial}\n` +
            `Package: ${packageName}\n` +
            `${stdout || stderr}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Failed to open ${app}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    };
  }
}