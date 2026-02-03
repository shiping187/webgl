/**
 * ============================================
 * WebGL 工具函数库
 * ============================================
 * 
 * 提供创建和管理WebGL程序的通用函数
 */

import type { WebGLInitResult } from '../types'

/**
 * 创建并编译着色器
 * @param gl - WebGL上下文
 * @param type - 着色器类型 (gl.VERTEX_SHADER 或 gl.FRAGMENT_SHADER)
 * @param source - 着色器源代码
 * @returns 编译后的着色器，失败返回null
 */
export function createShader(
  gl: WebGLRenderingContext, 
  type: number, 
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) {
    console.error('无法创建着色器')
    return null
  }
  
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  
  // 检查编译是否成功
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('着色器编译错误:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  
  return shader
}

/**
 * 创建并链接程序
 * @param gl - WebGL上下文
 * @param vertexShader - 顶点着色器
 * @param fragmentShader - 片段着色器
 * @returns 链接后的程序，失败返回null
 */
export function createProgram(
  gl: WebGLRenderingContext, 
  vertexShader: WebGLShader, 
  fragmentShader: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram()
  if (!program) {
    console.error('无法创建程序')
    return null
  }
  
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  
  // 检查链接是否成功
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('程序链接错误:', gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }
  
  return program
}

/**
 * 初始化一个完整的shader程序
 * @param canvas - Canvas元素
 * @param vertexSource - 顶点着色器代码
 * @param fragmentSource - 片段着色器代码
 * @param uniformNames - uniform变量名列表
 * @returns 包含gl、program和uniform位置的对象
 */
export function initShaderProgram(
  canvas: HTMLCanvasElement, 
  vertexSource: string, 
  fragmentSource: string, 
  uniformNames: string[] = []
): WebGLInitResult | null {
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
  
  if (!gl) {
    console.error('WebGL不可用')
    return null
  }
  
  // 创建着色器
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  
  if (!vertexShader || !fragmentShader) {
    return null
  }
  
  // 创建程序
  const program = createProgram(gl, vertexShader, fragmentShader)
  
  if (!program) {
    return null
  }
  
  // 设置顶点数据 - 覆盖整个canvas的矩形
  const positions = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
     1,  1
  ])
  
  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
  
  // 获取attribute位置并启用
  const positionLocation = gl.getAttribLocation(program, 'a_position')
  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
  
  // 获取所有uniform的位置
  const uniforms: Record<string, WebGLUniformLocation | null> = {}
  for (const name of uniformNames) {
    uniforms[name] = gl.getUniformLocation(program, name)
  }
  
  // 使用程序
  gl.useProgram(program)
  
  return {
    gl,
    program,
    uniforms,
    positionLocation
  }
}

/**
 * 调整canvas尺寸以匹配显示尺寸
 * @param canvas - Canvas元素
 * @param gl - WebGL上下文
 */
export function resizeCanvas(canvas: HTMLCanvasElement, gl: WebGLRenderingContext): void {
  const displayWidth = canvas.clientWidth * window.devicePixelRatio
  const displayHeight = canvas.clientHeight * window.devicePixelRatio
  
  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth
    canvas.height = displayHeight
    gl.viewport(0, 0, canvas.width, canvas.height)
  }
}

/**
 * HSV 转 RGB 颜色空间
 */
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = v - c
  
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ]
}

/**
 * 为卡片预览初始化简化的shader（使用Canvas 2D避免WebGL上下文过多）
 * @param canvas - Canvas元素
 * @param shaderId - Shader ID
 */
export function initPreviewShader(canvas: HTMLCanvasElement | null, shaderId: string): void {
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // 确保 canvas 有有效尺寸
  const width = canvas.clientWidth || 300
  const height = canvas.clientHeight || 200
  const dpr = window.devicePixelRatio || 1
  
  // 设置canvas尺寸
  canvas.width = width * dpr
  canvas.height = height * dpr
  ctx.scale(dpr, dpr)
  
  // 根据 shaderId 生成唯一的颜色
  const hash = shaderId.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
  const hue1 = Math.abs(hash % 360)
  const hue2 = (hue1 + 180) % 360
  
  const [r1, g1, b1] = hsvToRgb(hue1, 0.7, 0.9)
  const [r2, g2, b2] = hsvToRgb(hue2, 0.6, 0.3)
  
  // 动画参数
  let animationId: number
  const startTime = Date.now()
  
  const animate = (): void => {
    if (!canvas.isConnected) {
      cancelAnimationFrame(animationId)
      return
    }
    
    const time = (Date.now() - startTime) / 1000
    
    // 创建动态渐变背景
    const gradient = ctx.createRadialGradient(
      width / 2 + Math.sin(time) * 30, 
      height / 2 + Math.cos(time * 0.7) * 20,
      0,
      width / 2, 
      height / 2,
      Math.max(width, height) * 0.8
    )
    
    gradient.addColorStop(0, `rgb(${r1}, ${g1}, ${b1})`)
    gradient.addColorStop(0.5, `rgb(${(r1 + r2) / 2}, ${(g1 + g2) / 2}, ${(b1 + b2) / 2})`)
    gradient.addColorStop(1, `rgb(${r2}, ${g2}, ${b2})`)
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    
    // 添加动态波纹效果
    ctx.globalAlpha = 0.3
    for (let i = 0; i < 3; i++) {
      const waveTime = time + i * 0.5
      const cx = width / 2 + Math.sin(waveTime * 0.8 + i) * width * 0.2
      const cy = height / 2 + Math.cos(waveTime * 0.6 + i) * height * 0.2
      const radius = (Math.sin(waveTime * 2) * 0.5 + 0.5) * Math.min(width, height) * 0.4 + 20
      
      const waveGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
      waveGradient.addColorStop(0, `rgba(255, 255, 255, 0.4)`)
      waveGradient.addColorStop(0.5, `rgba(255, 255, 255, 0.1)`)
      waveGradient.addColorStop(1, `rgba(255, 255, 255, 0)`)
      
      ctx.fillStyle = waveGradient
      ctx.fillRect(0, 0, width, height)
    }
    ctx.globalAlpha = 1.0
    
    // 添加网格线效果
    ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`
    ctx.lineWidth = 1
    const gridSize = 30
    const offsetX = (time * 20) % gridSize
    const offsetY = (time * 15) % gridSize
    
    for (let x = -gridSize + offsetX; x < width + gridSize; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = -gridSize + offsetY; y < height + gridSize; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
    
    animationId = requestAnimationFrame(animate)
  }
  
  animate()
}

/**
 * 格式化shader代码用于显示
 * @param code - 原始代码
 * @returns 格式化后的代码
 */
export function formatShaderCode(code: string): string {
  // 移除首尾空行，保持缩进
  return code.trim()
}

export default {
  createShader,
  createProgram,
  initShaderProgram,
  resizeCanvas,
  initPreviewShader,
  formatShaderCode
}
