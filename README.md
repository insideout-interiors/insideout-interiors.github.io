# Inside Out

Interior design & 3D visualization studio portfolio. Alternating dark/light sections,
serif display typography, magazine-style project layouts and image-led storytelling.

Static site — no build step, no dependencies.

## Sections

```
Hero → Image break → 01 Projects → 02 Services → 03 Gallery → 04 About Us → 05 Process → 06 Let's Connect
```

## Images

```
images/
├── hero.jpg              main hero
├── about.jpg             studio / about section
├── projects/             PROJECT PHOTOGRAPHY (Projects section)
│   ├── project-01/       cover.jpg, 01.jpg, 02.jpg
│   ├── project-02/       cover.jpg, 01.jpg, 02.jpg
│   └── project-03/       cover.jpg, 01.jpg, 02.jpg
└── renders/              3D RENDERS (Gallery section)
    └── render-01..05.jpg
```

`projects/` and `renders/` are deliberately separate so gallery renders never
reuse project photography.

> **Asset status — needs attention.**
>
> | Asset | State |
> |---|---|
> | `hero.jpg`, `about.jpg` | placeholder ("replace with your image") |
> | `projects/project-01/*`, `projects/project-03/*` | placeholder |
> | `projects/project-02/*` | real photography, **74 MB unoptimised** (7952×5304 Lightroom exports) |
> | `renders/render-01..04.jpg` | real renders, but they are **PNG files with a `.jpg` extension** (2.4–11 MB each) |
> | `renders/render-05.jpg` | placeholder |
>
> Total `images/` weight is ~105 MB. Before deploying, re-export everything to
> real JPEG/WebP at roughly 2000 px on the long edge; that brings the folder
> under ~5 MB with no visible quality loss.

## Edit

| What | Where |
|---|---|
| Headings, copy, contact details | `index.html` |
| Project titles / categories / galleries | `projects` array in `projects.js` |
| Gallery renders | `renders` array in `projects.js` |
| Colours, type scale, spacing | `:root` block at the top of `style.css` |

### Adding a project
Append to the `projects` array. `images` can hold any number of photos —
the lightbox pages through them:

```js
{title:"Name", category:"Interior Design", location:"Raipur",
 cover:"images/projects/project-04/cover.jpg",
 images:["images/projects/project-04/cover.jpg","images/projects/project-04/01.jpg"]}
```

### Adding a render
Append to the `renders` array. Single-image entries hide the lightbox arrows
automatically:

```js
{title:"Name", category:"Residential · Interior Render",
 cover:"images/renders/render-06.jpg",
 images:["images/renders/render-06.jpg"]}
```

### Logo
Drop your file in `images/` and swap the text brand in the header:

```html
<a class="brand" href="#home">
  <img class="brand-logo" src="images/logo.svg" alt="Inside Out">
</a>
```

## Colour & contrast

Three colours only — near-black, warm off-white, and a gold-brown accent.
The accent has two tuned shades so text meets WCAG AA on both backgrounds:

| Token | Value | Use |
|---|---|---|
| `--accent` | `#8b6f47` | non-text only: borders, icon chips, dots |
| `--accent-text` | `#7d633f` | accent text on light (5.35:1) |
| `--accent-on-dark` | `#b4905c` | accent text on dark (6.47:1) |

If you change the accent, re-check contrast — the mid-tone `#8b6f47` fails AA
for normal-size text on both backgrounds, which is why the two variants exist.

## Local preview

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Deploy

GitHub repository → Settings → Pages → Deploy from branch → `main` → `/root`.
