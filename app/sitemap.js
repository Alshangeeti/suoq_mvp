export default function sitemap() {
  const base = "https://www.souqmauritania.com";
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/cart`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/account`, changeFrequency: "monthly", priority: 0.3 }
  ];
}
