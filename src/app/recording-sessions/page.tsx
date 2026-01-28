import Link from 'next/link';
import { Mic2, MapPin, Clock, Sparkles } from 'lucide-react';

async function getRecordingSessions() {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/recording-sessions`, {
            cache: 'no-store',
        });

        if (!res.ok) {
            throw new Error('Failed to fetch sessions');
        }

        const data = await res.json();
        return data.sessions || [];
    } catch (error) {
        console.error('Error fetching sessions:', error);
        return [];
    }
}

const locationIcons: Record<string, string> = {
    IN_STUDIO: '🎙️',
    ON_LOCATION: '📍',
    REMOTE: '🌐',
};

const locationLabels: Record<string, string> = {
    IN_STUDIO: 'In Studio',
    ON_LOCATION: 'On Location',
    REMOTE: 'Remote',
};

const equipmentLabels: Record<string, string> = {
    BASIC: 'Basic',
    STANDARD: 'Standard',
    PREMIUM: 'Premium',
    CUSTOM: 'Custom',
};

export default async function RecordingSessionsPage() {
    const sessions = await getRecordingSessions();

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-20">
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-6">
                            <Mic2 className="w-4 h-4" />
                            <span>Professional Recording Services</span>
                        </div>
                        <h1 className="text-5xl font-bold mb-6">DJ Mix Recording Sessions</h1>
                        <p className="text-xl text-purple-100 max-w-2xl mx-auto">
                            Book professional recording sessions with state-of-the-art equipment and expert sound engineers
                        </p>
                    </div>
                </div>
            </div>

            {/* Sessions Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {sessions.length === 0 ? (
                    <div className="text-center py-20">
                        <Mic2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sessions Available</h3>
                        <p className="text-gray-600">Check back soon for available recording sessions</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {sessions.map((session: any) => (
                            <Link
                                key={session.id}
                                href={`/recording-sessions/${session.id}`}
                                className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                            >
                                <div className="p-6">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-2xl">{locationIcons[session.locationType]}</span>
                                                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                                                    {locationLabels[session.locationType]}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                                                {session.name}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                        {session.description}
                                    </p>

                                    {/* Features */}
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <Sparkles className="w-4 h-4 text-purple-500" />
                                            <span className="font-medium">{equipmentLabels[session.equipmentTier]} Equipment</span>
                                        </div>
                                        {session.duration && (
                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                <Clock className="w-4 h-4 text-purple-500" />
                                                <span>{session.duration} minutes</span>
                                            </div>
                                        )}
                                        {session.includesEditing && (
                                            <div className="flex items-center gap-2 text-sm text-green-600">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span>Includes Editing</span>
                                            </div>
                                        )}
                                        {session.includesMastering && (
                                            <div className="flex items-center gap-2 text-sm text-green-600">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span>Includes Mastering</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Price */}
                                    <div className="pt-4 border-t border-gray-100">
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-sm text-gray-500">Starting from</p>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    KES {session.basePrice.toLocaleString()}
                                                </p>
                                                {session.hourlyRate && (
                                                    <p className="text-xs text-gray-500">
                                                        or KES {session.hourlyRate.toLocaleString()}/hour
                                                    </p>
                                                )}
                                            </div>
                                            <div className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold group-hover:bg-purple-700 transition-colors">
                                                Book Now
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* CTA Section */}
            <div className="bg-gray-900 text-white py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold mb-4">Need a Custom Package?</h2>
                    <p className="text-gray-300 mb-8">
                        Contact us to discuss your specific requirements and get a personalized quote
                    </p>
                    <Link
                        href="/contact"
                        className="inline-block px-8 py-3 rounded-lg bg-white text-gray-900 font-semibold hover:bg-gray-100 transition-colors"
                    >
                        Contact Us
                    </Link>
                </div>
            </div>
        </div>
    );
}
