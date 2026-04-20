/**  
 * @file auth-context.tsx  
 * @description 提供药安心平台的前端模拟认证与角色管理（医生 / 患者），使用 localStorage 持久化。  
 */

import React, { createContext, useContext, useEffect, useState } from 'react'

/**  
 * @description 支持的用户角色类型。  
 */
export type UserRole = 'doctor' | 'patient'

/**  
 * @description 已登录用户的关键信息。  
 */
export interface AuthUser {
  /** 用户姓名 */
  name: string
  /** 手机号或邮箱 */
  contact: string
  /** 用户角色：医生 / 患者 */
  role: UserRole
}

/**  
 * @description 存储在 localStorage 的完整用户信息。  
 */
interface StoredUser extends AuthUser {
  /** 登录密码（仅前端演示，实际项目请不要明文存储） */
  password: string
}

/**  
 * @description 认证上下文提供的能力。  
 */
interface AuthContextValue {
  /** 当前已登录用户 */
  user: AuthUser | null
  /** 是否正在初始化（本例中基本瞬间完成） */
  initializing: boolean
  /** 登录方法 */
  login: (contact: string, password: string) => AuthUser
  /** 注册方法 */
  register: (
    payload: Omit<StoredUser, 'role'> & { role: UserRole }
  ) => AuthUser
  /** 退出登录 */
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const USERS_KEY = 'yaoanxin_users'
const CURRENT_USER_KEY = 'yaoanxin_currentUser'

/**  
 * @description 从 localStorage 读取全部模拟用户。  
 */
function readStoredUsers(): StoredUser[] {
  try {
    const raw = window.localStorage.getItem(USERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

/**  
 * @description 将全部模拟用户写入 localStorage。  
 */
function writeStoredUsers(users: StoredUser[]): void {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

/**  
 * @description 从 localStorage 读取当前已登录用户。  
 */
function readCurrentUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(CURRENT_USER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as AuthUser
  } catch {
    return null
  }
}

/**  
 * @description 将当前登录用户写入 localStorage。  
 */
function writeCurrentUser(user: AuthUser | null): void {
  if (!user) {
    window.localStorage.removeItem(CURRENT_USER_KEY)
  } else {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
  }
}

/**  
 * @description 如果本地没有用户数据，则注入两个演示账号（一个医生、一个患者）。  
 */
function seedDemoUsers(): void {
  const existing = readStoredUsers()
  if (existing.length > 0) return

  const demoUsers: StoredUser[] = [
    {
      name: '李医生',
      contact: 'doctor@example.com',
      password: '123456',
      role: 'doctor',
    },
    {
      name: '王阿姨',
      contact: 'patient@example.com',
      password: '123456',
      role: 'patient',
    },
  ]
  writeStoredUsers(demoUsers)
}

/**  
 * @description 提供认证上下文的 Provider 组件，包裹整个应用使用。  
 */
export const AuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [initializing, setInitializing] = useState(true)

  // 初始化时：注入演示用户并读取当前登录用户
  useEffect(() => {
    seedDemoUsers()
    const current = readCurrentUser()
    if (current) {
      setUser(current)
    }
    setInitializing(false)
  }, [])

  /**  
   * @description 登录逻辑：校验账号密码并写入当前用户。  
   */
  const login = (contact: string, password: string): AuthUser => {
    const users = readStoredUsers()
    const found = users.find(
      (u) => u.contact === contact.trim() && u.password === password
    )
    if (!found) {
      throw new Error('账号或密码错误，请重试')
    }
    const nextUser: AuthUser = {
      name: found.name,
      contact: found.contact,
      role: found.role,
    }
    setUser(nextUser)
    writeCurrentUser(nextUser)
    return nextUser
  }

  /**  
   * @description 注册逻辑：校验唯一性并写入用户列表与当前用户。  
   */
  const register = (payload: Omit<StoredUser, 'role'> & { role: UserRole }): AuthUser => {
    const users = readStoredUsers()
    const exists = users.some((u) => u.contact === payload.contact.trim())
    if (exists) {
      throw new Error('该手机号 / 邮箱已注册，请直接登录')
    }
    const newUser: StoredUser = {
      name: payload.name.trim(),
      contact: payload.contact.trim(),
      password: payload.password,
      role: payload.role,
    }
    const nextUsers = [...users, newUser]
    writeStoredUsers(nextUsers)

    const nextUser: AuthUser = {
      name: newUser.name,
      contact: newUser.contact,
      role: newUser.role,
    }
    setUser(nextUser)
    writeCurrentUser(nextUser)
    return nextUser
  }

  /**  
   * @description 退出登录：清空当前用户并更新 localStorage。  
   */
  const logout = (): void => {
    setUser(null)
    writeCurrentUser(null)
  }

  const value: AuthContextValue = {
    user,
    initializing,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**  
 * @description 获取认证上下文的便捷 Hook。  
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth 必须在 AuthProvider 内部使用')
  }
  return ctx
}
