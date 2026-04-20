/**  
 * @file ComingSoonDialog.tsx  
 * @description 通用“功能暂未开放”弹窗组件，用于功能占位展示。  
 */

import React from 'react'

/**  
 * @description ComingSoonDialog 组件的属性。  
 */
export interface ComingSoonDialogProps {
  /** 是否显示弹窗 */
  open: boolean
  /** 标题文案 */
  title?: string
  /** 主体描述文案 */
  description?: string
  /** 关闭回调 */
  onClose: () => void
}

/**  
 * @description 简单的全屏遮罩弹窗，告知用户功能暂未开放。  
 */
export const ComingSoonDialog: React.FC<ComingSoonDialogProps> = ({
  open,
  title = '功能暂未开放',
  description = '该功能正在研发中，敬请期待。',
  onClose,
}) => {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mb-6 text-sm leading-relaxed text-slate-600">{description}</p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  )
}

export default ComingSoonDialog
