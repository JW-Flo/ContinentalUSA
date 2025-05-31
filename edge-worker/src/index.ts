export interface Env {
    APP_KV: KVNamespace;
    EDGE_HMAC_KEY: string;
}

// TextEncoder and TextDecoder are global in Cloudflare Workers

async function verifySignature(
    body: ArrayBuffer,
    key: string,
    signatureHeader: string | null
): Promise<boolean> {
    if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
        return false;
    }
    const signature = signatureHeader.slice(7);
    const keyData = new TextEncoder().encode(key);
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const expected = await crypto.subtle.sign("HMAC", cryptoKey, body);
    const expectedHex = Array.from(new Uint8Array(expected))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    const sigBytes = new Uint8Array(
        signature.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
    );
    const expBytes = new Uint8Array(
        expectedHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
    );
    if (sigBytes.length !== expBytes.length) {
        return false;
    }
    // timing safe compare
    let diff = 0;
    for (let i = 0; i < expBytes.length; i++) {
        diff |= expBytes[i] ^ sigBytes[i];
    }
    return diff === 0;
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const { method, headers } = request;
        const url = new URL(request.url);

        // CORS preflight
        if (method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, X-Signature",
                },
            });
        }

        // POST: ingest event
        if (method === "POST" && url.pathname === "/") {
            const buf = await request.arrayBuffer();
            const signature = headers.get("X-Signature");
            if (!(await verifySignature(buf, env.EDGE_HMAC_KEY, signature))) {
                return new Response("Unauthorized", { status: 401 });
            }
            let data: any;
            try {
                data = JSON.parse(new TextDecoder().decode(buf));
            } catch {
                return new Response("Invalid JSON", { status: 400 });
            }
            if (!data.id) {
                return new Response("Missing id", { status: 400 });
            }
            await env.APP_KV.put(data.id, JSON.stringify(data));
            return new Response("Stored", {
                status: 200,
                headers: { "Access-Control-Allow-Origin": "*" },
            });
        }

        // GET: retrieve events or anchors
        if (method === "GET") {
            // Handle /v1/anchors endpoint
            if (url.pathname === "/v1/anchors") {
                const anchors = [
                    { id: "anchor-1", name: "Columbus", lat: 39.9612, lon: -82.9988, date: "2024-06-04", day: 1, notes: "Starting point" },
                    { id: "anchor-4", name: "Milwaukee", lat: 43.0389, lon: -87.9065, date: "2024-06-07", day: 4, notes: "" },
                    { id: "anchor-12", name: "Seattle", lat: 47.6062, lon: -122.3321, date: "2024-06-15", day: 12, notes: "" },
                    { id: "anchor-17", name: "San Francisco", lat: 37.7749, lon: -122.4194, date: "2024-06-20", day: 17, notes: "" },
                    { id: "anchor-20", name: "Los Angeles", lat: 34.0522, lon: -118.2437, date: "2024-06-23", day: 20, notes: "1-day stay" },
                    { id: "anchor-27", name: "Denver", lat: 39.7392, lon: -104.9903, date: "2024-06-30", day: 27, notes: "Josh coffee stop" },
                    { id: "anchor-35", name: "Las Vegas", lat: 36.1699, lon: -115.1398, date: "2024-07-08", day: 35, notes: "" },
                    { id: "anchor-48", name: "Dallas", lat: 32.7767, lon: -96.7970, date: "2024-07-21", day: 48, notes: "" },
                    { id: "anchor-53", name: "Nashville", lat: 36.1627, lon: -86.7816, date: "2024-07-26", day: 53, notes: "Brady/Erin pulled forward" },
                    { id: "anchor-59", name: "New York", lat: 40.7128, lon: -74.0060, date: "2024-08-01", day: 59, notes: "" },
                    { id: "anchor-61", name: "Portland", lat: 43.6591, lon: -70.2568, date: "2024-08-03", day: 61, notes: "End point" }
                ];
                
                return new Response(JSON.stringify(anchors), {
                    status: 200,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                });
            }
            
            const id = url.searchParams.get("id");
            if (id) {
                const item = await env.APP_KV.get(id);
                if (!item) {
                    return new Response("Not Found", { status: 404 });
                }
                return new Response(item, {
                    status: 200,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                });
            } else {
                const list = await env.APP_KV.list();
                const items = await Promise.all(
                    list.keys.map((k: { name: string }) => env.APP_KV.get(k.name))
                );
                return new Response(JSON.stringify(items), {
                    status: 200,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                });
            }
        }

        return new Response("Method Not Allowed", { status: 405 });
    }
};
