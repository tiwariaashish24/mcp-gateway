import * as z from "zod/v4";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { getDevices, shell, adb } from "../adb/adbClient.js";

export const androidDeviceSchema = z.object({
  command: z.enum([
    "phone_get_contacts",
    "phone_get_photos",
    "phone_list_apps",
    "phone_list_files",
    "phone_download_file",
    "phone_open_app",
    "whatsapp_open",
    "whatsapp_find_chat",
    "whatsapp_read_visible_messages",
    "whatsapp_send_message"
  ]),
  value: z.string().optional()
});

export async function androidDevice({
  command,
  value
}: z.infer<typeof androidDeviceSchema>) {
  try {
    const devices = await getDevices();

    if (devices.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No Android device is currently connected."
          }
        ],
        isError: true
      };
    }

    const device = devices[0];

    switch (command) {

      case "phone_get_contacts":
        return {
          content: [
            {
              type: "text" as const,
              text:
                "phone_get_contacts selected.\n" +
                `Device: ${device.serial}\n\n` +
                "Contacts gateway will be connected here."
            }
          ]
        };

 
        case "phone_get_photos": {
          const { stdout } = await shell(device.serial, [
            "find",
            "/sdcard/DCIM/Camera",
            "-maxdepth",
            "1",
            "-type",
            "f"
          ]);
          const files = stdout
            .split(/\r?\n/)
            .map((file) => file.trim())
            .filter((file) => /\.(jpg|jpeg|png|webp|heic|mp4|mov)$/i.test(file));
          return {
            content: [
              {
                type: "text" as const,
                text:
                  `Device: ${device.serial}\n` +
                  `Total photos and videos: ${files.length}\n\n` +
                  (files.length > 0 ? files.join("\n") : "No photos or videos found.")
              }
            ]
          };
        }
  

      case "phone_list_apps": {
        const { stdout } = await shell(device.serial, [
          "pm",
          "list",
          "packages"
        ]);

        return {
          content: [
            {
              type: "text" as const,
              text:
                `Device: ${device.serial}\n\n` +
                stdout
            }
          ]
        };
      }

      case "phone_list_files": {
        const { stdout } = await shell(device.serial, [
          "ls",
          "-la",
          "/sdcard/"
        ]);

        return {
          content: [
            {
              type: "text" as const,
              text:
                `Device: ${device.serial}\n\n` +
                stdout
            }
          ]
        };
      }

      case "phone_download_file": {
        if (!value?.trim()) {
          return {
            content: [{ type: "text" as const, text: "Provide the full phone file path in value." }],
            isError: true
          };
        }
        const remotePath = path.posix.normalize(value.trim());
        const allowedRoots = ["/sdcard/DCIM/", "/sdcard/Pictures/", "/sdcard/Download/"];
        if (!allowedRoots.some((root) => remotePath.startsWith(root)) || remotePath.includes("..")) {
          return {
            content: [{ type: "text" as const, text: "File path must be inside DCIM, Pictures, or Download." }],
            isError: true
          };
        }
        const fileName = path.posix.basename(remotePath);
        if (!fileName || fileName === "." || fileName === "/") {
          return {
            content: [{ type: "text" as const, text: "Invalid file path." }],
            isError: true
          };
        }
        const downloadsDir = path.resolve(process.cwd(), "downloads");
        await mkdir(downloadsDir, { recursive: true });
        const localPath = path.join(downloadsDir, fileName);
        await adb(["-s", device.serial, "pull", remotePath, localPath]);
        return {
          content: [{
            type: "text" as const,
            text: `Download successful.\nDevice: ${device.serial}\nSource: ${remotePath}\nSaved to: ${localPath}`
          }]
        };
      }


      case "phone_open_app":
        return {
          content: [
            {
              type: "text" as const,
              text:
                `phone_open_app selected.\n` +
                `Application: ${value ?? "No application specified"}`
            }
          ]
        };

      case "whatsapp_open":
        return {
          content: [
            {
              type: "text" as const,
              text:
                "whatsapp_open selected.\n" +
                "WhatsApp UI controller will be connected here."
            }
          ]
        };

      case "whatsapp_find_chat":
        return {
          content: [
            {
              type: "text" as const,
              text:
                `whatsapp_find_chat selected.\n` +
                `Chat: ${value ?? "No chat specified"}`
            }
          ]
        };

      case "whatsapp_read_visible_messages":
        return {
          content: [
            {
              type: "text" as const,
              text:
                "whatsapp_read_visible_messages selected.\n" +
                "WhatsApp UI controller will be connected here."
            }
          ]
        };

      case "whatsapp_send_message":
        return {
          content: [
            {
              type: "text" as const,
              text:
                `whatsapp_send_message selected.\n` +
                `Message: ${value ?? "No message specified"}`
            }
          ]
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text:
            `Android device command failed: ${
              error instanceof Error
                ? error.message
                : String(error)
            }`
        }
      ],
      isError: true
    };
  }
}