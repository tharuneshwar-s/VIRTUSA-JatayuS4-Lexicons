import { Calendar, MapPin, Phone, Shield, Star as StarIcon } from 'lucide-react';
import AppointmentBooking from './appointments/AppointmentBooking';
import React, { useState } from "react";
import { cn, formatCurrency, formatDistance } from "@/lib/utils";
import {
    CheckCircle2Icon,
    MapPinIcon,
    CodeIcon,
    Star,
    Building2,
    ExternalLink,
    GitCompareIcon,
    Navigation,
    Info
} from "lucide-react";
import { usePriceaiContext } from "@/context/PriceaiContext";
import { Badge } from "./ui/badge";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader } from "./ui/Card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "./ui/tooltip";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";
import StarRating from "./ui/StarRating";


const ProviderCard = ({ isRecommended, provider, isSelfPay = null, hasInsurance = null, loading = false }: any) => {

    const { selectedService, compareProviders, setCompareProviders, setSelectedProvider, setOpenCompareProvider, openCompareProvider } = usePriceaiContext();

    const [showAppointmentBooking, setShowAppointmentBooking] = useState(false);

    const distance = provider.distance

    const isValidCharge = provider.standardCharge && parseFloat(provider.standardCharge) > 0;

    const isSelected = compareProviders.some((p: any) => p.id === provider.id);

    let displayedPrice = null;

    if (provider.standardCharge > 0) {
        displayedPrice = provider.standardCharge;
    }

    const handleSelectCompareProvider = (provider: any) => {
        setCompareProviders((prev: any) => {
            const exists = prev.some((p: any) => p.id === provider.id);
            if (exists) {

                return prev.filter((p: any) => p.id !== provider.id);
            } else {

                return [...prev, provider];
            }
        });
    };

    // Loading skeleton
    if (loading) {
        return (
            <Card className="w-full">
                <CardContent className="p-6 space-y-5">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4 space-y-3">
                            <Skeleton className="h-6 w-3/4" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-6 w-16" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-20" />
                        </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-6 w-16" />
                    </div>
                    <div className="flex gap-3">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 flex-1" />
                    </div>
                </CardContent>
            </Card>
        );
    }


    return (
        <>
            <Card
                className={cn(
                    "relative cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg w-full group",
                    isSelected ? "border-priceai-blue border ring-2 ring-priceai-blue ring-opacity-30" : "border-priceai-gray/30",
                )}
            >
                {/* Selection Indicator */}
                {isSelected && (
                    <div className="absolute top-3 right-3 rounded-full p-1 z-10 bg-priceai-lightgray">
                        <CheckCircle2Icon className="w-6 h-6 text-priceai-blue" />
                    </div>
                )}

                {/* Recommended Badge */}
                {isRecommended && (
                    <div className="absolute top-0 left-0 w-full py-2 px-4 flex items-center justify-center bg-gradient-to-r from-priceai-blue to-priceai-lightgreen text-white">
                        <Star className="w-4 h-4 mr-2 fill-current" />
                        <span className="font-medium text-sm">Recommended Hospital</span>
                    </div>
                )}

                <CardContent className={cn("p-4 flex flex-col space-y-4", isRecommended && "pt-14")}>
                    {/* Header Section */}
                    <div className="flex items-start justify-between">
                        <div className="text-start flex-1 pr-4">
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="text-xl font-bold line-clamp-2 transition-colors group-hover:text-priceai-blue text-priceai-dark flex-1 pr-2">
                                    {provider.providerName}
                                </h3>
                            </div>

                            <div className="flex flex-col space-y-2">
                                {/* Address */}
                                <div className="flex items-center gap-2 text-priceai-gray">
                                    <MapPinIcon className="w-4 h-4 shrink-0" />
                                    <p className="text-sm line-clamp-2">
                                        {provider.providerAddress}, {provider.providerState}
                                    </p>
                                </div>

                                {/* Distance with color coding */}
                                <div className="flex items-center gap-2">
                                    <Navigation className={cn("w-4 h-4 shrink-0", distance < 10 ? "text-green-600" : "text-priceai-gray")} />
                                    <p className={cn("text-sm font-medium text-nowrap", distance < 10 ? "text-green-600" : "text-priceai-gray")}>
                                        {formatDistance(distance)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Price Section */}
                        <div className="text-end flex-shrink-0">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="text-sm text-priceai-gray text-nowrap mb-1 flex items-center gap-1 justify-end">
                                        Standard Charge
                                        <Info className="w-3 h-3" />
                                    </p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Official hospital pricing before insurance or discounts</p>
                                </TooltipContent>
                            </Tooltip>

                            <div className="flex flex-col items-end">
                                {isSelfPay && isSelfPay?.isSelfPay && isSelfPay?.negotiateCharge ? (
                                    <div className="flex flex-col items-end">
                                        <p className="text-2xl font-extrabold text-green-600">
                                            {formatCurrency(parseFloat(isSelfPay.negotiateCharge))}
                                        </p>

                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-sm text-priceai-gray line-through italic">
                                                {formatCurrency(parseFloat(isSelfPay.standardCharge))}
                                            </span>
                                            <Badge className="text-xs px-1.5 py-0.5 text-nowrap bg-green-100 text-green-700">
                                                Save {Math.round((1 - parseFloat(isSelfPay.negotiateCharge) / parseFloat(isSelfPay.standardCharge)) * 100)}%
                                            </Badge>
                                        </div>


                                        <p className="text-xs mt-1 text-priceai-gray">
                                            You save <span className="font-semibold text-green-600">
                                                {formatCurrency(Number((parseFloat(isSelfPay.standardCharge) - parseFloat(isSelfPay.negotiateCharge)).toFixed(2)))}
                                            </span>
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-xl font-extrabold text-priceai-blue">
                                        {isValidCharge
                                            ? formatCurrency(parseFloat(provider.standardCharge))
                                            : "Price unavailable"
                                        }
                                    </p>
                                )}
                            </div>

                            {isSelfPay && isSelfPay?.isSelfPay && (
                                <Badge variant="outline" className="mt-2 border-priceai-blue text-priceai-blue">
                                    No Insurance
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Service Badges */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className="gap-1">
                            <Building2 className="w-3 h-3" />
                            {provider?.service_setting}
                        </Badge>

                        {/* Star Rating Badge */}
                        {provider.averageRating && provider.averageRating > 0 ? (
                            <Badge variant="secondary" className="text-xs px-2 py-1 hover:bg-none bg-yellow-50 text-yellow-700 border border-yellow-200 flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{provider.averageRating.toFixed(1)}</span>
                            </Badge>
                        ) : (
                            <Badge variant="outline" className='outline-yellow-200 border-yellow-200 text-yellow-400 flex items-center gap-1'>
                                <Star className="w-3 h-3 text-yellow-400" />
                                <span>New</span>
                            </Badge>
                        )}

                        {distance < 5 && (
                            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-green-100 text-green-700">
                                Nearby
                            </Badge>
                        )}

                        {isSelfPay && isSelfPay?.isSelfPay && !hasInsurance && (
                            <Badge className="bg-priceai-blue text-white">
                                Self pay
                            </Badge>
                        )}

                        {isSelfPay && !isSelfPay?.isSelfPay && hasInsurance && (
                            <Badge variant="destructive">
                                No Insurance
                            </Badge>
                        )}
                    </div>


                    <div className="w-full h-[1px] bg-slate-600/20"></div>


                    {/* Service Information */}
                    <div className="flex text-sm flex-wrap items-center gap-2">
                        <div className="flex items-start gap-2 flex-1">
                            <div className="flex flex-col">
                                <p className="flex-1 text-priceai-dark">
                                    {provider?.service_name}
                                </p>
                            </div>
                        </div>

                        <Badge variant="secondary" className="gap-1">
                            <CodeIcon className="w-3 h-3" />
                            {provider?.service_code}
                        </Badge>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-1 gap-2">
                        <Button
                            variant="outline"
                            className="flex-1 flex items-center justify-center gap-2"
                            onClick={() => handleSelectCompareProvider(provider)}
                        >
                            <GitCompareIcon className="w-4 h-4" />
                            <span>
                                Compare
                                {compareProviders.length > 0 && (
                                    <span className="ml-1">({compareProviders.length})</span>
                                )}
                            </span>
                        </Button>

                        <Button
                            className="flex-1 flex items-center justify-center gap-2"
                            onClick={() => setSelectedProvider({
                                ...provider,
                                ...selectedService,
                                service_id: selectedService?.id,
                                provider_id: provider?.id
                            })}
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span>Details</span>
                        </Button>
                    </div>
                    {/* Book Button below */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1 flex items-center justify-center gap-2"
                            onClick={() => setShowAppointmentBooking(true)}
                        >
                            <Calendar className="w-4 h-4" />
                            <span>Book</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Floating Compare Button */}
            {compareProviders.length > 1 && !openCompareProvider && (
                <Button
                    className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-6 py-3 rounded-full shadow-lg bg-priceai-blue hover:bg-priceai-blue/90"
                    onClick={() => setOpenCompareProvider(true)}
                >
                    <GitCompareIcon className="w-5 h-5" />
                    <span>Compare ({compareProviders.length})</span>
                </Button>
            )}

            {/* Appointment Booking Modal */}
            <AppointmentBooking
                provider={{
                    ...provider, provider_id: provider?.id
                }}
                service={selectedService}
                isOpen={showAppointmentBooking}
                isSelfPay={isSelfPay}
                onClose={() => setShowAppointmentBooking(false)}
            />
        </>
    );
};

// Skeleton Loading Component (can be used independently)
export const ProviderCardSkeleton = () => (
    <Card className="w-full">
        <CardContent className="p-6 space-y-5">
            <div className="flex items-start justify-between">
                <div className="flex-1 pr-4 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-16" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-20" />
                </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-16" />
            </div>
            <div className="flex gap-3">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
            </div>
        </CardContent>
    </Card>
);

export default ProviderCard;
