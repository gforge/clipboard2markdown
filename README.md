# clipboard2markdown

> Easily convert richly formatted text or HTML to
> [Markdown](http://daringfireball.net/projects/markdown/syntax).
> Use the clipboard and paste to Markdown with a single keypress.
>
> The conversion is carried out by
> [to-markdown](https://github.com/domchristie/to-markdown),
> a Markdown converter running in the browser.

## Demo

### Interactive

<http://euangoddard.github.io/clipboard2markdown/>

## Deployment ✅

You can host this app on GitHub Pages. This repository is preconfigured to publish to `https://gforge.github.io/clipboard2markdown/` (the `homepage` field is set in `package.json`). Two supported options are shown below.

1. Manual (npm + gh-pages)

- Install the `gh-pages` dev dependency and run the deploy scripts:

```bash
npm install --save-dev gh-pages
npm run predeploy
npm run deploy
```

- If you plan to serve from a subpath (e.g. `https://<your-username>.github.io/<repo-name>/`), add a `homepage` field to `package.json` with that URL or set a `VITE_BASE` (or `BASE`) variable in your CI to point to the repository subpath.

2. Automatic (GitHub Actions)

- A GitHub Actions workflow (added at `.github/workflows/deploy.yml`) will build and publish the `dist/` directory to the `gh-pages` branch when changes are pushed to `main`.

> Note: The action uses `GITHUB_TOKEN` so no extra secrets are required. If you need a custom base path, set a `homepage` in `package.json` or provide `VITE_BASE` in your workflow.

## Usage

Open [index.html](index.html) in a favorite browser and hit `Ctrl+C`
(or `⌘+C` on Mac).

To copy the converted Markdown to the clipboard, press `Ctrl+A`
followed by `Ctrl+C` (or `⌘+A` and `⌘+C` on Mac).

One can paste multiple times. This overwrites the previous conversion.

### Tested browsers

- Chrome 33 (Linux and OS X)
- Firefox 27 (Linux)
- Safari 5 (OS X)
- Internet Explorer 11 (Windows)

## About

[clipboard2markdown](https://github.com/euangoddard/clipboard2markdown)
was created by [Euan Goddard](https://github.com/euangoddard).
The original version used
[html2markdown](https://github.com/kates/html2markdown) by
[Kates Gasis](https://github.com/kates) and
[Himanshu Gilani](https://github.com/hgilani).
[Vegard Øye](https://github.com/epsil) ported it to
[to-markdown](https://github.com/domchristie/to-markdown) by
[Dom Christie](https://github.com/domchristie). The HTML template
is based on [Bootstrap](http://getbootstrap.com/).

### License

[![License][license-image]][license-url]

Released under the MIT License. See the [LICENSE](LICENSE) file
for details.

[license-image]: https://img.shields.io/npm/l/markdownlint.svg
[license-url]: http://opensource.org/licenses/MIT
