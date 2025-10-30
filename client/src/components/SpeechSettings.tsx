import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "lucide-react";
import { useSpeech } from "@/contexts/SpeechContext";
import { useState } from "react";

interface SpeechSettingsProps {
  onSettingsChange?: (settings: { voice?: SpeechSynthesisVoice; rate: number }) => void;
}

export function SpeechSettings({ onSettingsChange }: SpeechSettingsProps) {
  const { voices, getChildFriendlyVoices, supported } = useSpeech();
  const [rate, setRate] = useState(0.9);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);

  if (!supported) return null;

  const childVoices = getChildFriendlyVoices();
  const availableVoices = childVoices.length > 0 ? childVoices : voices;

  const handleRateChange = (value: number[]) => {
    const newRate = value[0];
    setRate(newRate);
    onSettingsChange?.({
      voice: availableVoices[selectedVoiceIndex],
      rate: newRate,
    });
  };

  const handleVoiceChange = (value: string) => {
    const index = parseInt(value);
    setSelectedVoiceIndex(index);
    onSettingsChange?.({
      voice: availableVoices[index],
      rate,
    });
  };

  return (
    <Card className="p-4 space-y-4" data-testid="speech-settings">
      <div className="flex items-center gap-2">
        <Settings className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Configuración de Voz</h3>
      </div>

      <div className="space-y-3">
        {/* Voice Selection */}
        {availableVoices.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="voice-select" className="text-xs">
              Voz del Tutor
            </Label>
            <Select
              value={selectedVoiceIndex.toString()}
              onValueChange={handleVoiceChange}
            >
              <SelectTrigger id="voice-select" data-testid="select-voice">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableVoices.map((voice, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {voice.name} ({voice.lang})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Rate Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="rate-slider" className="text-xs">
              Velocidad
            </Label>
            <span className="text-xs text-muted-foreground">
              {rate.toFixed(1)}x
            </span>
          </div>
          <Slider
            id="rate-slider"
            min={0.5}
            max={1.5}
            step={0.1}
            value={[rate]}
            onValueChange={handleRateChange}
            data-testid="slider-rate"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Lento</span>
            <span>Normal</span>
            <span>Rápido</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
