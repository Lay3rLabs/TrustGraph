'use client'

import { ChevronDown } from 'lucide-react'

import { useNetwork } from '@/contexts/NetworkContext'

import { Button, ButtonProps } from './Button'
import { Input } from './Input'
import { Popup } from './Popup'
import { Switch } from './Switch'

export type NetworkSimulationConfigDropdownProps = {
  className?: string
  size?: ButtonProps['size']
}

export const NetworkSimulationConfigDropdown = ({
  className,
  size = 'default',
}: NetworkSimulationConfigDropdownProps) => {
  const { simulationConfig, setSimulationConfig } = useNetwork()

  return (
    <Popup
      position="left"
      popupClassName="!p-0"
      popupPadding={0}
      trigger={{
        type: 'custom',
        Renderer: ({ onClick, open }) => (
          <Button
            variant={
              open
                ? 'outline'
                : simulationConfig.enabled
                ? 'brand'
                : 'secondary'
            }
            onClick={onClick}
            size={size}
            className={className}
          >
            <span>{simulationConfig.enabled ? 'SIMULATING' : 'SIMULATE'}</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        ),
      }}
    >
      <Button
        variant="ghost"
        className="!justify-between !rounded-none !px-3 !pt-2.5 !pb-2 !gap-4"
        size={null}
        onClick={() =>
          setSimulationConfig((config) => ({
            ...config,
            enabled: !config.enabled,
          }))
        }
      >
        <span>{simulationConfig.enabled ? 'Enabled' : 'Disabled'}</span>
        <Switch
          onClick={(e) => {
            e.stopPropagation()
            setSimulationConfig((config) => ({
              ...config,
              enabled: !config.enabled,
            }))
          }}
          size="md"
          enabled={simulationConfig.enabled}
        />
      </Button>

      <div className="flex flex-row justify-between items-center gap-4 px-3 pt-2.5 pb-2 text-sm">
        <span>Damping</span>
        <Input
          value={simulationConfig.dampingFactor}
          onChange={(e) =>
            setSimulationConfig((config) => ({
              ...config,
              dampingFactor: Number(e.target.value),
            }))
          }
          step={0.01}
          min={0}
          max={1}
          type="number"
          className="text-sm w-32"
        />
      </div>

      <div className="flex flex-row justify-between items-center gap-4 px-3 py-2 text-sm">
        <span>Trust Multiplier</span>
        <Input
          value={simulationConfig.trustMultiplier}
          onChange={(e) =>
            setSimulationConfig((config) => ({
              ...config,
              trustMultiplier: Number(e.target.value),
            }))
          }
          step={0.1}
          type="number"
          min={0}
          className="text-sm w-32"
        />
      </div>

      <div className="flex flex-row justify-between items-center gap-4 px-3 py-2 text-sm">
        <span>Trust Share</span>
        <Input
          value={simulationConfig.trustShare}
          onChange={(e) =>
            setSimulationConfig((config) => ({
              ...config,
              trustShare: Number(e.target.value),
            }))
          }
          step={0.01}
          min={0}
          max={1}
          type="number"
          className="text-sm w-32"
        />
      </div>

      <div className="flex flex-row justify-between items-center gap-4 px-3 pt-2.5 pb-2 text-sm">
        <span>Trust Decay</span>
        <Input
          value={simulationConfig.trustDecay}
          onChange={(e) =>
            setSimulationConfig((config) => ({
              ...config,
              trustDecay: Number(e.target.value),
            }))
          }
          step={0.01}
          type="number"
          min={0}
          max={1}
          className="text-sm w-32"
        />
      </div>
    </Popup>
  )
}
