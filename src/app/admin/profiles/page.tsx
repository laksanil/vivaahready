'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Search, Filter, Download, Eye, Edit, Trash2,
  ChevronLeft, ChevronRight, CheckCircle, XCircle,
  Loader2, RefreshCw
} from 'lucide-react'

interface Profile {
  id: string
  gender: string
  dateOfBirth: string | null
  height: string | null
  currentLocation: string | null
  occupation: string | null
  qualification: string | null
  caste: string | null
  isVerified: boolean
  createdAt: string
  user: {
    name: string
    email: string
  }
}

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([])

  useEffect(() => {
    fetchProfiles()
  }, [page, genderFilter])

  const fetchProfiles = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(genderFilter && { gender: genderFilter }),
        ...(searchQuery && { search: searchQuery }),
      })
      const res = await fetch(`/api/admin/profiles?${params}`)
      const data = await res.json()
      setProfiles(data.profiles || [])
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      console.error('Failed to fetch profiles:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchProfiles()
  }

  const handleVerify = async (profileId: string, verified: boolean) => {
    try {
      await fetch(`/api/admin/profiles/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: verified }),
      })
      fetchProfiles()
    } catch (err) {
      console.error('Failed to update profile:', err)
    }
  }

  const handleDelete = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return

    try {
      await fetch(`/api/admin/profiles/${profileId}`, {
        method: 'DELETE',
      })
      fetchProfiles()
    } catch (err) {
      console.error('Failed to delete profile:', err)
    }
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Gender', 'Location', 'Occupation', 'Qualification', 'Caste', 'Created']
    const rows = profiles.map(p => [
      p.user.name,
      p.user.email,
      p.gender,
      p.currentLocation || '',
      p.occupation || '',
      p.qualification || '',
      p.caste || '',
      new Date(p.createdAt).toLocaleDateString()
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `profiles-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const toggleSelectAll = () => {
    if (selectedProfiles.length === profiles.length) {
      setSelectedProfiles([])
    } else {
      setSelectedProfiles(profiles.map(p => p.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedProfiles.includes(id)) {
      setSelectedProfiles(selectedProfiles.filter(p => p !== id))
    } else {
      setSelectedProfiles([...selectedProfiles, id])
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Manage Profiles</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchProfiles}
            className="flex items-center px-4 py-2 text-gray-600 bg-white border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center px-4 py-2 text-gray-600 bg-white border rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </form>

          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={genderFilter}
              onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Genders</option>
              <option value="female">Brides</option>
              <option value="male">Grooms</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedProfiles.length === profiles.length && profiles.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Occupation</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qualification</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedProfiles.includes(profile.id)}
                          onChange={() => toggleSelect(profile.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">{profile.user.name}</div>
                          <div className="text-sm text-gray-500">{profile.user.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          profile.gender === 'female'
                            ? 'bg-pink-100 text-pink-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {profile.gender === 'female' ? 'Bride' : 'Groom'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">
                        {profile.currentLocation || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">
                        {profile.occupation || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">
                        {profile.qualification || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {profile.isVerified ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-300" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/profile/${profile.id}`}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/admin/profiles/${profile.id}/edit`}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleVerify(profile.id, !profile.isVerified)}
                            className={`p-1 ${profile.isVerified ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-green-500'}`}
                            title={profile.isVerified ? 'Unverify' : 'Verify'}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(profile.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-gray-500">
                Showing {profiles.length} profiles
                {selectedProfiles.length > 0 && (
                  <span className="ml-2">({selectedProfiles.length} selected)</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
