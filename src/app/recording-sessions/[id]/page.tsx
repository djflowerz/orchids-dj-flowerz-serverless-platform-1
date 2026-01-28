import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { notFound } from "next/navigation"
import BookingForm from "@/components/recording/BookingForm"
import { Check, Mic2, Clock, Music, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function SessionDetailPage({ params }: PageProps) {
    const { id } = await params
    const user = await getCurrentUser()

    const session = await prisma.recordingSession.findUnique({
        where: { id }
    })

    if (!session) return notFound()

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Link href="/recording-sessions" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Sessions
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{session.name}</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                                    {session.locationType.replace('_', ' ')}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {session.duration ? `${session.duration} minutes` : 'Flexible Duration'}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Starting from</p>
                            <p className="text-3xl font-bold text-purple-600">KES {session.basePrice.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-12">
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">About the Session</h2>
                            <div className="prose prose-purple max-w-none text-gray-600">
                                <p>{session.description}</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-6">What's Included</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                        <Mic2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{session.equipmentTier} Equipment</h4>
                                        <p className="text-sm text-gray-500">Professional grade gear for your recording.</p>
                                    </div>
                                </div>

                                {session.includesEditing && (
                                    <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                                        <div className="p-2 rounded-lg bg-green-50 text-green-600">
                                            <Music className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Mixing & Editing</h4>
                                            <p className="text-sm text-gray-500">Professional post-production included.</p>
                                        </div>
                                    </div>
                                )}

                                {session.includesMastering && (
                                    <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                                        <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                                            <Sparkles className="w-5 h-5" /> // Sparkles undefined? Need to check import
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Final Mastering</h4>
                                            <p className="text-sm text-gray-500">Radio-ready final output quality.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Important Notes</h2>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3 text-gray-600">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>Please arrive 15 minutes before your scheduled time.</span>
                                </li>
                                <li className="flex items-start gap-3 text-gray-600">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>Back up your files immediately after the session.</span>
                                </li>
                                {session.locationType === 'IN_STUDIO' && (
                                    <li className="flex items-start gap-3 text-gray-600">
                                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span>Studio location details will be sent upon confirmation.</span>
                                    </li>
                                )}
                            </ul>
                        </section>
                    </div>

                    {/* Right Column: Booking Form */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8">
                            <BookingForm session={session} user={user} />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

function Sparkles(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
        </svg>
    )
}
