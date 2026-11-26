#!/usr/bin/env python3
"""Crawl a deployed Tabwise site and report technical and on-page SEO issues.

Usage: python3 scripts/audit.py https://tabwise.sahil.lol [report.md]
"""
import concurrent.futures
import html
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser

UA = "Mozilla/5.0 (compatible; TabwiseAudit/1.0)"


def fetch(url, method="GET", follow=True):
    req = urllib.request.Request(url, method=method, headers={"User-Agent": UA})
    opener = urllib.request.build_opener() if follow else urllib.request.build_opener(NoRedirect)
    try:
        with opener.open(req, timeout=20) as r:
            return r.status, r.headers, r.read() if method == "GET" else b"", r.geturl()
    except urllib.error.HTTPError as e:
        return e.code, e.headers, b"", url
    except Exception as e:  # network failure is a finding, not a crash
        return 0, {}, str(e).encode(), url


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title, self.meta, self.links, self.imgs = "", {}, [], []
        self.headings, self.canonical, self.jsonld = [], None, []
        self._in, self._buf, self.text = None, "", []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ("title", "h1", "h2", "h3", "script") or tag == "style":
            self._in, self._buf = (tag, a), ""
        if tag == "meta":
            key = a.get("name") or a.get("property")
            if key:
                self.meta[key] = a.get("content", "")
        if tag == "link" and a.get("rel") == "canonical":
            self.canonical = a.get("href")
        if tag == "a" and a.get("href"):
            self.links.append((a["href"], a.get("rel", "")))
        if tag == "img":
            self.imgs.append(a)

    def handle_endtag(self, tag):
        if self._in and tag == self._in[0]:
            t, a = self._in
            text = re.sub(r"\s+", " ", self._buf).strip()
            if t == "title":
                self.title = text
            elif t in ("h1", "h2", "h3"):
                self.headings.append((t, text))
            elif t == "script" and a.get("type") == "application/ld+json":
                self.jsonld.append(self._buf)
            self._in = None

    def handle_data(self, data):
        if self._in:
            self._buf += data
        else:
            self.text.append(data)


def main():
    base = sys.argv[1].rstrip("/")
    out = sys.argv[2] if len(sys.argv) > 2 else None
    host = urllib.parse.urlsplit(base).netloc
    issues, rows, external = [], [], set()

    def issue(severity, url, text):
        issues.append((severity, url, text))

    status, _, robots, _ = fetch(base + "/robots.txt")
    robots = robots.decode(errors="replace")
    known = {"user-agent", "allow", "disallow", "sitemap", "crawl-delay"}
    for n, line in enumerate(robots.splitlines(), 1):
        line = line.split("#")[0].strip()
        if line and line.split(":")[0].strip().lower() not in known:
            issue("Medium", base + "/robots.txt", f"line {n}: unknown directive `{line[:60]}`")
    sitemaps = re.findall(r"(?im)^sitemap:\s*(\S+)", robots)
    for s in sitemaps:
        if urllib.parse.urlsplit(s).netloc != host:
            issue("High", base + "/robots.txt", f"sitemap points to another host: {s}")

    status, _, body, _ = fetch(base + "/sitemap-index.xml")
    urls = []
    for sm in re.findall(r"<loc>(.*?)</loc>", body.decode()):
        _, _, b, _ = fetch(sm.replace(urllib.parse.urlsplit(sm).netloc, host))
        urls += re.findall(r"<loc>(.*?)</loc>", b.decode())
    for u in urls:
        if urllib.parse.urlsplit(u).netloc != host:
            issue("High", base + "/sitemap-0.xml", f"sitemap URL on another host: {u}")
    queue = sorted({base + urllib.parse.urlsplit(u).path for u in urls} | {base + "/"})
    seen = set()

    while queue:
        url = queue.pop(0)
        if url in seen:
            continue
        seen.add(url)
        status, headers, body, final = fetch(url, follow=False)
        if status in (301, 302, 307, 308):
            issue("Medium", url, f"redirects ({status}) to {headers.get('Location')}")
            continue
        if status != 200:
            issue("High", url, f"internal URL returns {status}")
            continue
        p = Page()
        p.feed(body.decode(errors="replace"))
        words = len(re.findall(r"\w+", " ".join(p.text)))
        desc = p.meta.get("description", "")
        h1 = [h for t, h in p.headings if t == "h1"]
        rows.append((urllib.parse.urlsplit(url).path, len(p.title), len(desc), len(h1), words, len(p.imgs)))
        if not 30 <= len(p.title) <= 65:
            issue("Low", url, f"title is {len(p.title)} characters: {p.title!r}")
        if not 70 <= len(desc) <= 160:
            issue("Low", url, f"meta description is {len(desc)} characters")
        if len(h1) != 1:
            issue("Medium", url, f"{len(h1)} H1 elements")
        canon_host = urllib.parse.urlsplit(p.canonical or "").netloc
        if not p.canonical:
            issue("High", url, "missing canonical")
        elif canon_host != host:
            issue("High", url, f"canonical points to another host: {p.canonical}")
        if "og:image" not in p.meta:
            issue("Low", url, "missing og:image")
        elif urllib.parse.urlsplit(p.meta["og:image"]).netloc != host:
            issue("Medium", url, f"og:image on another host: {p.meta['og:image']}")
        if words < 300:
            issue("Medium", url, f"thin content: {words} words of visible text")
        for img in p.imgs:
            if "alt" not in img:
                issue("Medium", url, f"image without alt: {img.get('src', '')[:60]}")
        for block in p.jsonld:
            try:
                json.loads(block)
            except ValueError:
                issue("High", url, "invalid JSON-LD block")
        if not p.jsonld:
            issue("Low", url, "no structured data")
        if "BreadcrumbList" not in " ".join(p.jsonld) and url != base + "/":
            issue("Low", url, "no breadcrumb structured data")
        for href, rel in p.links:
            href = html.unescape(href)
            if href.startswith(("mailto:", "tel:", "#")):
                continue
            absolute = urllib.parse.urljoin(url, href).split("#")[0]
            if urllib.parse.urlsplit(absolute).netloc == host:
                if absolute not in seen:
                    queue.append(absolute)
            else:
                external.add(absolute)

    def check(u):
        s, _, _, _ = fetch(u, method="HEAD")
        if s in (0, 403, 405, 429):
            s, _, _, _ = fetch(u)
        return u, s

    with concurrent.futures.ThreadPoolExecutor(8) as pool:
        for u, s in pool.map(check, sorted(external)):
            if s == 0 or s >= 400:
                note = " (may block automated requests)" if s in (403, 429) else ""
                issue("Medium" if s in (403, 429) else "High", u, f"external link returns {s or 'no response'}{note}")

    order = {"High": 0, "Medium": 1, "Low": 2}
    issues.sort(key=lambda i: (order[i[0]], i[1]))
    lines = [f"# SEO audit of {base}", "", f"Crawled {len(seen)} internal URLs and checked {len(external)} external links.", "",
             "| Page | Title chars | Description chars | H1s | Words | Images |", "|---|---|---|---|---|---|"]
    lines += [f"| {r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]} | {r[5]} |" for r in rows]
    lines += ["", f"## Issues ({len(issues)})", "", "| Severity | URL | Issue |", "|---|---|---|"]
    lines += [f"| {s} | {u} | {t.replace('|', '/')} |" for s, u, t in issues]
    report = "\n".join(lines) + "\n"
    if out:
        open(out, "w").write(report)
    print(report)


if __name__ == "__main__":
    main()
