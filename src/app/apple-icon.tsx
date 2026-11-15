import { appIcon } from "@/lib/app-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iPhone/iPad home-screen icon (iOS adds its own rounded corners). */
export default function AppleIcon() {
  return appIcon(180, { padding: 0.12, rounded: false });
}
