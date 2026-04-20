/**
 * @file DoctorDashboard.tsx
 * @description 医生端“医生工作台”主页。
 *
 * 主要功能：
 * - 左侧功能菜单：患者档案、用药方案录入、AI 风险评估、历史评估记录等。
 * - 用药方案录入：支持录入药物列表、保存为命名方案（Regimen），并持久化到 localStorage。
 * - 点击“开始风险评估”：调用后端 /api/deepseek/evaluate（由 Node + DeepSeek 支持），
 *   对所选用药方案进行评估；
 * - 评估完成后：
 *    1. 在 AI 风险评估面板中展示详细结果（概要、冲突列表、机制说明、参考文献）；
 *    2. 以「用药方案名称 + 当前时间」的方式命名记录，追加到“历史评估记录”，并持久化到 localStorage；
 * - 历史评估记录：展示所有历史任务，支持点击某条记录重新在 AI 风险评估面板中查看结果。
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuth } from '../context/auth-context'
import ComingSoonDialog from '../components/ComingSoonDialog'
import {
  Activity,
  ClipboardList,
  FileText,
  LogOut,
  Pill,
  ShieldAlert,
  Stethoscope,
  UserSquare2,
} from 'lucide-react'

/**
 * @interface Medication
 * @description 用药方案中单条药物记录的数据结构。
 */
interface Medication {
  /** 药物名称 */
  name: string
  /** 剂量（例如：5 mg） */
  dose: string
  /** 用法（例如：睡前 1 次） */
  usage: string
  /** 备注 */
  note?: string
}

/**
 * @interface Regimen
 * @description 用药方案（Regimen）结构，保存一组药物及名称与时间戳。
 */
interface Regimen {
  /** 唯一 id（简易） */
  id: string
  /** 方案名称 */
  name: string
  /** 药物列表 */
  medications: Medication[]
  /** 创建时间（ISO） */
  createdAt: string
}

/**
 * @interface DeepSeekConflict
 * @description DeepSeek 评估结果中的单条冲突信息。
 */
interface DeepSeekConflict {
  pair?: string
  description?: string
  severity?: 'low' | 'medium' | 'high'
  severityText?: string
}

/**
 * @interface DeepSeekResult
 * @description DeepSeek 后端 /api/deepseek/evaluate 返回的结构化结果。
 */
interface DeepSeekResult {
  summary: string
  conflicts: DeepSeekConflict[]
  mechanism?: string
  references?: string[]
  raw?: any
}

/**
 * @interface PatientFriendlyAdvice
 * @description DeepSeek 生成的“写给患者和家属”的通俗说明。
 */
interface PatientFriendlyAdvice {
  regimenName: string
  title: string
  intro: string
  medicationChecklist: string[]
  dailyTips: string[]
  warningSigns: string[]
  familyTips: string[]
  closing: string
  plainText: string
}

/**
 * @interface AssessmentRecord
 * @description 一次风险评估任务在“历史评估记录”中的存储结构。
 */
interface AssessmentRecord {
  /** 唯一 id */
  id: string
  /** 显示标题：用药方案名 + 时间，例如 “王阿姨方案 · 2026/02/28 14:30” */
  title: string
  /** 用药方案名称 */
  regimenName: string
  /** 评估时间（ISO） */
  createdAt: string
  /** 用药方案快照 */
  regimen: Regimen
  /** DeepSeek 返回结果 */
  result: DeepSeekResult
  /** 面向患者的通俗说明 */
  patientAdvice?: PatientFriendlyAdvice
}

/**
 * @description 医生端功能键名类型。
 */
export type DoctorFeatureKey =
  | 'patients'
  | 'regimen'
  | 'risk'
  | 'results'
  | 'history'
  | 'advice'
  | 'export'

/**
 * @description 医生端功能配置列表。
 */
const DOCTOR_FEATURES: {
  key: DoctorFeatureKey
  title: string
  subtitle: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  {
    key: 'patients',
    title: '患者档案管理',
    subtitle: '基础信息与长期用药史',
    description:
      '集中管理 AD 患者基本信息、既往史与长期用药史，为后续 AI 风险评估提供数据基础。',
    icon: UserSquare2,
  },
  {
    key: 'regimen',
    title: '用药方案录入',
    subtitle: '当前处方与联用药物',
    description:
      '录入或导入当前处方与联用药物，支持标记用药周期与剂量，为 AI 模块生成风险评估输入。',
    icon: Pill,
  },
  {
    key: 'risk',
    title: 'AI 风险评估（DDI）',
    subtitle: '多药联用智能分析',
    description:
      '基于录入的药物组合，自动识别潜在药物相互作用、禁忌证与重复用药，输出分级风险提示。',
    icon: ShieldAlert,
  },
  {
    key: 'results',
    title: '风险结果查看',
    subtitle: '分级提示与干预建议',
    description:
      '以可视化图表展示风险等级分布、关键冲突药物与干预建议，便于快速把握风险重点。',
    icon: Activity,
  },
  {
    key: 'history',
    title: '历史评估记录',
    subtitle: '随访与疗程追踪',
    description:
      '按患者维度保存历次评估记录，支持对比用药方案调整前后的风险变化趋势。',
    icon: ClipboardList,
  },
  {
    key: 'advice',
    title: '辅助建议与说明',
    subtitle: '用药说明与沟通要点',
    description:
      '为典型用药组合生成患者宣教要点与沟通建议，辅助医生与患者及家属进行风险沟通。',
    icon: FileText,
  },
  {
    key: 'export',
    title: '报告导出',
    subtitle: 'PDF / 打印（占位）',
    description:
      '正式版本将支持一键导出可打印的用药及风险评估报告，本原型中以弹窗形式占位展示。',
    icon: FileText,
  },
]

