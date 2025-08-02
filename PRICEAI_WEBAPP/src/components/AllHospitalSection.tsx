'use client';

import { useLocationContext } from '@/context/LocationContext';
import { usePriceaiContext } from '@/context/PriceaiContext';
import { Location } from '@/types/LocationTypes';
import { ProviderCardData } from '@/types/ProviderCardTypes';
import React, { RefObject, useState } from 'react'
import ProviderCard from './ProviderCard';
import { Button } from './ui/Button';
import { Select } from './ui/select';


interface DistanceFilterProps {
    distanceSliderRef: RefObject<HTMLInputElement>;
    distanceValueRef: RefObject<HTMLSpanElement>;
    handleResetFilters: () => void;
    allCardsBeforeFilter: ProviderCardData[];
    setCards: (allProviderCardsData: ProviderCardData[]) => void;
}

function AllHospitalSection(
    { sortByRef, distanceSliderRef, distanceValueRef, handleResetFilters, displayedCards, loading }:
        { sortByRef: RefObject<HTMLSelectElement>; distanceSliderRef: RefObject<HTMLInputElement>; distanceValueRef: RefObject<HTMLSpanElement>; handleResetFilters: () => void; displayedCards: ProviderCardData[]; loading: boolean; }) {

    const { allProviderCardsDataBeforeFilter, allProviderCardsData, setAllProviderCardsData } = usePriceaiContext();
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    // Sort state
    const [selectedSortValue, setSelectedSortValue] = useState("price-asc");
    const hospitalsPerPage = 6; // Show 9 per page (3x3 grid)
    const totalPages = Math.ceil(displayedCards.length / hospitalsPerPage);
    const startIndex = (currentPage - 1) * hospitalsPerPage;
    const paginatedCards = displayedCards.slice(startIndex, startIndex + hospitalsPerPage);

    const goToPage = (page: number) => {
        setCurrentPage(page);
    };

    // Reset to first page when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [displayedCards]);



    return (
        <div id="results-section" className='pt-10'>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <h3 className="text-xl font-bold">All Hospitals</h3>
                <div className="mt-4 md:mt-0 flex flex-wrap gap-3 relative z-[1]">
                    <div className="flex items-center">
                        <label htmlFor="sort-by" className="text-sm text-gray-600 mr-2 text-nowrap">Sort by:</label>
                        <Select
                            options={[
                                { label: "Price: Low to High", value: "price-asc" },
                                { label: "Price: High to Low", value: "price-desc" },
                                { label: "Rating: Highest First", value: "rating-desc" },
                                { label: "Rating: Lowest First", value: "rating-asc" },
                                { label: "Distance: Nearest First", value: "distance-asc" },
                                { label: "Distance: Farthest First", value: "distance-desc" }
                            ]}
                            value={selectedSortValue}
                            onChange={(value) => {
                                setSelectedSortValue(value);
                                const [criteria, order] = value.split('-');
                                const sorted = [...allProviderCardsDataBeforeFilter].sort((a, b) => {
                                    if (criteria === 'rating') {
                                        const aRating: number = a.averageRating || 0;
                                        const bRating: number = b.averageRating || 0;
                                        return order === 'asc' ? aRating - bRating : bRating - aRating;
                                    } else if (criteria === 'price') {
                                        const aPrice: number = a.standardCharge || 0;
                                        const bPrice: number = b.standardCharge || 0;
                                        return order === 'asc' ? aPrice - bPrice : bPrice - aPrice;
                                    } else if (criteria === 'distance') {
                                        const aDistance: number = a.distance || 0;
                                        const bDistance: number = b.distance || 0;
                                        return order === 'asc' ? aDistance - bDistance : bDistance - aDistance;
                                    }
                                    return 0;
                                });
                                setAllProviderCardsData(sorted);
                            }}
                            className="min-w-[100px] h-12"
                        />
                    </div>
                </div>
            </div>

            <DistanceFilter
                distanceSliderRef={distanceSliderRef}
                distanceValueRef={distanceValueRef}
                handleResetFilters={handleResetFilters}
                allCardsBeforeFilter={allProviderCardsDataBeforeFilter}
                setCards={setAllProviderCardsData}
            />

            <div className="mb-4 text-sm text-gray-600">
                Showing {displayedCards.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + hospitalsPerPage, displayedCards.length)} of {displayedCards.length} results
            </div>

            <div className="grid grid-cols-3 max-lg:grid-cols-2 max-md:grid-cols-1 gap-6">
                {paginatedCards.length > 0 ? (
                    paginatedCards.map((card, index) => (
                        <ProviderCard
                            key={index + startIndex - 1}
                            provider={card}
                            isRecommended={false}
                            isSelfPay={{
                                isSelfPay: card.isSelfPay,
                                negotiateCharge: card.negotiateCharge,
                                standardCharge: card.standardCharge
                            }}
                            hasInsurance={!card.hasInsurance}
                            loading={loading}
                        />
                    ))
                ) : (
                    <div className="col-span-3 text-center py-8 bg-gray-50 rounded-lg">
                        <div className="text-gray-500 font-medium">No hospitals found matching your filters.</div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mt-3 text-priceai-blue hover:text-priceai-blue/80"
                            onClick={handleResetFilters}
                        >
                            Reset all filters
                        </Button>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between bg-white border border-priceai-gray/20 rounded-lg p-3">
                    <div className="text-sm text-priceai-gray">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="h-8 px-3"
                        >
                            Previous
                        </Button>
                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => goToPage(page)}
                                    className={`h-8 w-8 p-0 ${currentPage === page ? 'bg-priceai-blue' : ''}`}
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="h-8 px-3"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AllHospitalSection



const DistanceFilter = ({
    distanceSliderRef,
    distanceValueRef,
    handleResetFilters,
    allCardsBeforeFilter,
    setCards,

}: DistanceFilterProps) => (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
            <label htmlFor="distance-slider" className="text-sm font-medium text-gray-700">
                Max Distance: <span ref={distanceValueRef} className="text-priceai-blue font-semibold">50</span> miles
            </label>
            <button
                className="text-priceai-blue hover:underline text-xs"
                onClick={handleResetFilters}
            >
                Reset
            </button>
        </div>
        <input
            ref={distanceSliderRef}
            type="range"
            id="distance-slider"
            min="1"
            max="100"
            defaultValue="50"
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            onChange={(e) => {
                const maxDistance = parseInt(e.target.value, 10);
                if (distanceValueRef.current) {
                    distanceValueRef.current.textContent = String(maxDistance);
                }
                const percentage = (maxDistance / 100) * 100;
                e.target.style.background = `linear-gradient(to right, #0FA0CE 0%, #0FA0CE ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`;

                const filteredCards = allCardsBeforeFilter.filter((card) => {
                    const cardDistance = card.distance;
                    return cardDistance !== null && cardDistance <= maxDistance;
                });

                setCards(filteredCards);
            }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 mile</span>
            <span>25 miles</span>
            <span>50 miles</span>
            <span>75 miles</span>
            <span>100 miles</span>
        </div>
    </div>
);