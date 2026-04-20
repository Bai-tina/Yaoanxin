/**  
 * @file PatientDashboard.tsx  
 * @description 患者端“患者用药中心”主页，提供用药清单、提醒、打卡等功能入口，适配老年友好风格。  
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuth } from '../context/auth-context'
import ComingSoonDialog from '../components/ComingSoonDialog'
import {
  BellRing,
  HeartPulse,
  Info,
  LogOut,
  PhoneCall,
  Pill,
  User,
  ClipboardList,
  ShieldCheck,
} from 'lucide-react'

interface Medication {
  name: string
  dose: string
  usage: string
  note?: string
}

interface BoundRegimen {
  id: string
  name: string
  patientName: string
  patientContact: string
  medications: Medication[]
  createdAt: string
}

const REGIMENS_KEY = 'yaoanxin_regimens'

function readRegimensForPatient(contact: string, name?: string): BoundRegimen[] {
  try {
    const raw = window.localStorage.getItem(REGIMENS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item) => {
        const contactMatched = item?.patientContact === contact
        if (!contactMatched) return false
        if (!name) return true
        if (!item?.patientName) return true
        return item.patientName === name
      })
      .map((item) => ({
        id: String(item?.id ?? ''),
        name: String(item?.name ?? '未命名方案'),
        patientName: String(item?.patientName ?? ''),
        patientContact: String(item?.patientContact ?? ''),
        medications: Array.isArray(item?.medications) ? item.medications : [],
        createdAt:
          typeof item?.createdAt === 'string'
            ? item.createdAt
            : new Date().toISOString(),
      }))
  } catch {
    return []
  }
}

/**  
 * @description 患者端用药中心主页组件。  
 */
