"use client";

import { useState } from "react";
import { useAppData } from "@/lib/DataContext";
import { TwoPane, Card, Btn, UploadBtn, Badge, inputCls, inputStyle, C } from "@/components/ui";
import { uid, placeholder, collectNodeImages } from "@/lib/helpers";
import { Plus, Trash2, ChevronDown, ChevronRight, FolderTree } from "lucide-react";
import { ProductNode } from "@/lib/types";
import { bulkDeleteUploads, getFileUrl } from "@/lib/api";
import { BulkImportExcel, BulkImportResult } from "@/components/BulkImportExcel";
import AdminHint from "@/components/AdminHint";

// Recursively walks a node's `children` array, replacing the child whose id
// matches `childId` with the result of `fn`. Used so any depth of nesting
// can be edited by just re-running this from the root down.
function replaceNode(nodes: ProductNode[], targetId: string, fn: (n: ProductNode) => ProductNode): ProductNode[] {
  return nodes.map((n) => {
    if (n.id === targetId) return fn(n);
    if (n.children.length) return { ...n, children: replaceNode(n.children, targetId, fn) };
    return n;
  });
}

// One row of the tree, plus (recursively) all of its descendants. This is
// what lets the admin nest as many levels as they want: Dairy -> Milk Added
// Drink -> Flavoured Milk -> Mango Milk -> ... each level is just another
// NodeEditor rendered inside its parent's "children" section.
function NodeEditor({
  node,
  depth,
  onUpdate,
  onDelete,
}: {
  node: ProductNode;
  depth: number;
  onUpdate: (updated: ProductNode) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const [childName, setChildName] = useState("");
  const [childImage, setChildImage] = useState<string | null>(null);

  const addChild = () => {
    if (!childName.trim()) return;
    const child: ProductNode = {
      id: uid(),
      name: childName.trim(),
      image: childImage || placeholder(childName.slice(0, 2).toUpperCase()),
      children: [],
    };
    onUpdate({ ...node, children: [...node.children, child] });
    setChildName("");
    setChildImage(null);
    setExpanded(true);
  };

  const updateChild = (childId: string, updated: ProductNode) =>
    onUpdate({ ...node, children: node.children.map((c) => (c.id === childId ? updated : c)) });

  const deleteChild = (childId: string) => {
    const child = node.children.find((c) => c.id === childId);
    onUpdate({ ...node, children: node.children.filter((c) => c.id !== childId) });
    if (child) {
      const imgs = collectNodeImages([child]).filter((u) => u.startsWith("/uploads/"));
      if (imgs.length) bulkDeleteUploads(imgs).catch(() => {});
    }
  };

  const isLeaf = node.children.length === 0;

  return (
    <div className="rounded-md" style={{ border: `1px solid ${C.border}`, backgroundColor: depth === 0 ? "#fff" : C.cream }}>
      <div className="flex items-center gap-2.5 p-2.5">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 w-5 h-5 flex items-center justify-center rounded"
          style={{ color: C.muted }}
          title={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={getFileUrl(node.image)} alt="" className="w-9 h-9 rounded object-cover shrink-0" style={{ border: `1px solid ${C.border}` }} />
        <input
          value={node.name}
          onChange={(e) => onUpdate({ ...node, name: e.target.value })}
          className={`${inputCls} flex-1 min-w-[120px]`}
          style={inputStyle}
        />
        <UploadBtn
          small
          usage="product"
          label="Image"
          onFiles={(f) => f[0] && onUpdate({ ...node, image: f[0].dataUrl })}
        />
        {isLeaf ? (
          <Badge>Product</Badge>
        ) : (
          <Badge tone="gold">
            {node.children.length} item{node.children.length === 1 ? "" : "s"}
          </Badge>
        )}
        <button onClick={onDelete} className="shrink-0 p-1" style={{ color: C.danger }} title="Delete">
          <Trash2 size={15} />
        </button>
      </div>

      {expanded && (
        <div className="pl-8 pr-2.5 pb-2.5 flex flex-col gap-2">
          {node.children.map((child) => (
            <NodeEditor
              key={child.id}
              node={child}
              depth={depth + 1}
              onUpdate={(updated) => updateChild(child.id, updated)}
              onDelete={() => deleteChild(child.id)}
            />
          ))}

          <div className="flex flex-wrap items-center gap-2 p-2 rounded" style={{ border: `1px dashed ${C.border}` }}>
            <UploadBtn small usage="product" label={childImage ? "Change image" : "Choose image"} onFiles={(f) => f[0] && setChildImage(f[0].dataUrl)} />
            {childImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getFileUrl(childImage)} className="w-7 h-7 rounded object-cover" alt="" />
            )}
            <input
              placeholder={`Add item under "${node.name}"...`}
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addChild()}
              className={`${inputCls} flex-1 min-w-[140px]`}
              style={inputStyle}
            />
            <Btn size="sm" onClick={addChild} disabled={!childName.trim()}>
              <Plus size={12} /> Add
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminBrandsProductsPage() {
  const { data, setData } = useAppData();
  const cats = data.brandsProducts.categories;
  const [activeId, setActiveId] = useState<string | null>(cats[0]?.id ?? null);
  const [newCat, setNewCat] = useState("");
  const [newCatImage, setNewCatImage] = useState<string | null>(null);
  const cat = cats.find((c) => c.id === activeId);

  const update = (fn: (cs: ProductNode[]) => ProductNode[]) =>
    setData((d) => ({ ...d, brandsProducts: { categories: fn(d.brandsProducts.categories) } }));

  const addRootCategory = () => {
    if (!newCat.trim()) return;
    const c: ProductNode = { id: uid(), name: newCat.trim(), image: newCatImage || placeholder(newCat.slice(0, 2).toUpperCase()), children: [] };
    update((cs) => [...cs, c]);
    setActiveId(c.id);
    setNewCat("");
    setNewCatImage(null);
  };

  const deleteRootCategory = (id: string) => {
    const target = cats.find((c) => c.id === id);
    update((cs) => cs.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
    if (target) {
      const imgs = collectNodeImages([target]).filter((u) => u.startsWith("/uploads/"));
      if (imgs.length) bulkDeleteUploads(imgs).catch(() => {});
    }
  };

  // Bulk import stays 2-level (Category -> Product) since that maps
  // naturally onto spreadsheet rows — for deeper nesting, use the tree
  // editor below. Imported products land as leaf nodes under a matching
  // (or newly created) root category.
  const handleBulkImportProducts = (rows: Record<string, string>[]): BulkImportResult => {
    let added = 0;
    let skipped = 0;
    const categories = cats.map((c) => ({ ...c, children: [...c.children] }));

    for (const row of rows) {
      const categoryName = (row.category || "").trim();
      const productName = (row.productName || "").trim();
      const imageUrl = (row.imageUrl || "").trim();
      if (!categoryName || !productName) {
        skipped++;
        continue;
      }
      let idx = categories.findIndex((c) => c.name.toLowerCase() === categoryName.toLowerCase());
      if (idx === -1) {
        categories.push({ id: uid(), name: categoryName, image: placeholder(categoryName.slice(0, 2).toUpperCase()), children: [] });
        idx = categories.length - 1;
      }
      categories[idx].children.push({
        id: uid(),
        name: productName,
        image: imageUrl || placeholder(productName.slice(0, 2).toUpperCase()),
        children: [],
      });
      added++;
    }

    setData((d) => ({ ...d, brandsProducts: { categories } }));
    return { added, skipped, note: added > 0 ? "New categories were created automatically if they didn't already exist." : undefined };
  };

  return (
    <div className="flex flex-col gap-5">
      <AdminHint>
        <div className="flex items-center gap-1.5 mb-1 font-semibold" style={{ color: C.primary }}>
          <FolderTree size={14} /> Nest as many levels as you need
        </div>
        Pick a category on the left, then use <strong>"Add item under..."</strong> to build the tree —
        e.g. Dairy → Milk Added Drink → Mango Milk Drink. A row you add there can itself have more
        rows added under it, with no limit on how deep you go. A row with nothing under it is shown
        as a plain product on the site; a row with items under it is browsable, like a folder.
      </AdminHint>

      <BulkImportExcel
        title="Bulk Add Products (Excel)"
        templateFilename="agro-organica-products-template.xlsx"
        instructions={
          <>
            Columns: <strong>Category</strong> (existing or new — new ones are created automatically),{" "}
            <strong>Product Name</strong>, and <strong>Image URL</strong> (upload the photo in{" "}
            <a href="/admin/image-library" className="underline" style={{ color: C.primary }}>
              Image Library
            </a>{" "}
            first and paste the URL it gives you here — leave blank to use a placeholder). This
            creates a 2-level Category → Product tree; use the editor below for deeper nesting.
          </>
        }
        columns={[
          { key: "category", label: "Category", example: "Rice" },
          { key: "productName", label: "Product Name", example: "Basmati" },
          { key: "imageUrl", label: "Image URL", example: "/uploads/products/xxxxx.jpg" },
        ]}
        onImport={handleBulkImportProducts}
      />

      <TwoPane
        left={
          <>
            {cats.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className="text-left px-3 py-2 rounded-md text-sm"
                style={{ backgroundColor: activeId === c.id ? C.primaryTint : "#fff", border: `1px solid ${C.border}`, color: C.text }}
              >
                {c.name} <span style={{ color: C.muted }}>({c.children.length})</span>
              </button>
            ))}
            <Card className="p-3 mt-2">
              <div className="text-xs font-semibold mb-2" style={{ color: C.muted }}>
                Add root category
              </div>
              <input
                placeholder="Category name"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                className={`${inputCls} mb-2`}
                style={inputStyle}
              />
              <div className="flex items-center gap-2">
                <UploadBtn small usage="product" label={newCatImage ? "Change image" : "Choose image"} onFiles={(f) => f[0] && setNewCatImage(f[0].dataUrl)} />
                {newCatImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getFileUrl(newCatImage)} className="w-8 h-8 rounded object-cover" alt="" />
                )}
              </div>
              <div className="mt-2">
                <Btn size="sm" onClick={addRootCategory} disabled={!newCat.trim()}>
                  <Plus size={14} /> Add category
                </Btn>
              </div>
            </Card>
          </>
        }
        right={
          !cat ? (
            <p className="text-sm" style={{ color: C.muted }}>
              Select or add a category.
            </p>
          ) : (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-xl" style={{ color: C.primary }}>
                  {cat.name}
                </h3>
                <button
                  onClick={() => deleteRootCategory(cat.id)}
                  className="text-xs flex items-center gap-1"
                  style={{ color: C.danger }}
                >
                  <Trash2 size={14} /> Delete category
                </button>
              </div>
              <NodeEditor
                node={cat}
                depth={0}
                onUpdate={(updated) => update((cs) => replaceNode(cs, cat.id, () => updated))}
                onDelete={() => deleteRootCategory(cat.id)}
              />
            </Card>
          )
        }
      />
    </div>
  );
}