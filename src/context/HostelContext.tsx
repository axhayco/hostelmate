import { createContext, useContext } from "react";
import type { Hostel } from "@/data/hostels";

interface HostelContextValue {
  hostels: Hostel[];
  selectedHostel: Hostel | null;
}

const HostelContext = createContext<HostelContextValue>({
  hostels: [],
  selectedHostel: null,
});

export const HostelProvider = HostelContext.Provider;

export const useHostelContext = () => useContext(HostelContext);
