// Grid thumbnails: AliExpress CDN images support size-suffix variants, which
// load ~10x faster than the originals in product grids.
function thumb(url, size = 350) {
  if (!url || typeof url !== "string") return url;
  if (url.startsWith("data:")) return url;
  if (/alicdn\.com/.test(url) && /\.(jpg|jpeg|png|webp)$/i.test(url)) {
    return `${url}_${size}x${size}.jpg`;
  }
  return url;
}

module.exports = { thumb };
