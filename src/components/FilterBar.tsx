import { Search, X } from 'lucide-react'
import type { Category } from '../lib/types'

interface PillOption<T extends string> {
  value: T
  count: number
}

export default function FilterBar({
  search,
  onSearchChange,
  categories,
  selectedCategories,
  onToggleCategory,
  onClear,
  hasActiveFilters,
}: {
  search: string
  onSearchChange: (v: string) => void
  categories: PillOption<Category>[]
  selectedCategories: Category[]
  onToggleCategory: (c: Category) => void
  onClear: () => void
  hasActiveFilters: boolean
}) {
  return (
    <search className="filter-bar" aria-label="Filters">
      <div className="filter-bar-inner">
        <label className="filter-search">
          <Search size={14} />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search animations"
            aria-label="Search animations"
          />
        </label>

        <div className="filter-pills" role="group" aria-label="Filter by category">
          {categories.map(({ value, count }) => (
            <button
              key={value}
              type="button"
              aria-pressed={selectedCategories.includes(value)}
              disabled={count === 0 && !selectedCategories.includes(value)}
              onClick={() => onToggleCategory(value)}
              className="k-pill"
            >
              {value} <span className="k-pill-count">· {count}</span>
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button type="button" onClick={onClear} className="filter-clear">
            <X size={13} />
            Clear filters
          </button>
        )}
      </div>
    </search>
  )
}
