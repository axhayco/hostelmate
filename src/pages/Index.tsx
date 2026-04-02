import { useState, useCallback, useEffect } from "react";
import logo from "@/assets/logo.png";
import SplashScreen from "@/components/SplashScreen";
import LoginPage from "@/components/LoginPage";
import RoleSelectPage from "@/components/RoleSelectPage";
import StudentPage from "@/components/StudentPage";
import OwnerPage from "@/components/OwnerPage";
import HostelDetail from "@/components/HostelDetail";
import CommunityChat from "@/components/CommunityChat";
import ProfilePage from "@/components/ProfilePage";
import HelpPage from "@/components/HelpPage";
import ContactPage from "@/components/ContactPage";
import BottomNav from "@/components/BottomNav";
import WishlistsPage from "@/components/WishlistsPage";
import TripsPage, { Booking } from "@/components/TripsPage";
import MessagesPage from "@/components/MessagesPage";
import { Hostel, mockHostels } from "@/data/hostels";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { HostelProvider } from "@/context/HostelContext";
import { AgentControlPlane } from "@/components/AgentControlPlane";

type Page =
  | "splash" | "role-select"
  | "login-student" | "login-owner"
  | "student" | "owner"
  | "detail" | "chat"
  | "profile" | "help" | "contact"
  | "wishlists" | "trips" | "messages";

type Tab = "explore" | "wishlists" | "trips" | "messages" | "profile";

