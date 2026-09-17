import type { ResumeFont } from "@/types/extension";
import { resumeFontAsset } from "@/utils/resumeFontCatalog";

// All assets are local; only the chosen family is loaded and cached.
const fontData = new Map<string, string[]>();
const loading = new Map<string, Promise<void>>();

export function loadResumeFonts(font: ResumeFont): Promise<void> {
  const { family } = resumeFontAsset(font);
  const existing = loading.get(family);
  if (existing) return existing;
  const promise = Promise.all(["Regular", "Bold", "Italic"].map(async (weight) => {
      const response = await fetch(`fonts/${family}-${weight}.ttf`);
      if (!response.ok) throw new Error(`Could not load ${family}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 8192) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      }
      return btoa(binary);
    })).then((data) => { fontData.set(family, data); }).catch((error) => {
      loading.delete(family);
      throw error;
    });
  loading.set(family, promise);
  return promise;
}

export function getResumeFonts(font: ResumeFont): string[] {
  const data = fontData.get(resumeFontAsset(font).family);
  if (!data) throw new Error("Resume fonts must load before generating the PDF");
  return data;
}
