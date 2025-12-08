import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/authcontext/Authcontext'
import { doSignOut } from '../../firebase/auth'

const Header = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { userLoggedIn } = useAuth()

    if (location.pathname === '/') {
        return null
    }

    return (
        <nav className='flex flex-row justify-between items-center w-full z-20 fixed top-0 left-0 h-16 border-b bg-white shadow-sm px-6'>
            <Link to={userLoggedIn ? '/home' : '/'} className='flex items-center'>
                <span className='text-2xl font-bold text-[#22c55e]'>AgriVision</span>
            </Link>
            
            <div className='flex items-center gap-4'>
                {
                    userLoggedIn
                        ?
                        <>
                            <Link 
                                to='/home' 
                                className='text-sm font-medium text-gray-700 hover:text-[#22c55e] transition-colors'
                            >
                                Dashboard
                            </Link>
                            <button 
                                onClick={() => { doSignOut().then(() => { navigate('/') }) }} 
                                className='px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors'
                            >
                                Logout
                            </button>
                        </>
                        :
                        <>
                            <Link 
                                className='px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#22c55e] transition-colors' 
                                to={'/login'}
                            >
                                Login
                            </Link>
                            <Link 
                                className='px-4 py-2 text-sm font-medium text-white bg-[#22c55e] hover:bg-[#16a34a] rounded-lg transition-colors' 
                                to={'/register'}
                            >
                                Sign Up
                            </Link>
                        </>
                }
            </div>
        </nav>
    )
}

export default Header