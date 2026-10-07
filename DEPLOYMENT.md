# Publish xReality

This is a static HTML/JavaScript website. It does not need a build command or a backend.

`index.html` is the hosting entry point, copied from `research-group-site.html`. After editing the latter, update the entry point with:

```powershell
Copy-Item -LiteralPath research-group-site.html -Destination index.html
```

## GitHub Pages

1. Create a public GitHub repository named `xreality` in the intended account.
2. Resolve the large files below before committing. Upload website files using Git rather than the browser, which has a 25 MiB limit per file.
3. Include `index.html`, `research-group-site.html`, `neon-geometry.html`, `.nojekyll`, both favicons, `1965_The_Ultimate_Display.pdf`, and the runtime files in `assets`, `images`, `papers`, `videos`, and `3dmodels`. Asset preparation scripts, contact sheets, PowerPoint source files, logs, and original headshots are not needed for hosting.
4. In repository Settings → Pages, select Deploy from a branch, `main`, and `/ (root)`, then save.
5. The project URL will be `https://ACCOUNT.github.io/xreality/`.

For `https://xreality.github.io/`, the account or organisation must be named `xreality`, and the repository must be named `xreality.github.io`. Availability and ownership are not yet verified.

`xreality.git.org` requires permission from the owner of `git.org` and a DNS record; it is not a default GitHub Pages address.

## Items to resolve before publishing

GitHub blocks regular Git files above 100 MiB. These files exceed that limit:

- `videos/LocomotiVR.mp4` — 191,303,958 bytes.
- `videos/Your Face Your Anatomy ISMAR 2024.mp4` — 124,012,804 bytes.
- `papers/LocomotiVR - IEEE VR 2023.pdf` — 116,689,710 bytes.

These three publication links now point to their corresponding files on `https://web.tecnico.ulisboa.pt/~daniel.s.lopes/` in both HTML entry points. Their local copies are excluded by `.gitignore` and can remain on disk. If these files were committed previously, their oversized blobs must also be removed from unpushed Git history before publishing; adding `.gitignore` alone does not remove previous commits.

The personal website links currently point to `about.html`, which is absent. Supply the intended personal website URL or the missing page before publishing.

GitHub Pages documentation:

- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github

## Current status

The local hosting entry point and favicons are prepared. No GitHub repository has been created, no files have been uploaded, and the website has not been deployed. A GitHub account or repository destination and authenticated access are still required.
