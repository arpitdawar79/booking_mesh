import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/?source=pwa",
    name: "The Stream by Ekantah",
    short_name: "The Stream",
    description:
      "Native-feeling booking, guest, revenue, email, salary, and WhatsApp dashboard for The Stream by Ekantah.",
    start_url: "/dashboard?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    orientation: "portrait-primary",
    categories: ["business", "productivity", "travel"],
    lang: "en",
    dir: "ltr",
    icons: [
      {
        src: "/icons/iconldpi.png",
        sizes: "36x36",
        type: "image/png",
      },
      {
        src: "/icons/iconmdpi.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "/icons/iconhdpi.png",
        sizes: "72x72",
        type: "image/png",
      },
      {
        src: "/icons/iconxhdpi.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "/icons/iconxxhdpi.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        src: "/icons/iconxxxhdpi.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon@6x.png",
        sizes: "288x288",
        type: "image/png",
      },
      {
        src: "/icons/icon@7x.png",
        sizes: "336x336",
        type: "image/png",
      },
      {
        src: "/icons/icon@8x.png",
        sizes: "384x384",
        type: "image/png",
      },
      {
        src: "/icons/icon@8x.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon@8x.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/login.jpeg",
        sizes: "390x844",
        type: "image/jpeg",
        form_factor: "narrow",
        label: "Login Screen",
      },
      {
        src: "/screenshots/new_booking.jpeg",
        sizes: "390x844",
        type: "image/jpeg",
        form_factor: "narrow",
        label: "New Booking",
      },
      {
        src: "/screenshots/quick_add.jpeg",
        sizes: "390x844",
        type: "image/jpeg",
        form_factor: "narrow",
        label: "Quick Add",
      },
      {
        src: "/screenshots/analytics.jpeg",
        sizes: "390x844",
        type: "image/jpeg",
        form_factor: "narrow",
        label: "Analytics",
      },
      {
        src: "/screenshots/occupancy_calendar.jpeg",
        sizes: "390x844",
        type: "image/jpeg",
        form_factor: "narrow",
        label: "Occupancy Calendar",
      },
      {
        src: "/screenshots/signup.jpeg",
        sizes: "1280x720",
        type: "image/jpeg",
        form_factor: "wide",
        label: "Signup on Desktop",
      },
    ],
    shortcuts: [
      {
        name: "New Booking",
        short_name: "New",
        description: "Create a booking",
        url: "/dashboard/new",
        icons: [{ src: "/icons/iconxxxhdpi.png", sizes: "192x192" }],
      },
      {
        name: "Bookings",
        short_name: "Bookings",
        description: "Review current bookings",
        url: "/dashboard/bookings",
        icons: [{ src: "/icons/iconxxxhdpi.png", sizes: "192x192" }],
      },
      {
        name: "Revenue",
        short_name: "Revenue",
        description: "Open revenue analytics",
        url: "/dashboard/analytics/revenue",
        icons: [{ src: "/icons/iconxxxhdpi.png", sizes: "192x192" }],
      },
    ],
    launch_handler: {
      client_mode: ["navigate-existing", "auto"],
    },
  };
}
