'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLocationContext } from '../../context/LocationContext';
import { usePriceaiContext } from '../../context/PriceaiContext';
import { formatCurrency, formatDistance } from '../../lib/utils';
import { generateCompareProvidersRecommendation } from '../../services/Recommendation';
import {
  ArrowLeft,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  BotMessageSquare,
  Star,
  Columns3,
  ArrowUp,
  Shield,
  CheckCircle2,
  LayoutGrid,
  Navigation,
  MapPin,
  Phone,
  XCircle
} from 'lucide-react';
import Chatbot from '../chat/Chatbot';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Table } from '../ui/table';
import { Progress } from '../ui/progress';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import FilterSidebar from './FilterSidebar';


function CompareHospitalInsuranceDetails() {

  const { myCurrentLocation, selectedLocation } = useLocationContext();
  const { compareProviders, selectedService, selectedProvider, setOpenCompareProvider, setSelectedProvider } = usePriceaiContext();

  const [visibleColumns, setVisibleColumns] = useState<{
    [key: string]: boolean;
  }>({
    provider: true,
    insurance: true,
    plan: true,
    networkStatus: true,
    savings: true,
    negotiatedPrice: true,
    standardCharge: true,
    distance: true,
    benefits: true,
  });

  const [customFilters, setCustomFilters] = useState<string[]>([]);
  const [selectRecommendFilter, setSelectRecommendFilter] =
    useState<string>("all-factors");
  const [networkFilter, setNetworkFilter] = useState<string>('all');

  const [recommendedPlans, setRecommendedPlans] = useState<string>("");
  const [showRecommendation, setShowRecommendation] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [insurance, setInsurance] = useState<any[]>([]);
  const [insuranceError, setInsuranceError] = useState<any>(null);
  const [selectedInsurance, setSelectedInsurance] = useState<string>("all");
  const [insuranceOptions, setInsuranceOptions] = useState<string[]>([]);
  const [providersWithPricing, setProvidersWithPricing] = useState<any>([]);
  const [showSidebar, setShowSidebar] = useState(true);


  const [loadingRecommendation, setLoadingRecommendation] =
    useState<boolean>(false);
  const [insuranceLoading, setInsuranceLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [showChatBot, setShowChatBot] = useState<boolean>(false);


  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleCustomFilterChange = (filterKey: string, isChecked: boolean) => {
    setCustomFilters((prevFilters: any) => {
      if (isChecked) {
        return [...prevFilters, filterKey];
      } else {
        return prevFilters.filter((key: string) => key !== filterKey);
      }
    });
  };


  const filterPricingByInsurance = (pricing: any) => {
    if (!pricing || !Array.isArray(pricing)) {
      return [];
    }

    if (selectedInsurance === "all") {
      return [...pricing];
    }

    if (selectedInsurance === "No Insurance") {
      return pricing.filter((price: any) => price.inNetwork === null);
    }

    return pricing.filter(
      (price: any) => price.insuranceName === selectedInsurance
    );
  };

  const filterByNetworkStatus = (pricing: any) => {
    if (!pricing || !Array.isArray(pricing)) {
      return [];
    }

    if (networkFilter === 'all') {
      return [...pricing];
    } else if (networkFilter === "in-network") {
      return pricing.filter((price: any) => price.inNetwork === true);
    } else if (networkFilter === "out-network") {
      return pricing.filter((price: any) => price.inNetwork === false);
    }

    return [...pricing];
  }

  // Prepare data for the table
  const tableData = useMemo(() => {
    let items: any[] = [];
    providersWithPricing.forEach((provider: any) => {
      const filteredInsurances = filterByNetworkStatus(filterPricingByInsurance(provider.insurance));
      items = items.concat(filteredInsurances.map((insurance: any) => ({ provider, insurance })));
    });

    // Apply sorting to items if sortConfig exists
    if (sortConfig) {
      items.sort((a, b) => {
        const key = sortConfig.key;
        let aValue, bValue;

        switch (key) {
          case "providerName":
            aValue = a.provider.providerName;
            bValue = b.provider.providerName;
            break;
          case "distance":
            aValue = a.provider.distance || 0;
            bValue = b.provider.distance || 0;
            break;
          case "standardCharge":
            aValue = a.provider.standardCharge || 0;
            bValue = b.provider.standardCharge || 0;
            break;
          default:
            return 0;
        }

        const compareResult = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        return sortConfig.direction === "asc" ? compareResult : -compareResult;
      });
    }

    return items;
  }, [providersWithPricing, filterByNetworkStatus, filterPricingByInsurance, networkFilter, selectedInsurance, sortConfig]);



  const sortedProviders = useMemo(() => {
    if (!sortConfig || !providersWithPricing.length)
      return providersWithPricing;

    return [...providersWithPricing].sort((a, b) => {
      // // // console.log("providersWithPricing: ",providersWithPricing)
      const key = sortConfig.key;
      let aValue, bValue;

      switch (key) {
        case "providerName":
          aValue = a.providerName;
          bValue = b.providerName;
          break;
        case "distance":
          aValue = a.distance || 0;
          bValue = b.distance || 0;
          break;
        case "standardCharge":
          aValue = a.standardCharge || 0;
          bValue = b.standardCharge || 0;
          break;
        default:
          return 0;
      }

      const compareResult = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      return sortConfig.direction === "asc" ? compareResult : -compareResult;
    });
  }, [providersWithPricing, sortConfig, selectedLocation, myCurrentLocation]);


  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);


  const providerIds = compareProviders.map((provider: any) => provider.id);


  useEffect(() => {
    const fetchInsuranceData = async () => {
      if (!providerIds.length || !selectedService?.id) {
        setInsuranceLoading(false);
        return;
      }

      try {
        setInsuranceLoading(true);

        const apiUrl = process.env.NEXT_PUBLIC_REST_API_URL || '';
        const apiPrefix = process.env.NEXT_PUBLIC_REST_API_PREFIX || '';
        const apiVersion = process.env.NEXT_PUBLIC_REST_API_VERSION || '';
        const baseUrl = `${apiUrl}${apiPrefix}/${apiVersion}/insurance/multiple-providers-service/${providerIds.join(',')}/${selectedService?.id}`;

        const url = new URL(baseUrl);
        url.searchParams.append('provider_ids', providerIds.join(','));
        url.searchParams.append('service_id', selectedService?.id);

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error('Failed to fetch insurance data');
        }

        const data = await response.json();
        // // // console.log("All Compare Insurance: ", data)
        setInsurance(data);
      } catch (error) {
        console.error('Error fetching insurance data:', error);
        setInsuranceError(error);
      } finally {
        setInsuranceLoading(false);
      }
    };

    fetchInsuranceData();
  }, [providerIds.join(','), selectedService?.id]); // Only re-fetch when provider IDs or service ID change

  // Process the insurance data when it's loaded
  useEffect(() => {
    if (insurance) {
      const allInsurances = new Set();
      const updatedProviders = compareProviders.map((provider: any) => {
        const providerInsurance = insurance.filter(
          (ins: any) => ins.provider_id === provider.id
        );

        const insurancePlans = providerInsurance.map((ins: any) => ({
          id: ins.pricing_id,
          inNetwork: (ins.in_network) === 'true' ? true : (ins.in_network) === 'false' ? false : null,
          providerId: ins.provider_id,
          serviceId: ins.service_id,
          insuranceId: ins.insurance_id,
          insuranceName: ins.insurance_name,
          insurancePlan: ins.insurance_plan,
          negotiateCharge: ins.negotiated_price,
          standardCharge: ins.standard_charge,
          insuranceBenefits: ins.insurance_benefits,
          insurance_benefits:
            typeof ins.insurance_benefits === "string"
              ? ins.insurance_benefits
                .split(",")
                .map((b: string) => b.trim())
                .filter((b: string) => b)
              : [],
          in_network: ins.in_network,
          negotiated_price: ins.negotiated_price,
          standard_charge: ins.standard_charge,
        }));

        insurancePlans.forEach((plan: any) => {
          if (plan.insuranceName) {
            allInsurances.add(plan.insuranceName);
          }
          if (plan.inNetwork === null || plan.inNetwork === undefined) {
            allInsurances.add("No Insurance");
          }
        });

        return { ...provider, insurance: insurancePlans };
      });

      setProvidersWithPricing(updatedProviders);
      setInsuranceOptions(Array.from(allInsurances) as string[]);
    }
    setLoading(false);
  }, [insurance, selectedProvider]);


  const generateRecommendation = async () => {
    setLoadingRecommendation(true);

    try {
      const filterDetails =
        selectRecommendFilter === "custom"
          ? `Custom Filters: ${customFilters.join(", ")}`
          : `${selectRecommendFilter}`;

      const result = await generateCompareProvidersRecommendation({
        filterDetails,
        selectedService,
        providersWithPricing
      });

      if (result.success && result.data) {
        setRecommendedPlans(result.data);
        setShowRecommendation(true);
      } else {
        console.error("Error generating recommendation:", result.error);
        setRecommendedPlans("Failed to generate recommendation. Please try again.");
      }
    } catch (error) {
      console.error("Error generating recommendation:", error);
      setRecommendedPlans("Failed to generate recommendation. Please try again.");
    } finally {
      setLoadingRecommendation(false);
    }
  };


  // console.log("providersWithPricing: ", providersWithPricing)

  return (
    <div className="fixed inset-0 bg-black/30 z-[49] flex justify-end">
      <div className="bg-white h-full w-full animate-in slide-in-from-right duration-500">
        <ScrollArea className="h-full w-full">
          <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between border-priceai-lightgray bg-gradient-to-r from-priceai-blue to-priceai-lightblue shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpenCompareProvider(false)}
                className="text-white hover:text-white hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to results
              </Button>
              <h3 className="text-white font-medium text-xl">Compare Hospitals</h3>
              <div className="w-[154px]">
                {/* Empty div for flex alignment */}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              {/* Service Details Card */}
              <div className="sizer">

                <Card className="mb-6 overflow-hidden shadow-lg border-priceai-blue/20">
                  <CardHeader className="bg-gradient-to-r from-priceai-blue to-priceai-lightblue p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-2xl text-white inline-flex items-center gap-2">
                          {selectedService.service_name}{" "}
                          <Badge variant="outline" className="bg-priceai-lightblue/30 text-white border-white/10 ml-2">
                            {selectedService.setting || "Medical Service"}
                          </Badge>
                          <Badge variant="outline" className="bg-priceai-lightblue/30 text-white border-white/10 ml-2">
                            {selectedService.service_category || "General"}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-white/90 mt-1">
                          {selectedService.service_description ||
                            "Compare pricing and insurance across providers"}
                        </CardDescription>
                      </div>
                      <div className="bg-white/10 rounded-priceai p-4 text-white">
                        <div className="text-sm font-medium">Comparing</div>
                        <div className="text-2xl font-bold">
                          {compareProviders?.length} Hospitals
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
                {/* Main comparison interface */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left sidebar - filtering options */}
                  <div className="lg:col-span-3 border-r border-priceai-gray/50">
                    <FilterSidebar
                      selectRecommendFilter={selectRecommendFilter}
                      setSelectRecommendFilter={setSelectRecommendFilter}
                      customFilters={customFilters}
                      handleCustomFilterChange={handleCustomFilterChange}
                      loadingRecommendation={loadingRecommendation}
                      generateRecommendation={generateRecommendation}
                      selectedInsurance={selectedInsurance}
                      setSelectedInsurance={setSelectedInsurance}
                      insuranceOptions={insuranceOptions}
                      networkFilter={networkFilter}
                      setNetworkFilter={setNetworkFilter}
                      viewMode={viewMode}
                      setViewMode={setViewMode}
                      visibleColumns={visibleColumns}
                      setVisibleColumns={setVisibleColumns}
                    />
                  </div>

                  {/* Floating sidebar toggle button */}
                  {!showSidebar && (
                    <button
                      className="fixed left-4 top-24 z-[60] bg-white border border-priceai-lightgray shadow-lg rounded-full p-3 hover:bg-priceai-blue/10 transition-all duration-200 hover:scale-105"
                      onClick={() => setShowSidebar(true)}
                      aria-label="Open filters"
                    >
                      <SlidersHorizontal className="w-6 h-6 text-priceai-blue" />
                    </button>
                  )}

                  {/* Main content - comparison table or cards */}
                  <div className="lg:col-span-9">
                    {/* Recommendation section - collapsible */}
                    {recommendedPlans && (
                      <Card className="overflow-hidden shadow-sm border border-priceai-lightgray/50 mb-6">
                        <CardHeader
                          className="bg-priceai-blue/5 py-4 px-6 border-b border-priceai-lightgray/30 cursor-pointer hover:bg-priceai-blue/10 transition-colors"
                          onClick={() => setShowRecommendation(!showRecommendation)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Star className="w-5 h-5 text-priceai-blue mr-2" />
                              <CardTitle className="text-lg text-priceai-dark">AI Recommendation</CardTitle>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-priceai-blue hover:bg-priceai-blue/10"
                            >
                              {showRecommendation ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        {showRecommendation && (
                          <CardContent className="p-6">
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
                          </CardContent>
                        )}
                      </Card>
                    )}

                    {insuranceLoading ? (
                      <Card className="overflow-hidden shadow-sm border border-priceai-lightgray/50">
                        <CardContent className="p-6">
                          <div className="flex justify-center items-center h-40">
                            <div className="text-center">
                              <div className="animate-pulse mr-2 text-priceai-blue text-4xl mb-4">● ● ●</div>
                              <p className="text-priceai-gray">
                                Loading provider comparison data...
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : viewMode === "table" ? (
                      <Card className="overflow-hidden shadow-sm border border-priceai-lightgray/50">
                        <CardHeader className="bg-white py-4 px-6 border-b border-priceai-lightgray/30">
                          <div className="flex items-center">
                            <div className="bg-priceai-blue/10 p-2 rounded-full mr-3">
                              <Columns3 className="w-5 h-5 text-priceai-blue" />
                            </div>
                            <div>
                              <CardTitle className="text-lg text-priceai-dark">Comparison Table</CardTitle>
                              <CardDescription className="text-priceai-gray text-sm mt-1">
                                Compare insurance plans across providers
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <Table
                            data={tableData}
                            columns={[
                              {
                                id: 'provider',
                                header: 'Hospital',
                                accessor: (row: any) => (
                                  <div>
                                    <div
                                      className="font-medium text-priceai-blue mb-1 underline cursor-pointer hover:text-priceai-lightblue line-clamp-3"
                                      onClick={() => setSelectedProvider({ ...row.provider, ...selectedService, service_id: selectedService?.id, provider_id: row.provider.id })}
                                    >
                                      {row.provider.providerName}
                                    </div>
                                  </div>
                                ),
                                sortable: true,
                                sticky: true,
                                width: '200px',
                                className: 'sticky left-0 bg-white z-10 border-r border-priceai-lightgray/30'
                              },
                              ...(visibleColumns.insurance ? [{
                                id: 'insurance',
                                header: 'Insurance',
                                accessor: (row: any) => row.insurance.insuranceName || "No Insurance",
                                sortable: true
                              }] : []),
                              ...(visibleColumns.plan ? [{
                                id: 'plan',
                                header: 'Plan',
                                accessor: (row: any) => row.insurance.insurancePlan || "-",
                                sortable: true
                              }] : []),
                              ...(visibleColumns.networkStatus ? [{
                                id: 'networkStatus',
                                header: 'Network Status',
                                accessor: (row: any) => (
                                  <Badge
                                    className={`text-nowrap ${row.insurance.inNetwork
                                      ? "bg-priceai-green/20 text-priceai-green border-priceai-green/30"
                                      : "bg-red-500/10 text-red-500 border-red-500/30"
                                      }`}
                                  >
                                    {row.insurance.inNetwork ? "In-Network" : "Out-of-Network"}
                                  </Badge>
                                ),
                                sortable: false,
                                className: 'text-nowrap'
                              }] : []),
                              ...(visibleColumns.negotiatedPrice ? [{
                                id: 'negotiatedPrice',
                                header: 'Your Price',
                                accessor: (row: any) => {
                                  const isInNetwork = row.insurance.inNetwork;
                                  const negotiatedPrice = row.insurance.negotiateCharge || row.provider.standardCharge || 0;
                                  return (
                                    <span className={`font-medium ${isInNetwork ? "text-priceai-green" : "text-red-500"}`}>
                                      {formatCurrency(negotiatedPrice)}
                                    </span>
                                  );
                                },
                                sortable: true
                              }] : []),
                              ...(visibleColumns.standardCharge ? [{
                                id: 'standardCharge',
                                header: 'Standard Price',
                                accessor: (row: any) => {
                                  const standardCharge = row.provider.standardCharge || 0;
                                  return standardCharge ? formatCurrency(standardCharge) : "-";
                                },
                                sortable: true
                              }] : []),
                              ...(visibleColumns.savings ? [{
                                id: 'savings',
                                header: 'Savings',
                                accessor: (row: any) => {
                                  const isInNetwork = row.insurance.inNetwork;
                                  const standardCharge = row.provider.standardCharge || 0;
                                  const negotiatedPrice = row.insurance.negotiateCharge || standardCharge;
                                  const savingsAmount = isInNetwork && standardCharge && negotiatedPrice
                                    ? standardCharge - negotiatedPrice
                                    : 0;
                                  const savingsPercent = standardCharge && savingsAmount
                                    ? ((savingsAmount / standardCharge) * 100).toFixed(0)
                                    : "0";

                                  return isInNetwork && savingsAmount > 0 ? (
                                    <div className="flex items-center">
                                      <ArrowUp className="h-3 w-3 mr-1.5 text-priceai-green" />
                                      <span className="font-medium text-priceai-green">
                                        {savingsPercent}% ({formatCurrency(savingsAmount)})
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-priceai-gray text-sm">-</span>
                                  );
                                },
                                sortable: false
                              }] : []),
                              ...(visibleColumns.distance ? [{
                                id: 'distance',
                                header: 'Distance',
                                accessor: (row: any) => {
                                  const distance = row.provider?.distance || 0;
                                  return (
                                    <span className="text-nowrap">
                                      {distance ? formatDistance(distance) : "N/A"}
                                    </span>
                                  );
                                },
                                sortable: true,
                                className: 'text-nowrap'
                              }] : []),
                              ...(visibleColumns.benefits ? [{
                                id: 'benefits',
                                header: 'Benefits',
                                accessor: (row: any) => {
                                  return row.insurance.insurance_benefits && row.insurance.insurance_benefits.length > 0 ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger className="text-xs text-priceai-blue hover:underline flex items-center">
                                          <Shield className="h-3.5 w-3.5 mr-1" />
                                          View {row.insurance.insurance_benefits.length} Benefits
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs p-3 bg-white shadow-lg border border-priceai-lightgray/30">
                                          <h4 className="font-bold text-sm mb-2 text-priceai-dark">Plan Benefits</h4>
                                          <ScrollArea className="h-fit">
                                            <ul className="space-y-1.5 text-xs text-priceai-gray">
                                              {row.insurance.insurance_benefits.map((benefit: string, i: number) => (
                                                <li key={i} className="flex items-start">
                                                  <CheckCircle2 className="h-3 w-3 text-priceai-green mr-1.5 mt-0.5" />
                                                  {benefit}
                                                </li>
                                              ))}
                                            </ul>
                                          </ScrollArea>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : (
                                    <span className="text-priceai-gray text-xs">No data</span>
                                  );
                                },
                                sortable: false,
                                width: '200px',
                                className: 'sticky left-0 bg-white z-10 border-r border-priceai-lightgray/30'

                              }] : [])
                            ].filter(Boolean)}
                            stickyColumns={['provider', "benefits"]}
                            sortableColumns={['insurance', 'plan', 'negotiatedPrice', 'standardCharge', 'distance']}
                            pagination={{
                              enabled: true,
                              pageSize: 10,
                              showSizeSelector: true
                            }}
                            loading={insuranceLoading}
                            emptyMessage="No insurance plans found for selected filters"
                            className="min-h-[400px]"
                          />
                        </CardContent>
                      </Card>
                    ) : (
                      // Card view implementation
                      <Card className="overflow-hidden shadow-sm border border-priceai-lightgray/50 mb-6">
                        <CardHeader className="bg-white py-4 px-6 border-b border-priceai-lightgray/30">
                          <div className="flex items-center">
                            <div className="bg-priceai-blue/10 p-2 rounded-full mr-3">
                              <LayoutGrid className="w-5 h-5 text-priceai-blue" />
                            </div>
                            <div>
                              <CardTitle className="text-lg text-priceai-dark">Hospital Cards</CardTitle>
                              <CardDescription className="text-priceai-gray text-sm mt-1">
                                Compare hospitals and their insurance plans
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {sortedProviders.map((provider: any) => (
                              <Card
                                key={provider.id}
                                className="overflow-hidden shadow-sm border border-priceai-lightgray/50 hover:shadow-md transition-all"
                              >
                                <CardHeader className="bg-gradient-to-r from-priceai-blue to-priceai-lightblue text-white p-4">
                                  <div className="flex justify-between">
                                    <div>
                                      <CardTitle
                                        className="text-lg underline cursor-pointer text-white"
                                        onClick={() => setSelectedProvider({ ...provider, provider_id: provider.id, service_id: selectedService?.id })}
                                      >
                                        {provider.providerName}
                                      </CardTitle>
                                    </div>
                                    <div className="flex items-start">
                                      <Badge className="bg-white/20 text-white border-transparent text-nowrap">
                                        <Navigation className="w-3 h-3 mr-1" />
                                        {formatDistance(
                                          provider.distance
                                        )}
                                      </Badge>
                                    </div>
                                  </div>
                                </CardHeader>

                                <CardContent className="p-0">
                                  <div className="p-4 border-b border-priceai-lightgray/20">
                                    <div className="flex justify-between items-center">
                                      <div className="text-sm text-priceai-dark space-y-1">
                                        <div className="flex items-center">
                                          <MapPin className="w-3.5 h-3.5 mr-1.5 text-priceai-blue" />
                                          <span className="line-clamp-1">
                                            {provider.providerAddress}
                                          </span>
                                        </div>
                                        <div className="flex items-center">
                                          <Phone className="w-3.5 h-3.5 mr-1.5 text-priceai-blue" />
                                          <span>
                                            {provider.providerPhone || "No phone available"}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-xs uppercase tracking-wide text-priceai-gray font-medium">
                                          Standard Charge
                                        </div>
                                        <div className="text-lg font-bold text-priceai-blue">
                                          {provider.standardCharge
                                            ? formatCurrency(provider.standardCharge)
                                            : "N/A"}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Insurance plans */}
                                  <div className="p-4">
                                    <div className="flex justify-between items-center mb-3">
                                      <h4 className="font-medium text-priceai-dark text-sm flex items-center">
                                        <Shield className="w-4 h-4 mr-1.5 text-priceai-blue" />
                                        Insurance Plans
                                      </h4>
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-priceai-lightgray/10 text-priceai-gray border-priceai-lightgray/30"
                                      >
                                        {
                                          filterPricingByInsurance(provider.insurance)
                                            .length
                                        }{" "}
                                        Plans
                                      </Badge>
                                    </div>

                                    {filterPricingByInsurance(provider.insurance).length >
                                      0 ? (
                                      <div className="space-y-3">
                                        {filterPricingByInsurance(provider.insurance)
                                          .slice(0, 3)
                                          .map((plan: any, planIdx: number) => {
                                            const isInNetwork = plan.inNetwork;
                                            const negotiatedPrice = plan.negotiateCharge;
                                            const standardCharge = provider.standardCharge;

                                            const savingsAmount =
                                              isInNetwork &&
                                                negotiatedPrice &&
                                                standardCharge
                                                ? standardCharge - negotiatedPrice
                                                : 0;

                                            const savingsPercent =
                                              standardCharge && savingsAmount
                                                ? (
                                                  (savingsAmount / standardCharge) *
                                                  100
                                                ).toFixed(0)
                                                : "0";

                                            return (
                                              <div
                                                key={`${provider.id}-${plan.id || planIdx}`}
                                                className={`p-3 rounded-priceai ${isInNetwork
                                                  ? "bg-priceai-green/10 border border-priceai-green/30"
                                                  : "bg-red-500/10 border border-red-500/30"
                                                  }`}
                                              >
                                                <div className="flex justify-between items-center mb-1">
                                                  <span className="text-sm font-medium truncate max-w-[60%]">
                                                    {plan.insuranceName || "No Insurance"}
                                                  </span>
                                                  {isInNetwork ? (
                                                    <Badge className="bg-priceai-green/20 text-priceai-green border-transparent px-2 py-0.5 text-xs">
                                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                                      In-Network
                                                    </Badge>
                                                  ) : (
                                                    <Badge
                                                      variant="outline"
                                                      className="bg-red-500/10 text-red-500 border-red-500/30 px-2 py-0.5 text-xs"
                                                    >
                                                      <XCircle className="w-3 h-3 mr-1" />
                                                      Out-of-Network
                                                    </Badge>
                                                  )}
                                                </div>

                                                {plan.insurancePlan && (
                                                  <div className="text-xs text-priceai-gray mb-2 truncate">
                                                    Plan: {plan.insurancePlan}
                                                  </div>
                                                )}

                                                <div className="flex justify-between items-center">
                                                  <span
                                                    className={`${isInNetwork
                                                      ? "text-priceai-green"
                                                      : "text-red-500"
                                                      } font-medium`}
                                                  >
                                                    {isInNetwork
                                                      ? formatCurrency(negotiatedPrice)
                                                      : "Out-of-network"}
                                                  </span>

                                                  {isInNetwork && savingsAmount > 0 && (
                                                    <div className="flex items-center text-priceai-green text-xs">
                                                      <ArrowUp className="w-3 h-3 mr-0.5" />
                                                      Save {savingsPercent}%
                                                    </div>
                                                  )}
                                                </div>

                                                {isInNetwork &&
                                                  standardCharge &&
                                                  negotiatedPrice && (
                                                    <div className="mt-2">
                                                      <Progress
                                                        value={
                                                          (negotiatedPrice /
                                                            standardCharge) *
                                                          100
                                                        }
                                                        className="h-1.5 bg-priceai-lightgray/20"
                                                        style={{
                                                          "--progress-foreground": "#00B140",
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
                                            );
                                          })}

                                        {filterPricingByInsurance(provider.insurance)
                                          .length > 3 && (
                                            <div>
                                              {selectedProvider === provider.id ? (
                                                <>
                                                  {filterPricingByInsurance(provider.insurance)
                                                    .slice(3)
                                                    .map((plan: any, planIdx: number) => {
                                                      const isInNetwork = plan.inNetwork;
                                                      const negotiatedPrice = plan.negotiateCharge;
                                                      const standardCharge = provider.standardCharge;

                                                      const savingsAmount = isInNetwork && negotiatedPrice && standardCharge
                                                        ? standardCharge - negotiatedPrice
                                                        : 0;

                                                      const savingsPercent = standardCharge && savingsAmount
                                                        ? ((savingsAmount / standardCharge) * 100).toFixed(0)
                                                        : "0";

                                                      return (
                                                        <div
                                                          key={`${provider.id}-extra-${plan.id || planIdx}`}
                                                          className={`p-3 rounded-priceai mt-3 ${isInNetwork
                                                            ? "bg-priceai-green/10 border border-priceai-green/30"
                                                            : "bg-red-500/10 border border-red-500/30"
                                                            }`}
                                                        >
                                                          <div className="flex justify-between items-center mb-1">
                                                            <span className="text-sm font-medium truncate max-w-[60%]">
                                                              {plan.insuranceName || "No Insurance"}
                                                            </span>
                                                            {isInNetwork ? (
                                                              <Badge className="bg-priceai-green/20 text-priceai-green border-transparent px-2 py-0.5 text-xs">
                                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                In-Network
                                                              </Badge>
                                                            ) : (
                                                              <Badge
                                                                variant="outline"
                                                                className="bg-red-500/10 text-red-500 border-red-500/30 px-2 py-0.5 text-xs"
                                                              >
                                                                <XCircle className="w-3 h-3 mr-1" />
                                                                Out-of-Network
                                                              </Badge>
                                                            )}
                                                          </div>
                                                          {plan.insurancePlan && (
                                                            <div className="text-xs text-priceai-gray mb-2 truncate">
                                                              Plan: {plan.insurancePlan}
                                                            </div>
                                                          )}
                                                          <div className="flex justify-between items-center">
                                                            <span
                                                              className={`${isInNetwork ? "text-priceai-green" : "text-red-500"
                                                                } font-medium`}
                                                            >
                                                              {isInNetwork ? formatCurrency(negotiatedPrice) : "Out-of-network"}
                                                            </span>
                                                            {isInNetwork && savingsAmount > 0 && (
                                                              <div className="flex items-center text-priceai-green text-xs">
                                                                <ArrowUp className="w-3 h-3 mr-0.5" />
                                                                Save {savingsPercent}%
                                                              </div>
                                                            )}
                                                          </div>
                                                          {isInNetwork && standardCharge && negotiatedPrice && (
                                                            <div className="mt-2">
                                                              <Progress
                                                                value={(negotiatedPrice / standardCharge) * 100}
                                                                className="h-1.5 bg-priceai-lightgray/20"
                                                                style={{
                                                                  "--progress-foreground": "#00B140",
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
                                                      );
                                                    })}
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full text-priceai-blue text-xs mt-3 hover:bg-priceai-blue/5"
                                                  // onClick={() => setSelectedProvider(null)}
                                                  >
                                                    Show less
                                                  </Button>
                                                </>
                                              ) : (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="w-full text-priceai-blue text-xs mt-3 hover:bg-priceai-blue/5"
                                                // onClick={() => setSelectedProvider(provider.id)}
                                                >
                                                  View {filterPricingByInsurance(provider.insurance).length - 3} more plans
                                                </Button>
                                              )}
                                            </div>
                                          )}
                                      </div>
                                    ) : (
                                      <div className="text-sm text-priceai-gray py-4 text-center bg-priceai-lightgray/10 rounded-priceai">
                                        No insurance data available for selected filter
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div
          className="fixed hover:cursor-pointer shadow-md bottom-10 bg-gradient-to-tr from-priceai-blue to-priceai-lightblue p-3 flex items-center justify-center w-16 h-16 rounded-full text-white right-20 z-50"
          onClick={() => setShowChatBot(true)}
          title="Ask AI about providers & insurance"
        >
          <BotMessageSquare size={29} />
        </div>

        {/* Chatbot Modal */}
        {typeof window !== "undefined" && (
          <Chatbot
            open={showChatBot}
            onClose={() => setShowChatBot(false)}
            providers={providersWithPricing}
            service={selectedService}
          />
        )}

      </div>
    </div >
  )
}

export default CompareHospitalInsuranceDetails