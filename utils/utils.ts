
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.src = src;
  });
}

export function calculateFit(containerW: number, containerH: number, w: number, h: number) {
  const fitW = Math.min(containerW, containerH / h * w);
  const fitH = fitW / w * h;
  return {
    fitW,
    fitH
  }
}