/**
 * @description localStorage 中保存用药方案的键名。
 */
const REGIMENS_KEY = 'yaoanxin_regimens'
/**
 * @description localStorage 中保存历史评估记录的键名。
 */
const ASSESSMENTS_KEY = 'yaoanxin_assessments'

/**
 * @description 医生端工作台主页组件，包含左侧功能菜单与右侧内容区。
 */
const DoctorDashboard: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [selectedKey, setSelectedKey] = useState<DoctorFeatureKey>('regimen')
  const [showComingSoon, setShowComingSoon] = useState(false)

  // 当前用于风险评估的方案
  const [activeRegimenForAssessment, setActiveRegimenForAssessment] =
    useState<Regimen | null>(null)

  // 风险评估加载状态与结果
  const [assessmentLoading, setAssessmentLoading] = useState(false)
  const [assessmentResult, setAssessmentResult] =
    useState<DeepSeekResult | null>(null)
  // 患者可读说明（由 DeepSeek 生成）
  const [patientAdvice, setPatientAdvice] = useState<PatientFriendlyAdvice | null>(
    null,
  )
  const [patientAdviceLoading, setPatientAdviceLoading] = useState(false)

  // 历史评估记录集合（从 localStorage 初始化）
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentRecord[]>(
    () => {
      try {
        const raw =
          typeof window !== 'undefined'
            ? window.localStorage.getItem(ASSESSMENTS_KEY)
            : null
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed as AssessmentRecord[]
      } catch {
        return []
      }
    },
  )

  // 每次历史记录变更时写回 localStorage
  React.useEffect(() => {
    try {
      window.localStorage.setItem(
        ASSESSMENTS_KEY,
        JSON.stringify(assessmentHistory),
      )
    } catch {
      // 忽略 demo 环境中的存储异常
    }
  }, [assessmentHistory])

  /**
   * @description 退出登录处理，清空会话并跳转首页。
   */
  const handleLogout = () => {
    logout()
    toast.success('已退出登录，返回首页')
    navigate('/', { replace: true })
  }

  /**
   * @description 将一次评估结果追加到历史记录集合中。
   * @param regimen 本次评估的用药方案
   * @param result DeepSeek 返回的评估结果
   */
  const appendAssessmentHistory = (
    regimen: Regimen,
    result: DeepSeekResult,
    advice?: PatientFriendlyAdvice,
  ) => {
    const now = new Date()
    const createdAt = now.toISOString()
    const title = `${regimen.name} · ${now.toLocaleString()}`

    const record: AssessmentRecord = {
      id: `${createdAt}-${regimen.id}`,
      title,
      regimenName: regimen.name,
      createdAt,
      regimen,
      result,
      patientAdvice: advice,
    }

    setAssessmentHistory((prev) => [record, ...prev])
  }

  /**
   * @description 当 RegimenPanel 请求开始评估某个方案时调用：
   *              向后端 /api/deepseek/evaluate 发起评估请求，
   *              切换到 risk 分区并设置 activeRegimen 与评估结果，
   *              同时将结果记录到历史评估列表中。
   * @param regimen 要开始评估的方案
   */
  const handleStartAssessment = async (regimen: Regimen) => {
    // 切换到风险分区并设置当前方案
    setSelectedKey('risk')
    setActiveRegimenForAssessment(regimen)
    // 清理旧结果并进入加载状态
    setAssessmentResult(null)
    setPatientAdvice(null)
    setAssessmentLoading(true)
    setPatientAdviceLoading(false)

    try {
      // 如果你的后端运行在其他端口，可改为完整地址：
      const resp = await fetch('http://localhost:4000/api/deepseek/evaluate', { 
      // const resp = await fetch('/api/deepseek/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          regimen,
        }),
      })

      if (!resp.ok) {
        const text = await resp.text().catch(() => '')
        throw new Error(`DeepSeek API error ${resp.status} ${text}`)
      }

      const data = (await resp.json()) as DeepSeekResult

      // 将后端返回的评估结果保存到状态，RiskPanel 可展示
      setAssessmentResult(data)
      toast.success('风险评估完成，正在生成患者说明…')

      let advice: PatientFriendlyAdvice | undefined
      try {
        setPatientAdviceLoading(true)
        const adviceResp = await fetch('http://localhost:4000/api/deepseek/patient-advice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            regimen,
            assessment: data,
          }),
        })

        if (!adviceResp.ok) {
          const text = await adviceResp.text().catch(() => '')
          throw new Error(`DeepSeek advice API error ${adviceResp.status} ${text}`)
        }

        advice = (await adviceResp.json()) as PatientFriendlyAdvice
        setPatientAdvice(advice)
        toast.success('已生成患者可读说明，可在“辅助建议与说明”中查看和下载')
      } catch (adviceErr) {
        // eslint-disable-next-line no-console
        console.error('DeepSeek patient advice failed:', adviceErr)
        toast.warning('风险评估已完成，但患者说明生成失败，可稍后重试')
      } finally {
        setPatientAdviceLoading(false)
      }

      // 写入历史评估记录，以“用药方案名称 + 当前时间”命名
      appendAssessmentHistory(regimen, data, advice)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('DeepSeek evaluate failed:', err)
      toast.error('无法完成 DeepSeek 风险评估，请稍后重试')
    } finally {
      setAssessmentLoading(false)
    }
  }

  /**
   * @description 点击左侧菜单项时的处理逻辑。
   * @param key 要切换到的功能键
   */
  const handleMenuClick = (key: DoctorFeatureKey) => {
    if (key === 'export') {
      setShowComingSoon(true)
      return
    }
    setSelectedKey(key)
  }

  const currentFeature = DOCTOR_FEATURES.find((f) => f.key === selectedKey)

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* 顶部栏 */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-md">
              <span className="text-base font-bold">药</span>
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">
                药安心 · 医生工作台
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                当前身份：医生{user?.name ? `（${user.name}）` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-200">
              <Stethoscope className="mr-1.5 h-3.5 w-3.5" />
              医生
            </span>

            {/* 返回首页按钮 */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
            >
              返回首页
            </button>

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

      {/* 主体布局 */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 gap-4 px-4 py-4 md:py-6">
        {/* 左侧菜单 */}
        <aside className="hidden w-60 flex-shrink-0 flex-col gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100 md:flex">
          {DOCTOR_FEATURES.map((item) => {
            const Icon = item.icon
            const active = item.key === selectedKey
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleMenuClick(item.key)}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                  active
                    ? 'bg-sky-50 text-sky-800 ring-1 ring-sky-200'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      active
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[13px] font-medium">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {item.subtitle}
                    </span>
                  </span>
                </span>
                {item.key === 'export' && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-100">
                    暂未开放
                  </span>
                )}
              </button>
            )
          })}
        </aside>

        {/* 右侧内容区 */}
        <section className="flex-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 md:p-5">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-slate-900 md:text-xl">
                {currentFeature?.title ?? '医生工作台'}
              </h1>
              <p className="mt-1 text-xs text-slate-500 md:text-sm">
                {currentFeature?.description ??
                  '从患者档案到 AI 风险评估，支持您完成规范、安全的用药管理。'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span className="rounded-full bg-slate-50 px-2 py-1">
                当前身份：医生
              </span>
              <span className="rounded-full bg-sky-50 px-2 py-1 text-sky-700">
                演示环境 · 无真实数据
              </span>
            </div>
          </header>

          {/* 内容分区 */}
          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            {/* 左：主要内容卡片 */}
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-3 md:p-4">
                {selectedKey === 'patients' && <PatientsPanel />}
                {selectedKey === 'regimen' && (
                  <RegimenPanel onStartAssessment={handleStartAssessment} />
                )}
                {selectedKey === 'risk' && (
                  <RiskPanel
                    regimen={activeRegimenForAssessment}
                    result={assessmentResult}
                    loading={assessmentLoading}
                  />
                )}
                {selectedKey === 'results' && (
                  <ResultsPanel
                    regimen={activeRegimenForAssessment}
                    result={assessmentResult}
                  />
                )}
                {selectedKey === 'history' && (
                  <HistoryPanel
                    history={assessmentHistory}
                    onOpenRecord={(record) => {
                      setSelectedKey('risk')
                      setActiveRegimenForAssessment(record.regimen)
                      setAssessmentResult(record.result)
                      setPatientAdvice(record.patientAdvice || null)
                      setPatientAdviceLoading(false)
                    }}
                  />
                )}
                {selectedKey === 'advice' && (
                  <AdvicePanel
                    activeRegimen={activeRegimenForAssessment}
                    advice={patientAdvice}
                    loading={patientAdviceLoading}
                    onUseHistoryRecord={(record) => {
                      setActiveRegimenForAssessment(record.regimen)
                      setAssessmentResult(record.result)
                      setPatientAdvice(record.patientAdvice || null)
                      setPatientAdviceLoading(false)
                    }}
                    history={assessmentHistory}
                  />
                )}
                {selectedKey === 'export' && <ExportPlaceholder />}
              </div>
            </div>

            {/* 右：辅助信息卡片 */}
            <div className="space-y-3">
              <div className="rounded-2xl bg-slate-50 p-3 md:p-4">
                <p className="text-xs font-semibold text-slate-800">
                  今日需随访患者（示例）
                </p>
                <div className="mt-2 space-y-2 text-xs text-slate-700">
                  <FollowUpRow
                    name="王阿姨"
                    risk="中度"
                    time="09:30 门诊复查"
                    tag="AD 合并高血压"
                  />
                  <FollowUpRow
                    name="张先生"
                    risk="低度"
                    time="14:00 电话随访"
                    tag="长期用药评估"
                  />
                  <FollowUpRow
                    name="李伯伯"
                    risk="高度"
                    time="16:30 门诊"
                    tag="多药联用复评"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3 md:p-4">
                <p className="text-xs font-semibold text-slate-800">
                  用药风险概览（示例）
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="rounded-xl bg-white p-2 shadow-sm">
                    <p className="text-slate-500">近期评估</p>
                    <p className="mt-1 text-lg font-bold text-sky-600">
                      {assessmentHistory.length}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-2 shadow-sm">
                    <p className="text-slate-500">发现风险</p>
                    <p className="mt-1 text-lg font-bold text-amber-500">
                      {
                        assessmentHistory.filter((r) =>
                          r.result.conflicts?.some(
                            (c) =>
                              c.severity === 'medium' || c.severity === 'high',
                          ),
                        ).length
                      }
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-2 shadow-sm">
                    <p className="text-slate-500">已干预（示例）</p>
                    <p className="mt-1 text-lg font-bold text-emerald-600">3</p>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  本页数据仅为示例，用于展示系统工作流与可视化效果。
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <ComingSoonDialog
        open={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        title="报告导出功能暂未开放"
        description="当前版本中暂未接入报告导出模块。在正式版本中，可一键导出患者用药及风险评估报告，支持门诊打印与病历留存。"
      />
    </div>
  )
}

