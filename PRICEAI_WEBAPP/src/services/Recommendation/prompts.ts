// Healthcare insurance recommendation prompts for Gemini AI

export interface CompareProvidersPromptData {
  filterDetails: string;
  selectedService: {
    service_name: string;
    serviceName: string;
    setting: string;
  };
  providersWithPricing: any[];
}

export interface SingleProviderPromptData {
  filterDetails: string;
  selectedProvider: any;
  selectedService: any;
  fetchedServiceByProviderId: any[];
  standardChargeValue: number | null;
}

export const generateCompareProvidersPrompt = (data: CompareProvidersPromptData): string => {
  const { filterDetails, selectedService, providersWithPricing } = data;

  const formattedPlans = providersWithPricing
    .map((provider: any, pIdx: number) => {
      return `
Provider ${pIdx + 1} — ${provider.providerName} (${provider.providerCity}, ${provider.providerState})  
• Standard Charge: ₹${provider.standardCharge || "N/A"}  
• Distance: ${provider.distance || "N/A"} miles

Plans:
${provider.insurance
        .map((plan: any) => {
          const isInNetwork = plan.inNetwork;
          const negotiatedPrice = plan.negotiateCharge ? `₹${plan.negotiateCharge}` : "N/A";
          const savings = plan.negotiateCharge && provider.standardCharge 
            ? `${Math.round((1 - plan.negotiateCharge / provider.standardCharge) * 100)}%`
            : "N/A";
          const benefits = Array.isArray(plan.insurance_benefits) && plan.insurance_benefits.length > 0
            ? plan.insurance_benefits.join(", ")
            : "Basic coverage";

          return `  • ${plan.insuranceName} - ${plan.insurancePlan}
    ◦ Network: ${isInNetwork ? "In-Network" : "Out-of-Network"}
    ◦ Price: ${negotiatedPrice}
    ◦ Savings: ${savings}
    ◦ Benefits: ${benefits}`;
        })
        .join("\n")}
`;
    })
    .join("\n\n");

  const basePrompt = `
You're a smart healthcare assistant. Recommend the **top 3 insurance plans** for the user's chosen medical service, based on the list of providers and plans and the given filters.

Context:
- User Filters: ${filterDetails}
- Service Name: ${selectedService.service_name}
- Service Setting: ${selectedService.setting}

---

Available Healthcare Providers with their Plans:
${formattedPlans}

---

Instructions and Use these rules (in order of importance):
  1. Match the user's filters.
  2. Prefer in-network plans.
  3. Lower negotiated prices are better.
  4. Favor strong benefits (e.g. wellness, low co-pay).
  5. If no good in-network plan, suggest best out-of-network.
  6. Closer providers are better if all else is equal.
  7. Recommend exactly 3 plans:
    - Best Overall
    - Most Affordable
    - Best Coverage
  8. Don't include any disclaimers or unnecessary information.
  9. Keep your tone friendly, clear, and concise.
`;

  const responseFormat = `

Output Format:

**Here are the top 3 insurance plan recommendations** for a **${selectedService.serviceName}**, based on the provided data${filterDetails === 'all-factors' || filterDetails === 'all' ? "" : ` and your filters: **${filterDetails}**`}:

1. **Best Overall** <span class="text-[#0FA0CE] font-bold">{Plan}</span> with <span class="text-[#0FA0CE] font-semibold">{Provider}</span>  
  - <span class='text-black font-bold italic'>Savings</span>  {X}%  
  - <span class='text-black font-bold italic'>Cost</span> ₹{Price} (in-network / out-network)  
  - <span class='text-black font-bold italic'>Benefits</span> {top perks}

2. **Most Affordable** <span class="text-[#0FA0CE] font-bold">{Plan}</span> with <span class="text-[#0FA0CE] font-semibold">{Provider}</span>  
  - <span class='text-black font-bold italic'>Cost</span> ₹{Price}  
  - <span class='text-black font-bold italic'>Note</span> {if any limitation}

3. **Best Coverage** <span class="text-[#0FA0CE] font-bold">{Plan}</span> with <span class="text-[#0FA0CE] font-semibold">{Provider}</span>  
  - <span class='text-black font-bold italic'>Cost</span> ₹{Price}  
  - <span class='text-black font-bold italic'>Benefits</span> {summary}

---

**Why we chose these:**
- These plans were selected based on a combination of affordability, in-network status, proximity, and benefits like wellness coverage or low co-pays or etc.... The recommendations reflect your preferences and priorities.
- Make it maximum 2-3 points.
- Add bold style to the important terms and words.
<span class=''>{reason}</span>
`;

  return basePrompt + responseFormat;
};