const Index = () => {
  const { user, role, loading, signOut } = useAuth();

  const [page, setPage] = useState<Page>(() => {
    // 1. If splash seen, avoid initializing to it
    const splashSeen = sessionStorage.getItem("hostelmate-splash-seen") === "true";
    const savedPage = sessionStorage.getItem("hostelmate-current-page") as Page;
    if (splashSeen && savedPage) return savedPage;
    if (splashSeen) return "student"; // safety default
    return "splash";
  });
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
  const [hostels, setHostels] = useState<Hostel[]>(() => {
    try {
      const saved = localStorage.getItem("hostelmate-hostels");
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return mockHostels;
  });
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    return (sessionStorage.getItem("hostelmate-current-tab") as Tab) || "explore";
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("hostelmate-favorites") || "[]"); }
    catch { return []; }
  });
  const [bookings, setBookings] = useState<Booking[]>(() => {
    try { return JSON.parse(localStorage.getItem("hostelmate-bookings") || "[]"); }
    catch { return []; }
  });

  // ── Sync Page & Tab to sessionStorage ─────────────────────────────────────
  useEffect(() => {
    if (page !== "splash") {
      sessionStorage.setItem("hostelmate-current-page", page);
    }
  }, [page]);

  useEffect(() => {
    localStorage.setItem("hostelmate-hostels", JSON.stringify(hostels));
  }, [hostels]);

  useEffect(() => {
    sessionStorage.setItem("hostelmate-current-tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("hostelmate-bookings", JSON.stringify(bookings));
  }, [bookings]);

  // ── After Supabase finishes loading, decide which page to show ───────────
  useEffect(() => {
    if (loading) return; // wait for auth state

    if (user && role) {
      // User is logged in — go straight to their dashboard
      setPage(role === "owner" ? "owner" : "student");
    } else if (user && !role) {
      // OAuth user with no role yet — ask them to pick
      setPage("role-select");
    }
    // else: not logged in — stay at splash / role-select (handled below)
  }, [user, role, loading]);

  // ── Handle Google OAuth redirect: set role if pending ────────────────────
  // Must await updateUser + refreshSession so user_metadata.role is set
  // before the routing useEffect reads it.
  useEffect(() => {
    if (!user) return;

    // Don't overwrite if role already set (returning Google user)
    if (user.user_metadata?.role) return;

    // Read role from localStorage (primary) or URL param (fallback)
    const urlRole = new URLSearchParams(window.location.search).get("role");
    const pendingRole =
      localStorage.getItem("hostelmate-pending-role") || urlRole;

    if (!pendingRole) return;

    (async () => {
      await supabase.auth.updateUser({ data: { role: pendingRole } });
      // Refresh session so user_metadata reflects immediately in this tab
      await supabase.auth.refreshSession();
      localStorage.removeItem("hostelmate-pending-role");
      // Clean URL param without triggering a reload
      window.history.replaceState({}, "", "/");
      // Route to correct dashboard now that role is confirmed
      setPage(pendingRole === "owner" ? "owner" : "student");
    })();
  }, [user]);

  useEffect(() => {
    // Clear selected hostel when navigating away from detail or chat
    if (page !== "detail" && page !== "chat" && selectedHostel) {
      setSelectedHostel(null);
    }
  }, [page, selectedHostel]);

  const handleSplashFinish = useCallback(() => {
    sessionStorage.setItem("hostelmate-splash-seen", "true");
    if (user && role) {
      setPage(role === "owner" ? "owner" : "student");
    } else {
      setPage("student");
    }
  }, [user, role]);

  const handleNavigate = useCallback((target: string) => {
    setPage(target as Page);
  }, []);

  const handleSelectHostel = useCallback((hostel: Hostel) => {
    setSelectedHostel(hostel);
    setPage("detail");
  }, []);

  const handleLoginSuccess = useCallback((targetPage: Page) => {
    setPage(targetPage);
    if (targetPage === "student") setActiveTab("explore");
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setPage("role-select");
    setActiveTab("explore");
  }, [signOut]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      localStorage.setItem("hostelmate-favorites", JSON.stringify(next));
      return next;
    });
  }, []);

  const handleBookHostel = useCallback((hostel: Hostel) => {
    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      hostelName: hostel.name,
      location: hostel.location,
      image: hostel.image,
      checkIn: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      checkOut: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      status: "upcoming",
    };
    setBookings((prev) => [newBooking, ...prev]);
    setPage("trips");
    setActiveTab("trips");
  }, []);

  const handleEditBooking = useCallback((id: string, checkIn: string, checkOut: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, checkIn, checkOut } : b))
    );
  }, []);

  const handleCancelBooking = useCallback((id: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const handleTabChange = useCallback((tab: Tab) => {
    if (!user && (tab === "trips" || tab === "messages")) {
      setPage("role-select");
      return;
    }
    setActiveTab(tab);
    const pageMap: Record<Tab, Page> = {
      explore: "student",
      wishlists: "wishlists",
      trips: "trips",
      messages: "messages",
      profile: "profile",
    };
    setPage(pageMap[tab]);
  }, [user]);

  const showBottomNav = [
    "student", "wishlists", "trips", "messages",
    "profile", "help", "contact",
  ].includes(page);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="animate-logo-pop">
          <img src={logo} alt="Hostel Mate" className="h-20 w-20 animate-pulse" />
        </div>
      </div>
    );
  }

  // ── Page switch ───────────────────────────────────────────────────────────
  const hostelContextValue = { hostels, selectedHostel };

  const wrap = (el: React.ReactNode) => (
    <HostelProvider value={hostelContextValue}>
      {el}
      {page !== "splash" && <AgentControlPlane hasBottomNav={showBottomNav} />}
    </HostelProvider>
  );

  switch (page) {
    case "splash":
      return wrap(<SplashScreen onFinish={handleSplashFinish} />);

    case "role-select":
      return wrap(
        <RoleSelectPage
          onSelect={(role) =>
            setPage(role === "student" ? "login-student" : "login-owner")
          }
        />
      );

    case "login-student":
      return wrap(
        <LoginPage
          role="student"
          onLogin={() => handleLoginSuccess("student")}
        />
      );

    case "login-owner":
      return wrap(
        <LoginPage
          role="owner"
          onLogin={() => handleLoginSuccess("owner")}
        />
      );

    case "student":
      return wrap(
        <>
          <StudentPage
            hostels={hostels}
            onSelectHostel={handleSelectHostel}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
          <BottomNav active={activeTab} onTabChange={handleTabChange} />
        </>
      );

    case "owner":
      return wrap(
        <OwnerPage
          hostels={hostels}
          onHostelsChange={setHostels}
          onBack={handleSignOut}
          ownerId={user?.id ?? "unknown"}
        />
      );

    case "detail":
      return wrap(selectedHostel ? (
        <HostelDetail
          hostel={selectedHostel}
          onBack={() => setPage("student")}
          onBook={() => handleBookHostel(selectedHostel)}
          onOpenChat={() => {
            if (!user) {
              setPage("role-select");
            } else {
              setPage("chat");
            }
          }}
        />
      ) : (
        <>
          <StudentPage hostels={hostels} onSelectHostel={handleSelectHostel} favorites={favorites} onToggleFavorite={toggleFavorite} />
          <BottomNav active={activeTab} onTabChange={handleTabChange} />
        </>
      ));

    case "chat":
      return wrap(selectedHostel ? (
        <CommunityChat hostel={selectedHostel} onBack={() => setPage("detail")} />
      ) : (
        <>
          <StudentPage hostels={hostels} onSelectHostel={handleSelectHostel} favorites={favorites} onToggleFavorite={toggleFavorite} />
          <BottomNav active={activeTab} onTabChange={handleTabChange} />
        </>
      ));

    case "wishlists":
      return wrap(
        <>
          <WishlistsPage favorites={favorites} hostels={hostels} onSelectHostel={handleSelectHostel} onToggleFavorite={toggleFavorite} />
          <BottomNav active={activeTab} onTabChange={handleTabChange} />
        </>
      );

    case "trips":
      return wrap(
        <>
          <TripsPage
            bookings={bookings}
            onEditBooking={handleEditBooking}
            onCancelBooking={handleCancelBooking}
          />
          <BottomNav active={activeTab} onTabChange={handleTabChange} />
        </>
      );

    case "messages":
      return wrap(
        <>
          <MessagesPage
            hostels={hostels}
            favorites={favorites}
            onOpenChat={(h) => { setSelectedHostel(h); setPage("chat"); }}
          />
          <BottomNav active={activeTab} onTabChange={handleTabChange} />
        </>
      );

    case "profile":
      return wrap(
        <>
          <ProfilePage
            isGuest={!user}
            onBack={() => { setPage("student"); setActiveTab("explore"); }}
            onNavigate={handleNavigate}
            onSignOut={handleSignOut}
          />
          <BottomNav active={activeTab} onTabChange={handleTabChange} />
        </>
      );

    case "help":
      return wrap(
        <>
          <HelpPage onBack={() => { setPage("student"); setActiveTab("explore"); }} />
          <BottomNav active={activeTab} onTabChange={handleTabChange} />
        </>
      );

    case "contact":
      return wrap(
        <>
          <ContactPage onBack={() => { setPage("student"); setActiveTab("explore"); }} />
          <BottomNav active={activeTab} onTabChange={handleTabChange} />
        </>
      );

    default:
      return wrap(<SplashScreen onFinish={handleSplashFinish} />);
  }
};

export default Index;