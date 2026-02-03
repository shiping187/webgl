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
 * 为卡片预览初始化简化的shader
 * @param canvas - Canvas元素
 * @param shaderId - Shader ID
 */
export function initPreviewShader(canvas: HTMLCanvasElement, shaderId: string): void {
  if (!canvas) return
  
  const gl = canvas.getContext('webgl')
  if (!gl) return
  
  // 设置canvas尺寸
  canvas.width = canvas.clientWidth * window.devicePixelRatio
  canvas.height = canvas.clientHeight * window.devicePixelRatio
  gl.viewport(0, 0, canvas.width, canvas.height)
  
  // 简单的预览shader - 根据ID生成不同的图案
  const vertexShaderSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `
  
  // 根据shader ID选择不同的预览效果
  const getPreviewFragment = (id: string): string => {
    const hash = id.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
    const hue = Math.abs(hash % 360)
    
    return `
      precision mediump float;
      varying vec2 v_uv;
      uniform float u_time;
      
      vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }
      
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      
      void main() {
        vec2 uv = v_uv;
        float t = u_time * 0.5;
        
        // 根据ID生成不同图案
        float pattern = sin(uv.x * 10.0 + t) * sin(uv.y * 10.0 + t * 0.7);
        pattern += sin(length(uv - 0.5) * 15.0 - t * 2.0) * 0.5;
        pattern = pattern * 0.5 + 0.5;
        
        // 基于ID的颜色
        float hue = ${hue.toFixed(1)} / 360.0;
        vec3 color1 = hsv2rgb(vec3(hue, 0.7, 0.9));
        vec3 color2 = hsv2rgb(vec3(hue + 0.5, 0.6, 0.3));
        
        vec3 color = mix(color2, color1, pattern);
        
        // 添加一点噪声
        color += (hash(uv * 100.0 + t) - 0.5) * 0.05;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `
  }
  
  const fragmentShaderSource = getPreviewFragment(shaderId)
  
  // 创建着色器
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
  
  if (!vertexShader || !fragmentShader) return
  
  const program = createProgram(gl, vertexShader, fragmentShader)
  if (!program) return
  
  // 设置顶点
  const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
  
  const positionLocation = gl.getAttribLocation(program, 'a_position')
  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
  
  gl.useProgram(program)
  
  const timeLocation = gl.getUniformLocation(program, 'u_time')
  
  // 动画循环
  let animationId: number
  const startTime = Date.now()
  
  const animate = (): void => {
    if (!canvas.isConnected) {
      cancelAnimationFrame(animationId)
      return
    }
    
    const time = (Date.now() - startTime) / 1000
    gl.uniform1f(timeLocation, time)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
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
