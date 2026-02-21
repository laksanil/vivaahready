import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DirectoryCard } from '@/components/DirectoryCard'
import type { ProfileData } from '@/components/ProfileCard'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('@/hooks/useImpersonation', () => ({
  useImpersonation: () => ({
    buildUrl: (url: string) => url,
  }),
}))

function makeProfile(overrides: Partial<ProfileData> = {}): ProfileData {
  return {
    id: 'p-1',
    userId: 'u-1',
    gender: 'male',
    dateOfBirth: '01/01/1991',
    height: `5'10"`,
    currentLocation: 'San Jose, California',
    country: 'USA',
    occupation: 'software_engineer',
    qualification: 'masters_cs',
    educationLevel: 'masters',
    fieldOfStudy: 'cs_it',
    major: null,
    university: null,
    caste: null,
    community: 'Iyer',
    subCommunity: null,
    gotra: null,
    dietaryPreference: 'Vegetarian',
    maritalStatus: 'never_married',
    hasChildren: 'no',
    aboutMe: 'Profile for directory card tests.',
    photoUrls: null,
    profileImageUrl: null,
    annualIncome: '100k-150k',
    familyLocation: null,
    languagesKnown: null,
    religion: 'Hindu',
    hobbies: null,
    fitness: null,
    interests: null,
    grewUpIn: null,
    citizenship: null,
    user: {
      id: 'u-1',
      name: 'Test User',
    },
    ...overrides,
  }
}

describe('DirectoryCard education badges and display', () => {
  const expectBadge = (label: string) => {
    const badgeNodes = screen.getAllByText(label).filter(node => {
      const className = node.getAttribute('class') || ''
      return className.includes('text-[10px]') && className.includes('rounded')
    })
    expect(badgeNodes.length).toBeGreaterThan(0)
  }

  it('shows professional degree badges for MD, MBA, PhD, and JD', () => {
    const md = makeProfile({ id: 'md', user: { id: 'u-md', name: 'Md User' }, educationLevel: 'medical', qualification: 'md' })
    const mba = makeProfile({ id: 'mba', user: { id: 'u-mba', name: 'Mba User' }, educationLevel: 'mba', qualification: 'mba' })
    const phd = makeProfile({ id: 'phd', user: { id: 'u-phd', name: 'Phd User' }, educationLevel: 'doctorate', qualification: 'phd' })
    const jd = makeProfile({ id: 'jd', user: { id: 'u-jd', name: 'Jd User' }, educationLevel: 'law', qualification: 'jd' })

    const { rerender } = render(<DirectoryCard profile={md} showActions={false} />)
    expectBadge('MD')

    rerender(<DirectoryCard profile={mba} showActions={false} />)
    expectBadge('MBA')

    rerender(<DirectoryCard profile={phd} showActions={false} />)
    expectBadge('PhD')

    rerender(<DirectoryCard profile={jd} showActions={false} />)
    expectBadge('JD')
  })

  it('does not show badge for bachelors and masters profiles', () => {
    const bachelors = makeProfile({
      id: 'bachelors',
      user: { id: 'u-bachelors', name: 'Bachelors User' },
      educationLevel: 'bachelors',
      qualification: 'bachelors_cs',
    })
    const masters = makeProfile({
      id: 'masters',
      user: { id: 'u-masters', name: 'Masters User' },
      educationLevel: 'masters',
      qualification: 'masters_cs',
    })

    const { rerender } = render(<DirectoryCard profile={bachelors} showActions={false} />)
    expect(screen.queryByText(/^MD$/)).toBeNull()
    expect(screen.queryByText(/^MBA$/)).toBeNull()
    expect(screen.queryByText(/^PhD$/)).toBeNull()
    expect(screen.queryByText(/^JD$/)).toBeNull()

    rerender(<DirectoryCard profile={masters} showActions={false} />)
    expect(screen.queryByText(/^MD$/)).toBeNull()
    expect(screen.queryByText(/^MBA$/)).toBeNull()
    expect(screen.queryByText(/^PhD$/)).toBeNull()
    expect(screen.queryByText(/^JD$/)).toBeNull()
  })

  it('renders full education string when all fields are present', () => {
    const profile = makeProfile({
      educationLevel: 'masters',
      fieldOfStudy: 'social_sciences',
      major: 'School Psychology',
      university: 'Stanford',
      qualification: 'masters_arts',
    })

    render(<DirectoryCard profile={profile} showActions={false} />)
    expect(screen.getByText(/Master's Degree/i)).toBeInTheDocument()
    expect(screen.getByText(/Social Sciences & Psychology/i)).toBeInTheDocument()
    expect(screen.getByText(/School Psychology/i)).toBeInTheDocument()
    expect(screen.getByText(/Stanford/i)).toBeInTheDocument()
  })

  it('renders minimal education when only education level is present', () => {
    const profile = makeProfile({
      educationLevel: 'bachelors',
      qualification: 'bachelors_cs',
      fieldOfStudy: null,
      major: null,
      university: null,
    })

    render(<DirectoryCard profile={profile} showActions={false} />)
    expect(screen.getByText(/Bachelor's Degree/i)).toBeInTheDocument()
  })

  it('renders legacy-only qualification gracefully', () => {
    const profile = makeProfile({
      educationLevel: null,
      fieldOfStudy: null,
      major: null,
      university: null,
      qualification: 'pharmd',
    })

    render(<DirectoryCard profile={profile} showActions={false} />)
    expect(screen.getByText(/Pharmd/i)).toBeInTheDocument()
  })
})
