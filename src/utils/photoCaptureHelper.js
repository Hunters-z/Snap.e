import gifshot from 'gifshot';

/**
 * Draws an image or video onto a canvas context using object-fit: cover,
 * completely preventing distortion or aspect ratio stretching.
 */
export function drawCover(ctx, source, destX, destY, destW, destH, mirror = false) {
  if (!source) return;

  const sWidth = source.videoWidth || source.naturalWidth || source.width || destW;
  const sHeight = source.videoHeight || source.naturalHeight || source.height || destH;
  if (!sWidth || !sHeight) return;

  const targetRatio = destW / destH;
  const sourceRatio = sWidth / sHeight;

  let cropW, cropH, cropX, cropY;

  if (sourceRatio > targetRatio) {
    // Source is wider than target box: crop horizontally (left/right)
    cropH = sHeight;
    cropW = sHeight * targetRatio;
    cropX = (sWidth - cropW) / 2;
    cropY = 0;
  } else {
    // Source is taller than target box: crop vertically (top/bottom)
    cropW = sWidth;
    cropH = sWidth / targetRatio;
    cropX = 0;
    cropY = (sHeight - cropH) / 2;
  }

  ctx.save();
  if (mirror) {
    ctx.translate(destX + destW, destY);
    ctx.scale(-1, 1);
    ctx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, destW, destH);
  } else {
    ctx.drawImage(source, cropX, cropY, cropW, cropH, destX, destY, destW, destH);
  }
  ctx.restore();
}

/**
 * Format seconds into mm:ss
 */
export function formatSessionTime(seconds) {
  if (seconds == null || isNaN(seconds) || seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Generates an animated GIF data URL from an array of image data URLs using gifshot.
 */
export function generateGifFromFrames(images, width = 360, height = 270, interval = 0.12) {
  return new Promise((resolve) => {
    if (!images || images.length === 0) {
      resolve(null);
      return;
    }

    try {
      gifshot.createGIF({
        images,
        gifWidth: width,
        gifHeight: height,
        interval,
        numFrames: images.length,
        frameDuration: 1,
        sampleInterval: 10,
        numWorkers: 2
      }, (obj) => {
        if (!obj.error && obj.image) {
          resolve(obj.image);
        } else {
          console.warn('GIF generation error:', obj.error);
          resolve(null);
        }
      });
    } catch (e) {
      console.warn('gifshot exception:', e);
      resolve(null);
    }
  });
}

/**
 * Records a short live video clip (1.5 - 2s) from a MediaStream or Canvas.
 */
export function recordLiveVideoClip(stream, durationMs = 1800) {
  return new Promise((resolve) => {
    if (!stream || typeof MediaRecorder === 'undefined') {
      resolve(null);
      return;
    }

    try {
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4'
      ];
      let selectedMime = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';

      const recorder = selectedMime ? new MediaRecorder(stream, { mimeType: selectedMime }) : new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        try {
          const blob = new Blob(chunks, { type: selectedMime || 'video/webm' });
          const url = URL.createObjectURL(blob);
          resolve(url);
        } catch {
          resolve(null);
        }
      };

      recorder.onerror = () => resolve(null);

      recorder.start();
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, durationMs);
    } catch (err) {
      console.warn('Could not record live video clip:', err);
      resolve(null);
    }
  });
}
