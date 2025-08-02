import { useState, useEffect, useRef } from "react";
import { Loader2, Locate, LocateFixed, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocationContext } from "@/context/LocationContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import Loader from "@/components/ui/Loader";
import { fetchAddress, searchByPincode, getLocationSuggestions } from "@/services/Location/LocationService";

export function LocationSearch() {

  const { myCurrentLocation, setMyCurrentLocation, setSelectedLocation } = useLocationContext();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const [detectLocationLoading, setDetectLocationLoading] = useState<boolean>(true);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getAutomaticLocation = async () => {
    setDetectLocationLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;

      const currentLocation = await fetchAddress(latitude, longitude);

      setMyCurrentLocation(currentLocation)
    } catch (error) {
      console.error('Error getting location:', error);
   


    } finally {
      setDetectLocationLoading(false);
    }
  };

  useEffect(() => {
    getAutomaticLocation();
  }, []);


  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);

      let results = [];

      if (/^\d{5,6}$/.test(searchQuery)) {
        results = await searchByPincode(searchQuery);
      } else {
        results = await getLocationSuggestions(searchQuery);
      }

      setSuggestions(results);
      setShowSuggestions(true);
      setIsLoading(false);
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      selectLocation(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setSelectedIndex(-1);
  };

  const selectLocation = (location: any) => {
    setSearchQuery(location.name || '');
    setShowSuggestions(false);
    if (setSelectedLocation) {
      setSelectedLocation(location);
    }
    setShowSuggestions(false);
  };

  return (
    <div
      ref={searchContainerRef}
      className="space-y-3 relative"
    >
      <div className="relative flex h-full items-center gap-3">
        <div className="relative w-full">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search healthcare locations, via pincode ..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
            className="pl-10"
          // className="w-full px-5 pl-10 py-4 border border-gray-200 rounded-priceai shadow-sm focus:outline-none focus:ring-2 focus:ring-priceai-blue focus:border-transparent transition-all duration-200 text-lg"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          {isLoading && (
            <Loader className="absolute right-3 top-3" />
          )}
          {!isLoading && searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute h-full text-2xl hover:bg-transparent group top-0 right-0 flex justify-center items-center pr-3"
              onClick={() => {
                setSearchQuery("");
                setSelectedLocation(null);
                setSuggestions([]);
                inputRef.current?.focus();
              }}
            >
              <span className="sr-only">Clear search</span>
              <span className="text-gray-500 group-hover:text-red-400">&times;</span>
            </Button>
          )}
        </div>
        <div
          className="cursor-pointer bg-white px-3 py-3 border-focus-priceai"
          onClick={getAutomaticLocation}
        >
          {
            !detectLocationLoading ? (
              <LocateFixed className="text-priceai-lightblue" />
            ) : (
              <Locate className="text-priceai-lightblue" />
            )
          }
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-white rounded-priceai shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
          <ul className="text-start">
            {suggestions
              .filter((suggestion: any) => suggestion.city && suggestion.country)
              .map((suggestion: any, index: any) => (
                <li
                  key={index}
                  onClick={() => selectLocation(suggestion)}
                  className={cn(
                    "px-4 py-2 cursor-pointer group hover:bg-gradient-to-tr hover:from-priceai-blue hover:to-priceai-lightgreen hover:text-white flex flex-col",
                    selectedIndex === index ? "bg-gradient-to-tr from-priceai-blue to-priceai-lightgreen text-white" : ""
                  )}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <span className={`font-medium  group-hover:text-white ${selectedIndex === index ? "text-white" : "text-gray-800"}`}>{suggestion?.name || ""}</span>
                  <span className={`text-sm  group-hover:text-white ${selectedIndex === index ? "text-white" : "text-gray-800"}`}>
                    {[suggestion.city, suggestion.state, suggestion.country]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="">
        <div className="text-sm text-gray-600 flex gap-2 items-start">
          <p className="text-gray-800 text-nowrap">Current Location:</p>
          {detectLocationLoading ? (
            <Loader />
          ) : myCurrentLocation ? (
            <p className="text-gray-800 text-start">
              {myCurrentLocation.address}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
