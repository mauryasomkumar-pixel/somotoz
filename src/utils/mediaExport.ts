/**
 * Media Export Utilities for Somotoz AI Suite
 * Supports SVG, High-Res PNG, WebM Canvas Video, and Storyboard scripts
 */

/**
 * Downloads SVG XML as a direct .svg file
 */
export function downloadSvgImage(svgData: string, promptTitle: string = 'artwork'): void {
  if (!svgData) return;
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanName = promptTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 25);
  a.download = `somotoz-vector-${cleanName || 'art'}-${Date.now()}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Rasterizes SVG to High-Resolution PNG via Canvas and triggers instant download
 */
export function downloadPngImage(svgData: string, promptTitle: string = 'artwork'): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!svgData) {
      reject(new Error('No SVG data provided'));
      return;
    }

    try {
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        const scale = 2; // 2x crisp retina resolution
        const width = (img.width || 600) * scale;
        const height = (img.height || 400) * scale;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Canvas context not available'));
          return;
        }

        // Fill background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        // Draw SVG image
        ctx.drawImage(img, 0, 0, width, height);

        // Watermark badge
        ctx.fillStyle = 'rgba(0, 255, 65, 0.85)';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('SOMOTOZ AI // VECTOR RENDER', 20, height - 20);

        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = pngUrl;
            const cleanName = promptTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 25);
            a.download = `somotoz-image-${cleanName || 'art'}-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(pngUrl);
            URL.revokeObjectURL(url);
            resolve();
          } else {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to generate PNG blob'));
          }
        }, 'image/png');
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG into image buffer'));
      };

      img.src = url;
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Downloads a screenshot of the active HTML5 canvas as a PNG frame
 */
export function downloadCanvasFrame(
  canvas: HTMLCanvasElement | null,
  promptTitle: string = 'scene-frame'
): void {
  if (!canvas) return;

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanName = promptTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 25);
    a.download = `somotoz-video-frame-${cleanName || 'frame'}-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

/**
 * Records live canvas stream using MediaRecorder API and downloads a real .webm video file
 */
export function recordAndDownloadCanvasVideo(
  canvas: HTMLCanvasElement | null,
  durationMs: number = 4000,
  promptTitle: string = 'video-scene',
  onProgress?: (progressPercent: number, statusText: string) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!canvas) {
      reject(new Error('No canvas element available to record'));
      return;
    }

    if (typeof MediaRecorder === 'undefined' || !(canvas as any).captureStream) {
      // Fallback to frame snapshot if MediaRecorder is not supported in the environment
      downloadCanvasFrame(canvas, promptTitle);
      if (onProgress) onProgress(100, 'Frame captured (Video codec unsupported in browser)');
      resolve();
      return;
    }

    try {
      const stream = (canvas as any).captureStream(30); // 30 FPS stream
      const mimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
      let selectedMime = 'video/webm';

      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 2500000,
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: selectedMime });
        const url = URL.createObjectURL(videoBlob);
        const a = document.createElement('a');
        a.href = url;
        const cleanName = promptTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 25);
        a.download = `somotoz-video-${cleanName || 'scene'}-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        if (onProgress) onProgress(100, 'Video downloaded successfully');
        resolve();
      };

      recorder.start(100);
      if (onProgress) onProgress(10, 'Recording video stream...');

      const startTime = Date.now();
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const percent = Math.min(95, Math.round((elapsed / durationMs) * 100));
        if (onProgress) onProgress(percent, `Recording video (${percent}%)...`);
      }, 250);

      setTimeout(() => {
        clearInterval(progressInterval);
        if (recorder.state === 'recording') {
          if (onProgress) onProgress(98, 'Packaging video container...');
          recorder.stop();
        }
      }, durationMs);
    } catch (err) {
      console.warn('MediaRecorder error, falling back to frame snapshot:', err);
      downloadCanvasFrame(canvas, promptTitle);
      resolve();
    }
  });
}

/**
 * Downloads video storyboard and keyframe schedule script
 */
export function downloadVideoStoryboard(
  frames: string[],
  promptTitle: string,
  duration?: string
): void {
  const storyboardContent = `=====================================================
SOMOTOZ AI SUITE // VIDEO MOTION STORYBOARD
=====================================================
Prompt: ${promptTitle}
Estimated Duration: ${duration || '0:12'}
Framerate: 60 FPS
Engine: Motion Canvas & Vector Synthesis
Developer: Som Maurya
Export Date: ${new Date().toISOString()}

KEYFRAME TIMELINE BREAKDOWN:
-----------------------------------------------------
${frames.map((f, i) => `[Scene 0${i + 1}] • ${(i * 2.5).toFixed(1)}s -> ${f}`).join('\n')}

=====================================================
Generated with Somotoz AI Suite
`;

  const blob = new Blob([storyboardContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `somotoz-storyboard-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
