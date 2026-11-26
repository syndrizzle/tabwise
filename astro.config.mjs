// @ts-check

import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"

// https://astro.build/config
export default defineConfig({
  site: "https://tabwise.sahil.lol",
  image: {
    domains: [
      "i03.appmifile.com",
      "images.samsung.com",
      "motorolain.vteximg.com.br",
      "p2-ofp.static.pub",
      "psref.lenovo.com",
      "www.apple.com",
      "www.oneplus.in",
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: "always",
  },
  integrations: [react(), sitemap()],
})