export const generateSingleProviderPrompt = (data: SingleProviderPromptData): string => {
  const { 
    filterDetails, 
    selectedProvider, 
    selectedService, 
    fetchedServiceByProviderId, 
    standardChargeValue 
  } = data;

  const filteredPlans = fetchedServiceByProviderId.filter((plan: any) => plan.inNetwork !== null);

  const formattedPlans = filteredPlans.map((plan: any, idx: any) => {
    const isInNetwork = plan.inNetwork;
    const negotiatedPrice = plan.negotiateCharge ? Number(plan.negotiateCharge) : null;
    const stdCharge = plan.standardCharge ? Number(plan.standardCharge) : standardChargeValue;
    const outOfNetworkPrice = isInNetwork ? stdCharge : negotiatedPrice;

    let savingsAmount = null;
    let savingsPercent = null;

    if (isInNetwork && negotiatedPrice && stdCharge) {
      savingsAmount = stdCharge - negotiatedPrice;
      savingsPercent = `${((savingsAmount / stdCharge) * 100).toFixed(0)}%`;
    }

    const benefits = Array.isArray(plan.insurance_benefits) && plan.insurance_benefits.length > 0
      ? plan.insurance_benefits.join(", ")
      : "No benefits info";

    return `
Plan ${idx + 1}:
- Insurance Name: ${plan.insuranceName || "N/A"}
- Insurance Plan: ${plan.insurancePlan || "N/A"}
- In-Network: ${isInNetwork ? "Yes" : "No"}
- Negotiated Price: ${negotiatedPrice ? `₹${negotiatedPrice}` : "-"}
${savingsAmount !== null ? `- Estimated Savings: ₹${savingsAmount.toFixed(2)} (${savingsPercent})` : ""}
${!isInNetwork && outOfNetworkPrice ? `- Out-of-Network Estimated Cost: ₹${outOfNetworkPrice.toFixed(2)}` : ""}
- Benefits: ${benefits}
`.trim();
  }).join("\n\n");

  return `
You are a smart healthcare insurance assistant helping users choose the best insurance plan for a medical service based on personal preferences, pricing, and benefits.

Context:
- Provider Name: ${selectedProvider?.providerName || "Unknown"}
- Service Name: ${selectedProvider?.serviceName || "Unknown"}
- Standard or Actual Provider Price: ${standardChargeValue ? `₹${standardChargeValue.toFixed(2)}` : "Not available"}
- User Filters: ${filterDetails}

Available Plans:
${formattedPlans}

Instructions:
1. Evaluate and recommend the best plan **based on the following priorities**:
a. Match to user filters (e.g. insurance provider, plan features, pricing preference).
b. In-network status is preferred over out-of-network.
c. Lowest negotiated price if multiple plans match.
d. Rich benefit packages (e.g. high coverage, wellness perks, zero copay).
2. If **no in-network plans are available**, pick the best out-of-network option.
3. If **standard charge is missing**, acknowledge that exact savings cannot be computed.
4. Keep your tone friendly, clear, and concise.
5. Show only one best recommendation.

Output Format:

**Recommended Plan for** **${selectedProvider?.service_name || "the selected service"}** (with filters **${filterDetails}**)

**Best Plan**  
<span class='text-black font-bold italic'>Plan</span> - <span class='text-black font-bold italic'>{insurance_plan}</span>  
<span class='text-black font-bold italic'>Insurance Name</span> - <span class='text-black font-bold italic'>{insurance_name}</span>  

**Reason**  
<span class=''>{reason}</span>
`.trim();
};
