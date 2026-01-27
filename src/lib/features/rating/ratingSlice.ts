import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Rating {
    id: string
    userId: string
    productId: string
    orderId: string
    rating: number
    review: string
    createdAt: string
}

interface RatingState {
    list: Rating[]
    loading: boolean
    error: string | null
}

const initialState: RatingState = {
    list: [],
    loading: false,
    error: null,
}

const ratingSlice = createSlice({
    name: 'rating',
    initialState,
    reducers: {
        setRatings: (state, action: PayloadAction<Rating[]>) => {
            state.list = action.payload
            state.loading = false
            state.error = null
        },
        addRating: (state, action: PayloadAction<Rating>) => {
            state.list.push(action.payload)
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

export const { setRatings, addRating, setLoading, setError } = ratingSlice.actions

export default ratingSlice.reducer
