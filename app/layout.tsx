import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata = {
  title: "Great Salt Lake — Situation Monitor",
  description: "Live USGS stream gauges, lake level, watershed physics, and cloud-seeding impact context for the Great Salt Lake basin.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
