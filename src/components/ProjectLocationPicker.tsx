import { useEffect, useMemo, useState } from 'react'
import type { RefObject } from 'react'
import {
  icon,
  type LatLngExpression,
  type LatLngTuple,
} from 'leaflet'
import { Loader2, MapPin, Search } from 'lucide-react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import type { ProjectLocation } from '@/types/project'

interface ProjectLocationPickerProps {
  value: ProjectLocation | null
  onChange: (value: ProjectLocation | null) => void
  cityError?: string
  districtError?: string
  cityInputRef?: RefObject<HTMLInputElement | null>
  districtInputRef?: RefObject<HTMLInputElement | null>
}

interface SearchResult {
  display_name: string
  lat: string
  lon: string
  source?: 'search' | 'marker'
}

const TURKEY_CENTER: LatLngTuple = [39.0, 35.0]
const DEFAULT_ZOOM = 6
const SELECTED_ZOOM = 14

const markerIcon = icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export default function ProjectLocationPicker({
  value,
  onChange,
  cityError,
  districtError,
  cityInputRef,
  districtInputRef,
}: ProjectLocationPickerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const hasCoordinates =
    typeof value?.latitude === 'number' && typeof value?.longitude === 'number'

  const mapCenter = useMemo<LatLngExpression>(() => {
    if (hasCoordinates) {
      return [value.latitude as number, value.longitude as number]
    }
    return TURKEY_CENTER
  }, [hasCoordinates, value?.latitude, value?.longitude])
  const [initialZoom] = useState(() =>
    hasCoordinates ? SELECTED_ZOOM : DEFAULT_ZOOM
  )

  const updateLocation = (nextValue: Partial<ProjectLocation>) => {
    const previous = value ?? {
      city: null,
      district: null,
      address: null,
      latitude: null,
      longitude: null,
    }

    onChange({
      ...previous,
      ...nextValue,
    })
  }

  const searchLocation = async () => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setSearchError('Lütfen arama için bir değer girin.')
      return
    }

    setSearching(true)
    setSearchError(null)

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=tr&limit=6&q=${encodeURIComponent(trimmed)}`,
        {
          headers: {
            'Accept-Language': 'tr',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Konum arama servisi şu anda yanıt vermiyor.')
      }

      const data = (await response.json()) as SearchResult[]
      setResults(data.map((item) => ({ ...item, source: 'search' as const })))
    } catch (error) {
      setSearchError(
        error instanceof Error
          ? error.message
          : 'Konum araması sırasında bir hata oluştu.'
      )
    } finally {
      setSearching(false)
    }
  }

  const applySearchResult = (result: SearchResult) => {
    const latitude = Number(result.lat)
    const longitude = Number(result.lon)

    updateLocation({
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
    })
  }

  const handleMapPick = async (latitude: number, longitude: number) => {
    updateLocation({ latitude, longitude })

    const fallbackName = `Haritada işaretlenen nokta (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            'Accept-Language': 'tr',
          },
        }
      )
      if (!response.ok) throw new Error()

      const data = (await response.json()) as { display_name?: string }
      const markerResult: SearchResult = {
        display_name: data.display_name || fallbackName,
        lat: latitude.toString(),
        lon: longitude.toString(),
        source: 'marker',
      }
      setResults((previous) => [
        markerResult,
        ...previous.filter((item) => item.source !== 'marker'),
      ])
    } catch {
      const markerResult: SearchResult = {
        display_name: fallbackName,
        lat: latitude.toString(),
        lon: longitude.toString(),
        source: 'marker',
      }
      setResults((previous) => [
        markerResult,
        ...previous.filter((item) => item.source !== 'marker'),
      ])
    }
  }

  return (
    <div className="space-y-4">
      <style>
        {`
          .project-location-map .leaflet-control-attribution {
            display: none !important;
          }
        `}
      </style>
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void searchLocation()
            }
          }}
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          placeholder="İl, ilçe veya adres ara"
        />
        <button
          type="button"
          onClick={() => void searchLocation()}
          disabled={searching}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Ara
        </button>
      </div>

      {searchError && <p className="text-xs text-red-500">{searchError}</p>}

      {results.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white">
          {results.map((result) => (
            <div
              key={`${result.lat}-${result.lon}-${result.display_name}`}
              className="flex items-start justify-between gap-3 border-b border-slate-100 px-3 py-2 text-sm text-slate-700 last:border-b-0"
            >
              <div className="flex min-w-0 items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span className="select-text wrap-break-word">
                  {formatResultDisplayName(result, query)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => applySearchResult(result)}
                className="shrink-0 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Seç
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="project-location-map relative h-80 overflow-hidden rounded-xl border border-slate-200">
        <MapContainer center={mapCenter} zoom={initialZoom} className="h-full w-full">
          <MapAttributionPrefix />
          <MapRecenter center={mapCenter} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler
            onPick={(latitude, longitude) => {
              void handleMapPick(latitude, longitude)
            }}
          />
          {hasCoordinates && (
            <Marker
              icon={markerIcon}
              position={[value.latitude as number, value.longitude as number]}
              draggable
              eventHandlers={{
                dragend: (event) => {
                  const latLng = event.target.getLatLng()
                  void handleMapPick(latLng.lat, latLng.lng)
                },
              }}
            />
          )}
        </MapContainer>
        <button
          type="button"
          onClick={() => {
            updateLocation({
              latitude: null,
              longitude: null,
            })
            setResults((previous) =>
              previous.filter((item) => item.source !== 'marker')
            )
          }}
          disabled={!hasCoordinates}
          className="absolute right-3 top-3 z-500 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          İşareti Kaldır
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">İl *</label>
          <input
            ref={cityInputRef}
            value={value?.city ?? ''}
            onChange={(event) => updateLocation({ city: event.target.value || null })}
            aria-invalid={Boolean(cityError)}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500/20 ${
              cityError
                ? 'border-red-300 focus:border-red-400'
                : 'border-slate-300 focus:border-sky-500'
            }`}
            placeholder="İl"
          />
          {cityError && <p className="mt-1 text-xs text-red-500">{cityError}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">İlçe *</label>
          <input
            ref={districtInputRef}
            value={value?.district ?? ''}
            onChange={(event) => updateLocation({ district: event.target.value || null })}
            aria-invalid={Boolean(districtError)}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500/20 ${
              districtError
                ? 'border-red-300 focus:border-red-400'
                : 'border-slate-300 focus:border-sky-500'
            }`}
            placeholder="İlçe"
          />
          {districtError && (
            <p className="mt-1 text-xs text-red-500">{districtError}</p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Adres</label>
        <textarea
          rows={2}
          value={value?.address ?? ''}
          onChange={(event) => updateLocation({ address: event.target.value || null })}
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          placeholder="Detaylı adres"
        />
      </div>

    </div>
  )
}

function MapClickHandler({
  onPick,
}: {
  onPick: (latitude: number, longitude: number) => void
}) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })

  return null
}

function MapRecenter({
  center,
}: {
  center: LatLngExpression
}) {
  const map = useMap()

  useEffect(() => {
    map.panTo(center)
  }, [center, map])

  return null
}

function MapAttributionPrefix() {
  const map = useMap()

  useEffect(() => {
    map.attributionControl.setPrefix(false)
  }, [map])

  return null
}

function formatResultDisplayName(result: SearchResult, query: string): string {
  if (result.source === 'marker') {
    return `Haritada işaretlenen yer: ${result.display_name}`
  }

  const trimmedQuery = query.trim()
  if (trimmedQuery.length > 0) {
    return `${trimmedQuery}: ${result.display_name}`
  }

  return result.display_name
}