const PatientDashboard: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [comingSoonOpen, setComingSoonOpen] = useState(false)
  const [comingSoonText, setComingSoonText] = useState<string | undefined>()
  const [regimenModalOpen, setRegimenModalOpen] = useState(false)
  const [activeRegimen, setActiveRegimen] = useState<BoundRegimen | null>(null)

  const myRegimens =
    user?.contact ? readRegimensForPatient(user.contact, user.name) : []

  /**  
   * @description 退出登录处理。  
   */
  const handleLogout = () => {
    logout()
    toast.success('已退出登录，返回首页')
    navigate('/', { replace: true })
  }

  const triggerComingSoon = (featureName: string) => {
    setComingSoonText(`“${featureName}”功能将在正式版本中开放，当前页面仅为前端演示原型。`)
    setComingSoonOpen(true)
  }

  const handleOpenMyRegimens = () => {
    if (!user?.contact) {
      toast.error('当前账号信息异常，无法读取用药清单')
      return
    }
    if (myRegimens.length === 0) {
      toast.warning('医生暂未为您添加用药方案')
      return
    }
    setActiveRegimen(myRegimens[0])
    setRegimenModalOpen(true)
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-sky-50 via-slate-50 to-emerald-50">
      {/* 顶部栏（大字号、清晰按钮） */}
      <header className="border-b border-slate-200 bg-white/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-md">
              <span className="text-lg font-bold">药</span>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">患者用药中心</p>
              <p className="mt-0.5 text-xs text-slate-500">
                当前身份：患者{user?.name ? `（${user.name}）` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
              <User className="mr-1.5 h-3.5 w-3.5" />
              患者
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
            >
              <LogOut className="h-3.5 w-3.5" />
              退出登录
            </button>
          </div>
        </div>
      </header>

      {/* 主体内容：老年友好大卡片布局 */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4 md:py-6">
        {/* 今日提醒与风险标签 */}
        <section className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="rounded-3xl bg-white p-4 shadow-md shadow-sky-100/60 ring-1 ring-sky-100 md:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 md:h-10 md:w-10">
                  <BellRing className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-base font-semibold text-slate-900 md:text-lg">
                    今日用药提醒
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 md:text-sm">
                    按时服药有助于稳定病情，如有不适请及时联系医生。
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600 md:px-3">
                示例数据 · 仅供演示
              </span>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <TodayReminderCard
                time="08:00"
                drug="多奈哌齐片 5 mg"
                note="随水整片吞服，睡前不宜再加量"
              />
              <TodayReminderCard
                time="20:00"
                drug="盐酸美金刚片 10 mg"
                note="晚饭后 1 小时服用，注意观察情绪变化"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-emerald-100">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    当前总体风险状态
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    由医生端评估后同步到患者端显示
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 ring-1 ring-amber-100">
                  风险等级：中度
                </span>
                <span className="text-[11px] text-slate-500">
                  建议：按时复诊，如有头晕、心慌等不适及时就医。
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => triggerComingSoon('风险详细说明')}
              className="flex w-full items-center justify-between rounded-3xl bg-slate-900 px-4 py-3 text-left shadow-md shadow-slate-900/30"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-800 text-sky-200">
                  <Info className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    查看医生给您的用药风险说明
                  </p>
                  <p className="mt-0.5 text-xs text-slate-300">
                    包括注意事项、何时需要就医、如何观察不适等。
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-100">
                演示占位
              </span>
            </button>
          </div>
        </section>

        {/* 功能入口大按钮 */}
        <section className="grid gap-3 md:grid-cols-4">
          <PatientFeatureButton
            icon={Pill}
            label="我的用药清单"
            description="查看当前所有药物及用法说明"
            onClick={handleOpenMyRegimens}
          />
          <PatientFeatureButton
            icon={BellRing}
            label="用药提醒设置"
            description="自定义提醒时间与提示方式"
            onClick={() => triggerComingSoon('用药提醒设置')}
          />
          <PatientFeatureButton
            icon={ClipboardList}
            label="今日服药打卡"
            description="简单一键打卡，记录是否按时服药"
            accent
            onClick={() => {
              toast.success('已为您完成“今日服药”示例打卡')
            }}
          />
          <PatientFeatureButton
            icon={ShieldCheck}
            label="风险提示查看"
            description="了解当前用药风险与医生建议"
            onClick={() => triggerComingSoon('风险提示查看')}
          />
          <PatientFeatureButton
            icon={HeartPulse}
            label="历史用药记录"
            description="回顾近一段时间的用药情况"
            onClick={() => triggerComingSoon('历史用药记录')}
          />
          <PatientFeatureButton
            icon={PhoneCall}
            label="紧急联络"
            description="一键查看预留的急诊 / 家属电话"
            onClick={() => triggerComingSoon('紧急联络')}
          />
          <PatientFeatureButton
            icon={User}
            label="个人信息"
            description="查看或更新基本信息与联系方式"
            onClick={() => triggerComingSoon('个人信息')}
          />
          <PatientFeatureButton
            icon={LogOut}
            label="退出登录"
            description="完成操作后可安全退出账号"
            onClick={handleLogout}
          />
        </section>
      </main>

      <ComingSoonDialog
        open={comingSoonOpen}
        onClose={() => setComingSoonOpen(false)}
        title="功能暂未开放"
        description={
          comingSoonText ??
          '该功能将在正式版本中开放，用于完善患者端用药管理体验。当前页面为前端演示原型。'
        }
      />

      {regimenModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">我的用药清单</h3>
              <button
                type="button"
                onClick={() => {
                  setRegimenModalOpen(false)
                  setActiveRegimen(null)
                }}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200"
              >
                关闭
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[0.9fr_1.1fr]">
              <div className="max-h-80 overflow-y-auto rounded-xl bg-slate-50 p-2">
                {myRegimens.map((item) => {
                  const active = activeRegimen?.id === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveRegimen(item)}
                      className={`mb-2 w-full rounded-lg px-3 py-2 text-left text-xs ${
                        active ? 'bg-sky-100 text-sky-900' : 'bg-white hover:bg-slate-100'
                      }`}
                    >
                      <p className="font-semibold">{item.name}</p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {item.medications.length} 项 · {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </button>
                  )
                })}
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                {activeRegimen ? (
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{activeRegimen.name}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      医生为您创建于 {new Date(activeRegimen.createdAt).toLocaleString()}
                    </p>
                    <ul className="mt-3 space-y-2 text-xs">
                      {activeRegimen.medications.map((med, idx) => (
                        <li key={`${med.name}-${idx}`} className="rounded-lg bg-white p-2">
                          <p className="font-semibold text-slate-900">{med.name}</p>
                          <p className="mt-1 text-slate-600">
                            剂量：{med.dose} · 用法：{med.usage}
                          </p>
                          {med.note && (
                            <p className="mt-1 text-[11px] text-slate-500">备注：{med.note}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">请先点击左侧某个方案查看详细内容。</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface TodayReminderCardProps {
  /** 用药时间 */
  time: string
  /** 药物说明 */
  drug: string
  /** 备注说明 */
  note: string
}

/**  
 * @description “今日提醒”小卡片组件。  
 */
const TodayReminderCard: React.FC<TodayReminderCardProps> = ({
  time,
  drug,
  note,
}) => {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-3 py-2.5 text-xs text-slate-700 md:px-4">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white">
        <span className="text-base font-bold">{time}</span>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900">{drug}</p>
        <p className="text-[11px] text-slate-500">{note}</p>
      </div>
    </div>
  )
}

interface PatientFeatureButtonProps {
  /** 图标组件 */
  icon: React.ComponentType<{ className?: string }>
  /** 标题文案 */
  label: string
  /** 描述文案 */
  description: string
  /** 点击事件 */
  onClick: () => void
  /** 是否强调主操作 */
  accent?: boolean
}

/**  
 * @description 患者端功能入口大按钮组件（大字号、大触控区域）。  
 */
const PatientFeatureButton: React.FC<PatientFeatureButtonProps> = ({
  icon: Icon,
  label,
  description,
  onClick,
  accent,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-full flex-col justify-between rounded-3xl px-4 py-3 text-left shadow-sm transition ${
        accent
          ? 'bg-sky-600 text-white shadow-sky-500/40 hover:bg-sky-700'
          : 'bg-white text-slate-900 ring-1 ring-slate-100 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${
            accent ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-700'
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <p className="text-base font-semibold md:text-lg">{label}</p>
      </div>
      <p
        className={`mt-2 text-xs md:text-sm ${
          accent ? 'text-sky-50' : 'text-slate-600'
        }`}
      >
        {description}
      </p>
    </button>
  )
}

export default PatientDashboard
