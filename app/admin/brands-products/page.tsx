"use client";

import { useState } from "react";
import { useAppData } from "@/lib/DataContext";
import { TwoPane, Card, Btn, UploadBtn, inputCls, inputStyle, C } from "@/components/ui";
import { uid, placeholder } from "@/lib/helpers";
import { Plus, Trash2 } from "lucide-react";
import { Category } from "@/lib/types";
import { bulkDeleteUploads } from "@/lib/api";
import { BulkImportExcel, BulkImportResult } from "@/components/BulkImportExcel";
import AdminHint from "@/components/AdminHint";

export default function AdminBrandsPage() {
  const { data, setData } = useAppData();
  const cats = data.brandsProducts.categories;
  const [activeId, setActiveId] = useState<string | null>(cats[0]?.id ?? null);
  const [newCat, setNewCat] = useState("");
  const [pName, setPName] = useState("");
  const [pImage, setPImage] = useState<string | null>(null);
  const cat = cats.find((c) => c.id === activeId);

  const update = (fn: (cs: Category[]) => Category[]) => setData((d) => ({ ...d, brandsProducts: { categories: fn(d.brandsProducts.categories) } }));

  const addCat = () => {
    if (!newCat.trim()) return;
    const c: Category = { id: uid(), name: newCat.trim(), products: [] };
    update((cs) => [...cs, c]);
    setActiveId(c.id);
    setNewCat("");
  };
  const deleteCat = (id: string) => {
    update((cs) => cs.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  };
  const addProduct = () => {
    if (!pName.trim() || !pImage || !cat) return;
    update((cs) => cs.map((c) => (c.id === cat.id ? { ...c, products: [...c.products, { id: uid(), name: pName, image: pImage }] } : c)));
    setPName("");
    setPImage(null);
  };
  const deleteProduct = (id: string) => {
    if (!cat) return;
    const removed = cat.products.find((p) => p.id === id);
    update((cs) => cs.map((c) => (c.id === cat.id ? { ...c, products: c.products.filter((p) => p.id !== id) } : c)));
    if (removed?.image?.startsWith("/uploads/")) bulkDeleteUploads([removed.image]).catch(() => {});
  };

  // Bulk import: reads Category / Product Name / Image URL rows and either
  // drops each product into a matching existing category (by name, not
  // case-sensitive) or creates the category on the fly.
  const handleBulkImportProducts = (rows: Record<string, string>[]): BulkImportResult => {
    let added = 0;
    let skipped = 0;
    const categories = cats.map((c) => ({ ...c, products: [...c.products] }));

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
        categories.push({ id: uid(), name: categoryName, products: [] });
        idx = categories.length - 1;
      }
      categories[idx].products.push({
        id: uid(),
        name: productName,
        image: imageUrl || placeholder(productName.slice(0, 2).toUpperCase()),
      });
      added++;
    }

    setData((d) => ({ ...d, brandsProducts: { categories } }));
    return { added, skipped, note: added > 0 ? "New categories were created automatically if they didn't already exist." : undefined };
  };

  return (
    <div className="flex flex-col gap-5">
      <AdminHint>
        Add products one at a time on the right, or use <strong>Bulk Add Products</strong> below to
        add many at once from an Excel sheet. For the Image URL column: go to{" "}
        <a href="/admin/image-library" className="underline" style={{ color: C.primary }}>
          Image Library
        </a>{" "}
        first, upload your product photos there, copy each URL, then paste it into the sheet.
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
            first and paste the URL it gives you here — leave blank to use a placeholder).
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
                {c.name} <span style={{ color: C.muted }}>({c.products.length})</span>
              </button>
            ))}
            <Card className="p-3 mt-2">
              <div className="text-xs font-semibold mb-2" style={{ color: C.muted }}>
                Add category
              </div>
              <input placeholder="Category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} className={`${inputCls} mb-2`} style={inputStyle} />
              <Btn size="sm" onClick={addCat}>
                <Plus size={14} /> Add category
              </Btn>
            </Card>
          </>
        }
        right={
          !cat ? (
            <p className="text-sm" style={{ color: C.muted }}>
              Select or add a category.
            </p>
          ) : (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-xl" style={{ color: C.primary }}>
                  {cat.name}
                </h3>
                <button onClick={() => deleteCat(cat.id)} className="text-xs flex items-center gap-1" style={{ color: C.danger }}>
                  <Trash2 size={14} /> Delete category
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
                {cat.products.map((p) => (
                  <div key={p.id} className="rounded-lg overflow-hidden relative" style={{ border: `1px solid ${C.border}` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} className="w-full aspect-square object-cover" alt="" />
                    <div className="p-2 text-xs font-semibold truncate" style={{ color: C.text }}>
                      {p.name}
                    </div>
                    <button
                      onClick={() => deleteProduct(p.id)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "rgba(179,70,44,0.9)" }}
                    >
                      <Trash2 size={12} color="#fff" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-md" style={{ backgroundColor: C.cream, border: `1px dashed ${C.border}` }}>
                <div className="text-xs font-semibold mb-3" style={{ color: C.muted }}>
                  Add product
                </div>
                <input placeholder="Product name" value={pName} onChange={(e) => setPName(e.target.value)} className={`${inputCls} mb-3`} style={inputStyle} />
                <div className="flex items-center gap-3">
                  <UploadBtn small usage="product" label={pImage ? "Change image" : "Upload image"} onFiles={(f) => setPImage(f[0]?.dataUrl)} />
                  {pImage && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={pImage} className="w-9 h-9 rounded object-cover" alt="" />
                  )}
                  <Btn size="sm" onClick={addProduct}>
                    <Plus size={14} /> Add
                  </Btn>
                </div>
              </div>
            </Card>
          )
        }
      />
    </div>
  );
}
