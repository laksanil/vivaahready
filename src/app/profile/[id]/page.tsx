import { prisma } from '@/lib/prisma'
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
} from 'lucide-react'

export default async function ProfilePage({ params }: { params: { id: string } }) {
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

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-600" />
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end -mt-16 mb-4">
              <div className="h-32 w-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                <span className="text-4xl font-bold text-primary-600">{initials}</span>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-6 sm:mb-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{profile.user.name}</h1>
                  {profile.isVerified && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-gray-600">
                  {age && `${age} years`}
                  {age && profile.height && ' • '}
                  {profile.height}
                  {(age || profile.height) && profile.currentLocation && ' • '}
                  {profile.currentLocation}
                </p>
              </div>
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
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            {/* About */}
            {profile.aboutMe && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
                <p className="text-gray-600 whitespace-pre-line">{profile.aboutMe}</p>
              </div>
            )}

            {/* Basic Details */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem icon={Calendar} label="Date of Birth" value={profile.dateOfBirth} />
                <InfoItem icon={MapPin} label="Place of Birth" value={profile.placeOfBirth} />
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
                <InfoItem icon={GraduationCap} label="University" value={profile.university} />
                <InfoItem icon={Briefcase} label="Occupation" value={profile.occupation} />
                <InfoItem icon={MapPin} label="Current Location" value={profile.currentLocation} />
                <InfoItem icon={Briefcase} label="Annual Income" value={profile.annualIncome} />
              </div>
            </div>

            {/* Family Details */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Family Background</h2>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem icon={User} label="Father's Name" value={profile.fatherName} />
                <InfoItem icon={User} label="Mother's Name" value={profile.motherName} />
                <InfoItem icon={Users} label="Siblings" value={profile.siblings} />
                <InfoItem icon={MapPin} label="Family Location" value={profile.familyLocation} />
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
                  <p className="text-sm text-gray-600">{profile.idealPartnerDesc}</p>
                </div>
              )}
            </div>

            {/* Contact */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Connect</h2>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start">
      <Icon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-gray-900">{value}</p>
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
