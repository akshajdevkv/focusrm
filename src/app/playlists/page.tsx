import { AppSidebar } from "@/components/app-sidebar";
import { PlaylistImporter } from "@/features/playlists/playlist-importer";

export default function PlaylistsPage() {
  return (
    <div className="gloss-page min-h-screen lg:grid lg:grid-cols-[220px_1fr]">
      <AppSidebar active="My Playlists" />
      <main className="p-6 lg:p-8">
        <PlaylistImporter />
      </main>
    </div>
  );
}
