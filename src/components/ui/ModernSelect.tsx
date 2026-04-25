import React, { useState, useEffect, useRef } from "react";
import { Search, X, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface ModernSelectProps {
  options: any[]; // Can be string[] or {label: string, value: any}[]
  value: any;
  onChange: (val: any) => void;
  placeholder?: string;
  isMulti?: boolean;
  searchable?: boolean;
  className?: string;
}

export const ModernSelect: React.FC<ModernSelectProps> = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Selecionar...", 
  isMulti = false,
  searchable = true,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

  const formattedOptions = options.map(opt => 
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const filteredOptions = formattedOptions.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (optionValue: any) => {
    if (isMulti) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(optionValue)) {
        onChange(currentValues.filter((v: any) => v !== optionValue));
      } else {
        onChange([...currentValues, optionValue]);
      }
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
    setSearch("");
  };

  const getDisplayValue = () => {
    if (isMulti) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.length === 0) return placeholder;
      if (currentValues.length === 1) {
        const opt = formattedOptions.find(o => o.value === currentValues[0]);
        return opt ? opt.label : currentValues[0];
      }
      return `${currentValues.length} selecionados`;
    } else {
      const opt = formattedOptions.find(o => o.value === value);
      return opt ? opt.label : placeholder;
    }
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full h-9 px-3 rounded-xl border border-border/40 bg-zinc-900 text-white cursor-pointer transition-all hover:bg-zinc-800",
          isOpen && "ring-2 ring-primary/20 border-primary/40 shadow-lg shadow-primary/5"
        )}
      >
        <span className={cn(
          "text-[10px] font-bold uppercase tracking-widest truncate",
          !value && !isMulti && "text-white/40",
          isMulti && Array.isArray(value) && value.length === 0 && "text-white/40"
        )}>
          {getDisplayValue()}
        </span>
        <ChevronDown className={cn("h-3 w-3 text-white/40 transition-transform duration-200", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-zinc-900 border border-border/40 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl">
          {searchable && (
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-white/20" />
                <input 
                  autoFocus
                  type="text"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-8 pl-9 pr-3 bg-white/5 border border-white/5 rounded-lg text-[10px] text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary/40 font-bold uppercase tracking-widest"
                />
              </div>
            </div>
          )}
          
          <div className="max-h-[200px] overflow-y-auto overflow-x-hidden py-2 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-[9px] font-bold text-white/20 uppercase tracking-widest text-center">
                Sem resultados
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = isMulti 
                  ? (Array.isArray(value) && value.includes(opt.value))
                  : value === opt.value;
                
                return (
                  <div 
                    key={String(opt.value)}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "group flex items-center justify-between px-4 py-2.5 cursor-pointer transition-all hover:bg-white/5",
                      isSelected && "bg-primary/10 text-primary"
                    )}
                  >
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest transition-colors",
                      isSelected ? "text-primary" : "text-white/60 group-hover:text-white"
                    )}>
                      {opt.label}
                    </span>
                    {isSelected && <Check className="h-3 w-3 text-primary animate-in zoom-in duration-200" />}
                    {isMulti && !isSelected && (
                      <div className="h-3 w-3 rounded border border-white/10 group-hover:border-white/20" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {isMulti && Array.isArray(value) && value.length > 0 && (
            <div className="p-2 border-t border-white/5 bg-black/20">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onChange([]);
                }}
                className="w-full py-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-destructive transition-colors"
              >
                Limpar seleção
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
