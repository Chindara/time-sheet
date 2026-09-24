/**
 * Keeps the extension's Tailwind `dark` class in sync with the Azure DevOps
 * host's active theme, classifying it by the luminance of the host's applied
 * background color rather than matching theme names (host theme names are
 * not part of the SDK's public contract and have changed over time).
 */

const DARK_CLASS = "dark";
// A background is treated as "dark" below this relative luminance (WCAG
// relative luminance, 0 = black, 1 = white).
const LUMINANCE_THRESHOLD = 0.5;

function toRgb(color: string): [number, number, number] | null {
  if (!color) {
    return null;
  }
  const probe = document.createElement("span");
  probe.style.color = color;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  document.body.removeChild(probe);

  const channels = resolved.match(/[\d.]+/g);
  if (!channels || channels.length < 3) {
    return null;
  }
  return [Number(channels[0]), Number(channels[1]), Number(channels[2])];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const linearize = (channel: number) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
  );
}

function hostBackgroundColor(themeData?: { [varName: string]: string }): string {
  const fromEvent = themeData?.["background-color"];
  if (fromEvent) {
    return fromEvent;
  }
  // The SDK writes theme variables into a `<style>` tag on `:root` as part of
  // its init handshake, before this module ever gets a chance to attach a
  // "themeApplied" listener. Reading the already-applied variable back off
  // `:root` covers that initial load without racing the event.
  return getComputedStyle(document.documentElement)
    .getPropertyValue("--background-color")
    .trim();
}

function syncDarkClass(themeData?: { [varName: string]: string }): void {
  const rgb = toRgb(hostBackgroundColor(themeData));
  const isDark = rgb !== null && relativeLuminance(rgb) < LUMINANCE_THRESHOLD;
  document.documentElement.classList.toggle(DARK_CLASS, isDark);
}

/**
 * Subscribes to the Azure DevOps SDK's theme events and keeps `dark` on
 * `document.documentElement` matching the host's current theme, including
 * live theme changes. Call once per entry point, after `await SDK.ready()`.
 */
export function watchHostTheme(): void {
  syncDarkClass();
  window.addEventListener("themeApplied", (event) => {
    syncDarkClass((event as CustomEvent<{ [varName: string]: string }>).detail);
  });
}
