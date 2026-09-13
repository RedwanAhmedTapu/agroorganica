"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppData } from "@/lib/DataContext";
import { SecondaryNav } from "@/components/SecondaryNav";
import { C } from "@/components/ui";
import { getFileUrl } from "@/lib/api";
import { ProductNode } from "@/lib/types";
import { Folder, ChevronRight } from "lucide-react";

function findNode(node: ProductNode | undefined, path: string[]): ProductNode | undefined {
  let cur = node;
  for (const id of path) {
    cur = cur?.children.find((c) => c.id === id);
    if (!cur) break;
  }
  return cur;
}

export default function BrandsProductsPage() {
  return (
    <Suspense fallback={null}>
      <BrandsProductsContent />
    </Suspense>
  );
}

function BrandsProductsContent() {
  const { data } = useAppData();
  const cats = data.brandsProducts.categories;
  const searchParams = useSearchParams();
  const requestedCat = searchParams.get("cat");
  const [rootId, setRootId] = useState<string | undefined>(requestedCat || cats[0]?.id);
  // Ids of nodes drilled into below the selected root — this is what makes
  // browsing work no matter how many levels deep a category goes.
  const [drillPath, setDrillPath] = useState<string[]>([]);

  // Keep in sync with the navbar dropdown — picking a root category there
  // links to /brands-products?cat=<id> and should land on it, reset to top.
  useEffect(() => {
    if (requestedCat && cats.some((c) => c.id === requestedCat)) {
      setRootId(requestedCat);
      setDrillPath([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedCat]);

  const root = cats.find((c) => c.id === rootId) || cats[0];
  const currentNode = root ? findNode(root, drillPath) : undefined;

  // Breadcrumb chain from the root down to the current view.
  const chain: ProductNode[] = [];
  if (root) {
    chain.push(root);
    let cur = root;
    for (const id of drillPath) {
      const next = cur.children.find((c) => c.id === id);
      if (!next) break;
      chain.push(next);
      cur = next;
    }
  }

  const selectRoot = (id: string) => {
    setRootId(id);
    setDrillPath([]);
  };

  const drillInto = (nodeId: string, chainIndex: number) => {
    // chainIndex is this node's position in the breadcrumb chain (0 = root)
    setDrillPath((prev) => [...prev.slice(0, chainIndex), nodeId]);
  };

  const goToBreadcrumb = (index: number) => {
    // index 0 = root itself, so drillPath keeps everything before it
    setDrillPath(chain.slice(1, index + 1).map((n) => n.id));
  };

  return (
    <div>
      <SecondaryNav tabs={cats} activeId={root?.id} onSelect={selectRoot} />
      <div className="max-w-6xl mx-auto px-4 py-10">
        {!currentNode ? (
          <p className="text-sm" style={{ color: C.muted }}>
            No products in this category yet.
          </p>
        ) : (
          <>
            {/* Breadcrumb — only shown once you've drilled below the root */}
            {chain.length > 1 && (
              <div className="flex items-center flex-wrap gap-1.5 mb-6 text-sm">
                {chain.map((n, i) => (
                  <span key={n.id} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronRight size={13} style={{ color: C.muted }} />}
                    <button
                      onClick={() => goToBreadcrumb(i)}
                      className={i === chain.length - 1 ? "font-semibold" : "hover:underline"}
                      style={{ color: i === chain.length - 1 ? C.primary : C.muted }}
                      disabled={i === chain.length - 1}
                    >
                      {n.name}
                    </button>
                  </span>
                ))}
              </div>
            )}

            <h2 className="font-serif text-3xl mb-6" style={{ color: C.text }}>
              {currentNode.name}
            </h2>

            {currentNode.children.length === 0 ? (
              <p className="text-sm" style={{ color: C.muted }}>
                Nothing here yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {currentNode.children.map((node) => {
                  const isFolder = node.children.length > 0;
                  return (
                    <button
                      key={node.id}
                      onClick={() => isFolder && drillInto(node.id, chain.length - 1)}
                      className="text-left"
                      disabled={!isFolder}
                    >
                      <div
                        className="rounded-lg overflow-hidden mb-3 relative"
                        style={{ border: `1px solid ${C.border}` }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getFileUrl(node.image)} alt={node.name} className="w-full aspect-square object-cover" />
                        {isFolder && (
                          <div
                            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
                            title="Browse more inside"
                          >
                            <Folder size={13} color="#fff" />
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-medium" style={{ color: C.text }}>
                        {node.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}