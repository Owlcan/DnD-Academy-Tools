const imageCache = new Map();

export const preloadImage = (url) => {
  if (!url) return Promise.resolve();
  if (imageCache.has(url)) {
    return imageCache.get(url);
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
};
