// import { execFile } from "node:child_process";
// import { promisify } from "node:util";

// const execFileAsync = promisify(execFile);

// export const ADB_PATH =
//   "C:\\Users\\ujjaw\\Desktop\\platform-tools-latest-windows\\platform-tools\\adb.exe";

// export async function adb(args: string[]) {
//   try {
//     const { stdout, stderr } = await execFileAsync(
//       ADB_PATH,
//       args,
//       {
//         windowsHide: true,
//       }
//     );

//     return {
//       stdout: stdout.trim(),
//       stderr: stderr.trim(),
//     };
//   } catch (error: any) {
//     throw new Error(
//       error?.stderr?.trim() ||
//       error?.message ||
//       "ADB command failed"
//     );
//   }
// }

// export async function getDevices() {
//   const { stdout } = await adb(["devices"]);

//   const lines = stdout
//     .split(/\r?\n/)
//     .slice(1)
//     .map((line) => line.trim())
//     .filter(Boolean);

//   return lines
//     .map((line) => {
//       const [serial, state] = line.split(/\s+/);

//       return {
//         serial,
//         state,
//       };
//     })
//     .filter((device) => device.serial && device.state === "device");
// }

// export async function shell(
//   serial: string,
//   command: string[]
// ) {
//   return adb([
//     "-s",
//     serial,
//     "shell",
//     ...command,
//   ]);
// } 



import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const ADB_PATH =
  "C:\\Users\\ujjaw\\Desktop\\platform-tools-latest-windows\\platform-tools\\adb.exe";

export async function adb(args: string[]) {
  try {
    const { stdout, stderr } = await execFileAsync(
      ADB_PATH,
      args,
      {
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    };
  } catch (error: any) {
    throw new Error(
      error?.stderr?.trim() ||
      error?.message ||
      "ADB command failed"
    );
  }
}

export async function getDevices() {
  const { stdout } = await adb(["devices"]);

  const lines = stdout
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .map((line) => {
      const [serial, state] = line.split(/\s+/);

      return {
        serial,
        state,
      };
    })
    .filter((device) => device.serial && device.state === "device");
}

export async function shell(
  serial: string,
  command: string[]
) {
  return adb([
    "-s",
    serial,
    "shell",
    ...command,
  ]);
}
