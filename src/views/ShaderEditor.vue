<template>
  <div class="shader-editor">
    <!-- 返回按钮 -->
    <router-link to="/" class="back-btn">
      <span class="back-icon">←</span>
      <span>返回首页</span>
    </router-link>

    <div class="editor-header">
      <h1 class="editor-title">
        <span class="title-icon">⚡</span>
        Shader 在线编辑器
      </h1>
      <p class="editor-desc">实时编辑和预览你的 GLSL 代码</p>
    </div>

    <div class="editor-main">
      <!-- 左侧：代码编辑区 -->
      <div class="code-section">
        <div class="code-tabs">
          <button 
            :class="['tab-btn', { active: activeTab === 'vertex' }]"
            @click="activeTab = 'vertex'"
          >
            顶点着色器
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'fragment' }]"
            @click="activeTab = 'fragment'"
          >
            片段着色器
          </button>
        </div>

        <div class="code-editor-wrapper">
          <textarea
            v-show="activeTab === 'vertex'"
            v-model="vertexCode"
            class="code-textarea"
            spellcheck="false"
            @input="debouncedCompile"
          ></textarea>
          <textarea
            v-show="activeTab === 'fragment'"
            v-model="fragmentCode"
            class="code-textarea"
            spellcheck="false"
            @input="debouncedCompile"
          ></textarea>
        </div>

        <!-- 错误提示 -->
        <div v-if="error" class="error-panel">
          <span class="error-icon">⚠</span>
          <pre class="error-text">{{ error }}</pre>
        </div>

        <!-- 操作按钮 -->
        <div class="action-bar">
          <button class="action-btn primary" @click="compileShader">
            <span>▶</span> 运行
          </button>
          <button class="action-btn" @click="resetCode">
            <span>↺</span> 重置
          </button>
          <select v-model="selectedTemplate" @change="loadTemplate" class="template-select">
            <option value="">选择模板...</option>
            <option value="basic">基础模板</option>
            <option value="gradient">渐变效果</option>
            <option value="wave">波浪动画</option>
            <option value="noise">噪声纹理</option>
            <option value="3d-cube">3D 立方体</option>
            <option value="3d-sphere">3D 球体</option>
            <option value="particles">粒子系统</option>
          </select>
        </div>
      </div>

      <!-- 右侧：预览区 -->
      <div class="preview-section">
        <div class="canvas-wrapper">
          <canvas ref="previewCanvas" class="preview-canvas"></canvas>
          <div class="stats-overlay">
            <span>时间: {{ displayTime.toFixed(2) }}s</span>
            <span>FPS: {{ fps }}</span>
          </div>
        </div>

        <!-- Uniform 控制面板 -->
        <div class="controls-panel">
          <h3>参数控制</h3>
          <div class="control-item">
            <label>时间速度</label>
            <input type="range" v-model.number="timeSpeed" min="0" max="3" step="0.1" />
            <span class="control-value">{{ timeSpeed.toFixed(1) }}x</span>
          </div>
          <div class="control-item">
            <label>鼠标交互</label>
            <span class="control-hint">移动鼠标到画布上</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

// 状态
const previewCanvas = ref<HTMLCanvasElement | null>(null)
const activeTab = ref('fragment')
const selectedTemplate = ref('')
const error = ref('')
const displayTime = ref(0)
const fps = ref(60)
const timeSpeed = ref(1.0)

// WebGL 相关
let gl: WebGLRenderingContext | null = null
let program: WebGLProgram | null = null
let animationId: number | null = null
let startTime = Date.now()
let frameCount = 0
let lastFpsUpdate = Date.now()

// 鼠标位置
const mousePos = ref({ x: 0.5, y: 0.5 })

// 默认代码
const defaultVertex = `attribute vec2 a_position;
varying vec2 v_uv;

void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}`

const defaultFragment = `precision mediump float;
varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

void main() {
    vec2 uv = v_uv;
    
    // 创建简单的渐变效果
    vec3 color = vec3(uv.x, uv.y, 0.5 + 0.5 * sin(u_time));
    
    // 添加鼠标交互
    float dist = length(uv - u_mouse);
    color += vec3(0.0, 0.5, 0.5) * (1.0 - smoothstep(0.0, 0.2, dist));
    
    gl_FragColor = vec4(color, 1.0);
}`

const vertexCode = ref(defaultVertex)
const fragmentCode = ref(defaultFragment)

