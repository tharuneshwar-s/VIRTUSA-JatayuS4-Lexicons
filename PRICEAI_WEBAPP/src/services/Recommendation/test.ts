// Test file for the Recommendation services
// This file can be used to test the recommendation services during development

import { 
  generateCompareProvidersRecommendation,
  generateSingleProviderRecommendation
} from './index';

// Test data for compare providers
const testCompareData = {
  filterDetails: "all-factors",
  selectedService: {
    service_name: "MRI Scan",
    serviceName: "MRI Scan",
    setting: "Outpatient"
  },
  providersWithPricing: [
    {
      providerName: "Apollo Hospital",
      providerCity: "Chennai",
      providerState: "Tamil Nadu",
      standardCharge: 5000,
      distance: 2.5,
      insurance: [
        {
          insuranceName: "Star Health",
          insurancePlan: "Family Health Optima",
          inNetwork: true,
          negotiateCharge: 3500,
          insurance_benefits: ["Wellness coverage", "No waiting period"]
        }
      ]
    }
  ]
};

// Test data for single provider
const testSingleData = {
  filterDetails: "best-price",
  selectedProvider: {
    providerName: "Apollo Hospital",
    serviceName: "MRI Scan",
    service_name: "MRI Scan",
    standardCharge: 5000
  },
  selectedService: {
    service_name: "MRI Scan",
    serviceName: "MRI Scan"
  },
  fetchedServiceByProviderId: [
    {
      insuranceName: "Star Health",
      insurancePlan: "Family Health Optima",
      inNetwork: true,
      negotiateCharge: 3500,
      standardCharge: 5000,
      insurance_benefits: ["Wellness coverage", "No waiting period"]
    }
  ],
  standardChargeValue: 5000
};

// Test functions (uncomment to test)
export async function testRecommendationServices() {
  console.log("Testing Compare Providers Recommendation...");
  try {
    const compareResult = await generateCompareProvidersRecommendation(testCompareData);
    console.log("Compare Result:", compareResult);
  } catch (error) {
    console.error("Compare Test Error:", error);
  }

  console.log("Testing Single Provider Recommendation...");
  try {
    const singleResult = await generateSingleProviderRecommendation(testSingleData);
    console.log("Single Result:", singleResult);
  } catch (error) {
    console.error("Single Test Error:", error);
  }
}

// Uncomment the line below to run tests
// testRecommendationServices();
