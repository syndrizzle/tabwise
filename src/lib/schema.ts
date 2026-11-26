export type Crumb = { name: string; href: string }

type Thing = Record<string, unknown>

export const siteName = "Tabwise"

export function siteGraph(site: URL, page: Thing[] = []) {
  const url = (path: string) => new URL(path, site).href

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": url("/#organization"),
        name: siteName,
        url: url("/"),
        logo: url("/logo.png"),
      },
      {
        "@type": "WebSite",
        "@id": url("/#website"),
        name: siteName,
        url: url("/"),
        inLanguage: "en-IN",
        publisher: { "@id": url("/#organization") },
      },
      ...page,
    ],
  }
}

export const breadcrumbList = (site: URL, crumbs: Crumb[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map((crumb, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: crumb.name,
    item: new URL(crumb.href, site).href,
  })),
})
