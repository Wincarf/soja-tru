import { createFileRoute } from "@tanstack/react-router";
import { SojaApp } from "@/components/soja-app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Soja Tru — Field diagnosis and fair price" },
      { name: "description", content: "Offline soybean leaf diagnosis, fair price comparison and crop records for family farmers." },
      { property: "og:title", content: "Soja Tru — Field diagnosis and fair price" },
      { property: "og:description", content: "Offline soybean leaf diagnosis, fair price comparison and crop records for family farmers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return <SojaApp />;
}
