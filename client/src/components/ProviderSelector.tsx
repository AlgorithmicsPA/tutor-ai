import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProviderSelectorProps {
  value: "openai" | "gemini";
  onChange: (value: "openai" | "gemini") => void;
}

export function ProviderSelector({ value, onChange }: ProviderSelectorProps) {
  return (
    <div className="flex items-center gap-3" data-testid="provider-selector">
      <label htmlFor="provider" className="text-sm font-medium text-foreground">
        Proveedor de IA:
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]" data-testid="select-provider">
          <SelectValue placeholder="Selecciona proveedor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="openai">OpenAI (GPT)</SelectItem>
          <SelectItem value="gemini">Google Gemini</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
