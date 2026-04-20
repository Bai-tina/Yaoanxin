/**
 * @file index.js
 * @description 简单的 Node + Express 后端，提供 /api/deepseek/evaluate 接口，
 *              接收前端传入的用药方案（regimen），调用 DeepSeek API 进行风险评估，
 *              并返回结构化结果：summary、conflicts、mechanism、references 等。
 *
 * 使用方式（示例）：
 *   1. 安装依赖：npm install express cors
 *   2. 在终端设置环境变量（请使用你的真实 DeepSeek API Key）：
 *        export DEEPSEEK_API_KEY="sk-6000e460a0b042711bd27f2c019a919c"
 *   3. 启动后端：node server/index.js
 *
 * 注意：不要在代码中硬编码真实 API Key，建议通过环境变量传入。
 */

const express = require('express')
const cors = require('cors')

/**
 * @typedef {Object} DeepSeekConflict
 * @property {string} [pair] 药物组合名称
 * @property {string} [description] 冲突与风险描述
 * @property {'low'|'medium'|'high'} [severity] 风险等级
 * @property {string} [severityText] 风险等级文案
 */

/**
 * @typedef {Object} DeepSeekResult
 * @property {string} summary 概要说明
 * @property {DeepSeekConflict[]} conflicts 冲突列表
 * @property {string} [mechanism] 机制说明
 * @property {string[]} [references] 参考文献
 * @property {any} [raw] 原始 DeepSeek 返回结果，用于调试
 */

/**
 * @typedef {Object} PatientFriendlyAdvice
 * @property {string} regimenName 用药方案名称
 * @property {string} title 说明标题
 * @property {string} intro 开场说明（通俗版）
 * @property {string[]} medicationChecklist 服药要点
 * @property {string[]} dailyTips 日常生活建议
 * @property {string[]} warningSigns 需要警惕的症状
 * @property {string[]} familyTips 家属陪护建议
 * @property {string} closing 结尾提醒
 * @property {string} plainText 纯文本版本（用于下载）
 */

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 4000

/**
 * @description 尝试把模型返回文本解析为 JSON，支持 markdown 代码块容错。
 * @param {string} content 模型返回文本
 * @returns {any}
 */
function parseModelJson(content) {
  if (typeof content !== 'string') return null

  const trimmed = content.trim()
  const withoutFence = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  try {
    return JSON.parse(withoutFence)
  } catch {
    const start = withoutFence.indexOf('{')
    const end = withoutFence.lastIndexOf('}')
    if (start !== -1 && end > start) {
      const slice = withoutFence.slice(start, end + 1)
      try {
        return JSON.parse(slice)
      } catch {
        return null
      }
    }
    return null
  }
}

/**
 * @description 构建患者可下载的纯文本说明。
 * @param {PatientFriendlyAdvice} advice 结构化建议
 * @returns {string}
 */
function buildAdvicePlainText(advice) {
  const lines = []
  lines.push(advice.title || '用药温馨说明')
  lines.push(`方案：${advice.regimenName || '未命名方案'}`)
  lines.push('')
  lines.push(advice.intro || '请按医嘱规范用药，保持稳定作息。')
  lines.push('')

  lines.push('一、服药要点')
  if (Array.isArray(advice.medicationChecklist) && advice.medicationChecklist.length > 0) {
    advice.medicationChecklist.forEach((item, idx) => {
      lines.push(`${idx + 1}. ${item}`)
    })
  } else {
    lines.push('1. 按时按量，不自行加减药。')
  }
  lines.push('')

  lines.push('二、日常生活建议')
  if (Array.isArray(advice.dailyTips) && advice.dailyTips.length > 0) {
    advice.dailyTips.forEach((item, idx) => {
      lines.push(`${idx + 1}. ${item}`)
    })
  } else {
    lines.push('1. 规律作息，均衡饮食，适度活动。')
  }
  lines.push('')

  lines.push('三、这些情况请尽快联系医生')
  if (Array.isArray(advice.warningSigns) && advice.warningSigns.length > 0) {
    advice.warningSigns.forEach((item, idx) => {
      lines.push(`${idx + 1}. ${item}`)
    })
  } else {
    lines.push('1. 出现明显不适或症状突然加重。')
  }
  lines.push('')

  lines.push('四、家属陪护建议')
  if (Array.isArray(advice.familyTips) && advice.familyTips.length > 0) {
    advice.familyTips.forEach((item, idx) => {
      lines.push(`${idx + 1}. ${item}`)
    })
  } else {
    lines.push('1. 帮助患者按时服药并观察状态变化。')
  }
  lines.push('')

  lines.push(advice.closing || '有任何不舒服，别硬扛，及时联系医生。')
  return lines.join('\n')
}

/**
 * @function callDeepSeek
 * @description 调用 DeepSeek Chat Completions 接口，对用药方案进行风险评估。
 * @param {any} regimen 前端传入的用药方案对象
 * @returns {Promise<DeepSeekResult>} 结构化评估结果
 */
