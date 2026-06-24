import "./globals.css";
import "leaflet/dist/leaflet.css";
import SiteNav from "./components/SiteNav";

export const metadata = {
  title: "Bear River Basin Monitor — water to downstream value",
  description:
    "Turn a quantity of new water generated over the Bear River basin into a defensible downstream dollar value — first-order economics, ecological function, and how much reaches the Great Salt Lake.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
