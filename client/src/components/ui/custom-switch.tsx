import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CustomSwitchProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}

export function CustomSwitch({
  id,
  label,
  icon,
  defaultChecked = false,
  onChange,
}: CustomSwitchProps) {
  const [checked, setChecked] = useState(defaultChecked);

  const handleChange = (newChecked: boolean) => {
    setChecked(newChecked);
    if (onChange) {
      onChange(newChecked);
    }
  };

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center">
        {icon && <span className="mr-2">{icon}</span>}
        <Label htmlFor={id}>{label}</Label>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={handleChange}
      />
    </div>
  );
}
