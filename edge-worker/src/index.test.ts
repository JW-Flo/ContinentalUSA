import { describe, it, expect } from "vitest";

// Mock Cloudflare Worker environment
const mockEnv = {
    APP_KV: {
        get: () => Promise.resolve(null),
        put: () => Promise.resolve(),
        list: () => Promise.resolve({ keys: [] }),
    },
    EDGE_HMAC_KEY: "test-key",
};

// Import worker
import worker from "../src/index";

describe("Edge Worker", () => {
    it("should return anchors data for GET /v1/anchors", async () => {
        const request = new Request("http://localhost/v1/anchors", {
            method: "GET",
        });

        const response = await worker.fetch(request, mockEnv as any);
        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);
        
        // Verify structure of anchor data
        const firstAnchor = data[0];
        expect(firstAnchor).toHaveProperty("id");
        expect(firstAnchor).toHaveProperty("name");
        expect(firstAnchor).toHaveProperty("lat");
        expect(firstAnchor).toHaveProperty("lon");
        expect(firstAnchor).toHaveProperty("date");
        expect(firstAnchor).toHaveProperty("day");
    });

    it("should handle CORS preflight requests", async () => {
        const request = new Request("http://localhost/v1/anchors", {
            method: "OPTIONS",
        });

        const response = await worker.fetch(request, mockEnv as any);
        expect(response.status).toBe(204);
        expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });

    it("should return 405 for unsupported methods", async () => {
        const request = new Request("http://localhost/v1/anchors", {
            method: "PUT",
        });

        const response = await worker.fetch(request, mockEnv as any);
        expect(response.status).toBe(405);
    });
});