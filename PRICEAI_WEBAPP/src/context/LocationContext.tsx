'use client';

import { Location } from "@/types/LocationTypes";
import { createContext, useContext, useState, ReactNode } from "react";

interface LocationContextType {
  myCurrentLocation: Location | null;
  setMyCurrentLocation: (location: any | null) => void;

  selectedLocation: Location | null;
  setSelectedLocation: (location: Location | null) => void;

}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [myCurrentLocation, setMyCurrentLocation] = useState<Location | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  return (
    <LocationContext.Provider
      value={{
        myCurrentLocation,
        setMyCurrentLocation,
        selectedLocation,
        setSelectedLocation
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocationContext must be used within a LocationProvider");
  }
  return context;
};
