'use client'
import { useState } from 'react'
import { XIcon } from 'lucide-react'
import { useAppDispatch } from '@/lib/hooks'
import { addAddress } from '@/lib/features/address/addressSlice'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

interface AddressModalProps {
    setShowAddressModal: (show: boolean) => void
}

export default function AddressModal({ setShowAddressModal }: AddressModalProps) {
    const dispatch = useAppDispatch()
    const { user } = useAuth()

    const [formData, setFormData] = useState({
        name: user?.displayName || '',
        email: user?.email || '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'Kenya',
        phone: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user) {
            toast.error('Please login to add an address')
            return
        }

        try {
            const addressData = {
                ...formData,
                userId: user.uid,
                createdAt: new Date().toISOString(),
            }

            const docRef = await addDoc(collection(db, 'addresses'), addressData)

            dispatch(addAddress({
                id: docRef.id,
                ...addressData,
            }))

            toast.success('Address added successfully')
            setShowAddressModal(false)
        } catch (error) {
            console.error('Error adding address:', error)
            toast.error('Failed to add address')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-slate-800">Add Shipping Address</h2>
                    <button
                        onClick={() => setShowAddressModal(false)}
                        className="p-1 hover:bg-slate-100 rounded-full transition"
                    >
                        <XIcon size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Phone Number *
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            placeholder="+254..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Street Address *
                        </label>
                        <input
                            type="text"
                            name="street"
                            value={formData.street}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                City *
                            </label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                State/County *
                            </label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Postal Code
                            </label>
                            <input
                                type="text"
                                name="zip"
                                value={formData.zip}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Country *
                            </label>
                            <input
                                type="text"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-fuchsia-600 text-white py-2.5 rounded-md hover:bg-fuchsia-700 active:scale-95 transition-all font-medium"
                    >
                        Save Address
                    </button>
                </form>
            </div>
        </div>
    )
}
