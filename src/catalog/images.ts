import { getImage } from "astro:assets"

import type { Tablet } from "@/catalog/catalog"

// Result cards show product images at most 448px wide, so 640px covers 1.5x screens.
const cardWidth = 640

export async function withOptimizedImages(tablets: Tablet[]) {
  return Promise.all(
    tablets.map(async (tablet) => {
      try {
        const width = Math.min(cardWidth, tablet.image.width)
        const image = await getImage({
          src: tablet.image.url,
          width,
          height: Math.round((width * tablet.image.height) / tablet.image.width),
          format: "webp",
        })
        return {
          ...tablet,
          image: {
            ...tablet.image,
            url: image.src,
            width: Number(image.attributes.width),
            height: Number(image.attributes.height),
          },
        }
      } catch (error) {
        // A manufacturer CDN can be unreachable at build time; fall back to its URL.
        console.warn(`Kept remote image for ${tablet.id}:`, error)
        return tablet
      }
    })
  )
}