/**
 * @description 患者档案管理示例面板。
 */
const PatientsPanel: React.FC = () => {
  return (
    <div className="space-y-3 text-xs text-slate-700">
      <p>
        在正式系统中，您可以在此创建、编辑和检索患者档案，包括：基本信息（姓名、年龄、联系方式）、诊断信息（如
        AD 分期）、既往史与长期用药史等。
      </p>
      <div className="rounded-xl bg-white p-3 shadow-sm">
        <p className="text-[13px] font-semibold text-slate-900">
          示例患者列表
        </p>
        <ul className="mt-2 divide-y divide-slate-100 text-xs">
          <li className="flex items-center justify-between py-1.5">
            <span>王阿姨 · 72 岁 · AD 轻度</span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
              用药稳定
            </span>
          </li>
          <li className="flex items-center justify-between py-1.5">
            <span>张先生 · 68 岁 · AD 轻中度</span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
              需复评
            </span>
          </li>
          <li className="flex items-center justify-between py-1.5">
            <span>李伯伯 · 76 岁 · AD 中度</span>
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] text-rose-700">
              高风险
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}

/**
 * @interface RegimenPanelProps
 * @description 用药方案录入面板的属性定义。
 */
interface RegimenPanelProps {
  /** 当用户选择“开始风险评估”时回调到父组件 */
  onStartAssessment: (regimen: Regimen) => void
}

