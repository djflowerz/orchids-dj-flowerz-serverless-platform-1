import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Address {
    id: string
    userId: string
    name: string
    email: string
    street: string
    city: string
    state: string
    zip: string
    country: string
    phone: string
    createdAt: string
}

interface AddressState {
    list: Address[]
    loading: boolean
    error: string | null
}

const initialState: AddressState = {
    list: [],
    loading: false,
    error: null,
}

const addressSlice = createSlice({
    name: 'address',
    initialState,
    reducers: {
        setAddresses: (state, action: PayloadAction<Address[]>) => {
            state.list = action.payload
            state.loading = false
            state.error = null
        },
        addAddress: (state, action: PayloadAction<Address>) => {
            state.list.push(action.payload)
        },
        updateAddress: (state, action: PayloadAction<Address>) => {
            const index = state.list.findIndex(a => a.id === action.payload.id)
            if (index !== -1) {
                state.list[index] = action.payload
            }
        },
        deleteAddress: (state, action: PayloadAction<string>) => {
            state.list = state.list.filter(a => a.id !== action.payload)
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload
        },
        setError: (state, action: PayloadAction<string>) => {
            state.error = action.payload
            state.loading = false
        },
    },
})

export const { setAddresses, addAddress, updateAddress, deleteAddress, setLoading, setError } = addressSlice.actions

export default addressSlice.reducer
