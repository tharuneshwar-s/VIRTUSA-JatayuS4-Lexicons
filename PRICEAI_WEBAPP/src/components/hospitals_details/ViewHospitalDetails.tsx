'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { ArrowLeft, Building2, CheckCircle2, DollarSign, Globe, Lightbulb, MapPin, Navigation, Phone, XCircle, Star, TrendingUp, Award, Search, Filter, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { formatCurrency, formatDistance } from '@/lib/utils';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { TooltipProvider, TooltipTrigger, TooltipContent, Tooltip } from '../ui/tooltip';
import { usePriceaiContext } from '@/context/PriceaiContext';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Select } from '../ui/select';
import { generateSingleProviderRecommendation } from '@/services/Recommendation';
import ProviderRating from './ProviderRating';
import AppointmentBooking from '../appointments/AppointmentBooking';

function ViewHospitalDetails() {
    const { setSelectedProvider, selectedProvider, selectedService } = usePriceaiContext();
    const [fetchedServiceByProviderId, setFetchedServiceByProviderId] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('all');
    const [sortDirection, setSortDirection] = useState('asc');
    const [sortBy, setSortBy] = useState('insuranceName');
    const [recommendedPlans, setRecommendedPlans] = useState<any>([]);
    const [customFilters, setCustomFilters] = useState<string[]>([]);
    const [selectRecommendFilter, setSelectRecommendFilter] = useState<string>('all');
    const [loadingRecommendation, setLoadingRecommendation] = useState(false);
    const [insuranceLoading, setInsuranceLoading] = useState(true);
    const [insuranceCollapsed, setInsuranceCollapsed] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);

    const distance = selectedProvider?.distance;
    const hasValidStandardCharge = selectedProvider?.standardCharge && selectedProvider?.standardCharge > 0;
    let displayedPrice = hasValidStandardCharge ? formatCurrency(selectedProvider?.standardCharge) : null;

    const handleSort = (column: any) => {
        if (sortBy === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDirection('asc');
        }
    };

    const handleFilterChange = (filterKey: string, isChecked: boolean) => {
        setCustomFilters((prevFilters: any) => {
            if (isChecked) {
                return [...prevFilters, filterKey];
            } else {
                return prevFilters.filter((key: string) => key !== filterKey);
            }
        });
    };

    // Sort and filter the insurance plans
    const sortedFilteredPlans = fetchedServiceByProviderId
        ? [...fetchedServiceByProviderId]
            .filter((plan: any) => {
                // Skip if plan.inNetwork is null or undefined
                if (plan.inNetwork === null || plan.inNetwork === undefined) return false;

                // Convert inNetwork to boolean consistently
                const isInNetwork = typeof plan.inNetwork === 'string' ? plan.inNetwork.toLowerCase() === 'true' : Boolean(plan.inNetwork);

                if (activeTab === 'all') return true;
                if (activeTab === 'in-network') return isInNetwork;
                if (activeTab === 'out-of-network') return !isInNetwork;
                return true;
            })
            .sort((a: any, b: any) => {
                // Sort based on the selected sort field
                let aValue, bValue;
                switch (sortBy) {
                    case 'insuranceName':
                        aValue = a.insuranceName || '';
                        bValue = b.insuranceName || '';
                        break;
                    case 'negotiateCharge':
                        aValue = a.negotiateCharge || 0;
                        bValue = b.negotiateCharge || 0;
                        break;
                    case 'inNetwork':
                        aValue = a.inNetwork ? 1 : 0;
                        bValue = b.inNetwork ? 1 : 0;
                        break;
                    default:
                        return 0;
                }

                // Apply sort direction
                return sortDirection === 'asc' ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1;
            })
        : [];

    useEffect(() => {
        const fetchInsurance = async () => {
            setInsuranceLoading(true);
            try {
                const apiUrl = process.env.NEXT_PUBLIC_REST_API_URL || '';
                const apiPrefix = process.env.NEXT_PUBLIC_REST_API_PREFIX || '';
                const apiVersion = process.env.NEXT_PUBLIC_REST_API_VERSION || '';
                const baseUrl = `${apiUrl}${apiPrefix}/${apiVersion}/insurance/provider-service-insurance/${selectedProvider?.provider_id}/${selectedService?.service_id}`;
                const url = new URL(baseUrl, window.location.origin);
                url.searchParams.append('provider_id', selectedProvider?.provider_id);
                url.searchParams.append('service_id', selectedService?.service_id);

                const response = await fetch(url.toString());

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();

                const processedData = data.map((plan: any) => {
                    const parsedBenefits = plan.insurance_benefits
                        ? plan.insurance_benefits.split(',').map((b: string) => b.trim())
                        : [];

                    return {
                        id: plan.insurance_id,
                        insuranceName: plan.insurance_name,
                        insurancePlan: plan.insurance_plan,
                        insurance_benefits: parsedBenefits,
                        inNetwork: plan?.in_network,
                        negotiateCharge: plan?.negotiated_price,
                        standardCharge: plan?.standard_price,
                        insuranceId: plan.insurance_id,
                    };
                });

                setFetchedServiceByProviderId(processedData);
            } catch (error) {
                setFetchedServiceByProviderId([]);
            } finally {
                setInsuranceLoading(false);
            }
        };

        if (selectedProvider.hasInsurance) {
            fetchInsurance();
            setInsuranceLoading(false);
        }
        else {
            setFetchedServiceByProviderId([]);
            setInsuranceLoading(false);
        }

    }, [selectedProvider?.provider_id, selectedService?.service_id]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleRecommendBest = async () => {
        if (!fetchedServiceByProviderId || fetchedServiceByProviderId.length === 0) return;

        setLoadingRecommendation(true);

        try {
            const filterDetails =
                selectRecommendFilter === 'custom'
                    ? `Custom Filters: ${JSON.stringify(customFilters, null, 2)}`
                    : `Selected Filter: ${selectRecommendFilter}`;

            const standardChargeValue = selectedProvider?.standardCharge && selectedProvider?.standardCharge > 0 ? Number(selectedProvider.standard_price) : null;

            const result = await generateSingleProviderRecommendation({
                filterDetails,
                selectedProvider,
                selectedService,
                fetchedServiceByProviderId,
                standardChargeValue,
            });

            if (result.success && result.data) {
                setRecommendedPlans(result.data);
            } else {
                setRecommendedPlans('Failed to generate recommendation. Please try again.');
            }
        } catch (error) {
            setRecommendedPlans('Failed to generate recommendation. Please try again.');
        } finally {
            setLoadingRecommendation(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex justify-end">
            <div className="bg-white h-full w-full md:w-[85%] lg:w-[75%] xl:w-[65%] animate-in slide-in-from-right duration-500">
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between border-priceai-lightgray bg-gradient-to-r from-priceai-blue to-priceai-lightblue shadow-sm">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedProvider(null)}
                        className="text-white hover:text-white hover:bg-white/20 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to results
                    </Button>
                    <h3 className="text-white font-medium text-xl">Insurance Details</h3>
                    <div className="w-[154px]">{/* Empty div for flex alignment */}</div>
                </div>
                <ScrollArea className="h-full w-full">
                    <div className="h-full flex flex-col overflow-hidden">
                        {/* Content */}
                        <div className="flex-1 overflow-auto p-6">
                            <div className="max-w-4xl mx-auto">
                                {/* Provider summary card */}
                                <Card className="mb-6 overflow-hidden shadow-lg border-priceai-blue/20">
                                    <CardHeader className="bg-gradient-to-r from-priceai-blue to-priceai-lightblue p-6">
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <div className="flex-grow">
                                                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
                                                    <CardTitle className="text-2xl text-white">
                                                        {selectedProvider?.providerName}
                                                    </CardTitle>
                                                </div>

                                                <CardDescription className="text-white/90 flex items-center mb-2">
                                                    <Building2 className="w-4 h-4 mr-2" />
                                                    <p>
                                                        {selectedProvider?.providerSpecialities?.join(', ') || 'Healthcare Provider'}
                                                    </p>
                                                    <span className=" text-white/60 px-2">-</span>
                                                    <p>{selectedProvider?.service_name}</p>
                                                    <Badge variant={"outline"} className="bg-priceai-lightblue/30 ml-2 text-white border-white/10">
                                                        {selectedProvider?.service_code}
                                                    </Badge>
                                                </CardDescription>

                                                <div className="flex flex-wrap gap-3 mt-3">
                                                    {selectedProvider?.providerPhone && (
                                                        <a href={`tel:${selectedProvider?.providerPhone}`}
                                                            className="flex items-center bg-white/10 hover:bg-white/20 text-white rounded-priceai px-3 py-1.5 text-sm transition-colors">
                                                            <Phone className="w-3.5 h-3.5 mr-1.5" />
                                                            {selectedProvider?.providerPhone}
                                                        </a>
                                                    )}
                                                    {distance && (
                                                        <div className="flex items-center bg-white/10 text-white rounded-priceai px-3 py-1.5 text-sm">
                                                            <Navigation className="w-3.5 h-3.5 mr-1.5" />
                                                            {formatDistance(distance)}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center bg-white/10 text-white rounded-priceai px-3 py-1.5 text-sm">
                                                        <Globe className="w-3.5 h-3.5 mr-1.5" />
                                                        {selectedProvider?.providerCity}, {selectedProvider?.providerState}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-shrink-0 self-start">
                                                {displayedPrice && (
                                                    <div className="bg-white rounded-priceai p-4 shadow-md text-priceai-gray border border-priceai-blue/20 min-w-[180px]">
                                                        <div className="text-xs uppercase tracking-wide text-priceai-gray font-medium mb-1">Standard Charge</div>
                                                        <div className="text-2xl font-bold text-priceai-blue leading-tight">{displayedPrice}</div>
                                                        {/* Negotiated charge above savings, if available */}
                                                        {selectedProvider?.negotiateCharge > 0 && selectedProvider?.standardCharge > 0 && (
                                                            <>
                                                                <div className="text-xs uppercase tracking-wide text-priceai-green font-medium mt-3">Negotiated Price</div>
                                                                <div className="text-xl font-bold text-priceai-green leading-tight">{formatCurrency(selectedProvider.negotiateCharge)}</div>
                                                                <div className="text-xs text-priceai-green mt-1 flex items-center gap-1">
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                    You saved {formatCurrency(selectedProvider.standardCharge - selectedProvider.negotiateCharge)}
                                                                    <span className="ml-1">(
                                                                        {((selectedProvider.standardCharge - selectedProvider.negotiateCharge) / selectedProvider.standardCharge * 100).toFixed(0)}%
                                                                        )
                                                                    </span>
                                                                </div>
                                                            </>
                                                        )}
                                                        
                                                        {/* Booking Button */}
                                                        <Button
                                                            className="w-full mt-4 bg-gradient-to-r from-priceai-blue to-priceai-lightblue hover:from-priceai-blue/90 hover:to-priceai-lightblue/90 text-white font-medium py-2.5 rounded-priceai transition-all duration-200 shadow-md hover:shadow-lg"
                                                            onClick={() => setShowBookingModal(true)}
                                                        >
                                                            <Calendar className="w-4 h-4 mr-2" />
                                                            Book Appointment
                                                        </Button>
                                                    </div>
                                                )}
                                                {!displayedPrice && hasValidStandardCharge === false && (
                                                    <div className="bg-white/10 rounded-priceai p-4 border border-white/20 min-w-[180px]">
                                                        <div className="text-xs uppercase tracking-wide text-white/80 font-medium mb-1">Standard Charge</div>
                                                        <div className="text-lg font-semibold text-white/80">Not Available</div>
                                                        
                                                        {/* Booking Button for no-price providers */}
                                                        <Button
                                                            className="w-full mt-4 bg-white/20 hover:bg-white/30 text-white font-medium py-2.5 rounded-priceai transition-all duration-200 border border-white/30"
                                                            onClick={() => setShowBookingModal(true)}
                                                        >
                                                            <Calendar className="w-4 h-4 mr-2" />
                                                            Book Appointment
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-6 bg-gradient-to-b from-priceai-lightgray/30 to-white">
                                        <div className="grid grid-cols-1 gap-6">
                                            <h4 className="font-medium text-priceai-dark flex items-center">
                                                <MapPin className="w-4 h-4 mr-2 text-priceai-blue" />
                                                Location Details
                                            </h4>
                                            <div className="space-y-1 text-priceai-gray pl-6">
                                                <div className="flex items-start">
                                                    <div>
                                                        <div className="font-medium">{selectedProvider?.providerAddress}</div>
                                                        <div>{selectedProvider?.providerCity}, {selectedProvider?.providerState} {selectedProvider?.providerZip}</div>
                                                    </div>
                                                </div>

                                                <a href={`https://maps.google.com/?q=${selectedProvider?.providerLat || ''}, ${selectedProvider?.providerLng || ''}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-priceai-blue hover:text-priceai-blue/80 transition-colors mt-2 text-sm">
                                                    <MapPin className="w-3.5 h-3.5 mr-1.5" />
                                                    View on map
                                                </a>
                                            </div>


                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Insurance plans card */}
                                <Card className="overflow-hidden shadow-sm border border-priceai-lightgray/50">
                                    <CardHeader
                                        className="bg-white w-full flex-row py-5 px-6 border-b border-priceai-lightgray/30 cursor-pointer select-none flex items-center justify-between"
                                        onClick={() => setInsuranceCollapsed((prev) => !prev)}
                                        role="button"
                                        tabIndex={0}
                                        aria-expanded={!insuranceCollapsed}
                                    >
                                        <div className="flex items-center w-fit">
                                            <div className="bg-priceai-blue/10 p-2 rounded-full mr-3">
                                                <TrendingUp className="w-5 h-5 text-priceai-blue" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl text-priceai-dark flex items-center">
                                                    Insurance Plans
                                                    <span className={`ml-2 transition-transform ${insuranceCollapsed ? 'rotate-90' : ''}`}>
                                                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8L10 12L14 8" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                    </span>
                                                </CardTitle>
                                                <CardDescription className="text-priceai-gray text-sm mt-1">
                                                    Compare insurance options for this provider
                                                </CardDescription>
                                            </div>
                                        </div>
                                        {recommendedPlans && sortedFilteredPlans.length !== 0 && !insuranceLoading && (
                                            <div className='w-fit'>
                                                <Badge className="bg-priceai-green/10 text-priceai-green border-none px-3 py-1.5">
                                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                                    AI Recommendations Available
                                                </Badge>
                                            </div>
                                        )}
                                    </CardHeader>
                                    {/* Collapsible content */}
                                    <div
                                        className={`transition-all duration-300 overflow-hidden ${insuranceCollapsed ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-[2000px] opacity-100'}`}
                                        aria-hidden={insuranceCollapsed}
                                    >
                                        <CardContent className="p-0">
                                            {/* Custom filtering UI */}
                                            <div className="border-b px-6 py-4 bg-white">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex items-center">
                                                        <Badge className="bg-priceai-blue/10 text-priceai-blue border-none px-2 py-1 mr-2">
                                                            <Search className="w-3.5 h-3.5 mr-1.5" />
                                                            AI Assistant
                                                        </Badge>
                                                        <span className="text-sm font-medium text-priceai-dark">Find your best plan</span>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="w-[200px]">
                                                            <Select
                                                                options={[
                                                                    { label: "All Considerations", value: "all" },
                                                                    { label: "Lowest Price", value: "lowest-price" },
                                                                    { label: "Best Benefits", value: "best-benefits" },
                                                                    { label: "In-Network Only", value: "in-network" },
                                                                    { label: "Custom Filters", value: "custom" }
                                                                ]}
                                                                value={selectRecommendFilter}
                                                                onChange={setSelectRecommendFilter}
                                                                placeholder="Select criteria"
                                                                className="text-sm"
                                                            />
                                                        </div>

                                                        <Button
                                                            size="sm"
                                                            className="bg-gradient-to-r py-4 from-priceai-blue to-priceai-lightblue text-white hover:opacity-90"
                                                            disabled={loadingRecommendation}
                                                            onClick={handleRecommendBest}
                                                        >
                                                            {loadingRecommendation ? (
                                                                <>
                                                                    <span className="animate-pulse mr-2">● ● ●</span>
                                                                    Analyzing...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Star className="w-4 h-4 mr-2" />
                                                                    Recommend Best
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>

                                                {selectRecommendFilter === 'custom' && (
                                                    <div className="mt-4 p-3 bg-priceai-lightgray/20 rounded-priceai border border-priceai-lightgray/30">
                                                        <div className="flex items-center mb-2">
                                                            <Filter className="w-4 h-4 mr-2 text-priceai-blue" />
                                                            <span className="text-sm font-medium text-priceai-dark">Customize your recommendation</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-3 mt-2">
                                                            <label className="flex items-center bg-white px-3 py-1.5 rounded-full border border-priceai-lightgray/50 hover:border-priceai-blue/30 transition-colors cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    className="rounded text-priceai-blue mr-2"
                                                                    checked={customFilters.includes('price')}
                                                                    onChange={(e) => handleFilterChange('price', e.target.checked)}
                                                                />
                                                                <span className="text-sm">Price</span>
                                                            </label>
                                                            <label className="flex items-center bg-white px-3 py-1.5 rounded-full border border-priceai-lightgray/50 hover:border-priceai-blue/30 transition-colors cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    className="rounded text-priceai-blue mr-2"
                                                                    checked={customFilters.includes('network')}
                                                                    onChange={(e) => handleFilterChange('network', e.target.checked)}
                                                                />
                                                                <span className="text-sm">Network Status</span>
                                                            </label>
                                                            <label className="flex items-center bg-white px-3 py-1.5 rounded-full border border-priceai-lightgray/50 hover:border-priceai-blue/30 transition-colors cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    className="rounded text-priceai-blue mr-2"
                                                                    checked={customFilters.includes('benefits')}
                                                                    onChange={(e) => handleFilterChange('benefits', e.target.checked)}
                                                                />
                                                                <span className="text-sm">Rich Benefits</span>
                                                            </label>
                                                            <label className="flex items-center bg-white px-3 py-1.5 rounded-full border border-priceai-lightgray/50 hover:border-priceai-blue/30 transition-colors cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    className="rounded text-priceai-blue mr-2"
                                                                    checked={customFilters.includes('savings')}
                                                                    onChange={(e) => handleFilterChange('savings', e.target.checked)}
                                                                />
                                                                <span className="text-sm">Maximum Savings</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {recommendedPlans && (
                                                <div className="px-6 py-4 bg-priceai-blue/5 border-b">
                                                    <div className="flex items-center mb-3">
                                                        <Star className="w-5 h-5 text-priceai-blue mr-2" />
                                                        <h3 className="text-lg font-medium text-priceai-dark">AI Recommendation</h3>
                                                    </div>
                                                    <div
                                                        className="bg-white p-5 rounded-lg shadow-sm text-priceai-dark border border-priceai-blue/10"
                                                        dangerouslySetInnerHTML={{
                                                            __html: String(recommendedPlans || "")
                                                                .replace(/\*\*(.*?)\*\*/g, (_, text) => {
                                                                    return `<strong class="text-priceai-blue">${text}</strong>`;
                                                                })
                                                                .replace(/₹([\d,]+(\.\d+)?)/g, (match) => {
                                                                    return `<span class="text-priceai-green font-semibold">${match}</span>`;
                                                                })
                                                                .replace(/(\d+)%/g, (match) => {
                                                                    return `<span class="text-priceai-blue font-semibold">${match}</span>`;
                                                                })
                                                                .replace(/(in-network)/g, (match) => {
                                                                    return `<span class="bg-priceai-green/20 rounded-full text-priceai-green px-2 py-0.5 text-sm font-medium">${match}</span>`;
                                                                })
                                                                .replace(/(out-of-network)/g, (match) => {
                                                                    return `<span class="bg-red-500/10 rounded-full text-red-500 px-2 py-0.5 text-sm font-medium">${match}</span>`;
                                                                })
                                                                .replace(/\n/g, "<br />")
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            <div className="px-6 pt-4 pb-2">
                                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                                                        <TabsList className="grid w-full md:w-[300px] grid-cols-3 bg-priceai-lightgray/20">
                                                            <TabsTrigger
                                                                value="all"
                                                                className="data-[state=active]:bg-white data-[state=active]:text-priceai-blue data-[state=active]:shadow-sm"
                                                            >
                                                                All Plans
                                                            </TabsTrigger>
                                                            <TabsTrigger
                                                                value="in-network"
                                                                className="data-[state=active]:bg-white data-[state=active]:text-priceai-blue data-[state=active]:shadow-sm"
                                                            >
                                                                In-Network
                                                            </TabsTrigger>
                                                            <TabsTrigger
                                                                value="out-of-network"
                                                                className="data-[state=active]:bg-white data-[state=active]:text-priceai-blue data-[state=active]:shadow-sm"
                                                            >
                                                                Out-Network
                                                            </TabsTrigger>
                                                        </TabsList>
                                                    </Tabs>

                                                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleSort('insuranceName')}
                                                            className={`text-xs border-priceai-lightgray/50 ${sortBy === "insuranceName" ? "bg-priceai-blue/5 border-priceai-blue/20 text-priceai-blue" : ""}`}
                                                        >
                                                            Name {sortBy === "insuranceName" && (
                                                                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleSort('negotiateCharge')}
                                                            className={`text-xs border-priceai-lightgray/50 ${sortBy === "negotiateCharge" ? "bg-priceai-blue/5 border-priceai-blue/20 text-priceai-blue" : ""}`}
                                                        >
                                                            Price {sortBy === "negotiateCharge" && (
                                                                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleSort('inNetwork')}
                                                            className={`text-xs border-priceai-lightgray/50 ${sortBy === "inNetwork" ? "bg-priceai-blue/5 border-priceai-blue/20 text-priceai-blue" : ""}`}
                                                        >
                                                            Network {sortBy === "inNetwork" && (
                                                                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>

                                                <Separator className="mb-4" />

                                                {/* Insurance Plans Grid */}
                                                {insuranceLoading ? (
                                                    <div className="px-6 pb-6">
                                                        {/* Loading Header */}
                                                        <div className="flex items-center justify-center py-8 mb-6">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-priceai-blue"></div>
                                                                <span className="text-lg font-medium text-priceai-blue">Loading Insurance Plans...</span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Skeleton Cards Grid */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                            {Array.from({ length: 6 }).map((_, idx) => (
                                                                <div key={idx} className="bg-white border border-priceai-lightgray/30 rounded-lg p-4 flex flex-col h-full shadow-sm">
                                                                    {/* Header with badges */}
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <Skeleton className="h-6 w-24 rounded-full bg-gradient-to-r from-priceai-lightgray/40 to-priceai-lightgray/20 animate-pulse" />
                                                                        <Skeleton className="h-6 w-20 rounded-full bg-gradient-to-r from-priceai-blue/20 to-priceai-blue/10 animate-pulse" />
                                                                    </div>
                                                                    
                                                                    {/* Title and subtitle */}
                                                                    <Skeleton className="h-6 w-[80%] mb-2 bg-gradient-to-r from-priceai-lightgray/40 to-priceai-lightgray/20 animate-pulse" />
                                                                    <Skeleton className="h-4 w-[60%] mb-4 bg-gradient-to-r from-priceai-lightgray/30 to-priceai-lightgray/10 animate-pulse" />
                                                                    
                                                                    {/* Pricing section */}
                                                                    <div className="bg-priceai-lightgray/10 rounded-lg p-4 border border-priceai-lightgray/20 flex-1 flex flex-col justify-end">
                                                                        <div className="flex justify-between items-end mb-3">
                                                                            <Skeleton className="h-8 w-24 bg-gradient-to-r from-priceai-green/20 to-priceai-green/10 animate-pulse" />
                                                                            <Skeleton className="h-6 w-20 bg-gradient-to-r from-priceai-lightgray/30 to-priceai-lightgray/10 animate-pulse" />
                                                                        </div>
                                                                        <Skeleton className="h-3 w-full rounded-full mt-4 bg-gradient-to-r from-priceai-blue/20 to-priceai-blue/10 animate-pulse" />
                                                                        <div className="flex justify-between mt-2">
                                                                            <Skeleton className="h-4 w-20 bg-gradient-to-r from-priceai-lightgray/30 to-priceai-lightgray/10 animate-pulse" />
                                                                            <Skeleton className="h-4 w-20 bg-gradient-to-r from-priceai-lightgray/30 to-priceai-lightgray/10 animate-pulse" />
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Action button */}
                                                                    <Skeleton className="h-10 w-[70%] mt-3 rounded-md bg-gradient-to-r from-priceai-blue/20 to-priceai-blue/10 animate-pulse" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (sortedFilteredPlans.length === 0 && !insuranceLoading) ? (
                                                    <div className="text-center py-12 bg-priceai-lightgray/10 rounded-lg mx-6 mb-6 border border-priceai-lightgray/30">
                                                        <div className="flex justify-center mb-4">
                                                            <Lightbulb className="w-16 h-16 text-priceai-gray/50" />
                                                        </div>
                                                        <h3 className="text-lg font-medium text-priceai-dark mb-2">No Insurance Plans Available</h3>
                                                        <p className="text-priceai-gray max-w-md mx-auto">
                                                            No insurance plans were found for this provider and service. Please contact the provider directly for pricing information.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                                                        {sortedFilteredPlans.map((plan: any, idx: number) => {
                                                            const isInNetwork = typeof plan.inNetwork === "string"
                                                                ? plan.inNetwork.toLowerCase() === "true"
                                                                : Boolean(plan.inNetwork);
                                                            const negotiatedPrice = plan.negotiateCharge ?? 0;
                                                            const standardCharge = hasValidStandardCharge ? plan?.standardCharge : 0;

                                                            let savingsAmount = 0;
                                                            let savingsPercent = "0";

                                                            if (isInNetwork && negotiatedPrice && standardCharge) {
                                                                savingsAmount = standardCharge - negotiatedPrice;
                                                                savingsPercent = ((savingsAmount / standardCharge) * 100).toFixed(0);
                                                            }



                                                            return (
                                                                <Card
                                                                    key={plan.id}
                                                                    className={`overflow-hidden border h-full flex flex-col ${isInNetwork
                                                                        ? "border-priceai-green/20 hover:border-priceai-green/40"
                                                                        : "border-red-400/20 hover:border-red-400/40"
                                                                        } hover:shadow-md transition-all`}
                                                                >
                                                                    <div className="p-4 flex flex-col h-full">
                                                                        {/* Header with badges */}
                                                                        <div className="flex items-center justify-between mb-3 gap-1">
                                                                            {(isInNetwork) ? (
                                                                                <Badge className="bg-priceai-green/10 text-priceai-green border-none">
                                                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                                    In-Network
                                                                                </Badge>
                                                                            ) : (
                                                                                <Badge className="bg-red-500/10 text-red-500 border-none">
                                                                                    <XCircle className="w-3 h-3 mr-1" />
                                                                                    Out-of-Network
                                                                                </Badge>
                                                                            )}

                                                                            {plan.insurance_benefits && plan.insurance_benefits.length > 0 && (
                                                                                <TooltipProvider>
                                                                                    <Tooltip>
                                                                                        <TooltipTrigger asChild>
                                                                                            <Badge className="bg-priceai-blue/10 text-priceai-blue border-none cursor-pointer">
                                                                                                <Lightbulb className="w-3 h-3 mr-1" />
                                                                                                Benefits
                                                                                            </Badge>
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent className="max-w-xs p-3 bg-white shadow-lg border border-priceai-lightgray/30">
                                                                                            <h4 className="font-bold text-sm mb-2 text-priceai-dark">
                                                                                                Plan Benefits
                                                                                            </h4>
                                                                                            <ScrollArea className="h-fit">
                                                                                                <ul className="space-y-1.5 text-xs text-priceai-gray">
                                                                                                    {plan.insurance_benefits.map(
                                                                                                        (
                                                                                                            benefit: string,
                                                                                                            i: number
                                                                                                        ) => (
                                                                                                            <li
                                                                                                                key={i}
                                                                                                                className="flex items-start"
                                                                                                            >
                                                                                                                <CheckCircle2 className="h-3 w-3 text-priceai-green mr-1.5 mt-0.5" />
                                                                                                                {benefit}
                                                                                                            </li>
                                                                                                        )
                                                                                                    )}
                                                                                                </ul>
                                                                                            </ScrollArea>
                                                                                        </TooltipContent>
                                                                                    </Tooltip>
                                                                                </TooltipProvider>
                                                                            )}
                                                                        </div>


                                                                        {/* Plan details */}
                                                                        <div>
                                                                            <h3 className="text-lg font-medium text-priceai-dark">{plan.insurancePlan || "Insurance Plan"}</h3>
                                                                            <p className="text-priceai-gray text-sm">{plan.insuranceName || "Insurance Provider"}</p>
                                                                        </div>


                                                                        {/* Pricing section */}
                                                                        <div className="mt-4 bg-priceai-lightgray/10 rounded-lg p-4 border border-priceai-lightgray/20 flex-grow flex flex-col justify-between">
                                                                            <div className="flex flex-col items-start gap-3 mb-2">
                                                                                <div>
                                                                                    <div className="text-xs uppercase tracking-wide text-priceai-gray font-medium">Negotiated Price</div>
                                                                                    <div className={`text-2xl font-bold ${isInNetwork ? "text-priceai-blue" : "text-priceai-gray"} leading-tight`}>
                                                                                        {negotiatedPrice > 0 ? formatCurrency(negotiatedPrice) : "Not Available"}
                                                                                    </div>
                                                                                </div>
                                                                                {hasValidStandardCharge && (
                                                                                    <div className="flex flex-col items-start">
                                                                                        <p className="text-xs uppercase tracking-wide text-priceai-gray font-medium">Standard Charge</p>
                                                                                        <div className="flex flex-wrap items-center">
                                                                                            <p className={`text-sm text-priceai-gray ${isInNetwork && savingsAmount > 0 ? "line-through italic" : ""}`}>{formatCurrency(standardCharge)}</p>
                                                                                            {isInNetwork && savingsAmount > 0 && (
                                                                                                <span className="ml-2 bg-priceai-green/10 text-priceai-green text-xs font-semibold px-3 py-1 rounded-full border border-priceai-green/20">
                                                                                                    Save {savingsPercent}%
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                                {isInNetwork && savingsAmount > 0 && (
                                                                                    <div className="text-sm text-priceai-green font-medium mt-1">
                                                                                        You save {formatCurrency(savingsAmount)}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            {/* Price comparison bar */}
                                                                            {hasValidStandardCharge && negotiatedPrice > 0 && (
                                                                                <div className="mt-3">
                                                                                    <div className="text-xs font-medium text-priceai-dark mb-2">Price Comparison</div>
                                                                                    <Progress
                                                                                        value={Math.min(100, (negotiatedPrice / standardCharge) * 100)}
                                                                                        className={`h-2 overflow-hidden rounded-full ${isInNetwork ? "bg-priceai-gray/20" : "bg-red-400/10"}`}
                                                                                        style={{
                                                                                            "--progress-foreground": isInNetwork ? "#00B140" : "#ff6b6b",
                                                                                        } as React.CSSProperties}
                                                                                    />
                                                                                    <div className="flex justify-between text-xs text-priceai-gray mt-1">
                                                                                        <span className="flex items-center">
                                                                                            <span className="w-2 h-2 rounded-full bg-priceai-green mr-1 inline-block"></span>
                                                                                            Negotiated
                                                                                        </span>
                                                                                        <span className="flex items-center">
                                                                                            Standard
                                                                                            <span className="w-2 h-2 rounded-full bg-priceai-gray/50 ml-1 inline-block"></span>
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                        </div>


                                                                    </div>
                                                                </Card>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </div>
                                </Card>

                                {/* Reviews & Ratings Section */}
                                <Card className="overflow-hidden shadow-lg border border-priceai-lightgray/50 mt-10 rounded-2xl">
                                    {/* Gradient header for reviews */}
                                    <CardHeader className="bg-gradient-to-r from-priceai-blue to-priceai-lightblue py-6 px-6 border-b border-priceai-lightgray/30 rounded-t-2xl">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <CardTitle className="text-xl text-white">Patient Reviews & Ratings</CardTitle>
                                                <CardDescription className="text-white/90 text-sm mt-1">
                                                    Read real patient feedback and ratings for this provider
                                                </CardDescription>
                                            </div>
                                            {/* Summary row (if ProviderRating exposes summary) */}
                                            <div className="flex items-center gap-3 mt-3 md:mt-0">
                                                {/* If ProviderRating exposes summary props, render here. Example: */}
                                                {/* <ProviderRating.Summary provider={selectedProvider} service={selectedService} /> */}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <div className="space-y-6 px-5 py-2">
                                        <ProviderRating
                                            provider={selectedProvider}
                                            service={selectedService}
                                        />
                                    </div>

                                </Card>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </div>
            
            {/* Appointment Booking Modal */}
            {showBookingModal && (
                <AppointmentBooking
                    provider={selectedProvider}
                    service={selectedService}
                    isOpen={showBookingModal}
                    isSelfPay={{
                        isSelfPay: !selectedProvider?.negotiateCharge || selectedProvider?.negotiateCharge === 0,
                        negotiateCharge: selectedProvider?.negotiateCharge,
                        standardCharge: selectedProvider?.standardCharge
                    }}
                    onClose={() => setShowBookingModal(false)}
                />
            )}
        </div>
    );
}

export default ViewHospitalDetails;