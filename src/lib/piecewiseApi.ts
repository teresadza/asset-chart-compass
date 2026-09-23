import { greedyPiecewise } from "@/lib/piecewiseModel";

/**
 * Optional external Python API. When not configured (or unreachable),
 * the identical greedy piecewise algorithm runs in the browser.
 */
const API_URL = import.meta.env.VITE_PIECEWISE_API_URL as string | undefined;

function computeLocally(prices: number[], maxModels: number, rsqTarget: number) {
  const { model, r2 } = greedyPiecewise(prices, rsqTarget, maxModels);
  return { model, r2 };
}

export async function fetchPiecewiseModel(
  prices: number[],
  maxModels: number,
  rsqTarget = 0.98,
  signal?: AbortSignal
): Promise<{ model: number[]; r2: number }> {
  if (!API_URL) return computeLocally(prices, maxModels, rsqTarget);

  try {
    const res = await fetch(`${API_URL}/piecewise`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prices, max_models: maxModels, rsq_target: rsqTarget }),
      signal,
    });
    if (!res.ok) throw new Error(`Piecewise API error: ${res.status}`);
    return await res.json();
  } catch (e: any) {
    if (e?.name === "AbortError") throw e;
    console.warn("Piecewise API unavailable, computing in browser:", e?.message ?? e);
    return computeLocally(prices, maxModels, rsqTarget);
  }
}
