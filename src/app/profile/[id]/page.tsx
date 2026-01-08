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
  Heart,
  User,
  Users,
  Utensils,
  Globe,
  Calendar,
  MessageCircle,
  CheckCircle,
  Linkedin,
  Lock,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react'
import { getProfileImageUrl, extractPhotoThumbnails, extractDriveFolderLink } from '@/lib/googleDrive'

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const hasProfile = session?.user?.hasProfile || false

  const profile = await prisma.profile.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  if (!profile) {
    notFound()
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

  // Access control - mask data if user doesn't have profile
  const canViewFull = hasProfile
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
          <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <Lock className="h-8 w-8 text-primary-600" />
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold text-gray-900">
                  {session ? 'Complete Your Profile' : 'Sign In Required'}
                </h3>
                <p className="text-sm text-gray-600">
                  {session
                    ? 'Create your profile to see full details and connect with this person'
                    : 'Sign in or create an account to view complete profile information'}
                </p>
              </div>
              <Link
                href={session ? '/profile/create' : '/register'}
                className="flex-shrink-0 btn-primary text-sm"
              >
                {session ? 'Complete Profile' : 'Get Started'}
              </Link>
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
                <div className="mt-4 sm:mt-0 sm:ml-auto flex gap-3">
                  <button className="btn-primary flex items-center">
                    <Heart className="h-4 w-4 mr-2" />
                    Express Interest
                  </button>
                  <button className="btn-outline flex items-center">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </button>
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
                <>
                  {profile.linkedinProfile && profile.linkedinProfile !== 'NO' && (
                    <a
                      href={profile.linkedinProfile.startsWith('http') ? profile.linkedinProfile : `https://${profile.linkedinProfile}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-700 mb-3"
                    >
                      <Linkedin className="h-5 w-5 mr-2" />
                      LinkedIn Profile
                    </a>
                  )}
                  <p className="text-sm text-gray-500">
                    Express interest to connect with this profile. Contact details will be shared upon mutual interest.
                  </p>
                </>
              ) : (
                <div className="text-center py-4">
                  <Lock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Complete your profile to connect
                  </p>
                  <Link
                    href={session ? '/profile/create' : '/register'}
                    className="mt-3 inline-flex btn-primary text-sm"
                  >
                    {session ? 'Complete Profile' : 'Sign Up'}
                  </Link>
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
