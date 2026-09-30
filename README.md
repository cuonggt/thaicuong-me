# thaicuong.me

The personal site of Cuong Giang. One page, plain HTML and CSS, with a little
JavaScript on top. There is no build step.

## Run it locally

```sh
python3 -m http.server 4173
```

Then open http://localhost:4173. Any static file server works.

## What's here

| Path | What it is |
| --- | --- |
| `index.html` | The whole site: selected work, more projects, earlier work, about |
| `404.html` | The not-found page, for hosts that serve one |
| `assets/site.css` | All the styles. Colours are tokens at the top, light and dark |
| `assets/site.js` | The theme toggle, copy buttons, demo playback and keyboard shortcuts |
| `assets/media/` | Demo videos, their posters, and the Dibi screenshot |
| `assets/og.png` | The picture shown when the site is shared |

The page works without JavaScript. The script only adds things on top of it.

## Keys

Like omassh: `j` and `k` move through the projects, `enter` opens one, `y`
copies its install command, `g` and `G` go to the top and bottom, `t` switches
the theme and `?` lists them all. Readers can turn single-key shortcuts off from
that list.

## Changing things

- **A project**: each one is an `<article class="project">` or
  `<article class="card">` in `index.html`. Its `data-nav` is its name in the
  status line, `data-primary` marks the link that `enter` opens, and
  `data-copy` holds the command that the copy button and `y` copy.
- **Colours**: the tokens at the top of `assets/site.css`. The dark theme is
  written out twice, once for the system setting and once for the toggle.
- **A demo video**: the demos come from the GIFs in each repository. To redo one:

  ```sh
  ffmpeg -i demo.gif -an -movflags +faststart -pix_fmt yuv420p \
    -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -preset slow \
    -tune animation -crf 22 assets/media/omassh.mp4
  ffmpeg -ss 28 -i demo.gif -frames:v 1 poster.png
  cwebp -q 82 poster.png -o assets/media/omassh.webp
  ```

## Deploying

GitHub Pages serves the `main` branch as it is. Push, and the site updates a
minute later. `CNAME` holds the domain, and `.nojekyll` tells Pages to publish
the files without running Jekyll over them.

The domain's DNS lives at Cloudflare, with both records set to DNS only (grey
cloud), so GitHub can issue the certificate:

| Type | Name | Target |
| --- | --- | --- |
| CNAME | `thaicuong.me` | `cuonggt.github.io` |
| CNAME | `www` | `cuonggt.github.io` |
