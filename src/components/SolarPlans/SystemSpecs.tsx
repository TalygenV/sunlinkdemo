import React, { useState } from "react";
import { ZapIcon, BatteryIcon, HomeIcon, ShieldCheckIcon } from "lucide-react";

interface SystemSpec {
  icon: string;
  label: string;
  value: string;
  subValue?: string;
  warranty?: string;
  details?: string;
}

interface SystemSpecsProps {
  specs: SystemSpec[];
  batteryCount: number;
}

const SystemSpecs: React.FC<SystemSpecsProps> = ({ specs, batteryCount }) => {
  const [expandedSpec, setExpandedSpec] = useState<string | null>(null);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "zap":
        return <ZapIcon className="text-amber-400\" size={20} />;
      case "battery":
        return <BatteryIcon className="text-green-500" size={20} />;
      case "home":
        return <HomeIcon className="text-slate-300" size={20} />;
      default:
        return <ShieldCheckIcon size={20} />;
    }
  };

  const toggleExpand = (label: string) => {
    if (expandedSpec === label) {
      setExpandedSpec(null);
    } else {
      setExpandedSpec(label);
    }
  };

  const getBatteryValue = () => {
    if (batteryCount === 0) return "Not Selected";
    return `${batteryCount} × 10kWh Battery${batteryCount > 1 ? "s" : ""}`;
  };

  const getBatterySubValue = () => {
    if (batteryCount === 0) return undefined;
    return `${batteryCount * 10}kWh Total Capacity`;
  };

  const updatedSpecs = specs.map((spec) => {
    if (spec.label === "Battery") {
      return {
        ...spec,
        value: getBatteryValue(),
        subValue: getBatterySubValue(),
      };
    }
    return spec;
  });

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">System Specifications</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {updatedSpecs.map((spec) => (
          <div
            key={spec.label}
            className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors cursor-pointer relative"
            onClick={() => toggleExpand(spec.label)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                {getIcon(spec.icon)}
              </div>
              <div>
                <p className="text-sm text-slate-400">{spec.label}</p>
                <p className="font-bold">{spec.value}</p>
                {spec.subValue && (
                  <p className="text-sm text-slate-300 mt-1">{spec.subValue}</p>
                )}
                {spec.warranty && (
                  <div className="flex items-center gap-1.5 text-xs text-green-400 mt-2">
                    <ShieldCheckIcon size={14} />
                    <span>{spec.warranty}</span>
                  </div>
                )}
              </div>
            </div>

            {expandedSpec === spec.label && spec.details && (
              <div className="mt-3 pt-3 border-t border-slate-600 animate-fadeIn">
                <p className="text-sm text-slate-300">{spec.details}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemSpecs;
