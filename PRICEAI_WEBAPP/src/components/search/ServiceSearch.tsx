"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { PlusCircleIcon, PlusSquareIcon, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { useLocationContext } from "@/context/LocationContext";
import { usePriceaiContext } from "@/context/PriceaiContext";
import { Input } from "../ui/input";
import Loader from "../ui/Loader";


const HealthcareServiceSearch: React.FC = () => {
    // --- Context ---
    const { myCurrentLocation, selectedLocation } = useLocationContext();
    const { setSelectedService } = usePriceaiContext();

    // --- State ---
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [allCategorizedServices, setAllCategorizedServices] = useState<any>({});
    const [filteredCategorizedServices, setFilteredCategorizedServices] = useState<any>({});
    const dropdownRef = useRef<HTMLDivElement>(null);

    // --- Data Fetching ---
    const location = selectedLocation || myCurrentLocation;

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);


    useEffect(() => {
        const fetchServices = async () => {
            if (!location?.city || !location?.state) {
                setAllCategorizedServices({});
                setFilteredCategorizedServices({});
                return;
            }
            try {
                setIsLoading(true);
                const response = await axios.get(`${process.env.NEXT_PUBLIC_REST_API_URL}${process.env.NEXT_PUBLIC_REST_API_PREFIX}/${process.env.NEXT_PUBLIC_REST_API_VERSION}/services/location`, {
                    params: {
                        city: location.city,
                        state: location.state,
                    },
                });
                const services = response.data || [];

                const categorized: any = {};
                services.forEach((service: any) => {
                    const category = service.service_category || "Other";
                    if (!categorized[category]) categorized[category] = [];
                    categorized[category].push({
                        ...service,
                        serviceName: service.service_name,
                        serviceCode: service.service_code,
                        serviceCategory: service.service_category,
                        id: service.service_id,
                    });
                });
                // Sort categories and services
                const sortedCategories = Object.keys(categorized).sort();
                const sortedCategorizedServices: any = {};
                sortedCategories.forEach(category => {
                    categorized[category].sort((a: any, b: any) => (a.serviceName || "").localeCompare(b.serviceName || ""));
                    sortedCategorizedServices[category] = categorized[category];
                });
                setAllCategorizedServices(sortedCategorizedServices);
                setFilteredCategorizedServices(sortedCategorizedServices);
                setError(null);
            } catch (err: any) {
                setAllCategorizedServices({});
                setFilteredCategorizedServices({});
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchServices();
    }, [location?.city, location?.state]);

    // Effect 2: Filter services based on search term
    useEffect(() => {
        if (searchTerm.trim().length > 0) {
            const filtered: any = {};
            const lowerSearchTerm = searchTerm.toLowerCase();
            Object.entries(allCategorizedServices).forEach(([category, servicesInCategory]) => {
                const matchingServices = (servicesInCategory as any[]).filter(service =>
                    (service?.serviceName || '').toLowerCase().includes(lowerSearchTerm)
                );
                if (matchingServices.length > 0) { filtered[category] = matchingServices; }
            });
            setFilteredCategorizedServices(filtered);
        } else {
            setFilteredCategorizedServices(allCategorizedServices);
        }
    }, [searchTerm, allCategorizedServices]);

    // Effect 3: Handle clicks outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) { setIsOpen(false); } }
        if (isOpen) { document.addEventListener("mousedown", handleClickOutside); }
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, [isOpen]);

    // --- Handlers ---
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setIsOpen(true);
    };
    const handleSelectService = (service: any) => {
        setSelectedService(service);
        setSearchTerm(service.serviceName || "");
        setIsOpen(false);
    };

    // --- Render Logic ---
    const hasFilteredResults = Object.keys(allCategorizedServices).length !== 0;
    const isLocationMissing = !location?.state;
    const showNoResultsMessage = isOpen && searchTerm.length > 0 && !hasFilteredResults;
    const showNoServicesForLocation = isOpen && !searchTerm && !hasFilteredResults;


    return (
        <div className="relative w-full max-w-full" ref={dropdownRef}>
            <div className="relative w-full">
                {/* Input field remains the same */}
                <Input
                    type="text"
                    placeholder="Search for a healthcare service..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => { if (!isLocationMissing) setIsOpen(true); }}
                    disabled={isLocationMissing || isLoading}
                    aria-busy={isLoading}
                    aria-label="Search Healthcare Services"
                    className="pl-10"

                    title={isLocationMissing ? "Please select a location first" : ""} />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <PlusSquareIcon className="h-5 w-5 text-gray-400" />
                </div>
                {/* Loading spinner remains the same */}
                {isLoading && (<Loader className="absolute right-3 top-3" />)}
            </div>

            {/* Dropdown rendering logic remains the same */}
            {isOpen && (
                <div className="absolute z-10 w-full mt-2 max-h-60 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {isLocationMissing && (<div className="px-5 py-3 text-gray-500 text-center">Please select a location...</div>)}
                    {!isLocationMissing && isLoading && (<div className="px-5 py-3 text-gray-500 text-center">Loading services...</div>)}
                    {!isLocationMissing && error && (<div className="px-5 py-3 text-red-500 text-center">Error: {error.message}</div>)}
                    {!isLocationMissing && !isLoading && !error && (
                        <>
                            {hasFilteredResults ? (
                                <div className="max-h-60 overflow-y-auto">
                                    {Object.entries(filteredCategorizedServices).map(([category, servicesInCategory], index) => {
                                        const typedServices = servicesInCategory as Array<any>;
                                        return (
                                            <div key={index}>
                                                <p className="font-bold pt-3 underline text-[16px] text-start  bg-gray-100 text-transparent bg-gradient-to-tr from-priceai-lightblue to-priceai-lightgreen bg-clip-text px-4">{category}</p>
                                                <div key={category} className="p-3 border-b border-gray-200 last:border-b-0">
                                                    {typedServices.map((service) => (
                                                        <div onClick={() => handleSelectService(service)} className="cursor-pointer group text-gray-600 hover:bg-gray-100 px-4 py-2 text-sm rounded-md flex items-center justify-between" key={service.id}>
                                                            <p key={service.id} role="option" >
                                                                {service.serviceName || ''}
                                                            </p>
                                                            <Badge className="mr-4 mt-1 text-xs bg-gray-200 group-hover:bg-priceai-lightblue group-hover:text-white transition-all duration-0 text-gray-600 px-2 py-1 rounded-full">
                                                                {service.serviceCode || ''}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                showNoResultsMessage && (<div className="px-5 py-3 text-gray-500 text-center">No services found matching "{searchTerm}"</div>)
                            )}
                            {showNoServicesForLocation && (<div className="px-5 py-3 text-gray-500 text-center">No services found for {location?.city}</div>)}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default HealthcareServiceSearch;

