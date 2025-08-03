export interface ProviderCardData {
  id: string;
  providerName: string | null;
  providerAddress: string | null;
  providerCity: string | null;
  providerState: string | null;
  providerZip: string | null;
  providerPhone: string | null;
  providerLat: number | null;
  providerLng: number | null;
  providerSpecialities: string[] | null;
  // Pricing fields
  standardCharge: number | null;
  negotiateCharge: number | null;
  inNetwork: boolean | null;
  insuranceId: string | null;
  distance: number | null;
  isSelfPay: boolean | null;
  hasInsurance: boolean | null;
  // Rating fields
  averageRating?: number | null;
  totalReviews?: number;

  // Additional fields
  service_name?: string | null;
  service_category?: string | null;
  service_setting?: string | null;
  service_code?: string | null;
}