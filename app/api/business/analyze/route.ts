import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import UserAgent from "user-agents";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const userAgent = new UserAgent();
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": userAgent.toString(),
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch website" }, { status: response.status });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Basic extraction logic
    const title = $("title").text();
    const description = $('meta[name="description"]').attr("content") || "";
    
    // Attempt to find styles
    // This is tricky without a real browser, but we can look for style tags or inline styles
    // Or we can just extract generalized info
    
    // We can try to regex for some common CSS variables or values in style tags
    const styleContent = $("style").text();
    
    // Simple regex to find hex colors (very basic)
    const hexColorRegex = /#[0-9a-fA-F]{6}/g;
    const colors = styleContent.match(hexColorRegex) || [];
    // Count frequency to guess primary color
    const colorCounts: Record<string, number> = {};
    colors.forEach(c => {
        colorCounts[c] = (colorCounts[c] || 0) + 1;
    });
    const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
    let primaryColor = sortedColors.length > 0 ? sortedColors[0][0] : "#000000";

    // Improved Color Logic: Check meta theme-color specifically
    const themeColor = $('meta[name="theme-color"]').attr("content");
    if (themeColor && themeColor.startsWith('#')) {
       primaryColor = themeColor;
    }

    // Logo Extraction Logic
    let logoUrl = "";
    // 1. Check schema.org JSON-LD
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const json = JSON.parse($(el).html() || "{}");
            if (json["@type"] === "Organization" || json["@type"] === "Brand") {
                if (json.logo) {
                    logoUrl = typeof json.logo === "string" ? json.logo : json.logo.url;
                }
            }
        } catch (e) { /* ignore */ }
    });

    // 2. Check Open Graph or Twitter Card
    if (!logoUrl) logoUrl = $('meta[property="og:logo"]').attr("content") || "";
    if (!logoUrl) logoUrl = $('meta[property="og:image"]').attr("content") || "";
    
    // 3. Fallback to favicon
    if (!logoUrl) logoUrl = $('link[rel="icon"]').attr("href") || "";
    if (!logoUrl) logoUrl = $('link[rel="shortcut icon"]').attr("href") || "";
    if (!logoUrl) logoUrl = $('link[rel="apple-touch-icon"]').attr("href") || "";

    // Resolve relative URLs
    if (logoUrl && !logoUrl.startsWith("http")) {
        const baseUrl = new URL(url);
        // Handle absolute path vs relative path
        if (logoUrl.startsWith('/')) {
            logoUrl = `${baseUrl.origin}${logoUrl}`;
        } else {
             // crude join
             logoUrl = `${baseUrl.origin}/${logoUrl}`;
        }
    }

    // Try to find font families
    const fontRegex = /font-family:\s*([^;]+)/g;
    const fonts = [];
    let match;
    while ((match = fontRegex.exec(styleContent)) !== null) {
        fonts.push(match[1].trim());
    }
    const primaryFont = fonts.length > 0 ? fonts[0] : "Inter, sans-serif";

    // Try to find border radius
    // Look for --radius or border-radius
    const radiusRegex = /(?:--radius|border-radius):\s*([^;]+)/;
    const radiusMatch = styleContent.match(radiusRegex);
    const borderRadius = radiusMatch ? radiusMatch[1].trim() : "0.5rem";

    return NextResponse.json({
      name: title,
      description,
      logoUrl,
      styles: {
        primaryColor,
        typography: primaryFont,
        borderRadius,
        padding: "1rem", // Default assumption
      }
    });

  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
