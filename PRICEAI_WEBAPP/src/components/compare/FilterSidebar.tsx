'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Select } from '../ui/select';
import { Separator } from '../ui/separator';
import PriceaiCheckbox from '../ui/priceai-checkbox';
import { 
  SlidersHorizontal, 
  Lightbulb, 
  Shield, 
  Globe, 
  LayoutGrid, 
  Columns3, 
  Star, 
  Filter 
} from 'lucide-react';

interface FilterSidebarProps {
  selectRecommendFilter: string;
  setSelectRecommendFilter: (value: string) => void;
  customFilters: string[];
  handleCustomFilterChange: (filterKey: string, isChecked: boolean) => void;
  loadingRecommendation: boolean;
  generateRecommendation: () => void;
  selectedInsurance: string;
  setSelectedInsurance: (value: string) => void;
  insuranceOptions: string[];
  networkFilter: string;
  setNetworkFilter: (value: string) => void;
  viewMode: "cards" | "table";
  setViewMode: (mode: "cards" | "table") => void;
  visibleColumns: { [key: string]: boolean };
  setVisibleColumns: (columns: { [key: string]: boolean }) => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  selectRecommendFilter,
  setSelectRecommendFilter,
  customFilters,
  handleCustomFilterChange,
  loadingRecommendation,
  generateRecommendation,
  selectedInsurance,
  setSelectedInsurance,
  insuranceOptions,
  networkFilter,
  setNetworkFilter,
  viewMode,
  setViewMode,
  visibleColumns,
  setVisibleColumns
}) => {
  const columnOptions = [
    { key: 'provider', label: 'Hospital' },
    { key: 'insurance', label: 'Insurance' },
    { key: 'plan', label: 'Plan' },
    { key: 'networkStatus', label: 'Network Status' },
    { key: 'savings', label: 'Savings' },
    { key: 'negotiatedPrice', label: 'Your Price' },
    { key: 'standardCharge', label: 'Standard Price' },
    { key: 'distance', label: 'Distance' },
    { key: 'benefits', label: 'Benefits' }
  ];

  const customFilterOptions = [
    { key: 'insurance', label: 'Insurance Provider' },
    { key: 'plan', label: 'Plan Type' },
    { key: 'network_status', label: 'Network Status' },
    { key: 'savings', label: 'Maximum Savings' },
    { key: 'negotiated_price', label: 'Lowest Price' },
    { key: 'standard_charge', label: 'Standard Charge' },
    { key: 'distance', label: 'Closest Provider' },
    { key: 'benefits', label: 'Best Benefits' }
  ];

  return (
    <Card className="overflow-hidden shadow-sm border border-priceai-lightgray/50 sticky top-4">
      <CardHeader className="bg-white py-5 px-6 border-b border-priceai-lightgray/30">
        <div className="flex items-center">
          <div className="bg-priceai-blue/10 p-2 rounded-full mr-3">
            <SlidersHorizontal className="w-5 h-5 text-priceai-blue" />
          </div>
          <div>
            <CardTitle className="text-xl text-priceai-dark">Filters & Sort</CardTitle>
            <CardDescription className="text-priceai-gray text-sm mt-1">
              Customize your comparison view
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Recommendation Filters */}
        <div>
          <h3 className="font-medium text-priceai-dark flex items-center mb-3">
            <Lightbulb className="w-4 h-4 mr-2 text-priceai-blue" />
            Recommendation Filters
          </h3>
          <div className="space-y-4">
            <Select
              options={[
                { label: "All Considerations", value: "all-factors" },
                { label: "Insurance Provider", value: "insurance" },
                { label: "Plan Type", value: "plan" },
                { label: "Network Status", value: "network_status" },
                { label: "Maximum Savings", value: "savings" },
                { label: "Lowest Price", value: "negotiated_price" },
                { label: "Standard Charge", value: "standard_charge" },
                { label: "Closest Provider", value: "distance" },
                { label: "Best Benefits", value: "benefits" },
                { label: "Custom Filters", value: "custom" }
              ]}
              value={selectRecommendFilter}
              onChange={setSelectRecommendFilter}
              placeholder="Select criteria"
              className="text-sm"
            />

            {selectRecommendFilter === "custom" && (
              <div className="mt-4 p-3 bg-priceai-lightgray/20 rounded-priceai border border-priceai-lightgray/30">
                <div className="flex items-center mb-2">
                  <Filter className="w-4 h-4 mr-2 text-priceai-blue" />
                  <span className="text-sm font-medium text-priceai-dark">Customize your recommendation</span>
                </div>
                <div className="flex flex-wrap gap-3 mt-2">
                  {customFilterOptions.map((filter) => (
                    <label
                      key={filter.key}
                      className="flex items-center bg-white px-3 py-1.5 rounded-full border border-priceai-lightgray/50 hover:border-priceai-blue/30 transition-colors cursor-pointer"
                    >
                      <PriceaiCheckbox
                        checked={customFilters.includes(filter.key)}
                        onCheckedChange={(checked: boolean) =>
                          handleCustomFilterChange(filter.key, checked)
                        }
                        className="mr-2"
                      />
                      <span className="text-xs text-priceai-dark">{filter.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <Button
              className="bg-gradient-to-r py-4 from-priceai-blue to-priceai-lightblue text-white hover:opacity-90 w-full"
              size="sm"
              disabled={loadingRecommendation}
              onClick={generateRecommendation}
            >
              {loadingRecommendation ? (
                <>
                  <span className="animate-pulse mr-2">● ● ●</span>
                  Analyzing...
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 mr-2" />
                  Recommend Best
                </>
              )}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Insurance filter */}
        <div>
          <h3 className="font-medium text-priceai-dark flex items-center mb-3">
            <Shield className="w-4 h-4 mr-2 text-priceai-blue" />
            Insurance Plans
          </h3>
          <div className="bg-white max-h-[250px] overflow-y-auto rounded-priceai border border-priceai-lightgray/30">
            <div
              className={`px-3 py-2 text-sm cursor-pointer mb-1 ${
                selectedInsurance === "all"
                  ? "bg-priceai-blue text-white"
                  : "hover:bg-priceai-blue/10"
              }`}
              onClick={() => setSelectedInsurance("all")}
            >
              All Plans
            </div>
            {insuranceOptions.map((option) => (
              <div
                key={option}
                className={`px-3 py-2 text-sm cursor-pointer mb-1 truncate ${
                  selectedInsurance === option
                    ? "bg-priceai-blue text-white"
                    : "hover:bg-priceai-blue/10"
                }`}
                onClick={() => setSelectedInsurance(option)}
              >
                {option}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Network Status filter */}
        <div>
          <h3 className="font-medium text-priceai-dark flex items-center mb-3">
            <Globe className="w-4 h-4 mr-2 text-priceai-blue" />
            Network Status
          </h3>
          <Select
            options={[
              { label: "All", value: "all" },
              { label: "In-Network", value: "in-network" },
              { label: "Out-Network", value: "out-network" }
            ]}
            value={networkFilter}
            onChange={setNetworkFilter}
            placeholder="Select network status"
            // inputClassName="w-auto h-9"
          />
        </div>

        <Separator />

        {/* View toggles */}
        <div>
          <h3 className="font-medium text-priceai-dark flex items-center mb-3">
            <LayoutGrid className="w-4 h-4 mr-2 text-priceai-blue" />
            View Mode
          </h3>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              className={`flex-1 ${
                viewMode === "table"
                  ? "bg-gradient-to-r from-priceai-blue to-priceai-lightblue text-white"
                  : "bg-white border-priceai-lightgray/50"
              }`}
              onClick={() => setViewMode("table")}
            >
              <Columns3 className="h-3.5 w-3.5 mr-1.5" /> Table
            </Button>
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="sm"
              className={`flex-1 ${
                viewMode === "cards"
                  ? "bg-gradient-to-r from-priceai-blue to-priceai-lightblue text-white"
                  : "bg-white border-priceai-lightgray/50"
              }`}
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1.5" /> Cards
            </Button>
          </div>
        </div>

        {/* Column visibility in table mode */}
        {viewMode === "table" && (
          <div>
            <Separator className="mb-4" />
            <h3 className="font-medium text-priceai-dark flex items-center mb-3">
              <Columns3 className="w-4 h-4 mr-2 text-priceai-blue" />
              Visible Columns
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {columnOptions.map((column) => (
                <label
                  key={column.key}
                  className="flex items-center bg-white px-3 py-2 rounded-priceai border border-priceai-lightgray/50 hover:border-priceai-blue/30 transition-colors cursor-pointer"
                >
                  <PriceaiCheckbox
                    checked={visibleColumns[column.key]}
                    onCheckedChange={(checked: boolean) =>
                      setVisibleColumns({
                        ...visibleColumns,
                        [column.key]: checked
                      })
                    }
                    className="mr-2"
                  />
                  <span className="text-xs text-priceai-dark">{column.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FilterSidebar;
