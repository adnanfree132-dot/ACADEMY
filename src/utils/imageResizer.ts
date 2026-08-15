// Canvas Image Compressor & Resizer Utility with PNG Alpha Transparency Support

export function compressAndResizeImage(
  file: File, 
  maxWidth = 300, 
  maxHeight = 300, 
  quality = 0.85,
  preservePNG = false
): Promise<string> {
  return new Promise((resolve, reject) => {
    const isPNG = file.type === 'image/png' || preservePNG;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // Target canvas dimensions
        canvas.width = maxWidth;
        canvas.height = maxHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Fill background with white if converting to JPEG to prevent black alpha fill
        if (!isPNG) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, maxWidth, maxHeight);
        } else {
          ctx.clearRect(0, 0, maxWidth, maxHeight);
        }

        // Perform smart center-crop and aspect ratio cover scaling
        const imgAspect = img.width / img.height;
        const targetAspect = maxWidth / maxHeight;
        let renderableWidth, renderableHeight, xStart, yStart;

        if (imgAspect < targetAspect) {
          renderableWidth = img.width;
          renderableHeight = img.width / targetAspect;
          xStart = 0;
          yStart = Math.max(0, (img.height - renderableHeight) * 0.2); // Align top-center for faces
        } else {
          renderableHeight = img.height;
          renderableWidth = img.height * targetAspect;
          xStart = (img.width - renderableWidth) / 2;
          yStart = 0;
        }

        ctx.drawImage(
          img, 
          xStart, yStart, renderableWidth, renderableHeight, 
          0, 0, maxWidth, maxHeight
        );

        // Preserve PNG format if image is PNG, else use JPEG
        const mimeType = isPNG ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export const resizeImage = compressAndResizeImage;
