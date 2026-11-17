/**
 * Uploaded assets become data URLs that ride inside the show record (a
 * jsonb column, no object storage configured) and inside every realtime
 * broadcast to the stage display. Keep them small: these caps are chosen
 * to stay well under a realtime channel's per-message size limit even
 * after base64 inflates the file by about a third.
 */
export const MAX_LOGO_BYTES = 300 * 1024;
export const MAX_BACKGROUND_BYTES = 600 * 1024;
export const MAX_FONT_BYTES = 300 * 1024;

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
