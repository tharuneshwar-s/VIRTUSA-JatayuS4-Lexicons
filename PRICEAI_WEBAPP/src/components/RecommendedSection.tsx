import { usePriceaiContext } from '@/context/PriceaiContext';
import React, { useState, useEffect } from 'react'
import ProviderCard from './ProviderCard';
import { Button } from './ui/Button';
import Checkbox from './ui/priceai-checkbox';

function RecommendedSection() {

    const { recommendProviderCards, setRecommendProviderCards, allProviderCardsDataBeforeFilter } = usePriceaiContext();
    const [bestPriceChecked, setBestPriceChecked] = useState(true); // Default to true
    const [closestChecked, setClosestChecked] = useState(false);
    const [bestRatedChecked, setBestRatedChecked] = useState(false);

    // Set default selection on mount
    useEffect(() => {
        if (allProviderCardsDataBeforeFilter.length > 0) {
            const bestPriceOptions = [...allProviderCardsDataBeforeFilter]
                .filter((card) => card.standardCharge && card.standardCharge > 0)
                .sort((a, b) => (a.standardCharge || 0) - (b.standardCharge || 0))
                .slice(0, 3);
            setRecommendProviderCards(bestPriceOptions);
        }
    }, [allProviderCardsDataBeforeFilter, setRecommendProviderCards]);

    const handleBestPriceChange = (checked: boolean) => {
        setBestPriceChecked(checked);
        if (checked) {
            setClosestChecked(false);
            setBestRatedChecked(false);
            const bestPriceOptions = [...allProviderCardsDataBeforeFilter]
                .filter((card) => card.standardCharge && card.standardCharge > 0)
                .sort((a, b) => (a.standardCharge || 0) - (b.standardCharge || 0))
                .slice(0, 3);
            setRecommendProviderCards(bestPriceOptions);
        } else {
            const recomCards = allProviderCardsDataBeforeFilter.filter((card) => card.standardCharge && card.standardCharge > 0);
            setRecommendProviderCards(recomCards.slice(0, 3));
        }
    };

    const handleClosestChange = (checked: boolean) => {
        setClosestChecked(checked);
        if (checked) {
            setBestPriceChecked(false);
            setBestRatedChecked(false);
            const closestOptions = [...allProviderCardsDataBeforeFilter]
                .filter((card) => card.standardCharge && card.standardCharge > 0)
                .sort((a, b) => {
                    return (a.distance || 0) - (b.distance || 0);
                })
                .slice(0, 3);
            setRecommendProviderCards(closestOptions);
        } else {
            const recomCards = allProviderCardsDataBeforeFilter.filter((card) => card.standardCharge && card.standardCharge > 0);
            setRecommendProviderCards(recomCards.slice(0, 3));
        }
    };

    const handleBestRatedChange = (checked: boolean) => {
        setBestRatedChecked(checked);
        if (checked) {
            setBestPriceChecked(false);
            setClosestChecked(false);
            const bestRatedOptions = [...allProviderCardsDataBeforeFilter]
                .filter((card) => card.standardCharge && card.standardCharge > 0 && card.averageRating)
                .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
                .slice(0, 3);
            setRecommendProviderCards(bestRatedOptions);
        } else {
            const recomCards = allProviderCardsDataBeforeFilter.filter((card) => card.standardCharge && card.standardCharge > 0);
            setRecommendProviderCards(recomCards.slice(0, 3));
        }
    };

    const handleResetFilters = () => {
        setBestPriceChecked(true);
        setClosestChecked(false);
        setBestRatedChecked(false);
        const bestPriceOptions = [...allProviderCardsDataBeforeFilter]
            .filter((card) => card.standardCharge && card.standardCharge > 0)
            .sort((a, b) => (a.standardCharge || 0) - (b.standardCharge || 0))
            .slice(0, 3);
        setRecommendProviderCards(bestPriceOptions);
    };

    return (
        <div className="mt-8">
            <div>
                <h3 className="text-xl font-bold mb-4">Recommended Hospitals</h3>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div className="flex flex-wrap space-x-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="best-price"
                                variant="priceai"
                                checked={bestPriceChecked}
                                onCheckedChange={handleBestPriceChange}
                            />
                            <label htmlFor="best-price" className="text-sm cursor-pointer">
                                Best price options
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="closest"
                                variant="priceai"
                                checked={closestChecked}
                                onCheckedChange={handleClosestChange}
                            />
                            <label htmlFor="closest" className="text-sm cursor-pointer">
                                Closest to you
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="best-rated"
                                variant="priceai"
                                checked={bestRatedChecked}
                                onCheckedChange={handleBestRatedChange}
                            />
                            <label htmlFor="best-rated" className="text-sm cursor-pointer">
                                Best rated
                            </label>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-priceai-blue hover:text-priceai-blue/80 mt-2 md:mt-0"
                        onClick={handleResetFilters}
                    >
                        Reset filters
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-3 max-lg:grid-cols-2 max-md:grid-cols-1 gap-6">
                {recommendProviderCards.length > 0 ? (
                    recommendProviderCards.map((card, index) => (
                        <ProviderCard
                            key={index}
                            provider={card}
                            isRecommended
                            isSelfPay={{
                                isSelfPay: card.isSelfPay,
                                negotiateCharge: card.negotiateCharge,
                                standardCharge: card.standardCharge
                            }}
                            hasInsurance={!card.hasInsurance}
                        />
                    ))
                ) : (
                    <div className="col-span-3 text-center text-gray-500">No recommended hospitals found.</div>
                )}
            </div>
        </div>
    )
}

export default RecommendedSection