// 模板代码
const templates: Record<string, { vertex: string; fragment: string }> = {
  basic: {
    vertex: defaultVertex,
    fragment: defaultFragment
  },
  gradient: {
    vertex: defaultVertex,
    fragment: `precision mediump float;
varying vec2 v_uv;
uniform float u_time;

void main() {
    vec2 uv = v_uv;
    
    // 动态彩虹渐变
    vec3 color;
    color.r = sin(uv.x * 6.28 + u_time) * 0.5 + 0.5;
    color.g = sin(uv.y * 6.28 + u_time + 2.094) * 0.5 + 0.5;
    color.b = sin((uv.x + uv.y) * 3.14 + u_time + 4.188) * 0.5 + 0.5;
    
    gl_FragColor = vec4(color, 1.0);
}`
  },
  wave: {
    vertex: defaultVertex,
    fragment: `precision mediump float;
varying vec2 v_uv;
uniform float u_time;

void main() {
    vec2 uv = v_uv;
    
    // 多层波浪叠加
    float wave = 0.0;
    wave += sin(uv.x * 10.0 + u_time * 2.0) * 0.5;
    wave += sin(uv.x * 20.0 - u_time * 3.0) * 0.25;
    wave += sin(uv.x * 5.0 + u_time) * 0.25;
    
    wave = wave * 0.15 + 0.5;
    
    // 波浪颜色
    float inWave = step(uv.y, wave);
    vec3 waveColor = mix(vec3(0.0, 0.3, 0.5), vec3(0.0, 0.8, 0.9), uv.y);
    vec3 skyColor = mix(vec3(0.1, 0.1, 0.2), vec3(0.3, 0.2, 0.4), uv.y);
    
    vec3 color = mix(skyColor, waveColor, inWave);
    
    gl_FragColor = vec4(color, 1.0);
}`
  },
  noise: {
    vertex: defaultVertex,
    fragment: `precision highp float;
varying vec2 v_uv;
uniform float u_time;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for(int i = 0; i < 5; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 uv = v_uv * 4.0;
    float n = fbm(uv + u_time * 0.3);
    
    vec3 color1 = vec3(0.1, 0.0, 0.2);
    vec3 color2 = vec3(0.0, 0.8, 0.8);
    vec3 color = mix(color1, color2, n);
    
    gl_FragColor = vec4(color, 1.0);
}`
  },
  '3d-cube': {
    vertex: `attribute vec3 a_position;
attribute vec3 a_normal;
uniform mat4 u_modelViewProjection;
uniform mat4 u_model;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_position;

void main() {
    // 顶点变形动画
    vec3 pos = a_position;
    pos += a_normal * sin(u_time * 2.0 + a_position.x * 3.0) * 0.1;
    
    v_normal = mat3(u_model) * a_normal;
    v_position = (u_model * vec4(pos, 1.0)).xyz;
    gl_Position = u_modelViewProjection * vec4(pos, 1.0);
}`,
    fragment: `precision mediump float;
varying vec3 v_normal;
varying vec3 v_position;
uniform float u_time;

void main() {
    vec3 normal = normalize(v_normal);
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    
    // 漫反射
    float diff = max(dot(normal, lightDir), 0.0);
    
    // 基础颜色
    vec3 baseColor = vec3(0.0, 0.8, 0.8);
    
    // 菲涅尔边缘光
    vec3 viewDir = normalize(-v_position);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
    
    vec3 color = baseColor * (0.3 + diff * 0.7);
    color += vec3(0.5, 0.2, 0.8) * fresnel;
    
    gl_FragColor = vec4(color, 1.0);
}`
  },
  '3d-sphere': {
    vertex: `attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_uv;
uniform mat4 u_modelViewProjection;
uniform mat4 u_model;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_position;
varying vec2 v_uv;

void main() {
    vec3 pos = a_position;
    
    // 球体表面波动
    float wave = sin(a_uv.x * 20.0 + u_time * 3.0) * 
                 sin(a_uv.y * 20.0 + u_time * 2.0) * 0.05;
    pos += a_normal * wave;
    
    v_normal = mat3(u_model) * a_normal;
    v_position = (u_model * vec4(pos, 1.0)).xyz;
    v_uv = a_uv;
    gl_Position = u_modelViewProjection * vec4(pos, 1.0);
}`,
    fragment: `precision mediump float;
varying vec3 v_normal;
varying vec3 v_position;
varying vec2 v_uv;
uniform float u_time;

void main() {
    vec3 normal = normalize(v_normal);
    vec3 lightDir = normalize(vec3(sin(u_time), 1.0, cos(u_time)));
    
    float diff = max(dot(normal, lightDir), 0.0);
    float spec = pow(max(dot(reflect(-lightDir, normal), normalize(-v_position)), 0.0), 32.0);
    
    // 动态颜色
    vec3 color1 = vec3(0.0, 0.6, 0.8);
    vec3 color2 = vec3(0.8, 0.2, 0.5);
    vec3 baseColor = mix(color1, color2, sin(v_uv.y * 6.28 + u_time) * 0.5 + 0.5);
    
    vec3 color = baseColor * (0.2 + diff * 0.6) + vec3(1.0) * spec;
    
    // 菲涅尔
    float fresnel = pow(1.0 - max(dot(normal, normalize(-v_position)), 0.0), 2.0);
    color += vec3(0.3, 0.5, 1.0) * fresnel * 0.5;
    
    gl_FragColor = vec4(color, 1.0);
}`
  },
  particles: {
    vertex: `attribute vec3 a_position;
attribute vec3 a_velocity;
attribute float a_life;
uniform mat4 u_modelViewProjection;
uniform float u_time;
varying float v_life;
varying vec3 v_color;

void main() {
    // 粒子运动
    vec3 pos = a_position + a_velocity * mod(u_time + a_life * 10.0, 5.0);
    
    // 循环
    pos.y = mod(pos.y + 2.0, 4.0) - 2.0;
    
    v_life = fract(a_life + u_time * 0.2);
    
    // 根据生命值变色
    v_color = mix(vec3(1.0, 0.3, 0.1), vec3(1.0, 0.8, 0.2), v_life);
    
    gl_Position = u_modelViewProjection * vec4(pos, 1.0);
    gl_PointSize = (1.0 - v_life * 0.5) * 10.0;
}`,
    fragment: `precision mediump float;
varying float v_life;
varying vec3 v_color;

void main() {
    // 圆形粒子
    vec2 coord = gl_PointCoord * 2.0 - 1.0;
    float r = length(coord);
    if (r > 1.0) discard;
    
    float alpha = (1.0 - r) * (1.0 - v_life * 0.5);
    vec3 color = v_color * (1.0 + (1.0 - r) * 0.5);
    
    gl_FragColor = vec4(color, alpha);
}`
  }
}

