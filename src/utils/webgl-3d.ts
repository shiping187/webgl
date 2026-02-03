/**
 * ============================================
 * WebGL 3D 渲染工具库
 * ============================================
 * 
 * 提供3D几何体生成和矩阵计算功能
 */

/**
 * 3D 几何体数据结构
 */
export interface Geometry3D {
  positions: Float32Array
  normals: Float32Array
  uvs: Float32Array
  indices: Uint16Array
  vertexCount: number
}

/**
 * 粒子系统数据结构
 */
export interface ParticleData {
  positions: Float32Array
  velocities: Float32Array
  params: Float32Array
  count: number
}

/**
 * 创建立方体几何体
 */
export function createCube(size: number = 1): Geometry3D {
  const s = size / 2
  
  // 顶点位置 (每个面4个顶点，6个面)
  const positions = new Float32Array([
    // 前面
    -s, -s,  s,   s, -s,  s,   s,  s,  s,  -s,  s,  s,
    // 后面
     s, -s, -s,  -s, -s, -s,  -s,  s, -s,   s,  s, -s,
    // 上面
    -s,  s,  s,   s,  s,  s,   s,  s, -s,  -s,  s, -s,
    // 下面
    -s, -s, -s,   s, -s, -s,   s, -s,  s,  -s, -s,  s,
    // 右面
     s, -s,  s,   s, -s, -s,   s,  s, -s,   s,  s,  s,
    // 左面
    -s, -s, -s,  -s, -s,  s,  -s,  s,  s,  -s,  s, -s
  ])
  
  // 法线
  const normals = new Float32Array([
    // 前面
    0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
    // 后面
    0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,
    // 上面
    0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
    // 下面
    0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,
    // 右面
    1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
    // 左面
    -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0
  ])
  
  // UV坐标
  const uvs = new Float32Array([
    0, 0,  1, 0,  1, 1,  0, 1,
    0, 0,  1, 0,  1, 1,  0, 1,
    0, 0,  1, 0,  1, 1,  0, 1,
    0, 0,  1, 0,  1, 1,  0, 1,
    0, 0,  1, 0,  1, 1,  0, 1,
    0, 0,  1, 0,  1, 1,  0, 1
  ])
  
  // 索引
  const indices = new Uint16Array([
    0, 1, 2,  0, 2, 3,    // 前面
    4, 5, 6,  4, 6, 7,    // 后面
    8, 9, 10,  8, 10, 11, // 上面
    12, 13, 14,  12, 14, 15, // 下面
    16, 17, 18,  16, 18, 19, // 右面
    20, 21, 22,  20, 22, 23  // 左面
  ])
  
  return { positions, normals, uvs, indices, vertexCount: 36 }
}

/**
 * 创建球体几何体
 * @param radius - 半径
 * @param segments - 经线分段数
 * @param rings - 纬线分段数
 */
export function createSphere(radius: number = 1, segments: number = 32, rings: number = 24): Geometry3D {
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  
  // 生成顶点
  for (let y = 0; y <= rings; y++) {
    const v = y / rings
    const phi = v * Math.PI
    
    for (let x = 0; x <= segments; x++) {
      const u = x / segments
      const theta = u * Math.PI * 2
      
      // 位置
      const px = -radius * Math.cos(theta) * Math.sin(phi)
      const py = radius * Math.cos(phi)
      const pz = radius * Math.sin(theta) * Math.sin(phi)
      
      positions.push(px, py, pz)
      
      // 法线（球体法线就是归一化的位置）
      normals.push(px / radius, py / radius, pz / radius)
      
      // UV
      uvs.push(u, v)
    }
  }
  
  // 生成索引
  for (let y = 0; y < rings; y++) {
    for (let x = 0; x < segments; x++) {
      const a = y * (segments + 1) + x
      const b = a + segments + 1
      
      indices.push(a, b, a + 1)
      indices.push(b, b + 1, a + 1)
    }
  }
  
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: new Uint16Array(indices),
    vertexCount: indices.length
  }
}

/**
 * 创建粒子系统数据
 * @param count - 粒子数量
 */
export function createParticles(count: number): ParticleData {
  const positions = new Float32Array(count * 3)
  const velocities = new Float32Array(count * 3)
  const params = new Float32Array(count * 2)
  
  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const i2 = i * 2
    
    // 随机初始位置（球形分布）
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = Math.pow(Math.random(), 1/3) * 2  // 均匀球形分布
    
    positions[i3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i3 + 2] = r * Math.cos(phi)
    
    // 随机初始速度
    velocities[i3] = (Math.random() - 0.5) * 0.5
    velocities[i3 + 1] = Math.random() * 0.5 + 0.3  // 向上
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.5
    
    // 参数：生命偏移，大小
    params[i2] = Math.random()           // 生命周期偏移
    params[i2 + 1] = 0.5 + Math.random() * 0.5  // 大小
  }
  
  return { positions, velocities, params, count }
}

