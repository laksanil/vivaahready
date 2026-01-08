import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  GraduationCap,
  User,
  Users,
  Utensils,
  Globe,
  Calendar,
  CheckCircle,
  Lock,
  ExternalLink,
  Image as ImageIcon,
  Clock,
} from 'lucide-react'
import { getProfileImageUrl, extractPhotoThumbnails, extractDriveFolderLink } from '@/lib/googleDrive'
import InterestActions from '@/components/InterestActions'

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const hasProfile = (session?.user as any)?.hasProfile || false
  const approvalStatus = (session?.user as any)?.approvalStatus || null
  const isApproved = hasProfile && approvalStatus === 'approved'

  const profile = await prisma.profile.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  })

  if (!profile) {
    notFound()
  }

  // Query interest status if user is approved
  let interestStatus = { sentByMe: false, receivedFromThem: false, mutual: false }

  if (isApproved && session?.user?.id) {
    const sentInterest = await prisma.match.findUnique({
      where: {
        senderId_receiverId: {
          senderId: session.user.id,
          receiverId: profile.userId,
        }
      }
    })

    const receivedInterest = await prisma.match.findUnique({
      where: {
        senderId_receiverId: {
          senderId: profile.userId,
          receiverId: session.user.id,
        }
      }
    })

    const isMutual = (sentInterest && receivedInterest) ||
      sentInterest?.status === 'accepted' ||
      receivedInterest?.status === 'accepted'

    interestStatus = {
      sentByMe: !!sentInterest,
      receivedFromThem: !!receivedInterest,
      mutual: !!isMutual,
    }
  }

  const calculateAge = (dob: string | null): number | null => {
    if (!dob) return null
    const parts = dob.split('/')
    if (parts.length >= 2) {
      const year = parseInt(parts[parts.length - 1])
      if (year > 1900 && year < 2010) {
        return new Date().getFullYear() - year
      }
    }
    return null
  }

  const age = calculateAge(profile.dateOfBirth)
  const initials = profile.user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Get profile photos
  const mainPhotoUrl = getProfileImageUrl({
    profileImageUrl: profile.profileImageUrl,
    photoUrls: profile.photoUrls,
  }, 'w800')
  const photoThumbnails = extractPhotoThumbnails(profile.photoUrls, 'w400')
  const driveFolderLink = profile.drivePhotosLink || extractDriveFolderLink(profile.photoUrls)

  // Access control - mask data if user is not approved
  const canViewFull = isApproved
  const isPending = hasProfile && approvalStatus === 'pending'
  const displayName = canViewFull ? profile.user.name : profile.user.name.split(' ')[0].charAt(0) + '****'
  const displayLocation = canViewFull
    ? profile.currentLocation
    : profile.currentLocation
      ? profile.currentLocation.split(',').pop()?.trim() + ' area'
      : null

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/search"
          className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Search
        </Link>

        {/* Access Control Banner */}
        {!canViewFull && (
          <div className={`mb-6 p-4 rounded-xl ${isPending ? 'bg-yellow-50 border border-yellow-200' : 'bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200'}`}>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {isPending ? (
                  <Clock className="h-8 w-8 text-yellow-600" />
                ) : (
                  <Lock className="h-8 w-8 text-primary-600" />
                )}
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold text-gray-900">
                  {isPending
                    ? 'Profile Pending Approval'
                    : session
                    ? 'Complete Your Profile'
                    : 'Sign In Required'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isPending
                    ? 'Your profile is being reviewed. You can view matches once approved.'
                    : session
                    ? 'Create your profile to see full details and connect with this person'
                    : 'Sign in or create an account to view complete profile information'}
                </p>
              </div>
              {!isPending && (
                <Link
                  href={session ? '/profile/create' : '/register'}
                  className="flex-shrink-0 btn-primary text-sm"
                >
                  {session ? 'Complete Profile' : 'Get Started'}
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Hero Photo or Gradient */}
          <div className="h-48 md:h-64 bg-gradient-to-r from-primary-500 to-primary-600 relative">
            {mainPhotoUrl && canViewFull && (
              <img
                src={mainPhotoUrl}
                alt={profile.user.name}
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}
            {mainPhotoUrl && !canViewFull && (
              <div className="absolute inset-0">
                <img
                  src={mainPhotoUrl}
                  alt=""
                  className="w-full h-full object-cover filter blur-lg scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-white/40" />
              </div>
            )}
          </div>

          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end -mt-16 mb-4">
              {/* Profile Photo */}
              <div className={`h-32 w-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden ${!canViewFull ? 'relative' : ''}`}>
                {mainPhotoUrl ? (
                  <>
                    <img
                      src={mainPhotoUrl}
                      alt={profile.user.name}
                      className={`w-full h-full object-cover ${!canViewFull ? 'filter blur-md' : ''}`}
                      referrerPolicy="no-referrer"
                    />
                    {!canViewFull && (
                      <div className="absolute inset-0 bg-white/30 flex items-center justify-center">
                        <Lock className="h-8 w-8 text-gray-600" />
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-4xl font-bold text-primary-600">{initials}</span>
                )}
              </div>

              <div className="mt-4 sm:mt-0 sm:ml-6 sm:mb-2">
                <div className="flex items-center gap-3">
                  <h1 className={`text-2xl font-bold text-gray-900 ${!canViewFull ? 'blur-[4px] select-none' : ''}`}>
                    {canViewFull ? profile.user.name : displayName}
                  </h1>
                  {profile.isVerified && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    profile.gender === 'female' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {profile.gender === 'female' ? 'Bride' : 'Groom'}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">
                  {age && `${age} years`}
                  {age && profile.height && ' • '}
                  {profile.height}
                  {(age || profile.height) && displayLocation && ' • '}
                  <span className={!canViewFull ? 'blur-[3px] select-none' : ''}>{displayLocation}</span>
                </p>
              </div>

              {canViewFull && (
                <div className="mt-4 sm:mt-0 sm:ml-auto w-full sm:w-auto sm:max-w-xs">
                  <InterestActions
                    profileId={profile.id}
                    initialStatus={interestStatus}
                    contactInfo={interestStatus.mutual ? {
                      name: profile.user.name,
                      email: profile.user.email,
                      phone: profile.user.phone,
                      linkedinProfile: profile.linkedinProfile,
                      facebookInstagram: profile.facebookInstagram,
                    } : undefined}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Photo Gallery */}
        {canViewFull && photoThumbnails.length > 1 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Photos</h2>
              {driveFolderLink && (
                <a
                  href={driveFolderLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                >
                  View All Photos
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              )}
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {photoThumbnails.slice(0, 8).map((url, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drive Folder Link (if no inline photos) */}
        {canViewFull && driveFolderLink && photoThumbnails.length <= 1 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
            <a
              href={driveFolderLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 py-4 text-primary-600 hover:text-primary-700 border-2 border-dashed border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
            >
              <ImageIcon className="h-6 w-6" />
              <span className="font-medium">View Photos on Google Drive</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            {/* About */}
            {profile.aboutMe && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
                <p className={`text-gray-600 whitespace-pre-line ${!canViewFull ? 'blur-[3px] select-none' : ''}`}>
                  {canViewFull ? profile.aboutMe : profile.aboutMe.substring(0, 100) + '...'}
                </p>
              </div>
            )}

            {/* Basic Details */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem icon={Calendar} label="Date of Birth" value={profile.dateOfBirth} blur={!canViewFull} />
                <InfoItem icon={MapPin} label="Place of Birth" value={profile.placeOfBirth} blur={!canViewFull} />
                <InfoItem icon={User} label="Height" value={profile.height} />
                <InfoItem icon={User} label="Marital Status" value={profile.maritalStatus} />
                <InfoItem icon={Utensils} label="Diet" value={profile.dietaryPreference} />
                <InfoItem icon={Globe} label="Languages" value={profile.languagesKnown} />
              </div>
            </div>

            {/* Education & Career */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Education & Career</h2>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem icon={GraduationCap} label="Qualification" value={profile.qualification} />
                <InfoItem icon={GraduationCap} label="University" value={profile.university} blur={!canViewFull} />
                <InfoItem icon={Briefcase} label="Occupation" value={profile.occupation} />
                <InfoItem icon={MapPin} label="Current Location" value={canViewFull ? profile.currentLocation : displayLocation} blur={!canViewFull} />
                <InfoItem icon={Briefcase} label="Annual Income" value={canViewFull ? profile.annualIncome : 'Disclosed to members'} blur={!canViewFull} />
              </div>
            </div>

            {/* Family Details */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Family Background</h2>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem icon={User} label="Father's Name" value={canViewFull ? profile.fatherName : '••••••'} blur={!canViewFull} />
                <InfoItem icon={User} label="Mother's Name" value={canViewFull ? profile.motherName : '••••••'} blur={!canViewFull} />
                <InfoItem icon={Users} label="Siblings" value={profile.siblings} />
                <InfoItem icon={MapPin} label="Family Location" value={profile.familyLocation} blur={!canViewFull} />
              </div>
            </div>

            {/* Religious Background */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Religious Background</h2>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem icon={User} label="Caste" value={profile.caste} />
                <InfoItem icon={User} label="Gotra" value={profile.gotra} />
              </div>
            </div>
          </div>

          {/* Sidebar - Partner Preferences */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Partner Preferences</h2>
              <div className="space-y-4">
                <PreferenceItem label="Height" value={profile.prefHeight} />
                <PreferenceItem label="Age Difference" value={profile.prefAgeDiff} />
                <PreferenceItem label="Location" value={profile.prefLocation} />
                <PreferenceItem label="Diet" value={profile.prefDiet} />
                <PreferenceItem label="Caste" value={profile.prefCaste} />
                <PreferenceItem label="Gotra" value={profile.prefGotra} />
                <PreferenceItem label="Qualification" value={profile.prefQualification} />
                <PreferenceItem label="Income" value={profile.prefIncome} />
              </div>

              {profile.idealPartnerDesc && (
                <div className="mt-6 pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Looking For</h3>
                  <p className={`text-sm text-gray-600 ${!canViewFull ? 'blur-[2px] select-none' : ''}`}>
                    {canViewFull ? profile.idealPartnerDesc : profile.idealPartnerDesc.substring(0, 50) + '...'}
                  </p>
                </div>
              )}
            </div>

            {/* Connect */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Connect</h2>
              {canViewFull ? (
                interestStatus.mutual ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600 mb-4">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Contact Info Unlocked!</span>
                    </div>
                    {profile.user.email && (
                      <a
                        href={`mailto:${profile.user.email}`}
                        className="flex items-center text-gray-700 hover:text-primary-600"
                      >
                        <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {profile.user.email}
                      </a>
                    )}
                    {profile.user.phone && (
                      <a
                        href={`tel:${profile.user.phone}`}
                        className="flex items-center text-gray-700 hover:text-primary-600"
                      >
                        <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {profile.user.phone}
                      </a>
                    )}
                    {profile.linkedinProfile && profile.linkedinProfile !== 'NO' && (
                      <a
                        href={profile.linkedinProfile.startsWith('http') ? profile.linkedinProfile : `https://${profile.linkedinProfile}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-700"
                      >
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                        LinkedIn Profile
                      </a>
                    )}
                    {profile.facebookInstagram && (
                      <a
                        href={`https://instagram.com/${profile.facebookInstagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-pink-600 hover:text-pink-700"
                      >
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        {profile.facebookInstagram}
                      </a>
                    )}
                  </div>
                ) : (
                  <>
                    {profile.linkedinProfile && profile.linkedinProfile !== 'NO' && (
                      <a
                        href={profile.linkedinProfile.startsWith('http') ? profile.linkedinProfile : `https://${profile.linkedinProfile}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-700 mb-3"
                      >
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                        LinkedIn Profile
                      </a>
                    )}
                    <p className="text-sm text-gray-500">
                      Express interest to connect with this profile. Contact details will be shared upon mutual interest.
                    </p>
                  </>
                )
              ) : (
                <div className="text-center py-4">
                  <Lock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {isPending ? 'Pending approval' : 'Complete your profile to connect'}
                  </p>
                  {!isPending && (
                    <Link
                      href={session ? '/profile/create' : '/register'}
                      className="mt-3 inline-flex btn-primary text-sm"
                    >
                      {session ? 'Complete Profile' : 'Sign Up'}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value, blur = false }: { icon: any; label: string; value: string | null; blur?: boolean }) {
  if (!value) return null
  return (
    <div className="flex items-start">
      <Icon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`text-gray-900 ${blur ? 'blur-[3px] select-none' : ''}`}>{value}</p>
      </div>
    </div>
  )
}

function PreferenceItem({ label, value }: { label: string; value: string | null }) {
  if (!value || value === "Doesn't Matter") return null
  return (
    <div className="flex justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}
