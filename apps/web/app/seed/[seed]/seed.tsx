'use client'

import { useEffect, useState } from 'react'
import useMounted from '@/app/hooks/useMounted'
import { useVanilla } from '@/app/generate/vanilla'
import styles from './seed.module.css'
import { RandomizeRom, findPreset, Item } from 'core'
import {
  BeamMode,
  MajorDistributionMode,
  MinorDistributionMode,
  GravityHeatReduction
} from 'core/params'
import { cn } from '@/lib/utils'
import { downloadFile } from '@/lib/downloads'
import Button from '@/app/components/button'
import { useSearchParams } from 'next/navigation'
import { get as getKey } from 'idb-keyval'
import { ArrowDown } from 'react-feather'
import VanillaButton from '@/app/generate/vanilla'


type Seed = {
  data: any
  name: string
}

const getItemSplit = (value: number) => {
  switch (value) {
    case MajorDistributionMode.Standard:
      return 'Major/Minor'
    case MajorDistributionMode.Recall:
      return 'Recall Major/Minor'
    default:
      return 'Full'
  }
}

const getMinorItemDistribution = (value: number) => {
  switch (value) {
    case MinorDistributionMode.Dash:
      return 'DASH - 2:1:1'
    case MinorDistributionMode.Standard:
      return 'Standard - 3:2:1'
  }
}

const getMapLayout = (value: number) => {
  return value === 1 ? 'Standard' : 'DASH Recall'
}

const getBossMode = (value: number) => {
  return (value === 2) ? 'Randomized' : 'Standard'
}

const getAreaMode = (value: boolean) => value ? 'Randomized' : 'Standard'

const getBeamMode = (value: number) => {
  switch (value) {
    case BeamMode.Vanilla:
      return 'Vanilla'
    case BeamMode.DashClassic:
      return 'Classic'
    case BeamMode.DashRecall:
      return 'Recall'
    case BeamMode.New:
      return 'New'
  }
}

const getGravityMode = (value: number) => {
  return value === GravityHeatReduction.On ? 'On' : 'Off'
}

const displayOnOff = (value: boolean) => value ? 'On' : 'Off'

const getExtraItems = (extraItems: number[]) => {
  const doubleJump = displayOnOff(extraItems.includes(Item.DoubleJump))
  const heatShield = displayOnOff(extraItems.includes(Item.HeatShield))
  const pressureValve = displayOnOff(extraItems.includes(Item.PressureValve))
  return { doubleJump, heatShield, pressureValve }
}

const parseSettings = (parameters: any) => {
  const { itemPoolParams } = parameters
  const extraItems = getExtraItems(itemPoolParams.majorDistribution.extraItems)
  const randomizeParams = [
    { label: 'Item Split', value: getItemSplit(itemPoolParams.majorDistribution.mode) },
    { label: 'Boss', value: getBossMode(parameters.settings.bossMode) },
    { label: 'Area', value: getAreaMode(parameters.settings.randomizeAreas) }
  ]
  const settingsParams = [
    { label: 'Minor Item Distribution', value: getMinorItemDistribution(itemPoolParams.minorDistribution.mode)},
    { label: 'Map Layout', value: getMapLayout(parameters.mapLayout) },
    { label: 'Beam Mode', value: getBeamMode(parameters.settings.beamMode), },
    { label: 'Gravity Heat Reduction', value: getGravityMode(parameters.settings.gravityHeatReduction), },
    { label: 'Double Jump', value: extraItems.doubleJump, },
    { label: 'Heat Shield', value: extraItems.heatShield, },
    { label: 'Pressure Valve', value: extraItems.pressureValve, },
  ]
  const optionsParams = [
    { label: 'Seed Number', value: parameters.seed },
    { label: 'Disable Fanfare', value: displayOnOff(parameters.options.DisableFanfare), }
  ]
  return { randomizeParams, settingsParams, optionsParams }
}

const Parameters = ({ title, items }: { title: string, items: any[] }) => {
  return (
    <section className={styles.parameters}>
      <h4 className={styles.heading}>{title}</h4>
      {items.length > 0 && (
        <ul className={styles.list}>
          {items.map((item, index) => (
            <li key={index} className={styles.item}>
              <div className={styles.label}>{item.label}</div>
              <div className={styles.value}>{item.value}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function Seed({
  parameters,
  hash,
  signature
}: {
  parameters: any,
  hash: string,
  signature: string
}) {
  const mounted = useMounted()
  const { data: vanilla } = useVanilla()
  const [seed, setSeed] = useState<Seed|null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams && mounted && seed) {
      const autoDownload = async() => {
        const downloadParam = searchParams.get('download')
        const forceExit = downloadParam === 'false'
        const hasDownloaded = await getKey(hash)
        if (forceExit || hasDownloaded) {
          return
        }
        downloadFile(seed?.data, seed?.name, hash)
      }
      autoDownload()
    }
  }, [hash, mounted, searchParams, seed])

  useEffect(() => {
    const initialize = async () => {
      if (vanilla && !seed?.data) {
        const { seed: seedNum, mapLayout, itemPoolParams, settings, options } = parameters
        const preset = findPreset({ mapLayout, itemPoolParams, settings })
        if (preset != undefined && preset.settings != undefined) {
          settings.preset = preset.settings.preset
        } else {
          settings.preset = "Custom"
        }
        const seedData = await RandomizeRom(seedNum, mapLayout, itemPoolParams, settings, options, {
          vanillaBytes: vanilla,
        })
        if (seedData.data) {
          setSeed(seedData)
        }
      }
    }
    initialize()
  }, [parameters, vanilla, seed])

  const hasVanilla = Boolean(vanilla)
  const parsedParams = parseSettings(parameters)

  return (
    <div>
      <div className={cn(styles.signature, !vanilla && styles.noVanilla)}>{signature || <>&nbsp;</>}</div>
      <div className={styles.download}>
        {(hasVanilla && seed) ? (
          <Button variant="hero" onClick={(evt) => {
            evt.preventDefault()
            // TODO: Refactor to show loading state if still getting seed
            if (seed) {
              downloadFile(seed?.data, seed?.name, hash)
            }
          }}>
            <ArrowDown size={14} strokeWidth={2} />
            <>&nbsp;</>
            <span className={styles.mono}>{seed?.name}</span>
          </Button>
        ) : (
          <div style={{ maxWidth: '300px' }}>
            <VanillaButton />
          </div>
        )}
      </div>
      <Parameters title="Randomization" items={parsedParams.randomizeParams} />
      <Parameters title="Settings" items={parsedParams.settingsParams} />
      <Parameters title="Options" items={parsedParams.optionsParams} />
    </div>
  )
}
