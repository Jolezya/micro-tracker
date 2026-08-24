// Read a device image file into a resized data URL, so real seller photos can be
// added from the browser without bloating localStorage / the bundle.
// Downscales to maxDim and re-encodes JPEG; falls back to the original on error.
export function readAndResize(file, { maxDim = 1400, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('not-an-image'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read-failed'));
    reader.onload = () => {
      const dataUrl = reader.result;
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          const scale = Math.min(1, maxDim / Math.max(width, height || 1));
          width = Math.max(1, Math.round(width * scale));
          height = Math.max(1, Math.round(height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch {
          resolve(dataUrl); // canvas unavailable/tainted → keep original
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export async function readManyImages(fileList, limit = Infinity) {
  const files = Array.from(fileList || []).filter((f) => f.type?.startsWith('image/')).slice(0, limit);
  const out = [];
  for (const f of files) {
    try {
      out.push(await readAndResize(f));
    } catch {
      /* skip unreadable file */
    }
  }
  return out;
}
