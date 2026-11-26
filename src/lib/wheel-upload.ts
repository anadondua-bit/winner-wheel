/**
 * Uploaded assets become data URLs that ride inside the show record (a
 * jsonb column, no object storage configured) and inside every realtime
 * broadcast to the stage display — every field combined, on every change.
 * Supabase Realtime caps a single broadcast message at 256 KB on the Free
 * plan and 3,000 KB on Pro+ (this project runs on Pro+, since the old
 * combined logo+background+font cap already exceeded 256 KB). These caps
 * keep base64-inflated (~1.33x) logo + background + font + roster/winners
 * comfortably under that 3,000 KB ceiling, with headroom to spare.
 */
export const MAX_LOGO_BYTES = 300 * 1024;
export const MAX_BACKGROUND_BYTES = 1200 * 1024;
export const MAX_FONT_BYTES = 300 * 1024;

/** Long edge a background is downscaled to before re-encoding, in pixels. */
const MAX_BACKGROUND_DIMENSION = 2560;

export const readFileAsDataUrl = (file: File, maxBytes: number): Promise<string> => {
  if (file.size > maxBytes) {
    return Promise.reject(
      new Error(`"${file.name}" is too large — keep it under ${Math.round(maxBytes / 1024)} KB.`),
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error(`Could not read "${file.name}"`));
    reader.readAsDataURL(file);
  });
};

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read "${file.name}" as an image`));
    };
    img.src = url;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the compressed image"));
    reader.readAsDataURL(blob);
  });

/**
 * Backgrounds over the cap are shrunk to fit instead of being rejected: a
 * big phone photo gets downscaled and re-encoded as JPEG, trying smaller
 * dimensions and quality until it lands under maxBytes. This only touches
 * the file that's actually oversized — a file already under the cap is
 * read as-is, format and quality untouched.
 */
export const readImageFileFitted = async (file: File, maxBytes: number): Promise<string> => {
  if (file.size <= maxBytes) return readFileAsDataUrl(file, maxBytes);

  const img = await loadImage(file);
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  if (!width || !height) throw new Error(`Could not read "${file.name}" as an image`);

  const longEdge = Math.max(width, height);
  if (longEdge > MAX_BACKGROUND_DIMENSION) {
    const scale = MAX_BACKGROUND_DIMENSION / longEdge;
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process that image");

  const qualitySteps = [0.85, 0.75, 0.65, 0.55, 0.45, 0.35];
  for (let attempt = 0; attempt < 10; attempt++) {
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    const quality = qualitySteps[Math.min(attempt, qualitySteps.length - 1)];
    const blob = await canvasToBlob(canvas, quality);
    if (blob && blob.size <= maxBytes) return blobToDataUrl(blob);
    width = Math.max(1, Math.round(width * 0.85));
    height = Math.max(1, Math.round(height * 0.85));
  }

  throw new Error(`"${file.name}" is too large to fit even after compression — try a smaller image.`);
};
