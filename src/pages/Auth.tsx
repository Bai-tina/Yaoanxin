/**  
 * @file Auth.tsx  
 * @description 登录 / 注册统一页面，通过 Tab 切换“登录 / 注册”，并根据身份进入医生端或患者端。  
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuth, UserRole } from '../context/auth-context'

/**  
 * @description 登录 / 注册页面组件。  
 */
const AuthPage: React.FC = () => {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // 根据 URL 查询参数预选 Tab
  const initialTab = useMemo<'login' | 'register'>(() => {
    const searchParams = new URLSearchParams(location.search)
    const tab = searchParams.get('tab')
    return tab === 'register' ? 'register' : 'login'
  }, [location.search])

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab)

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  // 如果已登录，则直接根据角色跳转
  useEffect(() => {
    if (user) {
      navigate(user.role === 'doctor' ? '/doctor' : '/patient', { replace: true })
    }
  }, [user, navigate])

  // 登录表单状态
  const [loginContact, setLoginContact] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // 注册表单状态
  const [regName, setRegName] = useState('')
  const [regContact, setRegContact] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [regRole, setRegRole] = useState<UserRole | ''>('')

  /**  
   * @description 处理登录按钮点击。  
   */
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginContact.trim() || !loginPassword) {
      toast.error('请输入账号和密码')
      return
    }
    try {
      const signedIn = login(loginContact, loginPassword)
      toast.success('登录成功，正在跳转...')
      navigate(signedIn.role === 'doctor' ? '/doctor' : '/patient', {
        replace: true,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '登录失败，请重试')
    }
  }

  /**  
   * @description 处理注册按钮点击。  
   */
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (!regName.trim() || !regContact.trim() || !regPassword || !regConfirmPassword) {
      toast.error('请完整填写注册信息')
      return
    }
    if (!regRole) {
      toast.error('请选择身份（医生 / 患者）')
      return
    }
    if (regPassword.length < 6) {
      toast.error('密码长度至少为 6 位')
      return
    }
    if (regPassword !== regConfirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }
    try {
      const newUser = register({
        name: regName,
        contact: regContact,
        password: regPassword,
        role: regRole,
      })
      toast.success('注册成功，已自动登录并跳转')
      navigate(newUser.role === 'doctor' ? '/doctor' : '/patient', {
        replace: true,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '注册失败，请重试')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50">
      {/* 顶部简易导航 */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 md:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-md">
              <span className="text-base font-bold">药</span>
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">药安心 · 账号中心</p>
              <p className="mt-0.5 text-xs text-slate-500">
                登录 / 注册以进入医生工作台或患者用药中心
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs font-medium text-sky-700 hover:text-sky-800"
          >
            返回首页
          </button>
        </div>
      </header>

      {/* 表单内容区 */}
      <main className="flex flex-1 items-center justify-center px-4 py-8 md:py-12">
        <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white/95 shadow-2xl shadow-sky-100/80 ring-1 ring-slate-100">
          <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
            {/* 左侧：表单 */}
            <div className="px-6 py-6 md:px-8 md:py-8">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    activeTab === 'login'
                      ? 'bg-sky-600 text-white shadow'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  登录
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    activeTab === 'register'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  注册
                </button>
              </div>

              {activeTab === 'login' ? (
                <section className="mt-6">
                  <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
                    欢迎登录药安心
                  </h1>
                  <p className="mt-2 text-xs text-slate-600 md:text-sm">
                    使用注册时填写的手机号 / 邮箱与密码登录，系统将自动识别您的身份并进入对应工作台。
                  </p>

                  <form className="mt-5 space-y-4" onSubmit={handleLogin}>
                    <div>
                      <label
                        htmlFor="loginContact"
                        className="text-xs font-medium text-slate-700"
                      >
                        手机号 / 邮箱
                      </label>
                      <input
                        id="loginContact"
                        type="text"
                        value={loginContact}
                        onChange={(e) => setLoginContact(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-inner shadow-slate-100 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                        placeholder="请输入手机号或邮箱"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="loginPassword"
                        className="text-xs font-medium text-slate-700"
                      >
                        密码
                      </label>
                      <input
                        id="loginPassword"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-inner shadow-slate-100 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                        placeholder="请输入密码"
                      />
                    </div>

                    <button
                      type="submit"
                      className="mt-1 inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-500/30 transition hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                    >
                      登录
                    </button>

                    <p className="mt-2 text-[11px] text-slate-500">
                      演示账号（医生）：doctor@example.com / 123456
                      <br />
                      演示账号（患者）：patient@example.com / 123456
                    </p>
                  </form>
                </section>
              ) : (
                <section className="mt-6">
                  <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
                    注册药安心账号
                  </h1>
                  <p className="mt-2 text-xs text-slate-600 md:text-sm">
                    请选择您的身份（医生 / 患者），系统将在登录后自动跳转到对应的工作台界面。
                  </p>

                  <form className="mt-5 space-y-4" onSubmit={handleRegister}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="regName"
                          className="text-xs font-medium text-slate-700"
                        >
                          姓名
                        </label>
                        <input
                          id="regName"
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-inner shadow-slate-100 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                          placeholder="请输入姓名，例如：李医生 / 王阿姨"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="regContact"
                          className="text-xs font-medium text-slate-700"
                        >
                          手机号 / 邮箱
                        </label>
                        <input
                          id="regContact"
                          type="text"
                          value={regContact}
                          onChange={(e) => setRegContact(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-inner shadow-slate-100 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                          placeholder="用于登录和接收提醒通知"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="regPassword"
                          className="text-xs font-medium text-slate-700"
                        >
                          设置密码
                        </label>
                        <input
                          id="regPassword"
                          type="password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-inner shadow-slate-100 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                          placeholder="至少 6 位，建议包含数字与字母"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="regConfirmPassword"
                          className="text-xs font-medium text-slate-700"
                        >
                          确认密码
                        </label>
                        <input
                          id="regConfirmPassword"
                          type="password"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-inner shadow-slate-100 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                          placeholder="再次输入密码"
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-700">身份选择</p>
                      <div className="mt-2 flex flex-wrap gap-3">
                        <RoleChip
                          label="我是医生"
                          value="doctor"
                          selected={regRole === 'doctor'}
                          onSelect={setRegRole}
                        />
                        <RoleChip
                          label="我是患者 / 家属"
                          value="patient"
                          selected={regRole === 'patient'}
                          onSelect={setRegRole}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="mt-1 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                    >
                      完成注册并进入平台
                    </button>

                    <p className="mt-2 text-[11px] text-slate-500">
                      注册即视为同意平台的隐私保护与数据使用说明（演示版本，不采集真实数据）。
                    </p>
                  </form>
                </section>
              )}
            </div>

            {/* 右侧：医疗场景展示 */}
            <aside className="relative hidden bg-gradient-to-br from-sky-600 via-sky-700 to-emerald-600 p-6 text-white md:block">
              <div className="absolute inset-0">
                <img
                  src="https://pub-cdn.sider.ai/u/U09GH7LNA5E/web-coder/699d5fc6e52d6260821ab07b/resource/8415957b-ecf6-48e8-8bfa-e312ddffa5f2.jpg"
                  alt="medical"
                  className="h-full w-full object-cover opacity-20"
                />
              </div>
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                  <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                    阿尔茨海默症 · 用药安全守护
                  </p>
                  <h2 className="mt-4 text-2xl font-semibold leading-snug">
                    一个平台，连接医生与患者
                  </h2>
                  <p className="mt-3 text-sm text-sky-50/90">
                    医生端聚焦用药方案与风险评估，患者端聚焦用药提醒与依从性记录，
                    通过 AI 辅助工具，让长期用药管理更安全、更可视、更可追踪。
                  </p>
                </div>

                <div className="mt-6 space-y-3 text-xs text-sky-50/90">
                  <FeatureBullet title="医生端 · 医疗风格工作台">
                    管理患者档案、录入用药方案，一键发起 DDI 风险评估，查看可视化结果与辅助建议。
                  </FeatureBullet>
                  <FeatureBullet title="患者端 · 老年友好界面">
                    放大字号与按钮，突出“今日任务”，简化操作步骤，方便长辈与家属共同使用。
                  </FeatureBullet>
                  <FeatureBullet title="本页仅为前端原型">
                    所有账号与数据均为模拟示例，用于课程汇报与项目路演展示。
                  </FeatureBullet>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}

interface RoleChipProps {
  /** 展示文案 */
  label: string
  /** 对应角色值 */
  value: UserRole
  /** 是否选中 */
  selected: boolean
  /** 选中回调 */
  onSelect: (role: UserRole) => void
}

/**  
 * @description 身份选择圆角标签组件。  
 */
const RoleChip: React.FC<RoleChipProps> = ({
  label,
  value,
  selected,
  onSelect,
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        selected
          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/60'
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          selected ? 'bg-emerald-500' : 'bg-slate-300'
        }`}
      />
      {label}
    </button>
  )
}

interface FeatureBulletProps {
  /** 小标题 */
  title: string
  /** 描述内容 */
  children: React.ReactNode
}

/**  
 * @description 右侧说明区域的小条目组件。  
 */
const FeatureBullet: React.FC<FeatureBulletProps> = ({ title, children }) => {
  return (
    <div>
      <p className="text-xs font-semibold text-white">{title}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-sky-50/90">{children}</p>
    </div>
  )
}

export default AuthPage