/**
 * @description 用药方案录入示例面板，支持保存当前药物列表为方案，
 *              列出已保存方案，并从方案发起 DeepSeek 风险评估。
 */
const RegimenPanel: React.FC<RegimenPanelProps> = ({ onStartAssessment }) => {
  // 示例初始数据
  const [medications, setMedications] = useState<Medication[]>([
    { name: '多奈哌齐片', dose: '5 mg', usage: '睡前 1 次', note: 'AD 认知症' },
    { name: '氨氯地平片', dose: '5 mg', usage: '早晨 1 次', note: '高血压' },
    {
      name: '阿司匹林肠溶片',
      dose: '100 mg',
      usage: '早餐后 1 次',
      note: '心血管二级预防',
    },
  ])

  /**
   * @description 从 localStorage 读取已保存的方案（容错处理）。
   */
  const loadStoredRegimens = (): Regimen[] => {
    try {
      const raw = window.localStorage.getItem(REGIMENS_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed as Regimen[]
    } catch {
      return []
    }
  }

  /**
   * @description 将方案集合写回 localStorage（简单覆盖策略）。
   * @param items 要保存的方案数组
   */
  const saveStoredRegimens = (items: Regimen[]) => {
    try {
      window.localStorage.setItem(REGIMENS_KEY, JSON.stringify(items))
    } catch {
      // demo 环境忽略异常
    }
  }

  // 已保存的用药方案集合（从 localStorage 初始化）
  const [regimens, setRegimens] = useState<Regimen[]>(() =>
    loadStoredRegimens(),
  )

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [usage, setUsage] = useState('')
  const [note, setNote] = useState('')

  // 保存当前药物列表为方案时填写的方案名称
  const [saveName, setSaveName] = useState('')

  // 方案操作弹窗状态
  const [activeRegimen, setActiveRegimen] = useState<Regimen | null>(null)
  const [regimenModalOpen, setRegimenModalOpen] = useState(false)

  // regimens 变更时同步写入 localStorage
  React.useEffect(() => {
    saveStoredRegimens(regimens)
  }, [regimens])

  /**
   * @description 添加药物到当前编辑列表。
   */
  const handleAddMedication = () => {
    if (!name.trim() || !dose.trim() || !usage.trim()) {
      toast.error('请填写药物名称、剂量与用法')
      return
    }
    const next: Medication = {
      name: name.trim(),
      dose: dose.trim(),
      usage: usage.trim(),
      note: note.trim(),
    }
    setMedications((s) => [next, ...s])
    setName('')
    setDose('')
    setUsage('')
    setNote('')
    setShowForm(false)
    toast.success('已添加药物')
  }

  /**
   * @description 从当前编辑列表删除药物项。
   * @param index 要删除的索引
   */
  const handleRemove = (index: number) => {
    setMedications((s) => s.filter((_, i) => i !== index))
    toast.success('已删除')
  }

  /**
   * @description 将当前药物列表保存为一个命名的用药方案，并持久化到 localStorage。
   */
  const handleSaveRegimen = () => {
    if (!saveName.trim()) {
      toast.error('请输入方案名称')
      return
    }
    if (medications.length === 0) {
      toast.error('当前无药物可保存')
      return
    }
    const newRegimen: Regimen = {
      id: String(Date.now()),
      name: saveName.trim(),
      medications: medications.slice(),
      createdAt: new Date().toISOString(),
    }
    setRegimens((s) => {
      const next = [newRegimen, ...s]
      return next
    })
    setSaveName('')
    toast.success(`已保存方案「${newRegimen.name}」`)
  }

  /**
   * @description 打开方案操作弹窗。
   * @param regimen 要操作的方案
   */
  const openRegimenModal = (regimen: Regimen) => {
    setActiveRegimen(regimen)
    setRegimenModalOpen(true)
  }

  /**
   * @description 删除指定方案，并同步到 localStorage。
   * @param id 方案 id
   */
  const handleDeleteRegimen = (id: string) => {
    setRegimens((s) => {
      const next = s.filter((r) => r.id !== id)
      return next
    })
    setRegimenModalOpen(false)
    toast.success('已删除方案')
  }

  return (
    <div className="space-y-3 text-xs text-slate-700">
      <div className="flex items-center justify-between">
        <p>
          在此可录入患者当前用药方案，包括主治药物、合并用药及剂量频次，为 AI 风险评估提供输入。下方为一个示例用药方案展示。
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-700"
          >
            {showForm ? '取消' : '添加药物'}
          </button>
        </div>
      </div>

      {/* 动态表单 */}
      {showForm && (
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <p className="text-[13px] font-semibold text-slate-900">
            手动添加药物
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <label className="flex flex-col text-[13px]">
              药物名称 <span className="text-rose-500">*</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：多奈哌齐片"
                className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col text-[13px]">
              剂量 <span className="text-rose-500">*</span>
              <input
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="例如：5 mg"
                className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col text-[13px]">
              用法 <span className="text-rose-500">*</span>
              <input
                value={usage}
                onChange={(e) => setUsage(e.target.value)}
                placeholder="例如：睡前 1 次"
                className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col text-[13px]">
              备注
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="例如：AD 认知症 / 高血压"
                className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setName('')
                setDose('')
                setUsage('')
                setNote('')
              }}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleAddMedication}
              className="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-700"
            >
              添加到方案
            </button>
          </div>
        </div>
      )}

      {/* 药物列表展示 */}
      <div className="rounded-xl bg-white p-3 shadow-sm">
        <p className="text-[13px] font-semibold text-slate-900">
          示例用药方案（当前编辑）
        </p>
        <table className="mt-2 w-full table-fixed border-separate border-spacing-y-1 text-xs">
          <thead className="text-[11px] text-slate-500">
            <tr>
              <th className="text-left">药物名称</th>
              <th className="text-left">剂量</th>
              <th className="text-left">用法</th>
              <th className="text-left">备注</th>
              <th className="text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {medications.map((m, idx) => (
              <tr key={idx} className="rounded-lg bg-slate-50">
                <td className="py-1.5 pr-2">{m.name}</td>
                <td className="py-1.5 pr-2">{m.dose}</td>
                <td className="py-1.5 pr-2">{m.usage}</td>
                <td className="py-1.5 pr-2">{m.note}</td>
                <td className="py-1.5 pr-2">
                  <button
                    onClick={() => handleRemove(idx)}
                    className="rounded-md bg-rose-50 px-2 py-1 text-[11px] text-rose-700 hover:bg-rose-100"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
            {medications.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-500">
                  暂无药物，请点击“添加药物”录入
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* 保存为方案 */}
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="为当前药物列表命名，便于保存与复用（如：王阿姨·2026-02）"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-sky-500 focus:bg-white"
            />
            <button
              type="button"
              onClick={handleSaveRegimen}
              className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700"
            >
              保存为方案
            </button>
          </div>

          {/* 已保存的方案列表 */}
          <div>
            <p className="text-[12px] text-slate-600">已保存的用药方案</p>
            {regimens.length === 0 ? (
              <p className="mt-2 text-[12px] text-slate-500">
                暂无已保存方案
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {regimens.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => openRegimenModal(r)}
                      className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2 text-left text-sm shadow-sm hover:bg-slate-50"
                    >
                      <div>
                        <div className="font-medium text-slate-900">
                          {r.name}
                        </div>
                        <div className="mt-0.5 text-[12px] text-slate-500">
                          {r.medications.length} 项 • 保存于{' '}
                          {new Date(r.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-[12px] text-slate-400">操作</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* 方案操作弹窗：查看 &amp; 开始风险评估 &amp; 删除方案 */}
      {regimenModalOpen && activeRegimen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">
              {activeRegimen.name}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              保存于 {new Date(activeRegimen.createdAt).toLocaleString()}
            </p>

            <div className="mt-4 max-h-44 overflow-auto rounded-md border border-slate-100 bg-slate-50 p-3 text-xs">
              <ul className="space-y-2">
                {activeRegimen.medications.map((m, i) => (
                  <li key={i} className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-slate-900">
                        {m.name}
                      </div>
                      <div className="text-[12px] text-slate-500">
                        {m.dose} · {m.usage} {m.note ? `· ${m.note}` : ''}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setRegimenModalOpen(false)
                }}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                取消
              </button>
              <button
                onClick={() => {
                  onStartAssessment(activeRegimen)
                  setRegimenModalOpen(false)
                }}
                className="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
              >
                开始风险评估
              </button>
              <button
                onClick={() => handleDeleteRegimen(activeRegimen.id)}
                className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
              >
                删除方案
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * @interface RiskPanelProps
 * @description AI 风险评估面板的属性定义。
 */
interface RiskPanelProps {
  regimen?: Regimen | null
  result?: DeepSeekResult | null
  loading?: boolean
}

/**
 * @description AI 风险评估示例面板，接收 Regimen 与 DeepSeek 结果进行展示。
 *              提供概要、冲突列表、机制说明、参考文献及导出 PDF 按钮。
 */
const RiskPanel: React.FC<RiskPanelProps> = ({ regimen, result, loading }) => {
  /**
   * @description 导出 PDF（通过浏览器打印对话框，医生可选择“另存为 PDF”）。
   */
  const handleExportPdf = () => {
    try {
      window.print()
    } catch {
      // 忽略 demo 环境的异常
    }
  }

  return (
    <div className="space-y-3 text-xs text-slate-700">
      <p>
        录入用药方案后，可在此发起 AI 风险评估。系统将通过 DeepSeek
        模型自动比对知识库，识别潜在药物相互作用与禁忌。
      </p>

      {loading ? (
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <p className="text-[13px] font-semibold text-slate-900">
            正在与 DeepSeek 交互，正在评估…
          </p>
          <p className="mt-2 text-[12px] text-slate-500">
            评估过程可能需要数秒，请稍候。
          </p>
        </div>
      ) : result ? (
        <div className="space-y-3">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-slate-900">
                  DeepSeek 风险评估结果
                  {regimen ? ` — ${regimen.name}` : ''}
                </p>
                <p className="mt-1 text-[12px] text-slate-500">
                  下方为本次用药方案的总体风险概览与主要相互作用提示。
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportPdf}
                className="rounded-full bg-sky-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-sky-700"
              >
                导出 PDF
              </button>
            </div>

            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-[12px]">
              <p className="font-medium text-slate-900">概要说明</p>
              <p className="mt-1 text-slate-700">
                {result.summary || '后端未提供概要说明'}
              </p>
            </div>

            {Array.isArray(result.conflicts) &&
              result.conflicts.length > 0 && (
                <div className="mt-3">
                  <p className="text-[12px] font-medium text-slate-900">
                    主要相互作用与风险点
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {result.conflicts.map((c, i) => (
                      <li
                        key={i}
                        className="flex items-start justify-between gap-2 rounded-lg bg-slate-50 p-2"
                      >
                        <div className="flex-1">
                          <p className="text-[12px] font-medium text-slate-900">
                            {c.pair || `潜在冲突 ${i + 1}`}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-600">
                            {c.description || '未提供详细描述'}
                          </p>
                        </div>
                        <span
                          className={`ml-2 mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            c.severity === 'high'
                              ? 'bg-rose-50 text-rose-700'
                              : c.severity === 'medium'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {c.severityText ||
                            (c.severity === 'high'
                              ? '高度风险'
                              : c.severity === 'medium'
                              ? '中度风险'
                              : '低度风险')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[12px] font-medium text-slate-900">
                  可能机制说明
                </p>
                <p className="mt-1 text-[11px] text-slate-600">
                  {result.mechanism ||
                    '后端未提供详细机制说明。正式版本中可展示药代动力学 / 药效学机制、代谢酶途径等。'}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[12px] font-medium text-slate-900">
                  参考文献与资料
                </p>
                {Array.isArray(result.references) &&
                result.references.length > 0 ? (
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] text-slate-600">
                    {result.references.map((ref, idx) => (
                      <li key={idx}>{ref}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-[11px] text-slate-600">
                    后端未返回参考文献示例。正式版本可链接至药典、指南或文献数据库。
                  </p>
                )}
              </div>
            </div>

            <p className="mt-3 text-[11px] text-slate-500">
              结果为 DeepSeek 输出示例，正式系统将结合结构化药学知识库进行再加工，并提供更完整的机制说明和参考文献。
            </p>
          </div>
        </div>
      ) : regimen ? (
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <p className="text-[13px] font-semibold text-slate-900">
            正在评估：{regimen.name}
          </p>
          <p className="mt-2 text-[12px] text-slate-500">
            包含 {regimen.medications.length} 个药物，等待 DeepSeek 返回结果…
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <p className="text-[13px] font-semibold text-slate-900">
            示例评估结果概览（多奈哌齐 + 其他药物）
          </p>
          <ul className="mt-2 space-y-1.5">
            <li className="flex items-center justify-between">
              <span>多奈哌齐片 + 氯吡格雷</span>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
                中度相互作用
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>多奈哌齐片 + 阿米替林</span>
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] text-rose-700">
                高度相互作用
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>多奈哌齐片 + 氨氯地平</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                低度相互作用
              </span>
            </li>
          </ul>
          <p className="mt-2 text-[11px] text-slate-500">
            正式版本将接入药学与临床知识库进行计算。
          </p>
        </div>
      )}
    </div>
  )
}

interface ResultsPanelProps {
  regimen?: Regimen | null
  result?: DeepSeekResult | null
}

/**
 * @description 风险结果查看面板，自动展示当前选中用药方案的真实风险分布。
 */
const ResultsPanel: React.FC<ResultsPanelProps> = ({ regimen, result }) => {
  if (!regimen || !result) {
    return (
      <div className="space-y-3 text-xs text-slate-700">
        <p>
          当前尚未选择可统计的评估结果。请先在“用药方案录入”中发起“AI 风险评估”，
          或在“历史评估记录”中选择一条记录。
        </p>
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <p className="text-[13px] font-semibold text-slate-900">
            暂无风险分布数据
          </p>
          <p className="mt-2 text-[11px] text-slate-500">
            完成评估后，这里会自动显示当前方案的低/中/高风险统计。
          </p>
        </div>
      </div>
    )
  }

  const conflicts = Array.isArray(result.conflicts) ? result.conflicts : []
  const low = conflicts.filter((c) => c.severity === 'low').length
  const medium = conflicts.filter((c) => c.severity === 'medium').length
  const high = conflicts.filter((c) => c.severity === 'high').length
  const total = conflicts.length

  const calcHeight = (count: number) => {
    if (total === 0) return 12
    const ratio = count / total
    return Math.max(12, Math.round(ratio * 96))
  }

  const pct = (count: number) => (total === 0 ? 0 : Math.round((count / total) * 100))

  const highestLevelText =
    high > 0 ? '高度风险' : medium > 0 ? '中度风险' : low > 0 ? '低度风险' : '未识别'

  return (
    <div className="space-y-3 text-xs text-slate-700">
      <p>
        下方统计基于当前选择方案的真实 AI 评估结果，自动计算低/中/高风险分布。
      </p>
      <div className="rounded-xl bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] font-semibold text-slate-900">
            当前方案风险分布：{regimen.name}
          </p>
          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] text-sky-700">
            总冲突数：{total}
          </span>
        </div>

        {total === 0 ? (
          <p className="mt-2 text-[11px] text-slate-500">
            当前评估未返回可分级的冲突项，可能是低风险或模型未输出详细分级数据。
          </p>
        ) : (
          <div className="mt-2 flex items-end gap-2">
            <div className="flex-1 rounded-lg bg-slate-50 p-2 text-center">
              <div
                className="mx-auto w-6 rounded-full bg-emerald-400/70"
                style={{ height: `${calcHeight(low)}px` }}
              />
              <p className="mt-1 text-[11px] text-slate-600">
                低度（{low}，{pct(low)}%）
              </p>
            </div>
            <div className="flex-1 rounded-lg bg-slate-50 p-2 text-center">
              <div
                className="mx-auto w-6 rounded-full bg-amber-400/80"
                style={{ height: `${calcHeight(medium)}px` }}
              />
              <p className="mt-1 text-[11px] text-slate-600">
                中度（{medium}，{pct(medium)}%）
              </p>
            </div>
            <div className="flex-1 rounded-lg bg-slate-50 p-2 text-center">
              <div
                className="mx-auto w-6 rounded-full bg-rose-500/80"
                style={{ height: `${calcHeight(high)}px` }}
              />
              <p className="mt-1 text-[11px] text-slate-600">
                高度（{high}，{pct(high)}%）
              </p>
            </div>
          </div>
        )}

        <p className="mt-2 text-[11px] text-slate-500">
          当前最高风险等级：{highestLevelText}。建议结合“AI 风险评估”页的具体冲突明细进一步调整方案。
        </p>
      </div>
    </div>
  )
}

/**
 * @interface HistoryPanelProps
 * @description 历史评估记录面板的属性定义。
 */
interface HistoryPanelProps {
  history: AssessmentRecord[]
  onOpenRecord?: (record: AssessmentRecord) => void
}

/**
 * @description 历史评估记录面板：展示所有 DeepSeek 评估任务，
 *              每条记录以“用药方案 + 时间”命名，可点击查看详情。
 */
const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onOpenRecord,
}) => {
  /**
   * @description 根据冲突列表统计不同等级风险数量。
   * @param conflicts 冲突列表
   */
  const countBySeverity = (conflicts: DeepSeekConflict[]) => {
    const low = conflicts.filter((c) => c.severity === 'low').length
    const medium = conflicts.filter((c) => c.severity === 'medium').length
    const high = conflicts.filter((c) => c.severity === 'high').length
    return { low, medium, high }
  }

  return (
    <div className="space-y-3 text-xs text-slate-700">
      <p>
        此处按时间倒序展示历次 DeepSeek
        风险评估记录，可快速回顾同一患者不同疗程或多次调整方案前后的风险变化。
      </p>
      <div className="rounded-xl bg-white p-3 shadow-sm">
        <p className="text-[13px] font-semibold text-slate-900">
          历史评估记录
        </p>
        {history.length === 0 ? (
          <p className="mt-2 text-[12px] text-slate-500">
            暂无评估记录，请先在“用药方案录入”中选择方案并点击“开始风险评估”。
          </p>
        ) : (
          <ul className="mt-2 space-y-2 text-xs">
            {history.map((record) => {
              const { low, medium, high } = countBySeverity(
                record.result.conflicts || [],
              )
              return (
                <li key={record.id}>
                  <button
                    type="button"
                    onClick={() => onOpenRecord?.(record)}
                    className="flex w-full items-start justify-between gap-3 rounded-xl bg-slate-50 p-2.5 text-left hover:bg-slate-100"
                  >
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-slate-900">
                        {record.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        方案：{record.regimenName} · 评估时间：
                        {new Date(record.createdAt).toLocaleString()}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-600">
                        概要：{record.result.summary}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-[10px]">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                        低度：{low}
                      </span>
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                        中度：{medium}
                      </span>
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700">
                        高度：{high}
                      </span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

/**
 * @interface AdvicePanelProps
 * @description 辅助建议与说明面板属性。
 */
interface AdvicePanelProps {
  activeRegimen: Regimen | null
  advice: PatientFriendlyAdvice | null
  loading: boolean
  history: AssessmentRecord[]
  onUseHistoryRecord: (record: AssessmentRecord) => void
}

/**
 * @description 辅助建议与说明面板。
 *              展示 DeepSeek 自动生成的患者通俗说明，支持从历史记录中切换与下载文本。
 */
const AdvicePanel: React.FC<AdvicePanelProps> = ({
  activeRegimen,
  advice,
  loading,
  history,
  onUseHistoryRecord,
}) => {
  /**
   * @description 下载当前患者说明为 txt 文件。
   */
  const handleDownloadAdvice = () => {
    if (!advice?.plainText) {
      toast.warning('当前没有可下载的患者说明')
      return
    }

    try {
      const now = new Date()
      const dateTag = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
        2,
        '0',
      )}-${String(now.getDate()).padStart(2, '0')}`
      const safeName = (advice.regimenName || '用药方案').replace(/[\\/:*?"<>|]/g, '_')
      const filename = `${safeName}-患者说明-${dateTag}.txt`
      const blob = new Blob([advice.plainText], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)

      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      anchor.click()

      URL.revokeObjectURL(url)
      toast.success('患者说明已开始下载')
    } catch {
      toast.error('下载失败，请稍后重试')
    }
  }

  // 有患者说明的历史记录，便于快速切换
  const adviceHistory = history.filter((item) => !!item.patientAdvice)

  return (
    <div className="space-y-3 text-xs text-slate-700">
      <p>
        在完成“AI 风险评估”后，系统会自动生成一份写给患者和家属的通俗说明，语言更直白温和，便于日常执行。
      </p>

      {loading ? (
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <p className="text-[13px] font-semibold text-slate-900">
            正在生成患者说明…
          </p>
          <p className="mt-2 text-[12px] text-slate-500">
            正把专业评估结果转换成患者易懂版本，请稍候。
          </p>
        </div>
      ) : advice ? (
        <div className="space-y-3">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[14px] font-semibold text-slate-900">{advice.title}</p>
                <p className="mt-1 text-[12px] text-slate-500">
                  方案：{advice.regimenName}
                  {activeRegimen?.name ? `（当前选择：${activeRegimen.name}）` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadAdvice}
                className="rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-700"
              >
                下载患者说明（txt）
              </button>
            </div>

            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-[12px]">
              <p className="font-medium text-slate-900">温馨开场</p>
              <p className="mt-1 text-slate-700">{advice.intro}</p>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <AdviceList title="服药要点" items={advice.medicationChecklist} />
              <AdviceList title="日常生活建议" items={advice.dailyTips} />
              <AdviceList title="需要警惕的症状" items={advice.warningSigns} />
              <AdviceList title="家属陪护建议" items={advice.familyTips} />
            </div>

            <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-[12px] text-emerald-900">
              <p className="font-medium">结尾提醒</p>
              <p className="mt-1">{advice.closing}</p>
            </div>
          </div>

          {adviceHistory.length > 0 && (
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <p className="text-[13px] font-semibold text-slate-900">
                可复用的历史患者说明
              </p>
              <ul className="mt-2 space-y-2">
                {adviceHistory.map((record) => (
                  <li key={record.id}>
                    <button
                      type="button"
                      onClick={() => onUseHistoryRecord(record)}
                      className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-left text-[12px] hover:bg-slate-100"
                    >
                      <span>
                        {record.regimenName} · {new Date(record.createdAt).toLocaleString()}
                      </span>
                      <span className="text-slate-400">使用此说明</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <p className="text-[13px] font-semibold text-slate-900">
            暂无可用的患者说明
          </p>
          <p className="mt-2 text-[12px] text-slate-500">
            请先在“用药方案录入”里选择方案并完成“AI 风险评估”。评估成功后会自动生成对应方案的患者说明。
          </p>
          {adviceHistory.length > 0 && (
            <div className="mt-3">
              <p className="text-[12px] font-medium text-slate-700">历史可用说明</p>
              <ul className="mt-2 space-y-2">
                {adviceHistory.map((record) => (
                  <li key={record.id}>
                    <button
                      type="button"
                      onClick={() => onUseHistoryRecord(record)}
                      className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-left text-[12px] hover:bg-slate-100"
                    >
                      <span>
                        {record.regimenName} · {new Date(record.createdAt).toLocaleString()}
                      </span>
                      <span className="text-slate-400">载入</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface AdviceListProps {
  title: string
  items: string[]
}

/**
 * @description 患者说明中的列表分区。
 */
const AdviceList: React.FC<AdviceListProps> = ({ title, items }) => {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-[12px] font-medium text-slate-900">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] text-slate-700">
          {items.map((item, idx) => (
            <li key={`${title}-${idx}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-[11px] text-slate-500">暂无内容</p>
      )}
    </div>
  )
}

/**
 * @description 报告导出占位面板。
 */
const ExportPlaceholder: React.FC = () => {
  return (
    <div className="space-y-3 text-xs text-slate-700">
      <p>
        报告导出模块将在正式版本中接入，可一键生成可打印 / PDF
        报告，用于门诊打印与病历留存。
      </p>
      <div className="rounded-xl bg-white p-3 shadow-sm">
        <p className="text-[13px] font-semibold text-slate-900">
          报告导出（占位）
        </p>
        <p className="mt-2 text-[12px] text-slate-500">
          当前版本中，“AI 风险评估”面板已提供“导出
          PDF”（浏览器打印）功能，供原型演示使用。
        </p>
      </div>
    </div>
  )
}

/**
 * @interface FollowUpRowProps
 * @description 今日随访患者列表行组件的属性定义。
 */
interface FollowUpRowProps {
  name: string
  risk: string
  time: string
  tag: string
}

/**
 * @description 今日随访患者列表行组件。
 */
const FollowUpRow: React.FC<FollowUpRowProps> = ({
  name,
  risk,
  time,
  tag,
}) => {
  return (
    <div className="flex items-start justify-between gap-2 rounded-xl bg-white p-2 shadow-sm">
      <div className="text-[11px] text-slate-700">
        <p className="font-medium text-slate-900">{name}</p>
        <p className="mt-0.5">{time}</p>
        <p className="mt-0.5 text-slate-500">{tag}</p>
      </div>
      <span className="mt-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
        风险：{risk}
      </span>
    </div>
  )
}

export default DoctorDashboard
