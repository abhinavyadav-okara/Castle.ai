const BASE_URL = "https://castle-ai.vercel.app";

const ROUTES = ["/", "/home", "/learn", "/puzzle", "/play", "/blog", "/board", "/jwt-decoder-generator"];

export default function sitemap() {
  const lastModified = new Date();
  return ROUTES.map((route) => ({
    url: `${BASE_URL}${route === "/" ? "" : route}`,
    lastModified,
  }));
}
