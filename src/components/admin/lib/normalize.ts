export function unwrap<T = any>(res: any): T {
  if (res && typeof res === "object" && "data" in res) return (res as any).data;
  return res;
}

export function normalizeArray<T>(res: any): T[] {
  const d = unwrap(res);

  if (Array.isArray(d)) return d;

  if (d && typeof d === "object") {
    if (Array.isArray((d as any).items)) return (d as any).items;
    if (Array.isArray((d as any).results)) return (d as any).results;
    if (Array.isArray((d as any).docs)) return (d as any).docs;
    if (Array.isArray((d as any).rows)) return (d as any).rows;
  }

  return [];
}