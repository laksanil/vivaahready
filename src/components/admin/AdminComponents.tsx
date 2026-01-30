'use client'

import { ReactNode, useRef, useEffect, useId, useState } from 'react'
import { Search, ChevronLeft, ChevronRight, Loader2, XCircle, MoreHorizontal, AlertTriangle } from 'lucide-react'

// ============================================
// TABS COMPONENT
// ============================================
interface Tab {
  id: string
  label: string
  count?: number
}

interface AdminTabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  children?: ReactNode // For search/filter content below tabs
}

export function AdminTabs({ tabs, activeTab, onTabChange, children }: AdminTabsProps) {
  const tablistId = useId()

  return (
    <div className="bg-white rounded-xl shadow-sm mb-6">
      <div className="border-b">
        <nav
          className="flex -mb-px overflow-x-auto"
          role="tablist"
          aria-label="Admin section tabs"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tablistId}-panel-${tab.id}`}
              id={`${tablistId}-tab-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
      {children && <div className="p-4" role="tabpanel">{children}</div>}
    </div>
  )
}

// ============================================
// SEARCH FILTER COMPONENT
// ============================================
interface AdminSearchFilterProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  onSearchSubmit: (e: React.FormEvent) => void
  placeholder?: string
  children?: ReactNode // For additional filter dropdowns
}

export function AdminSearchFilter({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  placeholder = 'Search...',
  children,
}: AdminSearchFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <form onSubmit={onSearchSubmit} className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </form>
      {children}
    </div>
  )
}

// ============================================
// TABLE COMPONENT
// ============================================
interface AdminTableProps {
  headers: { key: string; label: string; className?: string }[]
  children: ReactNode
  loading?: boolean
  emptyMessage?: string
  emptyIcon?: ReactNode
}

export function AdminTable({
  headers,
  children,
  loading,
  emptyMessage = 'No data found',
  emptyIcon,
}: AdminTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header) => (
                <th
                  key={header.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${header.className || ''}`}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function AdminTableEmpty({ message, icon }: { message: string; icon?: ReactNode }) {
  return (
    <tr>
      <td colSpan={100} className="px-4 py-12 text-center">
        {icon && <div className="flex justify-center mb-4">{icon}</div>}
        <p className="text-gray-500">{message}</p>
      </td>
    </tr>
  )
}

// ============================================
// PAGINATION COMPONENT
// ============================================
interface AdminPaginationProps {
  currentPage: number
  totalPages: number
  totalCount: number
  itemsShown: number
  itemLabel?: string
  onPageChange: (page: number) => void
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalCount,
  itemsShown,
  itemLabel = 'items',
  onPageChange,
}: AdminPaginationProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-white">
      <div className="text-sm text-gray-500">
        Showing {itemsShown} of {totalCount} {itemLabel}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ============================================
// BADGE COMPONENT
// ============================================
type BadgeVariant = 'approved' | 'pending' | 'rejected' | 'suspended' | 'verified' | 'bride' | 'groom' | 'gray' | 'info'

const badgeStyles: Record<BadgeVariant, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-red-100 text-red-700',
  verified: 'bg-green-100 text-green-700',
  bride: 'bg-pink-100 text-pink-700',
  groom: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-700',
  info: 'bg-blue-100 text-blue-700',
}

interface AdminBadgeProps {
  variant: BadgeVariant
  children: ReactNode
  className?: string
}

export function AdminBadge({ variant, children, className = '' }: AdminBadgeProps) {
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${badgeStyles[variant]} ${className}`}>
      {children}
    </span>
  )
}

// ============================================
// BUTTON COMPONENTS
// ============================================
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700',
  secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  success: 'bg-green-600 text-white hover:bg-green-700',
  ghost: 'text-gray-600 hover:bg-gray-100',
}

interface AdminButtonProps {
  variant?: ButtonVariant
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
  type?: 'button' | 'submit'
  title?: string
}

export function AdminButton({
  variant = 'primary',
  children,
  onClick,
  disabled,
  loading,
  className = '',
  type = 'button',
  title,
}: AdminButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${buttonStyles[variant]} ${className}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : children}
    </button>
  )
}

