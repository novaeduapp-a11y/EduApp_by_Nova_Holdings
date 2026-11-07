"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { foldAscii } from "@/lib/text-search";
import { cn } from "@/lib/utils";

export type SearchableOption = {
  value: string;
  label: string;
  keywords?: string;
  disabled?: boolean;
};

type SearchableSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  allowEmpty?: boolean;
  emptyOptionLabel?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
};

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Choisir…",
  searchPlaceholder = "Rechercher…",
  emptyLabel = "Aucun résultat.",
  allowEmpty = false,
  emptyOptionLabel = "—",
  disabled = false,
  className,
  id,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const display =
    value === "" && allowEmpty
      ? emptyOptionLabel
      : selected?.label ?? placeholder;

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-11 min-h-11 w-full justify-between rounded-[1rem] border border-input bg-card px-3 font-normal shadow-none hover:bg-card",
            !selected && !(allowEmpty && value === "") && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate text-left">{display}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Command
          filter={(itemValue, search) =>
            foldAscii(itemValue).includes(foldAscii(search)) ? 1 : 0
          }
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {allowEmpty ? (
                <CommandItem
                  value={`__empty__ ${emptyOptionLabel}`}
                  onSelect={() => {
                    onValueChange("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value === "" ? "opacity-100" : "opacity-0")}
                    aria-hidden
                  />
                  {emptyOptionLabel}
                </CommandItem>
              ) : null}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.keywords ?? ""} ${option.value}`}
                  disabled={option.disabled}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                    aria-hidden
                  />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