// ============================================
// 矩阵工具函数（简化版，不依赖 gl-matrix）
// ============================================

export type Mat4 = Float32Array

/**
 * 创建单位矩阵
 */
export function mat4Identity(): Mat4 {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ])
}

/**
 * 创建透视投影矩阵
 */
export function mat4Perspective(fov: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1.0 / Math.tan(fov / 2)
  const nf = 1 / (near - far)
  
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0
  ])
}

/**
 * 创建观察矩阵 (lookAt)
 */
export function mat4LookAt(eye: [number, number, number], center: [number, number, number], up: [number, number, number]): Mat4 {
  const zAxis = normalize([
    eye[0] - center[0],
    eye[1] - center[1],
    eye[2] - center[2]
  ])
  const xAxis = normalize(cross(up, zAxis))
  const yAxis = cross(zAxis, xAxis)
  
  return new Float32Array([
    xAxis[0], yAxis[0], zAxis[0], 0,
    xAxis[1], yAxis[1], zAxis[1], 0,
    xAxis[2], yAxis[2], zAxis[2], 0,
    -dot(xAxis, eye), -dot(yAxis, eye), -dot(zAxis, eye), 1
  ])
}

/**
 * 创建旋转矩阵 (绕Y轴)
 */
export function mat4RotateY(angle: number): Mat4 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  
  return new Float32Array([
    c, 0, s, 0,
    0, 1, 0, 0,
    -s, 0, c, 0,
    0, 0, 0, 1
  ])
}

/**
 * 创建旋转矩阵 (绕X轴)
 */
export function mat4RotateX(angle: number): Mat4 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  
  return new Float32Array([
    1, 0, 0, 0,
    0, c, -s, 0,
    0, s, c, 0,
    0, 0, 0, 1
  ])
}

/**
 * 矩阵乘法
 */
export function mat4Multiply(a: Mat4, b: Mat4): Mat4 {
  const result = new Float32Array(16)
  
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      result[j * 4 + i] = 
        a[i] * b[j * 4] +
        a[i + 4] * b[j * 4 + 1] +
        a[i + 8] * b[j * 4 + 2] +
        a[i + 12] * b[j * 4 + 3]
    }
  }
  
  return result
}

// 辅助函数
function normalize(v: number[]): number[] {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
  return [v[0] / len, v[1] / len, v[2] / len]
}

function cross(a: number[], b: number[]): number[] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ]
}