interface AdminIconButtonProps {
  icon: ReactNode
  onClick?: () => void
  disabled?: boolean
  title?: string
  'aria-label'?: string
  variant?: 'default' | 'purple' | 'pink' | 'green' | 'blue' | 'red' | 'orange' | 'gray'
  className?: string
  href?: string
  target?: string
}

const iconButtonStyles: Record<string, string> = {
  default: 'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
  purple: 'text-purple-500 hover:bg-purple-50',
  pink: 'text-pink-500 hover:bg-pink-50',
  green: 'text-green-500 hover:bg-green-50',
  blue: 'text-blue-500 hover:bg-blue-50',
  red: 'text-red-500 hover:bg-red-50',
  orange: 'text-orange-500 hover:bg-orange-50',
  gray: 'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
}

export function AdminIconButton({
  icon,
  onClick,
  disabled,
  title,
  'aria-label': ariaLabel,
  variant = 'default',
  className = '',
  href,
  target,
}: AdminIconButtonProps) {
  const baseClasses = `p-1.5 rounded transition-colors ${iconButtonStyles[variant]} ${className}`
  const accessibleLabel = ariaLabel || title

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
        className={baseClasses}
        title={title}
        aria-label={accessibleLabel}
      >
        <span aria-hidden="true">{icon}</span>
      </a>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={accessibleLabel}
      className={`${baseClasses} disabled:opacity-50`}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  )
}

// ============================================
// MODAL COMPONENT
// ============================================
interface AdminModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
}

