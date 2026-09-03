import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'
import { get, set, del } from 'idb-keyval'

// Custom IndexDB storage for Zustand to handle larger offline data payloads
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name)
  },
}

// 1. Wizard del Operador (Patio)
export interface InspeccionDraft {
  pasoActual: number
  datos: Record<string, any>
  timestamp: number | null
}

// 2. Wizard de Compras (Carrito)
export interface RequisicionDraft {
  items: any[]
  otId: string | null
  urgencia: string
}

interface WizardState {
  inspeccion: InspeccionDraft
  compras: RequisicionDraft
  
  // Acciones Inspección
  setInspeccionDatos: (datos: Partial<Record<string, any>>) => void
  setPasoInspeccion: (paso: number) => void
  clearInspeccion: () => void

  // Acciones Compras
  agregarItemCompra: (item: any) => void
  removerItemCompra: (index: number) => void
  setOtId: (id: string) => void
  clearCompras: () => void
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      inspeccion: {
        pasoActual: 0,
        datos: {},
        timestamp: null,
      },
      compras: {
        items: [],
        otId: null,
        urgencia: 'Medio',
      },

      setInspeccionDatos: (nuevosDatos) =>
        set((state) => ({
          inspeccion: {
            ...state.inspeccion,
            datos: { ...state.inspeccion.datos, ...nuevosDatos },
            timestamp: Date.now(),
          },
        })),

      setPasoInspeccion: (paso) =>
        set((state) => ({
          inspeccion: {
            ...state.inspeccion,
            pasoActual: paso,
            timestamp: Date.now(),
          },
        })),

      clearInspeccion: () =>
        set(() => ({
          inspeccion: { pasoActual: 0, datos: {}, timestamp: null },
        })),

      agregarItemCompra: (item) =>
        set((state) => ({
          compras: {
            ...state.compras,
            items: [...state.compras.items, item],
          },
        })),

      removerItemCompra: (index) =>
        set((state) => ({
          compras: {
            ...state.compras,
            items: state.compras.items.filter((_, i) => i !== index),
          },
        })),

      setOtId: (id) =>
        set((state) => ({
          compras: {
            ...state.compras,
            otId: id,
          },
        })),

      clearCompras: () =>
        set(() => ({
          compras: { items: [], otId: null, urgencia: 'Medio' },
        })),
    }),
    {
      name: 'warhorse-wizards-storage',
      storage: createJSONStorage(() => idbStorage),
    }
  )
)
