let counter = 1;
export const uid = () => `id${counter++}_${Math.random().toString(36).slice(2, 7)}`;

export function placeholder(label: string, bg = "#3f6b52", fg = "#ffffff") {
  const initials = label.slice(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="53%" font-family="Georgia, serif" font-size="170" fill="${fg}" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function mediaTypeFromDataUrl(dataUrl: string): "image" | "video" {
  if (dataUrl.startsWith("data:video")) return "video";
  if (/\.(mp4|webm|mov)(\?.*)?$/i.test(dataUrl)) return "video";
  return "image";
}

export const readFileAsDataUrl = (file: File): Promise<{ name: string; dataUrl: string }> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, dataUrl: reader.result as string });
    reader.readAsDataURL(file);
  });
