'use client'

import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { LogIn } from "lucide-react";


function Header() {
    const { user, signOut, loading } = useAuth();
    const router = useRouter();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut();
            setShowDropdown(false);
        } catch (error) {
            console.error("Header - Error signing out:", error);
        }
    };

    const handleLogin = () => {
        router.push('/auth/login');
    };

    const handleProfileClick = () => {
        setShowDropdown(!showDropdown);
    };

    const navigateTo = (path: string) => {
        setShowDropdown(false);
        router.push(path);
    };
    return (
        <header className="h-16 mx-auto  items-center z-[1] relative border-slate-50 border-b">
            <div className="sizer h-full flex justify-between items-center">
                <Link href={"/"} className="items-center flex justify-center">
                    <h3 className="text-white drop-shadow-sm bg-clip-text bg-gradient-to-r from-priceai-blue to-priceai-lightgreen font-bold text-3xl">
                        PriceAI 
                        {/* <span>Healthcare price comparisum</span> */}
                    </h3>
                </Link>

                <div className="flex items-center space-x-4">
                    {!loading && (
                        <>
                            {user ? (
                                <div className="relative" ref={dropdownRef}>
                                    <div 
                                        className="flex items-center space-x-2 cursor-pointer p-2 text-white rounded-priceai bg-priceai-blue hover:bg-priceai-lightblue transition-colors"
                                        onClick={handleProfileClick}
                                    >
                                        {user.user_metadata?.avatar_url ? (
                                            <img 
                                                src={user.user_metadata.avatar_url} 
                                                alt="Profile" 
                                                className="w-8 h-8 rounded-full"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-priceai-blue flex items-center justify-center text-white font-semibold">
                                                {(user.user_metadata?.full_name || user.email || "U").charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span className="text-sm text-gray-200">
                                            {user.user_metadata?.full_name || user.email}
                                        </span>
                                        <svg 
                                            className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24" 
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                    
                                    {showDropdown && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-priceai shadow-lg py-1 z-50">
                                            <div 
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                                onClick={() => navigateTo('/profile')}
                                            >
                                                My Profile
                                            </div>
                                            <div 
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                                onClick={() => navigateTo('/appointments')}
                                            >
                                                Appointments
                                            </div>
                                            <div className="h-px bg-gray-200 my-1"></div>
                                            <div 
                                                className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
                                                onClick={handleSignOut}
                                            >
                                                Logout
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Button
                                    onClick={handleLogin}
                                    className="hover:bg-priceai-lightblue bg-priceai-blue text-white"
                                >
                                    <LogIn/>
                                    Login
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;