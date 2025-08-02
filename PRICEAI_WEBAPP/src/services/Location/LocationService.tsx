import axios from "axios";
import { Location } from "@/types/LocationTypes";

// Reverse geocoding to get address from lat/lng
export const fetchAddress = async (latitude: number, longitude: number): Promise<Location | null> => {
    try {
        const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        return {
            address: response.data.display_name,
            latitude: response.data.lat,
            longitude: response.data.lon,
            country: response.data.address.country,
            state: response.data.address.state,
            state_district: response.data.address.state_district,
            town: response.data.address.town,
            suburb: response.data.address.suburb,
            quarter: response.data.address.quarter,
            county: response.data.address.county,
            city: response.data.address.city || response.data.address.village || response.data.address.town,
        };
    } catch (error) {
        console.error('Error fetching address:', error);
        return null;
    }
};

// Autocomplete-style location suggestions
export const getLocationSuggestions = async (query: string): Promise<Location[]> => {
    if (!query || query.length < 2) return [];

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'LocationSearchApp/1.0'
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch location suggestions');
        }

        const data = await response.json();

        return data.map((result: any) => {
            const address = result.address || {};
            return {
                id: result.place_id || result.osm_id || Math.random().toString(36).substring(2, 9),
                name: result.display_name,
                address: result.display_name,
                city: address.city || address.town || address.village,
                state: address.state || address.county,
                country: address.country,
                latitude: result.lat,
                longitude: result.lon,
            };
        });
    } catch (error) {
        console.error('Error fetching location suggestions:', error);
 
        return [];
    }
};

export const searchByPincode = async (pincode: string): Promise<Location[]> => {
    if (!pincode || pincode.length < 3) return [];

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&postalcode=${pincode}&limit=5&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'LocationSearchApp/1.0'
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch pincode results');
        }

        const data = await response.json();

        return data.map((result: any) => {
            const address = result.address || {};
            return {
                id: result.place_id || result.osm_id || Math.random().toString(36).substring(2, 9),
                name: result.display_name,
                address: result.display_name,
                city: address.city || address.town || address.village,
                state: address.state || address.county,
                country: address.country,
                latitude: result.lat,
                longitude: result.lon,
                pincode: address.postcode,
            };
        });
    } catch (error) {
        console.error('Error searching by pincode:', error);

        return [];
    }
};
