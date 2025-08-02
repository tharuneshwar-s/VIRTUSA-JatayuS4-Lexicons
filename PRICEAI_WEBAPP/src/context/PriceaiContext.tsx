'use client';

import { ProviderCardData } from '@/types/ProviderCardTypes';
import React, { createContext, useContext, useState, ReactNode } from 'react';
interface PriceaiContextType {
  selectedService: any;
  setSelectedService: (service: any) => void;

  allProviderCardsData: ProviderCardData[];
  setAllProviderCardsData: (allProviderCardsData: ProviderCardData[]) => void;
  allProviderCardsDataBeforeFilter: ProviderCardData[];
  setAllProviderCardsDataBeforeFilter: (allProviderCardsDataBeforeFilter: ProviderCardData[]) => void;
  recommendProviderCards: ProviderCardData[];
  setRecommendProviderCards: (recommendProviderCards: ProviderCardData[]) => void;

  selectedProvider: any;
  setSelectedProvider: (provider: any | null) => void;

  compareProviders: any[];
  setCompareProviders: (compareProviders: any) => void;
  openCompareProvider: boolean;
  setOpenCompareProvider: (openCompareProvider: boolean) => void;

  resetCards: () => void;
}

const PriceaiContext = createContext<PriceaiContextType | undefined>(undefined);

export const PriceaiProvider = ({ children }: { children: ReactNode }) => {
  const [selectedService, setSelectedService] = useState<any>(null);

  const [allProviderCardsData, setAllProviderCardsData] = useState<ProviderCardData[]>([]);
  const [allProviderCardsDataBeforeFilter, setAllProviderCardsDataBeforeFilter] = useState<ProviderCardData[]>([]);
  const [recommendProviderCards, setRecommendProviderCards] = useState<ProviderCardData[]>([]);

  const [selectedProvider, setSelectedProvider] = useState<any>(null);

  const [compareProviders, setCompareProviders] = useState<any[]>([]);
  const [openCompareProvider, setOpenCompareProvider] = useState<boolean>(false);

  const resetCards = () => {
    setAllProviderCardsData([]);
  };

  return (
    <PriceaiContext.Provider value={
      {
        selectedService,
        setSelectedService,

        allProviderCardsData,
        setAllProviderCardsData,
        allProviderCardsDataBeforeFilter,
        setAllProviderCardsDataBeforeFilter,
        recommendProviderCards,
        setRecommendProviderCards,

        selectedProvider,
        setSelectedProvider,

        compareProviders,
        setCompareProviders,
        openCompareProvider,
        setOpenCompareProvider,

        resetCards,
      }
    }>
      {children}
    </PriceaiContext.Provider>
  );
};

export const usePriceaiContext = () => {
  const context = useContext(PriceaiContext);
  if (!context) {
    throw new Error("usePriceaiContext must be used within a PriceaiProvider");
  }
  return context;
};

