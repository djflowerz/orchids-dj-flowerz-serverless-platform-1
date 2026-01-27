import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Product {
    id: string
    title: string
    description: string
    price: number
    type: 'digital' | 'physical'
    images: string[]
    category?: string
    status: 'active' | 'inactive'
    downloads?: number
    stock?: number
    sku?: string
    version?: string
    average_rating?: number
    rating_count?: number
    created_at: string
}

interface ProductState {
    list: Product[]
    loading: boolean
    error: string | null
}

const initialState: ProductState = {
    list: [],
    loading: false,
    error: null,
}

const productSlice = createSlice({
    name: 'product',
    initialState,
    reducers: {
        setProducts: (state, action: PayloadAction<Product[]>) => {
            state.list = action.payload
            state.loading = false
            state.error = null
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload
        },
        setError: (state, action: PayloadAction<string>) => {
            state.error = action.payload
            state.loading = false
        },
        updateProduct: (state, action: PayloadAction<Product>) => {
            const index = state.list.findIndex(p => p.id === action.payload.id)
            if (index !== -1) {
                state.list[index] = action.payload
            }
        },
        addProduct: (state, action: PayloadAction<Product>) => {
            state.list.push(action.payload)
        },
    },
})

export const { setProducts, setLoading, setError, updateProduct, addProduct } = productSlice.actions

export default productSlice.reducer
