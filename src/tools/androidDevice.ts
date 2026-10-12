// import * as z from "zod/v4";
// import { getDevices, shell } from "../adb/adbClient.js";

// export const androidDeviceSchema = z.object({
//   command: z.enum([
//     "phone_get_contacts",
//     "phone_get_photos",
//     "phone_list_apps",
//     "phone_list_files",
//     "phone_download_file",
//     "phone_open_app",
//     "whatsapp_open",
//     "whatsapp_find_chat",
//     "whatsapp_read_visible_messages",
//     "whatsapp_send_message"
//   ]),
//   value: z.string().optional()
// });

// export async function androidDevice({
//   command,
//   value
// }: z.infer<typeof androidDeviceSchema>) {
//   try {
//     const devices = await getDevices();

//     if (devices.length === 0) {
//       return {
//         content: [
//           {
//             type: "text" as const,
//             text: "No Android device is currently connected."
//           }
//         ],
//         isError: true
//       };
//     }

//     const device = devices[0];

//     switch (command) {
//       case "phone_get_contacts":
//         return {
//           content: [
//             {
//               type: "text" as const,
//               text:
//                 "phone_get_contacts selected.\n" +
//                 `Device: ${device.serial}\n\n` +
//                 "Contacts gateway will be connected here."
//             }
//           ]
//         };

//       case "phone_get_photos":
//         return {
//           content: [
//             {
//               type: "text" as const,
//               text:
//                 "phone_get_photos selected.\n" +
//                 `Device: ${device.serial}\n\n` +
//                 "Photos gateway will be connected here."
//             }
//           ]
//         };

//       case "phone_list_apps": {
//         const { stdout } = await shell(device.serial, [
//           "pm",
//           "list",
//           "packages"
//         ]);

//         return {
//           content: [
//             {
//               type: "text" as const,
//               text:
//                 `Device: ${device.serial}\n\n` +
//                 stdout
//             }
//           ]
//         };
//       }

//       case "phone_list_files": {
//         const { stdout } = await shell(device.serial, [
//           "ls",
//           "-la",
//           "/sdcard/"
//         ]);

//         return {
//           content: [
//             {
//               type: "text" as const,
//               text:
//                 `Device: ${device.serial}\n\n` +
//                 stdout
//             }
//           ]
//         };
//       }

//       case "phone_download_file":
//         return {
//           content: [
//             {
//               type: "text" as const,
//               text:
//                 `phone_download_file selected.\n` +
//                 `Requested file: ${value ?? "No file specified"}\n\n` +
//                 "File download gateway will be connected here."
//             }
//           ]
//         };

//       case "phone_open_app":
//         return {
//           content: [
//             {
//               type: "text" as const,
//               text:
//                 `phone_open_app selected.\n` +
//                 `Application: ${value ?? "No application specified"}`
//             }
//           ]
//         };

//       case "whatsapp_open":
//         return {
//           content: [
//             {
//               type: "text" as const,
//               text:
//                 "whatsapp_open selected.\n" +
//                 "WhatsApp UI controller will be connected here."
//             }
//           ]
//         };

//       case "whatsapp_find_chat":
//         return {
//           content: [
//             {
//               type: "text" as const,
//               text:
//                 `whatsapp_find_chat selected.\n` +
//                 `Chat: ${value ?? "No chat specified"}`
//             }
//           ]
//         };

//       case "whatsapp_read_visible_messages":
//         return {
//           content: [
//             {
//               type: "text" as const,
//               text:
//                 "whatsapp_read_visible_messages selected.\n" +
//                 "WhatsApp UI controller will be connected here."
//             }
//           ]
//         };

//       case "whatsapp_send_message":
//         return {
//           content: [
//             {
//               type: "text" as const,
//               text:
//                 `whatsapp_send_message selected.\n` +
//                 `Message: ${value ?? "No message specified"}`
//             }
//           ]
//         };
//     }
//   } catch (error) {
//     return {
//       content: [
//         {
//           type: "text" as const,
//           text:
//             `Android device command failed: ${
//               error instanceof Error
//                 ? error.message
//                 : String(error)
//             }`
//         }
//       ],
//       isError: true
//     };
//   }
// }

import * as z from "zod/v4";
import { getDevices, shell } from "../adb/adbClient.js";

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
          "content",
          "query",
          "--uri",
          "content://media/external/images/media",
          "--projection",
          "_id:_display_name:mime_type:size:date_added",
          "--sort",
          "date_added DESC"
        ]);

        return {
          content: [
            {
              type: "text" as const,
              text:
                `Device: ${device.serial}\n\n` +
                `Photos:\n${stdout || "No photos found."}`
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

      case "phone_download_file":
        return {
          content: [
            {
              type: "text" as const,
              text:
                `phone_download_file selected.\n` +
                `Requested file: ${value ?? "No file specified"}\n\n` +
                "File download gateway will be connected here."
            }
          ]
        };

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