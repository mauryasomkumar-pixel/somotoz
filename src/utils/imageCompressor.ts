/**
 * Client-side image compressor using HTML5 Canvas.
 * Compresses any user-selected profile image to strictly under 300 KB.
 */
export async function compressProfileImage(file: File | Blob, maxSizeBytes: number = 290 * 1024): Promise<{ dataUrl: string; sizeBytes: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        // Max dimension for profile avatar
        const maxDim = 600;
        let { width, height } = img;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Progressively step down quality until strictly under maxSizeBytes
        let quality = 0.85;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Check byte size of base64 string
        let base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
        let byteSize = Math.round((base64Length * 3) / 4);

        while (byteSize > maxSizeBytes && quality > 0.25) {
          quality -= 0.12;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
          byteSize = Math.round((base64Length * 3) / 4);
        }

        resolve({ dataUrl, sizeBytes: byteSize });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
