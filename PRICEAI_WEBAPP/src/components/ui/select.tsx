import * as React from "react";
import { Input } from "./input";

interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  inputClassName = "",
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputClick = () => setIsOpen((open) => !open);

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative w-full h-12 ${className}`} ref={containerRef}>
      <Input
        readOnly
        value={selectedOption ? selectedOption.label : ""}
        placeholder={placeholder}
        onClick={handleInputClick}
        className={`cursor-pointer bg-white ${inputClassName}`}
      />
      {isOpen && (
        <div className="relative z-10 w-full mt-2 max-h-60 bg-white border border-gray-200 rounded-priceai shadow-lg overflow-auto">
          {options.length === 0 ? (
            <div className="px-4 py-2 text-gray-400">No options</div>
          ) : (
            options.map((option, idx) => (
              <div
                key={option.value}
                className={
                  [
                    "px-4 py-2 cursor-pointer group hover:bg-gradient-to-tr hover:from-priceai-blue hover:to-priceai-lightgreen hover:text-white flex flex-col",
                    highlightedIndex === idx ? "bg-gradient-to-tr from-priceai-blue to-priceai-lightgreen text-white" : "",
                    value === option.value ? "font-semibold" : ""
                  ].join(" ")
                }
                onClick={() => handleOptionClick(option.value)}
                onMouseEnter={() => setHighlightedIndex(idx)}
              >
                <span className={`font-medium group-hover:text-white ${highlightedIndex === idx ? "text-white" : "text-gray-800"}`}>{option.label}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