async function callDeepSeek(regimen) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY 未配置，请在环境变量中设置 DeepSeek API Key')
  }

  // 此处以 DeepSeek Chat Completions API 为例，具体路径和模型请以官方文档为准
  const url = 'https://api.deepseek.com/chat/completions'

  const systemPrompt =
    'You are a clinical pharmacist specialized in drug-drug interaction (DDI) analysis. ' +
    'You must respond ONLY with valid JSON (no extra text).'

  const userPrompt =
    '请根据下面提供的用药方案，评估药物相互作用与安全性风险，并返回 JSON 对象，字段包含：' +
    'summary（中文概要说明），conflicts（数组），每个 conflict 含有：' +
    'pair（药物组合名称），description（中文风险描述），severity（low/medium/high），severityText（中文风险等级文案）。\n' +
    '用药方案 JSON 如下：\n' +
    JSON.stringify(regimen, null, 2)

  const payload = {
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    // 如果 DeepSeek 支持强制 JSON 输出，可启用类似 response_format 能力（以官方文档为准）
    // response_format: { type: 'json_object' },
  }

  // Node 18+ 内置 fetch，如果没有则需要安装 node-fetch
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`DeepSeek API error: ${response.status} ${text}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content || '{}'

  const parsed = parseModelJson(content)
  if (!parsed) {
    // 如果模型未按预期返回纯 JSON，则退化为简单包装
    const fallback = {
      summary: content,
      conflicts: [],
    }
    return {
      summary: fallback.summary || '未提供概要说明',
      conflicts: Array.isArray(fallback.conflicts) ? fallback.conflicts : [],
      mechanism: fallback.mechanism,
      references: Array.isArray(fallback.references) ? fallback.references : [],
      raw: data,
    }
  }

  /** @type {DeepSeekResult} */
  const result = {
    summary: parsed.summary || '未提供概要说明',
    conflicts: Array.isArray(parsed.conflicts) ? parsed.conflicts : [],
    mechanism: parsed.mechanism,
    references: Array.isArray(parsed.references) ? parsed.references : [],
    raw: data,
  }

  return result
}

/**
 * @function callDeepSeekPatientAdvice
 * @description 基于用药方案与风险评估结果，生成写给患者/家属的通俗说明。
 * @param {any} regimen 用药方案
 * @param {DeepSeekResult} assessment 风险评估结果
 * @returns {Promise<PatientFriendlyAdvice>}
 */
async function callDeepSeekPatientAdvice(regimen, assessment) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY 未配置，请在环境变量中设置 DeepSeek API Key')
  }

  const url = 'https://api.deepseek.com/chat/completions'
  const regimenName =
    typeof regimen?.name === 'string' && regimen.name.trim()
      ? regimen.name.trim()
      : '当前用药方案'

  const systemPrompt =
    '你是一位临床药师与患者教育专家。' +
    '请把专业风险评估结果改写成患者和家属容易理解、温暖直白的中文说明。' +
    '必须只返回 JSON，不要返回任何额外文字。'

  const userPrompt =
    '请根据以下用药方案与风险评估结果，生成“写给患者和家属”的说明文。' +
    '语言要求：口语化、温暖、简洁、可执行，避免术语堆砌。' +
    '输出 JSON 字段：' +
    'title（字符串）、intro（字符串）、' +
    'medicationChecklist（数组，3-6 条）、dailyTips（数组，3-6 条）、' +
    'warningSigns（数组，3-6 条）、familyTips（数组，2-4 条）、' +
    'closing（字符串）。\n' +
    '用药方案：\n' +
    JSON.stringify(regimen, null, 2) +
    '\n风险评估结果：\n' +
    JSON.stringify(
      {
        summary: assessment?.summary || '',
        conflicts: assessment?.conflicts || [],
        mechanism: assessment?.mechanism || '',
      },
      null,
      2,
    )

  const payload = {
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`DeepSeek API error: ${response.status} ${text}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content || '{}'
  const parsed = parseModelJson(content)

  /** @type {PatientFriendlyAdvice} */
  const normalized = {
    regimenName,
    title: parsed?.title || `${regimenName} 用药温馨说明`,
    intro:
      parsed?.intro ||
      '这份说明是给您和家属看的，重点是帮助您更安全地按时用药。',
    medicationChecklist: Array.isArray(parsed?.medicationChecklist)
      ? parsed.medicationChecklist
      : [],
    dailyTips: Array.isArray(parsed?.dailyTips) ? parsed.dailyTips : [],
    warningSigns: Array.isArray(parsed?.warningSigns) ? parsed.warningSigns : [],
    familyTips: Array.isArray(parsed?.familyTips) ? parsed.familyTips : [],
    closing:
      parsed?.closing || '有不舒服先别硬扛，及时联系医生，我们一起把风险降到最低。',
    plainText: '',
  }

  normalized.plainText =
    typeof parsed?.plainText === 'string' && parsed.plainText.trim()
      ? parsed.plainText.trim()
      : buildAdvicePlainText(normalized)

  return normalized
}

/**
 * @route POST /api/deepseek/evaluate
 * @description 接收前端传入的 regimen，用 DeepSeek 进行风险评估并返回结果。
 */
app.post('/api/deepseek/evaluate', async (req, res) => {
  const { regimen } = req.body || {}
  if (!regimen) {
    return res.status(400).json({ error: 'Missing regimen in request body' })
  }

  try {
    const result = await callDeepSeek(regimen)
    return res.json(result)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('DeepSeek evaluate failed:', err)
    return res.status(500).json({
      error: 'Failed to call DeepSeek API',
      message: err.message,
    })
  }
})

/**
 * @route POST /api/deepseek/patient-advice
 * @description 接收 regimen + assessment，生成患者可读的温馨说明。
 */
app.post('/api/deepseek/patient-advice', async (req, res) => {
  const { regimen, assessment } = req.body || {}
  if (!regimen || !assessment) {
    return res
      .status(400)
      .json({ error: 'Missing regimen or assessment in request body' })
  }

  try {
    const advice = await callDeepSeekPatientAdvice(regimen, assessment)
    return res.json(advice)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('DeepSeek patient advice failed:', err)
    return res.status(500).json({
      error: 'Failed to generate patient advice by DeepSeek',
      message: err.message,
    })
  }
})

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`DeepSeek backend listening on http://localhost:${PORT}`)
})