const modalMaxWidths = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export function AdminModal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  maxWidth = 'md',
}: AdminModalProps) {
  const titleId = useId()
  const modalRef = useRef<HTMLDivElement>(null)

  // Handle escape key to close modal
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Focus trap and restore focus
  useEffect(() => {
    if (!isOpen) return

    const previousActiveElement = document.activeElement as HTMLElement
    modalRef.current?.focus()

    return () => {
      previousActiveElement?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`bg-white rounded-xl ${modalMaxWidths[maxWidth]} w-full shadow-xl outline-none`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            {icon && <span aria-hidden="true">{icon}</span>}
            <h2 id={titleId} className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XCircle className="h-5 w-5 text-gray-500" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// STAT CARD COMPONENT
// ============================================
interface AdminStatCardProps {
  label: string
  value: number | string
  icon: ReactNode
  color?: 'purple' | 'pink' | 'green' | 'blue' | 'red' | 'yellow' | 'gray'
  onClick?: () => void
}

const statCardColors = {
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  red: { bg: 'bg-red-100', text: 'text-red-600' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-600' },
}

export function AdminStatCard({ label, value, icon, color = 'purple', onClick }: AdminStatCardProps) {
  const colorClasses = statCardColors[color]
  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper
      onClick={onClick}
      className={`bg-white rounded-xl p-4 shadow-sm ${onClick ? 'hover:shadow-md transition-shadow cursor-pointer w-full text-left' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 ${colorClasses.bg} rounded-lg`}>
          <div className={colorClasses.text}>{icon}</div>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </Wrapper>
  )
}

// ============================================
// EMPTY STATE COMPONENT
// ============================================
interface AdminEmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
}

export function AdminEmptyState({ icon, title, description }: AdminEmptyStateProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
      <div className="flex justify-center mb-4 text-gray-300">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-gray-500">{description}</p>}
    </div>
  )
}

// ============================================
// PAGE HEADER COMPONENT
// ============================================
interface AdminPageHeaderProps {
  title: string
  description?: ReactNode
  actions?: ReactNode
}

export function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-gray-600 text-sm mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}

// ============================================
// HELPER FUNCTIONS
// ============================================
export function formatRelativeDate(date: string | null | undefined): string {
  if (!date) return 'Never'
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return d.toLocaleDateString()
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

// ============================================
// SKELETON LOADER COMPONENT
// ============================================
interface AdminTableSkeletonProps {
  rows?: number
  columns?: number
  showCheckbox?: boolean
}

export function AdminTableSkeleton({ rows = 5, columns = 6, showCheckbox = false }: AdminTableSkeletonProps) {
  const totalCols = showCheckbox ? columns + 1 : columns

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse" aria-busy="true" aria-label="Loading table data">
      {/* Header skeleton */}
      <div className="bg-gray-50 border-b">
        <div className="flex gap-4 p-4">
          {Array.from({ length: totalCols }).map((_, i) => (
            <div
              key={i}
              className={`h-4 bg-gray-200 rounded ${i === 0 && showCheckbox ? 'w-8' : 'flex-1'}`}
            />
          ))}
        </div>
      </div>
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b last:border-b-0">
          {Array.from({ length: totalCols }).map((_, colIndex) => (
            <div
              key={colIndex}
              className={`h-4 bg-gray-100 rounded ${colIndex === 0 && showCheckbox ? 'w-8' : 'flex-1'} ${
                rowIndex % 2 === 0 ? 'opacity-75' : ''
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ============================================
// CONFIRMATION MODAL COMPONENT
// ============================================
interface AdminConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'danger' | 'warning' | 'primary'
  isLoading?: boolean
  icon?: ReactNode
}

const confirmVariantStyles: Record<string, string> = {
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  warning: 'bg-orange-500 hover:bg-orange-600 text-white',
  primary: 'bg-primary-600 hover:bg-primary-700 text-white',
}

const confirmVariantIcons: Record<string, string> = {
  danger: 'text-red-500',
  warning: 'text-orange-500',
  primary: 'text-primary-500',
}

export function AdminConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  isLoading = false,
  icon,
}: AdminConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={icon || <AlertTriangle className={`h-5 w-5 ${confirmVariantIcons[confirmVariant]}`} />}
      maxWidth="sm"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${confirmVariantStyles[confirmVariant]}`}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            ) : (
              confirmText
            )}
          </button>
        </>
      }
    >
      <p className="text-gray-600">{message}</p>
    </AdminModal>
  )
}

// ============================================
// ACTION MENU COMPONENT
// ============================================
interface ActionMenuItem {
  label: string
  icon?: ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}

interface ActionMenuGroup {
  label?: string
  items: ActionMenuItem[]
}

interface AdminActionMenuProps {
  groups: ActionMenuGroup[]
  disabled?: boolean
}

export function AdminActionMenu({ groups, disabled }: AdminActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on escape
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="More actions"
        className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
        >
          {groups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {groupIndex > 0 && <div className="border-t border-gray-100 my-1" />}
              {group.label && (
                <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {group.label}
                </div>
              )}
              {group.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false)
                    item.onClick()
                  }}
                  disabled={item.disabled}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors disabled:opacity-50 ${
                    item.variant === 'danger'
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.icon && <span aria-hidden="true">{item.icon}</span>}
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// ============================================
// BULK ACTION BAR COMPONENT
// ============================================
interface AdminBulkActionBarProps {
  selectedCount: number
  onClearSelection: () => void
  children: ReactNode // Action buttons
}

export function AdminBulkActionBar({ selectedCount, onClearSelection, children }: AdminBulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-4 z-40"
      role="region"
      aria-label="Bulk actions"
    >
      <div className="flex items-center gap-2">
        <span className="font-medium">{selectedCount}</span>
        <span className="text-gray-300">selected</span>
      </div>
      <div className="w-px h-6 bg-gray-700" />
      <div className="flex items-center gap-2">
        {children}
      </div>
      <button
        onClick={onClearSelection}
        className="ml-2 p-1.5 hover:bg-gray-800 rounded transition-colors"
        aria-label="Clear selection"
      >
        <XCircle className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  )
}

// ============================================
// CHECKBOX COMPONENT FOR BULK SELECTION
// ============================================
interface AdminCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  indeterminate?: boolean
  'aria-label'?: string
}

export function AdminCheckbox({
  checked,
  onChange,
  indeterminate = false,
  'aria-label': ariaLabel,
}: AdminCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate
    }
  }, [indeterminate])

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={ariaLabel}
      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
    />
  )
}
