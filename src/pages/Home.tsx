/**  
 * @file Home.tsx  
 * @description 药安心平台首页（Landing Page），展示平台定位、功能亮点与流程示意，并提供登录 / 注册入口。  
 */

import React from 'react'
import { Link, useNavigate } from 'react-router'
import { Activity, BellRing, Brain, ShieldCheck } from 'lucide-react'

/**  
 * @description 药安心首页组件，作为访问入口。  
 */
const HomePage: React.FC = () => {
  const navigate = useNavigate()

  const handlePrimaryCTA = (tab: 'login' | 'register') => {
    navigate(`/auth?tab=${tab}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-emerald-50 to-slate-50 text-slate-900">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-md">
              <span className="text-lg font-bold">药</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold tracking-tight md:text-xl">
                  药安心
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  AD 用药安全
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 md:text-sm">
                面向阿尔茨海默症患者与医生的 AI 辅助用药平台
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
            <a href="#intro" className="hover:text-sky-700">
              平台简介
            </a>
            <a href="#features" className="hover:text-sky-700">
              功能亮点
            </a>
            <a href="#flow" className="hover:text-sky-700">
              使用流程
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handlePrimaryCTA('login')}
              className="hidden rounded-full border border-sky-500 px-4 py-1.5 text-sm font-medium text-sky-700 transition hover:bg-sky-50 md:inline-flex"
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => handlePrimaryCTA('register')}
              className="inline-flex items-center rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-1.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
            >
              立即注册
            </button>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:pb-24 md:pt-12">
        {/* 主视觉区 */}
        <section
          id="intro"
          className="grid gap-10 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:items-center"
        >
          <div>
            <div className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-sky-700 shadow-sm ring-1 ring-sky-100">
              AI 辅助用药 · AD 患者安全守护
            </div>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
              药安心：AI 辅助用药平台
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 md:text-base">
              面向医生与患者，聚焦阿尔茨海默症多药联用风险，通过智能风险评估、用药提醒与记录，帮助医生开展科学决策，协助患者与家属实现安全、规范、可追溯的长期用药管理。
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handlePrimaryCTA('register')}
                className="inline-flex items-center rounded-full bg-gradient-to-r from-sky-600 to-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:brightness-105"
              >
                立即体验 · 免费注册
              </button>
              <button
                type="button"
                onClick={() => handlePrimaryCTA('login')}
                className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                我是已有账号 · 去登录
              </button>
            </div>

            <dl className="mt-6 grid max-w-lg grid-cols-2 gap-4 text-xs text-slate-600 md:text-sm">
              <div>
                <dt className="font-medium text-slate-800">多药联用风险评估</dt>
                <dd className="mt-1">
                  聚焦 AD 合并基础病场景，辅助识别潜在 DDI 及易混用药。
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">智能提醒与记录</dt>
                <dd className="mt-1">
                  患者端自动生成用药日程，支持提醒、打卡与长期追踪。
                </dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            <div className="absolute -left-4 -top-4 h-24 w-24 rounded-3xl bg-sky-200/60 blur-2xl" />
            <div className="absolute -bottom-6 -right-4 h-24 w-24 rounded-3xl bg-emerald-200/60 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl bg-white/90 p-5 shadow-2xl ring-1 ring-sky-100/80">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-sky-600">角色入口</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    医生端 / 患者端
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                  实时演示
                </span>
              </div>

              <div className="mt-4 grid gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => handlePrimaryCTA('login')}
                  className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50 px-3 py-2 text-left transition hover:border-sky-300 hover:bg-sky-100"
                >
                  <div>
                    <p className="font-semibold text-slate-900">医生工作台</p>
                    <p className="mt-1 text-[11px] text-slate-600">
                      患者档案、用药方案、AI 风险评估、报告导出一体化管理。
                    </p>
                  </div>
                  <span className="ml-3 rounded-full bg-sky-500 px-2 py-0.5 text-[11px] font-medium text-white">
                    医生入口
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrimaryCTA('login')}
                  className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-left transition hover:border-emerald-300 hover:bg-emerald-100"
                >
                  <div>
                    <p className="font-semibold text-slate-900">患者用药中心</p>
                    <p className="mt-1 text-[11px] text-slate-600">
                      用药清单、提醒打卡、风险提示，适合长辈使用的简洁界面。
                    </p>
                  </div>
                  <span className="ml-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-medium text-white">
                    患者入口
                  </span>
                </button>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-[11px] text-slate-600">
                <div className="rounded-2xl bg-slate-50 p-2">
                  <p className="text-xs font-semibold text-slate-800">
                    用药依从率
                  </p>
                  <p className="mt-1 text-lg font-bold text-emerald-600">92%</p>
                  <p className="mt-1 text-[10px] text-slate-500">近期样本</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-2">
                  <p className="text-xs font-semibold text-slate-800">
                    风险警示
                  </p>
                  <p className="mt-1 text-lg font-bold text-amber-500">中等</p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    自动生成建议
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-2">
                  <p className="text-xs font-semibold text-slate-800">
                    日均提醒
                  </p>
                  <p className="mt-1 text-lg font-bold text-sky-600">4 次</p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    个性化设定
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 功能亮点 */}
        <section id="features" className="mt-14 md:mt-20">
          <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">
            核心功能亮点
          </h2>
          <p className="mt-2 text-sm text-slate-600 md:text-base">
            围绕“医生决策辅助 + 患者安全用药管理”，构建完整的 AI 用药风险评估闭环。
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-4">
            <FeatureCard
              icon={Brain}
              title="AI 风险评估"
              description="基于多药联用场景，对潜在药物相互作用（DDI）、肾功能/肝功能禁忌等风险进行智能识别。"
              badge="医生端"
            />
            <FeatureCard
              icon={BellRing}
              title="用药提醒"
              description="按医嘱自动生成用药计划，对患者及家属进行多通道用药提醒与漏服提示。"
              badge="患者端"
            />
            <FeatureCard
              icon={ShieldCheck}
              title="安全用药管理"
              description="记录全程用药行为，追踪依从性与不良反应，辅助长期疗程管理。"
              badge="双端共用"
            />
            <FeatureCard
              icon={Activity}
              title="医生辅助决策"
              description="汇总用药史与风险结果，输出可视化报告，帮助医生快速把握关键风险点。"
              badge="医生端"
            />
          </div>
        </section>

        {/* 流程示意 */}
        <section id="flow" className="mt-16 md:mt-20">
          <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">
            平台功能流程示意
          </h2>
          <p className="mt-2 text-sm text-slate-600 md:text-base">
            从注册登录，到角色分流，再到用药管理与 AI 风险评估，全流程可在本前端原型中进行演示。
          </p>

          <div className="mt-6 rounded-3xl bg-white/90 p-5 shadow-lg shadow-slate-200/60 ring-1 ring-slate-100 md:p-6">
            <ol className="grid gap-4 text-sm text-slate-700 md:grid-cols-4">
              <FlowStep
                index={1}
                title="注册账号"
                content="选择医生 / 患者身份，填写基本信息，完成快速注册。"
              />
              <FlowStep
                index={2}
                title="登录平台"
                content="使用手机号 / 邮箱 + 密码登录，系统自动识别角色。"
              />
              <FlowStep
                index={3}
                title="角色分流"
                content="医生进入“医生工作台”，患者进入“患者用药中心”。"
              />
              <FlowStep
                index={4}
                title="功能使用"
                content="医生端开展用药录入与风险评估；患者端进行用药提醒、打卡与风险查看。"
              />
            </ol>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <p>本页面仅为前端原型演示，不涉及真实患者数据与接口。</p>
              <Link
                to="/auth"
                className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-700 ring-1 ring-sky-100 hover:bg-sky-100"
              >
                立即进入登录 / 注册页面
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="border-t border-slate-200 bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} 药安心 · AI 辅助用药平台 · 演示原型</div>
          <div className="flex flex-wrap gap-3">
            <span>联系方式：contact@yaoanxin.demo</span>
            <span>本项目用于教学与展示，不作为医疗诊断依据。</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

interface FeatureCardProps {
  /** 图标组件 */
  icon: React.ComponentType<{ className?: string }>
  /** 标题 */
  title: string
  /** 描述 */
  description: string
  /** 角色徽章文案 */
  badge: string
}

/**  
 * @description 首页功能亮点卡片组件。  
 */
const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  badge,
}) => {
  return (
    <article className="flex h-full flex-col rounded-2xl bg-white/90 p-4 shadow-md shadow-slate-200/70 ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <span className="mt-0.5 inline-flex w-fit rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            {badge}
          </span>
        </div>
      </div>
      <p className="mt-3 flex-1 text-xs leading-relaxed text-slate-600 md:text-[13px]">
        {description}
      </p>
    </article>
  )
}

interface FlowStepProps {
  /** 步骤序号 */
  index: number
  /** 步骤标题 */
  title: string
  /** 步骤描述 */
  content: string
}

/**  
 * @description 平台流程示意步骤卡片。  
 */
const FlowStep: React.FC<FlowStepProps> = ({ index, title, content }) => {
  return (
    <li className="relative flex flex-col rounded-2xl bg-slate-50/80 p-3 ring-1 ring-slate-100 md:p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 text-xs font-bold text-white shadow">
          {index}
        </div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">{content}</p>
    </li>
  )
}

export default HomePage