// 加载模板
const loadTemplate = () => {
  if (selectedTemplate.value && templates[selectedTemplate.value]) {
    const template = templates[selectedTemplate.value]
    vertexCode.value = template.vertex
    fragmentCode.value = template.fragment
    compileShader()
    selectedTemplate.value = ''
  }
}

// 重置代码
const resetCode = () => {
  vertexCode.value = defaultVertex
  fragmentCode.value = defaultFragment
  compileShader()
}

// 创建着色器
const createShader = (type: number, source: string): WebGLShader | null => {
  if (!gl) return null
  const shader = gl.createShader(type)
  if (!shader) return null
  
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(info || '着色器编译失败')
  }
  
  return shader
}

// 编译 Shader
const compileShader = () => {
  if (!gl || !previewCanvas.value) return
  
  error.value = ''
  
  try {
    // 创建着色器
    const vertShader = createShader(gl.VERTEX_SHADER, vertexCode.value)
    const fragShader = createShader(gl.FRAGMENT_SHADER, fragmentCode.value)
    
    if (!vertShader || !fragShader) {
      throw new Error('着色器创建失败')
    }
    
    // 创建程序
    const newProgram = gl.createProgram()
    if (!newProgram) throw new Error('程序创建失败')
    
    gl.attachShader(newProgram, vertShader)
    gl.attachShader(newProgram, fragShader)
    gl.linkProgram(newProgram)
    
    if (!gl.getProgramParameter(newProgram, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(newProgram)
      gl.deleteProgram(newProgram)
      throw new Error(info || '程序链接失败')
    }
    
    // 删除旧程序
    if (program) {
      gl.deleteProgram(program)
    }
    program = newProgram
    
    // 设置顶点数据
    setupGeometry()
    
  } catch (e) {
    error.value = (e as Error).message
  }
}

// 设置几何体
const setupGeometry = () => {
  if (!gl || !program) return
  
  const positions = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
     1,  1
  ])
  
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
  
  const positionLoc = gl.getAttribLocation(program, 'a_position')
  if (positionLoc >= 0) {
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)
  }
}

// 防抖编译
let compileTimeout: number | null = null
const debouncedCompile = () => {
  if (compileTimeout) {
    clearTimeout(compileTimeout)
  }
  compileTimeout = window.setTimeout(() => {
    compileShader()
  }, 500)
}

// 渲染循环
const render = () => {
  if (!gl || !program || !previewCanvas.value) {
    animationId = requestAnimationFrame(render)
    return
  }
  
  const canvas = previewCanvas.value
  
  // 更新 canvas 尺寸
  const dpr = window.devicePixelRatio
  const width = canvas.clientWidth * dpr
  const height = canvas.clientHeight * dpr
  
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
    gl.viewport(0, 0, width, height)
  }
  
  // 计算时间
  const currentTime = (Date.now() - startTime) / 1000 * timeSpeed.value
  displayTime.value = currentTime
  
  // 计算 FPS
  frameCount++
  const now = Date.now()
  if (now - lastFpsUpdate > 1000) {
    fps.value = Math.round(frameCount * 1000 / (now - lastFpsUpdate))
    frameCount = 0
    lastFpsUpdate = now
  }
  
  // 使用程序
  gl.useProgram(program)
  
  // 设置 uniforms
  const timeLoc = gl.getUniformLocation(program, 'u_time')
  const resLoc = gl.getUniformLocation(program, 'u_resolution')
  const mouseLoc = gl.getUniformLocation(program, 'u_mouse')
  
  if (timeLoc) gl.uniform1f(timeLoc, currentTime)
  if (resLoc) gl.uniform2f(resLoc, canvas.width, canvas.height)
  if (mouseLoc) gl.uniform2f(mouseLoc, mousePos.value.x, mousePos.value.y)
  
  // 清除并绘制
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  
  animationId = requestAnimationFrame(render)
}

