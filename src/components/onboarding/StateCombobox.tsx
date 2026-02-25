import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface StateComboboxProps {
    estados: any[];
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function StateCombobox({ estados, value, onChange, disabled }: StateComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    const filteredEstados = React.useMemo(() => {
        if (!search) return estados;
        return estados.filter((estado) =>
            estado.nome.toLowerCase().includes(search.toLowerCase()) ||
            estado.sigla.toLowerCase().includes(search.toLowerCase())
        );
    }, [estados, search]);

    const selectedEstado = estados.find((estado) => estado.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="w-full justify-between h-11 bg-white/[0.02] border-white/5 rounded-lg text-white font-normal hover:bg-white/5 hover:text-white"
                >
                    {value
                        ? `${selectedEstado?.nome} (${selectedEstado?.sigla})`
                        : "Selecione o estado..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-zinc-950 border-white/10 text-white backdrop-blur-xl">
                <Command className="bg-transparent text-white" shouldFilter={false}>
                    <div className="flex items-center border-b border-white/10 px-3" cmdk-input-wrapper="">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 text-white"
                            placeholder="Pesquisar estado..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <CommandList>
                        <CommandEmpty>Nenhum estado encontrado.</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                            {filteredEstados.map((estado) => (
                                <CommandItem
                                    key={estado.id}
                                    value={estado.nome}
                                    onSelect={() => {
                                        onChange(estado.id)
                                        setOpen(false)
                                    }}
                                    className="data-[selected=true]:bg-white/10 data-[selected=true]:text-white hover:bg-white/10 cursor-pointer text-white/80"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === estado.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {estado.nome} ({estado.sigla})
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
