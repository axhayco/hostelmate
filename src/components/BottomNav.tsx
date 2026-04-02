import { Search, Heart, CalendarDays, MessageCircle, User } from "lucide-react";

type Tab = "explore" | "wishlists" | "trips" | "messages" | "profile";

interface BottomNavProps {
  active: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "explore", label: "Explore", icon: Search },
  { id: "wishlists", label: "Wishlists", icon: Heart },
  { id: "trips", label: "Trips", icon: CalendarDays },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "profile", label: "Profile", icon: User },
];

const BottomNav = ({ active, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1.5">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-semibold transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`}
                fill={isActive && id === "wishlists" ? "currentColor" : "none"}
              />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
