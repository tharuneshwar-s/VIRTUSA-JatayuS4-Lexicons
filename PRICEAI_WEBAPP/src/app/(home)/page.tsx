'use client'

import React, { useEffect } from 'react'
import { MapPin } from 'lucide-react';
import { useLocationContext } from '@/context/LocationContext';
import { LocationSearch } from '@/components/search/LocationSearch';
import { usePriceaiContext } from '@/context/PriceaiContext';
import { ProviderCardData } from '@/types/ProviderCardTypes';
import axios from 'axios';
import HealthcareServiceSearch from '@/components/search/ServiceSearch';
import RecommendedSection from '@/components/RecommendedSection';
import AllHospitalSection from '@/components/AllHospitalSection'
import { ProviderCardSkeleton } from '@/components/ProviderCard';
import ViewHospitalDetails from '@/components/hospitals_details/ViewHospitalDetails';
import CompareHospitalInsuranceDetails from '@/components/compare/CompareHospitals';
import { useAuth } from '@/context/AuthContext';

import { supabase } from '@/lib/supabase/supabase';

interface Location {
  address: string;
  latitude: number;
  longitude: number;
}

interface Service {
  service_id: number;
  service_name: string;
  service_code: string;
}

function HomePage() {

  const { myCurrentLocation, selectedLocation } = useLocationContext();
  const { selectedService, allProviderCardsData, allProviderCardsDataBeforeFilter, setAllProviderCardsData, setAllProviderCardsDataBeforeFilter, setRecommendProviderCards, selectedProvider, openCompareProvider } = usePriceaiContext()


  const [isLoading, setIsLoading] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [searchCompleted, setSearchCompleted] = React.useState(false);

  // Refs for filter elements
  const distanceSliderRef = React.useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;
  const distanceValueRef = React.useRef<HTMLSpanElement>(null) as React.RefObject<HTMLSpanElement>;

  const sortByRef = React.useRef<HTMLSelectElement>(null) as React.RefObject<HTMLSelectElement>;

  const location = selectedLocation ?? myCurrentLocation;

  const handleSearch = async () => {
    const params = {
      city: location?.city,
      state: location?.state,
      latitude: location?.latitude ? parseFloat(location.latitude) : undefined,
      longitude: location?.longitude ? parseFloat(location.longitude) : undefined,
      service_id: selectedService?.id
    };

    try {
      setIsLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_REST_API_URL}${process.env.NEXT_PUBLIC_REST_API_PREFIX}/${process.env.NEXT_PUBLIC_REST_API_VERSION}/providers/service/${selectedService?.id}`, { params });
      setFetchError(null); // Clear any previous errors
      setSearchCompleted(true);
      setFetchError(null); // Clear any previous errors


      if (response.data && Array.isArray(response.data)) {
        // Transform the API response into the format our app expects
        const transformedData: ProviderCardData[] = response.data.map((provider: any) => ({
          id: provider.provider_id,
          providerName: provider.provider_name,
          providerAddress: provider.provider_address,
          providerCity: provider.provider_city,
          providerState: provider.provider_state,
          providerZip: provider.provider_zip,
          providerPhone: provider.provider_phone,
          providerLat: provider.provider_lat || null,
          providerLng: provider.provider_lng || null,
          providerSpecialities: provider.provider_specialities,
          standardCharge: provider.standard_price,
          negotiateCharge: provider.negotiated_price,
          inNetwork: provider.in_network,
          insuranceId: provider.insurance_id,
          distance: provider.provider_distance,
          isSelfPay: provider.is_self_pay,
          hasInsurance: provider.has_insurance,
          service_name: provider.service_name,
          service_code: provider.service_code,
          service_category: provider.service_category,
          service_setting: provider.service_setting,

        }));

        // Fetch rating data for providers
        try {
          const providerIds = transformedData.map(p => p.id).join(',');
          const ratingResponse = await fetch(`/api/ratings/providers?providerIds=${providerIds}`, {
            credentials: 'include'
          });

          if (ratingResponse.ok) {
            const ratingData = await ratingResponse.json();

            // Merge rating data with provider data
            const enrichedData = transformedData.map(provider => {
              const ratingInfo = ratingData.ratings.find((r: any) => r.providerId === parseInt(provider.id));
              return {
                ...provider,
                averageRating: ratingInfo?.averageRating || null,
                totalReviews: ratingInfo?.totalReviews || 0
              };
            });

            setAllProviderCardsData(enrichedData);
            setAllProviderCardsDataBeforeFilter(enrichedData.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)));
            setRecommendProviderCards(enrichedData.slice(0, 3));
          } else {
            // Fallback if rating fetch fails - add default rating values
            const fallbackData = transformedData.map(provider => ({
              ...provider,
              averageRating: null,
              totalReviews: 0
            }));
            setAllProviderCardsData(fallbackData);
            setAllProviderCardsDataBeforeFilter(fallbackData.sort((a, b) => (a.standardCharge || 0) - (b.standardCharge || 0)));
            setRecommendProviderCards(fallbackData.slice(0, 3));
          }
        } catch (ratingError) {
          console.error('Error fetching ratings:', ratingError);
          // Fallback if rating fetch fails - add default rating values
          const fallbackData = transformedData.map(provider => ({
            ...provider,
            averageRating: null,
            totalReviews: 0
          }));
          setAllProviderCardsData(fallbackData);
          setAllProviderCardsDataBeforeFilter(fallbackData.sort((a, b) => (a.standardCharge || 0) - (b.standardCharge || 0)));
          setRecommendProviderCards(fallbackData.slice(0, 3));
        }

      }
      else {
        console.error("Unexpected response format:", response.data);
        setAllProviderCardsData([]);
        setAllProviderCardsDataBeforeFilter([]);
        setRecommendProviderCards([]);
      }
    }
    catch (error: any) {
      console.error("Error fetching data:", error);
      setAllProviderCardsData([]);
      setAllProviderCardsDataBeforeFilter([]);
      setRecommendProviderCards([]);
      setFetchError(error?.message || "Failed to fetch providers and pricing details.");

    }
    finally {
      setIsLoading(false);
    }
  }

  const handleResetFilters = React.useCallback((baseData = allProviderCardsDataBeforeFilter, triggerSearch = true) => {
    if (distanceSliderRef.current) {
      distanceSliderRef.current.value = "50";
    }

    if (distanceValueRef.current) {
      distanceValueRef.current.textContent = "50";
    }

    if (sortByRef.current) {
      sortByRef.current.value = "price-asc";
    }

    setAllProviderCardsData(baseData);

    const recomCards = baseData.slice(0, 3);
    setRecommendProviderCards(recomCards);
  }, [allProviderCardsDataBeforeFilter, setAllProviderCardsData]);

  return (
    <div className='min-h-screen sizer relative'>

      <div className="text-center z-[0] text-white relative drop-shadow-sm bg-slate-100/50 w-fit h-8 rounded-full mx-auto shadow-sm items-center p-1 flex justify-start gap-1 px-2">
        <MapPin />
        {myCurrentLocation ? (
          <span>
            {myCurrentLocation?.state || myCurrentLocation?.city}, {myCurrentLocation?.country}
          </span>
        ) : (
          <div role="status">
            <svg className="w-6 h-6 text-priceai-lightgray animate-spin fill-priceai-blue" viewBox="0 0 100 101" fill="none">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        )}
      </div>

      <div className="text-center py-7 text-white relative z-[0]">
        <h2 className="text-5xl font-extrabold mb-4">
          Find the Best Healthcare Prices Near You
        </h2>
        <p className="text-xl text-white/80 max-w-3xl mx-auto">
          Compare hospital prices, insurance coverage, and find the most affordable healthcare options in your area.
        </p>
      </div>

      <div className="bg-white z-[1] relative rounded-priceai space-y-5 shadow-lg p-8 mb-8 border border-priceai-lightgray max-w-3xl mx-auto">
        <LocationSearch />
        <HealthcareServiceSearch />

        <button
          onClick={handleSearch}
          disabled={!(selectedService && (selectedLocation || myCurrentLocation))}
          className={`w-full py-3 px-6 justify-center flex items-center text-white font-medium rounded-priceai transition-all duration-200 ${selectedService && (selectedLocation || myCurrentLocation)
            ? "bg-priceai-blue hover:opacity-80"
            : "bg-gray-300 cursor-not-allowed"
            }`}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>

      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="mt-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Searching for providers and prices...</h3>
          </div>

          <div className="grid grid-cols-3 max-lg:grid-cols-2 max-md:grid-cols-1 gap-6">
            {[...Array(6)].map((_, index) => (
              <ProviderCardSkeleton key={index} />
            ))}
          </div>
        </div>
      )}

      {searchCompleted && fetchError && (
        <div className="container mx-auto px-6 relative mt-4 text-center text-red-600 bg-red-100 border border-red-400 p-3 rounded-md">
          Error during search: {fetchError}
        </div>
      )}

      {/* Main Content */}
      {/* Display Results Sections */}
      {!isLoading && searchCompleted && !fetchError && (
        <>
          <RecommendedSection />
          <AllHospitalSection
            displayedCards={allProviderCardsData}
            sortByRef={sortByRef}
            distanceSliderRef={distanceSliderRef}
            distanceValueRef={distanceValueRef}
            handleResetFilters={() => handleResetFilters(allProviderCardsDataBeforeFilter, false)}
            loading={false}
          />
        </>
      )}


      {selectedProvider && (
        <ViewHospitalDetails />
      )}

      {openCompareProvider && (
        <CompareHospitalInsuranceDetails
        />
      )}

      {/* MCP-Powered Healthcare AI Chatbot */}
      {/*<ChatbotProvider /> */}


    </div>
  )
}


export default HomePage