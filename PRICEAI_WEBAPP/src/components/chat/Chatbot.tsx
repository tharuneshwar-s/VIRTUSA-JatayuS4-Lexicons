'use client';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { BotMessageSquare, RefreshCw, XCircle } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/Button';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

function Chatbot({ open, onClose, providers, service }: any): React.ReactElement | null {

    const [messages, setMessages] = useState<{ role: string, content: string }[]>([
        {
            role: 'assistant',
            content: `Hi there! I'm your healthcare assistant. Ask me anything about the providers or ${service?.serviceName} pricing you're comparing.`
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);


    // Scroll to bottom of chat whenever messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Handle sending a message
    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        // Add user message to chat
        const userMessage = { role: 'user', content: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {

            const providerData = providers.map((provider: any) => ([
                {
                    name: provider.providerName,
                    address: provider.providerAddress,
                    city: provider.providerCity,
                    state: provider.providerState,
                    standardCharge: provider.standardCharge,
                    insurancePlans: (provider.insurance || []).map((plan: any) => ({
                        name: plan.insuranceName,
                        plan: plan.insurancePlan,
                        inNetwork: plan.inNetwork,
                        negotiatedPrice: plan.negotiateCharge,
                        benefits: plan.insuranceBenefits
                    }))
                }
            ]));

            // Call Google Generative AI
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", generationConfig: { temperature: 0 } });


            const prompt = `
        You are a helpful PriceAI assistant specializing in medical pricing and insurance information for healthcare comparison.
        
        Context:
        - Service: ${service?.serviceName} (${service?.serviceDescription || 'No description'})
        - Service Setting: ${service?.serviceSetting || 'Not specified'}
        - Number of providers being compared: ${providers.length}
        
        Provider Information:
        ${JSON.stringify(providerData, null, 2)}
        
        User query: ${inputValue}
        
        Enhanced Response Instructions:
        - Answer queries based ONLY on the provider and service data provided above
        - For price comparisons: Always mention both standard charges and negotiated prices (if available)
        - Insurance network status: Clearly highlight in-network vs out-of-network differences and savings
        - Cost analysis: Calculate and show potential savings between different options
        - Provider recommendations: When asked for recommendations, consider price, location, and insurance coverage
        - Format currency in Indian Rupees (₹) with proper comma separators (e.g., ₹1,50,000)
        - Use bullet points or numbered lists for clarity when comparing multiple options
        - Include relevant insurance benefits when discussing coverage options
        - If data is missing or unclear, explicitly state "Based on available data..." or "Information not available for..."
        - Provide actionable insights like "You could save ₹X by choosing..." or "Best option for your insurance..."
        - Keep responses concise (2-4 sentences max) but informative
        - Use friendly, professional tone with healthcare-appropriate language
        - End responses with helpful next steps when appropriate (e.g., "Consider calling the provider to confirm...")
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response.text();

            // Add AI response to chat
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            console.error("Error getting AI response:", error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm sorry, I encountered an error processing your request. Please try again."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Enter key to send message
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // If modal is closed, don't render anything
    if (!open) return null;

    return (
        <div
            className={`fixed right-20 bottom-20 z-[200] ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'} transition-all duration-300 ease-in-out transform origin-bottom-right`}
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg h-[600px] flex flex-col animate-slide-up">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-[#0FA0CE] to-[#33C3F0] text-white rounded-t-lg">
                    <div className="flex items-center gap-2">
                        <BotMessageSquare className="w-5 h-5" />
                        <h2 className="font-semibold">PriceAI Assistant</h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0 rounded-full text-white hover:bg-white/20"
                    >
                        <XCircle className="h-5 w-5" />
                    </Button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                        >
                            <div
                                className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user'
                                    ? 'bg-[#0FA0CE] text-white rounded-br-none'
                                    : 'bg-[#F6F7F8] text-[#1A1F2C] rounded-bl-none'
                                    }`}
                            >
                                <p dangerouslySetInnerHTML={{
                                    __html: (msg.content).replace(/\*\*(.*?)\*\*/g, (match: string, text: string) => {
                                        return `<strong class="text-[#0FA0CE]">${text}</strong>`;
                                    })
                                        .replace(/₹([\d,]+(\.\d+)?)/g, (match: string) => {
                                            return `<span class="text-[#00B140] font-semibold">${match}</span>`;
                                        })
                                        .replace(/(\d+)%/g, (match: string) => {
                                            return `<span class="text-[#0FA0CE] font-semibold">${match}</span>`;
                                        })
                                        .replace(/(\d+(\.\d+)?)%/g, (match) => {
                                            return `<span class="text-[#0FA0CE] font-semibold">${match}</span>`;
                                        })
                                        .replace(/(in-network)/g, (match: string) => {
                                            return `<span class="bg-[#A4E1B5] rounded-full text-black px-2 py-1">${match}</span>`;
                                        })
                                        .replace(/(out-of-network)/g, (match: string) => {
                                            return `<span class="bg-[#ff6b6b] rounded-full text-white px-2 py-1">${match}</span>`;
                                        })
                                        .replace(/\n/g, "<br />")
                                }} />
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="bg-[#F6F7F8] p-3 rounded-lg rounded-bl-none">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-2 w-2 bg-[#0FA0CE] rounded-full animate-bounce" />
                                    <div className="h-2 w-2 bg-[#0FA0CE] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    <div className="h-2 w-2 bg-[#0FA0CE] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 border-t bg-white rounded-b-lg">
                    <div className="flex gap-2">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about providers, prices, or insurance..."
                            className="flex-1 border border-priceai-gray/20 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[#0FA0CE] resize-none h-12 max-h-32"
                            rows={1}
                            disabled={isLoading}
                        />
                        <Button
                            onClick={handleSendMessage}
                            disabled={isLoading || !inputValue.trim()}
                            className="bg-[#0FA0CE] hover:bg-[#0FA0CE]/80 text-white h-12 px-4"
                        >
                            {isLoading ? (
                                <RefreshCw className="h-5 w-5 animate-spin" />
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="m22 2-7 20-4-9-9-4Z" />
                                    <path d="M22 2 11 13" />
                                </svg>
                            )}
                        </Button>
                    </div>
                    <div className="text-xs text-center text-[#8E9196] mt-2">
                        Ask anything about the providers, insurance plans, or pricing in this PriceAI comparison view.
                    </div>
                    <div className="text-[11px] text-center text-[#B0B3B8] mt-1">
                        <span className="italic">AI Disclaimer:</span> PriceAI's chatbot provides automated responses based on the data shown in this comparison. Information is for guidance only and not a substitute for professional medical, insurance, or financial advice.
                    </div>
                </div>
            </div>
        </div>

    )
}

export default Chatbot
