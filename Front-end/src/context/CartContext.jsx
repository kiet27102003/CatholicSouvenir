import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_TO_CART': {
            const existingItemIndex = state.items.findIndex(
                item => item.id === action.payload.id
            );

            if (existingItemIndex > -1) {
                // Update quantity if item exists
                const updatedItems = [...state.items];
                updatedItems[existingItemIndex].quantity += action.payload.quantity;
                return { ...state, items: updatedItems };
            } else {
                // Add new item
                return { ...state, items: [...state.items, action.payload] };
            }
        }
        case 'REMOVE_FROM_CART':
            return {
                ...state,
                items: state.items.filter(item => item.id !== action.payload)
            };
        case 'UPDATE_QUANTITY': {
            const { id, quantity } = action.payload;
            if (quantity <= 0) {
                return {
                    ...state,
                    items: state.items.filter(item => item.id !== id)
                };
            }
            return {
                ...state,
                items: state.items.map(item =>
                    item.id === id ? { ...item, quantity } : item
                )
            };
        }
        case 'CLEAR_CART':
            return { ...state, items: [] };
        case 'TOGGLE_CART':
            return { ...state, isOpen: !state.isOpen };
        case 'SET_CART_OPEN':
            return { ...state, isOpen: action.payload };
        default:
            return state;
    }
};

export const CartProvider = ({ children }) => {
    // Load initial state from local storage or default to empty
    const initialState = {
        items: JSON.parse(localStorage.getItem('cartItems')) || [],
        isOpen: false
    };

    const [state, dispatch] = useReducer(cartReducer, initialState);

    // Persist cart items to local storage
    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(state.items));
    }, [state.items]);

    // Calculate totals
    const cartItemsCount = state.items.reduce((total, item) => total + item.quantity, 0);
    const cartTotalAmount = state.items.reduce(
        (total, item) => total + (item.price * item.quantity),
        0
    );

    // Action creators
    const addToCart = (product, quantity = 1) => {
        dispatch({
            type: 'ADD_TO_CART',
            payload: {
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.image || product.images?.[0]?.imageUrl || product.images?.[0]?.image_url,
                artisan: product.artisan || product.artisanName,
                quantity
            }
        });
        dispatch({ type: 'SET_CART_OPEN', payload: true }); // Open drawer on add
    };

    const removeFromCart = (id) => {
        dispatch({ type: 'REMOVE_FROM_CART', payload: id });
    };

    const updateQuantity = (id, quantity) => {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
    };

    const clearCart = () => {
        dispatch({ type: 'CLEAR_CART' });
    };

    const toggleCart = () => {
        dispatch({ type: 'TOGGLE_CART' });
    };

    const setCartOpen = (isOpen) => {
        dispatch({ type: 'SET_CART_OPEN', payload: isOpen });
    };

    return (
        <CartContext.Provider
            value={{
                cartItems: state.items,
                isCartOpen: state.isOpen,
                cartItemsCount,
                cartTotalAmount,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                toggleCart,
                setCartOpen
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
