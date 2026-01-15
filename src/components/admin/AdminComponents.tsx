'use client'

import { ReactNode } from 'react'
import { Search, ChevronLeft, ChevronRight, Loader2, XCircle } from 'lucide-react'

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
  return (
    <div className="bg-white rounded-xl shadow-sm mb-6">
      <div className="border-b">
        <nav className="flex -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
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
      {children && <div className="p-4">{children}</div>}
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
  variant = 'default',
  className = '',
  href,
  target,
}: AdminIconButtonProps) {
  const baseClasses = `p-1.5 rounded transition-colors ${iconButtonStyles[variant]} ${className}`

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
        className={baseClasses}
        title={title}
      >
        {icon}
      </a>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${baseClasses} disabled:opacity-50`}
    >
      {icon}
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
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl ${modalMaxWidths[maxWidth]} w-full shadow-xl`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XCircle className="h-5 w-5 text-gray-500" />
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
  description?: string
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
