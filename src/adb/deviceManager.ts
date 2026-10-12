import { getDevices, shell } from "./adbClient.js";

export interface ManagedDevice {
  serial: string;
  state: string;
  brand: string;
  model: string;
  androidVersion: string;
  sdkVersion: string;
  connection: "usb" | "wifi";
}

async function getProperty(serial: string, property: string): Promise<string> {
  try {
    const { stdout } = await shell(serial, ["getprop", property]);
    return stdout.trim() || "Unknown";
  } catch {
    return "Unknown";
  }
}

function getConnectionType(serial: string): "usb" | "wifi" {
  if (serial.includes(":") || serial.includes(".")) {
    return "wifi";
  }
  return "usb";
}

export async function scanDevices(): Promise<ManagedDevice[]> {
  const devices = await getDevices();
  const managedDevices: ManagedDevice[] = [];

  for (const device of devices) {
    const brand = await getProperty(device.serial, "ro.product.brand");
    const model = await getProperty(device.serial, "ro.product.model");
    const androidVersion = await getProperty(device.serial, "ro.build.version.release");
    const sdkVersion = await getProperty(device.serial, "ro.build.version.sdk");

    managedDevices.push({
      serial: device.serial,
      state: device.state,
      brand,
      model,
      androidVersion,
      sdkVersion,
      connection: getConnectionType(device.serial),
    });
  }

  return managedDevices;
}

export async function getActiveDevice(): Promise<ManagedDevice> {
  const devices = await scanDevices();

  if (devices.length === 0) {
    throw new Error("No Android device is currently connected to ADB.");
  }

  return devices[0];
}