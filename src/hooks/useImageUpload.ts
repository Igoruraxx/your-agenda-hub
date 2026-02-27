import { useState, useCallback, useEffect } from 'react';

const MAX_SIZE_MB = 20;
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;

async function compressToJpeg(file: File, maxDimension = MAX_DIMENSION, quality = JPEG_QUALITY): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas não suportado')); return; }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Falha ao comprimir imagem')); return; }
          const compressed = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, '') + '.jpg',
            { type: 'image/jpeg', lastModified: Date.now() }
          );
          resolve(compressed);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Erro ao carregar imagem'));
    };

    img.src = objectUrl;
  });
}

export function useImageUpload() {
  const [file, setFileState] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [compressing, setCompressing] = useState(false);

  const setFile = useCallback((newFile: File | undefined | null) => {
    setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return ''; });
    setError('');

    if (!newFile) { setFileState(null); return; }

    if (newFile.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Arquivo muito grande. Máximo ${MAX_SIZE_MB}MB.`);
      setFileState(null);
      return;
    }

    setCompressing(true);

    compressToJpeg(newFile)
      .then(compressed => {
        const url = URL.createObjectURL(compressed);
        setFileState(compressed);
        setPreviewUrl(url);
      })
      .catch(() => {
        const url = URL.createObjectURL(newFile);
        setFileState(newFile);
        setPreviewUrl(url);
      })
      .finally(() => setCompressing(false));
  }, []);

  const clear = useCallback(() => {
    setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return ''; });
    setFileState(null);
    setError('');
    setCompressing(false);
  }, []);

  useEffect(() => {
    return () => {
      setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return prev; });
    };
  }, []);

  return { file, previewUrl, error, compressing, setFile, clear };
}
