/**  
 * @file App.tsx  
 * @description 应用根组件，配置路由与全局认证上下文，实现医生端 / 患者端的角色分流。  
 */

import React from 'react'
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router'
import { Toaster } from 'sonner'
import HomePage from './pages/Home'
import AuthPage from './pages/Auth'
import DoctorDashboard from './pages/DoctorDashboard'
import PatientDashboard from './pages/PatientDashboard'
import { AuthProvider, useAuth } from './context/auth-context'

/**  
 * @description 应用根组件，包含路由与 AuthProvider。  
 */
export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
        <Toaster position="top-center" richColors />
      </HashRouter>
    </AuthProvider>
  )
}

/**  
 * @description 抽离路由配置，便于在 Provider 内部使用 Hook。  
 */
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/doctor"
        element={
          <ProtectedRoute expectedRole="doctor">
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient"
        element={
          <ProtectedRoute expectedRole="patient">
            <PatientDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

interface ProtectedRouteProps {
  /** 期望的用户角色，如果为空则只判断是否登录 */
  expectedRole?: 'doctor' | 'patient'
  /** 保护的子组件 */
  children: React.ReactNode
}

/**  
 * @description 简单的路由守卫组件：未登录跳转到 /auth，角色不匹配则跳到对应首页。  
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  expectedRole,
  children,
}) => {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        正在加载，请稍候…
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to={`/auth?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    )
  }

  if (expectedRole && user.role !== expectedRole) {
    // 如果角色不匹配，则根据实际角色跳转到正确的工作台
    const target = user.role === 'doctor' ? '/doctor' : '/patient'
    return <Navigate to={target} replace />
  }

  return <>{children}</>
}
