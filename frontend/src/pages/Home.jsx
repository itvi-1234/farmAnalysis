import React from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/authcontext/Authcontext'
import { doSignOut } from '../firebase/auth'

const Home = () => {
    const { currentUser, userLoggedIn } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        try {
            await doSignOut()
            navigate('/')
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    return (
        <>
            {!userLoggedIn && (<Navigate to={'/login'} replace={true} />)}
            
            <div className='min-h-screen bg-gray-50'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20'>
                    <div className='bg-white rounded-lg shadow-md p-8'>
                        <div className='flex justify-between items-center mb-6'>
                            <h1 className='text-3xl font-bold text-gray-800'>
                                Welcome to AgriVision Dashboard
                            </h1>
                            <button
                                onClick={handleLogout}
                                className='px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors'
                            >
                                Logout
                            </button>
                        </div>
                        <div className='border-t pt-6'>
                            <p className='text-xl text-gray-700 mb-4'>
                                Hello <span className='font-semibold text-[#22c55e]'>
                                    {currentUser?.displayName || currentUser?.email}
                                </span>, you are now logged in.
                            </p>
                            <p className='text-gray-600'>
                                Your dashboard is ready. Start monitoring your crops with AI precision!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Home