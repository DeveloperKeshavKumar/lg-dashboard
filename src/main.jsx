import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import './index.css'
import App from './App.jsx'

import Homepage from './pages/Homepage';
import Region from './pages/Region';
import Branch from './pages/Branch';
import Manager from './pages/Manager'



const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Homepage />
      },
      {
        path: '/region/:regionId',
        element: <Region />
      },
      {
        path: '/branch/:branchId',
        element: <Branch />
      },
      {
        path: '/manager/:managerId',
        element: <Manager />
      },
    ]
  }
], { basename: import.meta.env.VITE_BASENAME })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
