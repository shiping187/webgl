/**
 * ============================================
 * WebGL Shader 类型定义
 * ============================================
 * 
 * 定义了整个项目中使用的核心类型
 */

/**
 * Shader 难度级别
 */
export type ShaderLevel = 'basic' | 'intermediate' | 'advanced'

/**
 * Uniform 变量名称
 */
export type UniformName = 'u_time' | 'u_resolution' | 'u_mouse' | string

/**
 * Shader 示例数据结构
 */
export interface ShaderExample {
  /** 唯一标识符 */
  id: string
  /** 显示标题 */
  title: string
  /** 简短描述 */
  description: string
  /** 难度级别 */
  level: ShaderLevel
  /** 标签列表 */
  tags: string[]
  /** 顶点着色器源码 */
  vertexShader: string
  /** 片段着色器源码 */
  fragmentShader: string
  /** 详细讲解（Markdown格式） */
  explanation: string
  /** 需要的uniform变量列表 (可选，已弃用) */
  uniforms?: UniformName[]
  /** 是否为3D场景 */
  is3D?: boolean
  /** 粒子数量（仅粒子系统使用） */
  particleCount?: number
}

/**
 * WebGL 初始化结果
 */
export interface WebGLInitResult {
  /** WebGL 上下文 */
  gl: WebGLRenderingContext
  /** WebGL 程序 */
  program: WebGLProgram
  /** Uniform 位置映射 */
  uniforms: Record<string, WebGLUniformLocation | null>
  /** Position attribute 位置 */
  positionLocation: number
}

/**
 * 鼠标位置（归一化坐标）
 */
export interface NormalizedMousePosition {
  x: number
  y: number
}

/**
 * 难度级别信息
 */
export interface LevelInfo {
  id: string
  name: string
  icon: string
}

/**
 * 学习路径步骤
 */
export interface LearningPathStep {
  title: string
  description: string
}

/**
 * 标签页信息
 */
export interface TabInfo {
  id: string
  name: string
}
