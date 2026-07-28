# Renyuan Liu — Industry Portfolio

Industrial-facing personal homepage for Renyuan Liu, focused on AI Agent systems,
tool routing, model serving, and research-grade engineering.

Production path:

```text
https://ryannnice.github.io/nexus/ryan/
```

## Local preview

Run the server from the parent `nexus` directory so the sibling project link works:

```bash
cd /renyuanliu/nexus
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/ryan/
```

## Structure

```text
ryan/
├── index.html
├── style.css
├── script.js
├── DESIGN.md
└── assets/
    ├── favicon.svg
    ├── og-cover.svg
    ├── og-cover.png
    ├── portrait.webp
    └── portrait.png
```

The site is intentionally plain HTML, CSS, and JavaScript. It has no build
dependencies and is directly compatible with GitHub Pages.

## Content sources

- Identity, portrait, CV, education, research, and public writing:
  `Ryannnice/ryannnice.github.io`
- Flagship system narrative and metrics:
  `nexus/ecommerce-agent`
- Internship details and technical stack:
  public CV source in the academic homepage repository

Every experiment metric is shown with its evaluation scope. The homepage does
not present fixed synthetic benchmark results as online production performance.

## Privacy

The public page intentionally omits phone number, WeChat QR code, transcripts,
offer letters, scholarship evidence, infrastructure addresses, and private
repository links.
