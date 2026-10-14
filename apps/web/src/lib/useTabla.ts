import { useMemo, useState } from 'react'

export type SortDir = 'asc' | 'desc'

export interface TablaControls<T> {
  /** Sorted + paginated rows to render */
  filasPagina: T[]
  /** Total rows after filtering (before pagination) */
  total: number
  sortCol: string
  sortDir: SortDir
  pageSize: number
  page: number
  totalPages: number
  setPageSize: (n: number) => void
  setPage: (n: number) => void
  toggleSort: (col: string) => void
  /** Call whenever the source data or external filters change to reset to page 1 */
  resetPage: () => void
}

export const PAGE_SIZES = [10, 25, 50, 100] as const

/**
 * useTabla — lightweight sort + pagination hook.
 *
 * @param rows      The already-filtered source array.
 * @param defaultSort  Column key to sort by on first render.
 * @param defaultDir   Initial sort direction.
 * @param getVal    A function that extracts a comparable value from a row by key.
 */
export function useTabla<T>(
  rows: T[],
  defaultSort: string,
  defaultDir: SortDir = 'desc',
  getVal: (row: T, col: string) => string | number | null | undefined,
  initialPageSize: number = 25,
): TablaControls<T> {
  const [sortCol, setSortCol] = useState(defaultSort)
  const [sortDir, setSortDir] = useState<SortDir>(defaultDir)
  const [pageSize, setPageSizeRaw] = useState(initialPageSize)
  const [page, setPageRaw] = useState(1)

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = getVal(a, sortCol) ?? ''
      const bv = getVal(b, sortCol) ?? ''
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [rows, sortCol, sortDir, getVal])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const filasPagina = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, safePage, pageSize])

  const toggleSort = (col: string) => {
    if (col === sortCol) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
    setPageRaw(1)
  }

  const setPageSize = (n: number) => {
    setPageSizeRaw(n)
    setPageRaw(1)
  }

  const setPage = (n: number) => setPageRaw(Math.max(1, Math.min(n, totalPages)))

  const resetPage = () => setPageRaw(1)

  return {
    filasPagina,
    total: rows.length,
    sortCol,
    sortDir,
    pageSize,
    page: safePage,
    totalPages,
    setPageSize,
    setPage,
    toggleSort,
    resetPage,
  }
}