// 鼠标移动处理
const handleMouseMove = (e: MouseEvent) => {
  const canvas = previewCanvas.value
  if (!canvas) return
  
  const rect = canvas.getBoundingClientRect()
  mousePos.value = {
    x: (e.clientX - rect.left) / rect.width,
    y: 1.0 - (e.clientY - rect.top) / rect.height
  }
}

// 初始化
onMounted(() => {
  const canvas = previewCanvas.value
  if (!canvas) return
  
  gl = canvas.getContext('webgl')
  if (!gl) {
    error.value = 'WebGL 不可用'
    return
  }
  
  // 初始编译
  compileShader()
  
  // 开始渲染
  render()
  
  // 监听鼠标
  canvas.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (compileTimeout) {
    clearTimeout(compileTimeout)
  }
})
</script>

<style scoped>
.shader-editor {
  padding: 24px 40px 60px;
  max-width: 1800px;
  margin: 0 auto;
  min-height: 100vh;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 24px;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: var(--bg-card);
  color: var(--neon-cyan);
}

.editor-header {
  margin-bottom: 32px;
  text-align: center;
}

.editor-title {
  font-size: 2.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 12px;
}

.title-icon {
  font-size: 2rem;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.editor-desc {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.editor-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  min-height: 600px;
}

/* 代码区 */
.code-section {
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.code-tabs {
  display: flex;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.tab-btn {
  flex: 1;
  padding: 14px 20px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.tab-btn.active {
  color: var(--neon-cyan);
  background: var(--bg-card);
  border-bottom: 2px solid var(--neon-cyan);
}

.code-editor-wrapper {
  flex: 1;
  min-height: 400px;
}

.code-textarea {
  width: 100%;
  height: 100%;
  min-height: 400px;
  padding: 20px;
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: none;
  resize: none;
  outline: none;
  tab-size: 4;
}

.code-textarea:focus {
  box-shadow: inset 0 0 0 1px var(--neon-cyan);
}

/* 错误面板 */
.error-panel {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(255, 100, 100, 0.1);
  border-top: 1px solid rgba(255, 100, 100, 0.3);
}

.error-icon {
  font-size: 1.2rem;
  color: #ff6b6b;
}

.error-text {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 13px;
  color: #ff6b6b;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

/* 操作栏 */
.action-bar {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: var(--bg-tertiary);
  border-top: 1px solid var(--border-color);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-weight: 500;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.action-btn:hover {
  border-color: var(--neon-cyan);
  color: var(--neon-cyan);
}

.action-btn.primary {
  background: var(--gradient-primary);
  color: var(--bg-primary);
  border: none;
}

.action-btn.primary:hover {
  box-shadow: var(--glow-cyan);
}

.template-select {
  flex: 1;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  font-family: var(--font-sans);
  cursor: pointer;
}

.template-select:hover {
  border-color: var(--neon-purple);
}

/* 预览区 */
.preview-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.canvas-wrapper {
  position: relative;
  flex: 1;
  min-height: 400px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.preview-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.stats-overlay {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* 控制面板 */
.controls-panel {
  padding: 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.controls-panel h3 {
  font-size: 1rem;
  color: var(--neon-cyan);
  margin-bottom: 16px;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.control-item label {
  min-width: 80px;
  font-weight: 500;
  color: var(--text-secondary);
}

.control-item input[type="range"] {
  flex: 1;
  accent-color: var(--neon-cyan);
}

.control-value {
  min-width: 40px;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: var(--neon-cyan);
}

.control-hint {
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* 响应式 */
@media (max-width: 1200px) {
  .editor-main {
    grid-template-columns: 1fr;
  }
  
  .code-editor-wrapper {
    min-height: 300px;
  }
  
  .code-textarea {
    min-height: 300px;
  }
}

@media (max-width: 768px) {
  .shader-editor {
    padding: 16px 20px 40px;
  }
  
  .editor-title {
    font-size: 1.8rem;
  }
  
  .action-bar {
    flex-wrap: wrap;
  }
  
  .template-select {
    width: 100%;
  }
}
</style>
