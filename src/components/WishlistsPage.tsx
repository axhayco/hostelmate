import { Heart } from "lucide-react";
import { Hostel } from "@/data/hostels";
import HostelCard from "./HostelCard";

interface WishlistsPageProps {
  favorites: string[];
  hostels: Hostel[];
  onSelectHostel: (hostel: Hostel) => void;
  onToggleFavorite: (id: string) => void;
}

const WishlistsPage = ({ favorites, hostels, onSelectHostel, onToggleFavorite }: WishlistsPageProps) => {
  const favoriteHostels = hostels.filter((h) => favorites.includes(h.id));

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-5xl px-4 pt-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Wishlists</h1>
        <p className="text-sm text-muted-foreground mb-6">Your saved hostels</p>

        {favoriteHostels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <Heart className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-foreground">No wishlists yet</p>
            <p className="mt-1 text-sm text-muted-foreground max-w-xs">
              Heart the hostels you love and they'll appear here
            </p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteHostels.map((h, i) => (
              <div
                key={h.id}
                className="relative animate-fade-up"
                style={{ animationDelay: `${i * 0.06}s`, animationFillMode: "both" }}
              >
                <div className="cursor-pointer" onClick={() => onSelectHostel(h)}>
                  <HostelCard hostel={h} />
                </div>
                <button
                  onClick={() => onToggleFavorite(h.id)}
                  className="absolute right-4 top-4 z-10 rounded-full bg-card/80 p-2 backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
                >
                  <Heart className="h-5 w-5 fill-primary text-primary" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistsPage;
