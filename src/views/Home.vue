<template>
  <div class="home">
    <!-- 英雄区域 -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="line-1">探索</span>
          <span class="line-2">WebGL <span class="gradient-text">Shader</span></span>
          <span class="line-3">的艺术世界</span>
        </h1>
        <p class="hero-desc">
          从零开始学习着色器编程，通过精心设计的交互式示例，
          掌握GPU图形编程的核心技术。每个示例都配有详细的代码解析与原理说明。
        </p>
        <div class="hero-stats">
          <div class="stat">
            <span class="stat-number">{{ shaders.length }}</span>
            <span class="stat-label">个示例</span>
          </div>
          <div class="stat">
            <span class="stat-number">3</span>
            <span class="stat-label">个难度级别</span>
          </div>
          <div class="stat">
            <span class="stat-number">∞</span>
            <span class="stat-label">种可能</span>
          </div>
        </div>
      </div>
      <div class="hero-visual">
        <canvas ref="heroCanvas" class="hero-canvas"></canvas>
      </div>
    </section>

    <!-- 难度筛选 -->
    <section class="filter-section">
      <div class="container">
        <div class="filter-tabs">
          <button 
            v-for="level in levels" 
            :key="level.id"
            :class="['filter-tab', { active: currentLevel === level.id }]"
            @click="currentLevel = level.id"
          >
            <span class="tab-icon">{{ level.icon }}</span>
            <span class="tab-text">{{ level.name }}</span>
            <span class="tab-count">{{ getShaderCount(level.id) }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Shader 网格展示 -->
    <section class="shaders-section">
      <div class="container">
        <div class="shaders-grid">
          <router-link 
            v-for="(shader, index) in filteredShaders" 
            :key="shader.id"
            :to="`/shader/${shader.id}`"
            class="shader-card"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="card-preview">
              <canvas :ref="el => initCardCanvas(el, shader)" class="card-canvas"></canvas>
              <div class="card-overlay">
                <span class="view-btn">查看详情 →</span>
              </div>
            </div>
            <div class="card-content">
              <div class="card-header">
                <span :class="['difficulty-badge', shader.level]">
                  {{ getLevelName(shader.level) }}
                </span>
                <span class="card-number">#{{ String(index + 1).padStart(2, '0') }}</span>
              </div>
              <h3 class="card-title">{{ shader.title }}</h3>
              <p class="card-desc">{{ shader.description }}</p>
              <div class="card-tags">
                <span v-for="tag in shader.tags" :key="tag" class="tag">{{ tag }}</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </section>

    <!-- 学习路径 -->
    <section class="learning-path">
      <div class="container">
        <h2 class="section-title">
          <span class="title-icon">◈</span>
          学习路径
        </h2>
        <div class="path-timeline">
          <div class="path-item" v-for="(step, index) in learningPath" :key="index">
            <div class="path-marker">{{ index + 1 }}</div>
            <div class="path-content">
              <h3>{{ step.title }}</h3>
              <p>{{ step.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { shaders } from '../data/shaders'
import { initPreviewShader } from '../utils/webgl'

const heroCanvas = ref(null)
const currentLevel = ref('all')
let heroAnimationId = null
const cardCanvases = new Map()

const levels = [
  { id: 'all', name: '全部', icon: '◎' },
  { id: 'basic', name: '基础', icon: '●' },
  { id: 'intermediate', name: '中级', icon: '◉' },
  { id: 'advanced', name: '高级', icon: '◈' }
]

const learningPath = [
  { title: '理解基础概念', description: '学习顶点着色器和片段着色器的基本原理，了解GPU渲染管线的工作流程。' },
  { title: '掌握GLSL语法', description: '熟悉着色器语言的数据类型、内置函数和数学运算，为复杂效果打下基础。' },
  { title: '实践简单效果', description: '从纯色、渐变开始，逐步实现条纹、棋盘格等基础图案效果。' },
  { title: '探索进阶技术', description: '学习噪声算法、动画原理、光照模型等核心技术，创造更丰富的视觉效果。' },
  { title: '挑战高级特效', description: '综合运用所学知识，实现粒子系统、后处理效果等专业级shader特效。' }
]

const filteredShaders = computed(() => {
  if (currentLevel.value === 'all') return shaders
  return shaders.filter(s => s.level === currentLevel.value)
})

const getShaderCount = (level) => {
  if (level === 'all') return shaders.length
  return shaders.filter(s => s.level === level).length
}

const getLevelName = (level) => {
  const map = { basic: '基础', intermediate: '中级', advanced: '高级' }
  return map[level] || level
}

// 初始化卡片预览canvas
const initCardCanvas = (el, shader) => {
  if (el && !cardCanvases.has(shader.id)) {
    cardCanvases.set(shader.id, el)
    // 延迟初始化预览
    setTimeout(() => {
      initPreviewShader(el, shader.id)
    }, 100)
  }
}

// 初始化英雄区域的shader
const initHeroShader = () => {
  const canvas = heroCanvas.value
  if (!canvas) return
  
  const gl = canvas.getContext('webgl')
  if (!gl) return
  
  // 设置canvas尺寸
  const resize = () => {
    canvas.width = canvas.clientWidth * window.devicePixelRatio
    canvas.height = canvas.clientHeight * window.devicePixelRatio
    gl.viewport(0, 0, canvas.width, canvas.height)
  }
  resize()
  window.addEventListener('resize', resize)
  
  // 英雄区域的酷炫shader
  const vertexShaderSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `
  
  const fragmentShaderSource = `
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_time;
    
    // 噪声函数
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
      vec2 uv = gl_FragCoord.xy / u_resolution;
      vec2 p = uv * 3.0;
      
      float t = u_time * 0.3;
      
      // 创建流动的噪声
      float n1 = fbm(p + vec2(t, 0.0));
      float n2 = fbm(p + vec2(0.0, t) + n1);
      float n3 = fbm(p + n2);
      
      // 颜色混合
      vec3 color1 = vec3(0.0, 1.0, 0.96); // cyan
      vec3 color2 = vec3(0.616, 0.306, 0.867); // purple  
      vec3 color3 = vec3(1.0, 0.0, 1.0); // pink
      
      vec3 color = mix(color1, color2, n2);
      color = mix(color, color3, n3 * 0.5);
      
      // 添加光晕效果
      float glow = smoothstep(0.4, 0.0, length(uv - 0.5));
      color += glow * 0.3;
      
      // 暗角效果
      float vignette = 1.0 - length(uv - 0.5) * 0.8;
      color *= vignette;
      
      gl_FragColor = vec4(color * 0.6, 1.0);
    }
  `
  
  // 创建着色器
  const createShader = (type, source) => {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    return shader
  }
  
  const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource)
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource)
  
  const program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  gl.useProgram(program)
  
  // 创建顶点缓冲
  const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
  
  const positionLocation = gl.getAttribLocation(program, 'a_position')
  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
  
  const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
  const timeLocation = gl.getUniformLocation(program, 'u_time')
  
  // 动画循环
  const startTime = Date.now()
  const animate = () => {
    const time = (Date.now() - startTime) / 1000
    
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
    gl.uniform1f(timeLocation, time)
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    heroAnimationId = requestAnimationFrame(animate)
  }
  animate()
}

onMounted(() => {
  initHeroShader()
})

onUnmounted(() => {
  if (heroAnimationId) {
    cancelAnimationFrame(heroAnimationId)
  }
})
</script>

<style scoped>
.home {
  min-height: 100vh;
}

/* 英雄区域 */
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  padding: 80px 60px;
  min-height: 80vh;
  align-items: center;
}

.hero-content {
  animation: fade-in 0.8s ease-out;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 24px;
}

.hero-title .line-1 {
  display: block;
  color: var(--text-secondary);
  font-size: 1.5rem;
  font-weight: 400;
  margin-bottom: 8px;
}

.hero-title .line-2 {
  display: block;
}

.hero-title .line-3 {
  display: block;
  font-size: 2rem;
  color: var(--text-secondary);
  font-weight: 400;
}

.gradient-text {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-desc {
  font-size: 1.1rem;
  color: var(--text-secondary);
  line-height: 1.8;
  margin-bottom: 40px;
  max-width: 500px;
}

.hero-stats {
  display: flex;
  gap: 40px;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  font-family: var(--font-mono);
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.hero-visual {
  position: relative;
  animation: slide-in-right 0.8s ease-out;
}

.hero-canvas {
  width: 100%;
  height: 500px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  box-shadow: var(--glow-purple);
}

/* 筛选区域 */
.filter-section {
  padding: 40px 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  background: rgba(18, 18, 26, 0.5);
}

.filter-tabs {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border-radius: var(--radius-lg);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-weight: 500;
  border: 1px solid transparent;
}

.filter-tab:hover {
  border-color: var(--neon-cyan);
  color: var(--neon-cyan);
}

.filter-tab.active {
  background: linear-gradient(135deg, rgba(0, 255, 245, 0.2), rgba(157, 78, 221, 0.2));
  border-color: var(--neon-cyan);
  color: var(--neon-cyan);
  box-shadow: var(--glow-cyan);
}

.tab-icon {
  font-size: 0.9rem;
}

.tab-count {
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 0.8rem;
  font-family: var(--font-mono);
}

/* Shader 网格 */
.shaders-section {
  padding: 80px 0;
}

.shaders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 32px;
}

.shader-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-color);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fade-in 0.6s ease-out backwards;
  color: var(--text-primary);
}

.shader-card:hover {
  transform: translateY(-8px);
  border-color: var(--neon-cyan);
  box-shadow: var(--glow-cyan);
  color: var(--text-primary);
  text-shadow: none;
}

.card-preview {
  position: relative;
  height: 220px;
  overflow: hidden;
}

.card-canvas {
  width: 100%;
  height: 100%;
  background: var(--bg-tertiary);
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.shader-card:hover .card-overlay {
  opacity: 1;
}

.view-btn {
  padding: 12px 24px;
  background: var(--gradient-primary);
  border-radius: var(--radius-md);
  font-weight: 600;
  color: var(--bg-primary);
}

.card-content {
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.difficulty-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.difficulty-badge.basic {
  background: rgba(0, 245, 212, 0.2);
  color: var(--neon-green);
}

.difficulty-badge.intermediate {
  background: rgba(255, 214, 10, 0.2);
  color: var(--neon-yellow);
}

.difficulty-badge.advanced {
  background: rgba(255, 0, 255, 0.2);
  color: var(--neon-pink);
}

.card-number {
  font-family: var(--font-mono);
  color: var(--text-muted);
  font-size: 0.85rem;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.card-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 16px;
}

.card-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

/* 学习路径 */
.learning-path {
  padding: 80px 0;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 2rem;
  margin-bottom: 48px;
  justify-content: center;
}

.title-icon {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.path-timeline {
  max-width: 800px;
  margin: 0 auto;
}

.path-item {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
  position: relative;
}

.path-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 50px;
  width: 2px;
  height: calc(100% + 12px);
  background: linear-gradient(180deg, var(--neon-cyan), var(--neon-purple));
}

.path-marker {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--bg-primary);
  flex-shrink: 0;
}

.path-content {
  flex: 1;
  padding: 16px 24px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.path-content h3 {
  font-size: 1.1rem;
  margin-bottom: 8px;
  color: var(--neon-cyan);
}

.path-content p {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

/* 响应式 */
@media (max-width: 1024px) {
  .hero {
    grid-template-columns: 1fr;
    gap: 40px;
    padding: 60px 40px;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-canvas {
    height: 350px;
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 40px 20px;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-stats {
    gap: 24px;
  }
  
  .stat-number {
    font-size: 1.8rem;
  }
  
  .shaders-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-tabs {
    gap: 8px;
  }
  
  .filter-tab {
    padding: 10px 16px;
  }
}
</style>