function dot(a: number[], b: number[] | [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

/**
 * 初始化 3D 渲染场景
 */
export interface WebGL3DContext {
  gl: WebGLRenderingContext
  program: WebGLProgram
  uniforms: Record<string, WebGLUniformLocation | null>
  buffers: {
    position: WebGLBuffer | null
    normal: WebGLBuffer | null
    uv: WebGLBuffer | null
    index: WebGLBuffer | null
  }
  geometry: Geometry3D | null
  particles: ParticleData | null
  vertexCount: number
  isParticleSystem: boolean
}

/**
 * 初始化 3D 场景
 */
export function init3DScene(
  canvas: HTMLCanvasElement,
  vertexSource: string,
  fragmentSource: string,
  geometryType: 'cube' | 'sphere' | 'particles',
  particleCount?: number
): WebGL3DContext | null {
  const gl = canvas.getContext('webgl')
  if (!gl) {
    console.error('WebGL not available')
    return null
  }
  
  // 启用深度测试和混合
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  
  // 创建着色器
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  
  if (!vertexShader || !fragmentShader) return null
  
  // 创建程序
  const program = gl.createProgram()
  if (!program) return null
  
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program))
    return null
  }
  
  gl.useProgram(program)
  
  // 获取 uniform 位置
  const uniformNames = [
    'u_modelMatrix', 'u_viewMatrix', 'u_projectionMatrix', 'u_modelViewProjection',
    'u_time', 'u_resolution', 'u_mouse', 'u_model'
  ]
  const uniforms: Record<string, WebGLUniformLocation | null> = {}
  for (const name of uniformNames) {
    uniforms[name] = gl.getUniformLocation(program, name)
  }
  
  // 创建几何体
  let geometry: Geometry3D | null = null
  let particles: ParticleData | null = null
  let vertexCount = 0
  const isParticleSystem = geometryType === 'particles'
  
  if (geometryType === 'cube') {
    geometry = createCube(1.5)
    vertexCount = geometry.vertexCount
  } else if (geometryType === 'sphere') {
    geometry = createSphere(1.2, 64, 48)
    vertexCount = geometry.vertexCount
  } else if (geometryType === 'particles') {
    particles = createParticles(particleCount || 2000)
    vertexCount = particles.count
  }
  
  // 创建缓冲区
  const buffers = {
    position: gl.createBuffer(),
    normal: gl.createBuffer(),
    uv: gl.createBuffer(),
    index: gl.createBuffer()
  }
  
  // 设置属性
  if (geometry) {
    // 位置
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
    gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW)
    const posLoc = gl.getAttribLocation(program, 'a_position')
    if (posLoc >= 0) {
      gl.enableVertexAttribArray(posLoc)
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0)
    }
    
    // 法线
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal)
    gl.bufferData(gl.ARRAY_BUFFER, geometry.normals, gl.STATIC_DRAW)
    const normalLoc = gl.getAttribLocation(program, 'a_normal')
    if (normalLoc >= 0) {
      gl.enableVertexAttribArray(normalLoc)
      gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0)
    }
    
    // UV
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uv)
    gl.bufferData(gl.ARRAY_BUFFER, geometry.uvs, gl.STATIC_DRAW)
    const uvLoc = gl.getAttribLocation(program, 'a_uv')
    if (uvLoc >= 0) {
      gl.enableVertexAttribArray(uvLoc)
      gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0)
    }
    
    // 索引
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW)
  } else if (particles) {
    // 粒子位置
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
    gl.bufferData(gl.ARRAY_BUFFER, particles.positions, gl.STATIC_DRAW)
    const posLoc = gl.getAttribLocation(program, 'a_position')
    if (posLoc >= 0) {
      gl.enableVertexAttribArray(posLoc)
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0)
    }
    
    // 粒子速度
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal)
    gl.bufferData(gl.ARRAY_BUFFER, particles.velocities, gl.STATIC_DRAW)
    const velLoc = gl.getAttribLocation(program, 'a_velocity')
    if (velLoc >= 0) {
      gl.enableVertexAttribArray(velLoc)
      gl.vertexAttribPointer(velLoc, 3, gl.FLOAT, false, 0, 0)
    }
    
    // 粒子参数
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uv)
    gl.bufferData(gl.ARRAY_BUFFER, particles.params, gl.STATIC_DRAW)
    const paramLoc = gl.getAttribLocation(program, 'a_params')
    if (paramLoc >= 0) {
      gl.enableVertexAttribArray(paramLoc)
      gl.vertexAttribPointer(paramLoc, 2, gl.FLOAT, false, 0, 0)
    }
  }
  
  return {
    gl,
    program,
    uniforms,
    buffers,
    geometry,
    particles,
    vertexCount,
    isParticleSystem
  }
}

/**
 * 渲染 3D 场景
 */
export function render3DScene(
  ctx: WebGL3DContext,
  time: number,
  mousePos: { x: number; y: number },
  canvas: HTMLCanvasElement
): void {
  const { gl, uniforms, geometry, vertexCount, isParticleSystem } = ctx
  
  // 调整视口
  const dpr = window.devicePixelRatio
  const width = canvas.clientWidth * dpr
  const height = canvas.clientHeight * dpr
  
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
    gl.viewport(0, 0, width, height)
  }
  
  // 清除
  gl.clearColor(0.05, 0.05, 0.08, 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  
  // 计算矩阵
  const aspect = width / height
  const projection = mat4Perspective(Math.PI / 4, aspect, 0.1, 100)
  const view = mat4LookAt([0, 0, 4], [0, 0, 0], [0, 1, 0])
  
  // 模型矩阵（旋转动画）
  const rotY = mat4RotateY(time * 0.5)
  const rotX = mat4RotateX(time * 0.3)
  const model = mat4Multiply(rotY, rotX)
  
  // MVP 矩阵
  const mvp = mat4Multiply(projection, mat4Multiply(view, model))
  
  // 设置 uniform
  if (uniforms.u_modelMatrix) gl.uniformMatrix4fv(uniforms.u_modelMatrix, false, model)
  if (uniforms.u_model) gl.uniformMatrix4fv(uniforms.u_model, false, model)
  if (uniforms.u_viewMatrix) gl.uniformMatrix4fv(uniforms.u_viewMatrix, false, view)
  if (uniforms.u_projectionMatrix) gl.uniformMatrix4fv(uniforms.u_projectionMatrix, false, projection)
  if (uniforms.u_modelViewProjection) gl.uniformMatrix4fv(uniforms.u_modelViewProjection, false, mvp)
  if (uniforms.u_time) gl.uniform1f(uniforms.u_time, time)
  if (uniforms.u_resolution) gl.uniform2f(uniforms.u_resolution, width, height)
  if (uniforms.u_mouse) gl.uniform2f(uniforms.u_mouse, mousePos.x, mousePos.y)
  
  // 绘制
  if (isParticleSystem) {
    gl.drawArrays(gl.POINTS, 0, vertexCount)
  } else if (geometry) {
    gl.drawElements(gl.TRIANGLES, vertexCount, gl.UNSIGNED_SHORT, 0)
  }
}

/**
 * 编译着色器
 */
function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  
  return shader
}
