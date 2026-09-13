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

// ---------------- Recursive product tree helpers ----------------
// Brands & Products nodes can nest to any depth (category -> sub-category
// -> sub-sub-category -> ... -> product), so anything that needs to walk
// "every node" (collecting images for cleanup, counting leaves, etc.) has
// to recurse rather than assume a fixed 2-level shape.

type TreeNode = { id: string; name: string; image: string; children: TreeNode[] };

/** Every image URL in the tree, at every depth — used to clean up
 * uploaded files when a node (or the whole tree) is deleted. */
export function collectNodeImages(nodes: TreeNode[]): string[] {
  const out: string[] = [];
  const walk = (list: TreeNode[]) => {
    for (const n of list) {
      if (n.image) out.push(n.image);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

/** Total leaf-level products anywhere under these nodes (a leaf = a node
 * with no children). Used for dashboard counts. */
export function countLeafProducts(nodes: TreeNode[]): number {
  let count = 0;
  const walk = (list: TreeNode[]) => {
    for (const n of list) {
      if (!n.children || n.children.length === 0) count++;
      else walk(n.children);
    }
  };
  walk(nodes);
  return count;
}

/** Fixes up product-tree data saved by an older version of the app, where
 * a category's items lived in a flat `products` array instead of the
 * current recursive `children` array (and any node could be missing
 * `children`, or `image`, entirely). Every node here is guaranteed to come
 * out with a real `children` array and a non-empty `image`, however deep,
 * so the rest of the app never has to null-check `.children` before
 * reading `.length`/mapping over it, or worry about rendering an <img>
 * with an empty src. Safe to run on already-current data — it's a no-op
 * in that case. */
export function normalizeProductNodes(nodes: any[] | undefined | null): TreeNode[] {
  if (!Array.isArray(nodes)) return [];
  return nodes.map((n) => {
    // Legacy shape: { id, name, image, products: [...] } — products were
    // always leaves, so they just become children with no children of
    // their own.
    const rawChildren = Array.isArray(n?.children) ? n.children : Array.isArray(n?.products) ? n.products : [];
    const name = n?.name ?? "";
    return {
      id: n?.id ?? "",
      name,
      image: n?.image || placeholder((name || "??").slice(0, 2).toUpperCase()),
      children: normalizeProductNodes(rawChildren),
    };
  });
}