<template>
  <div class="shader-demo" v-if="shader">
    <!-- 返回按钮 -->
    <router-link to="/" class="back-btn">
      <span class="back-icon">←</span>
      <span>返回列表</span>
    </router-link>
    
    <!-- 标题区域 -->
    <header class="demo-header">
      <div class="header-info">
        <span :class="['level-badge', shader.level]">{{ levelName }}</span>
        <h1 class="demo-title">{{ shader.title }}</h1>
        <p class="demo-desc">{{ shader.description }}</p>
        <div class="demo-tags">
          <span v-for="tag in shader.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>
    </header>
    
    <!-- 主内容区 -->
    <div class="demo-content">
      <!-- 左侧：渲染区域 -->
      <div class="render-section">
        <div class="canvas-wrapper">
          <canvas ref="shaderCanvas" class="shader-canvas"></canvas>
          
          <!-- 控制面板 -->
          <div class="controls-overlay">
            <button 
              class="control-btn" 
              @click="togglePlay"
              :title="isPlaying ? '暂停' : '播放'"
            >
              {{ isPlaying ? '⏸' : '▶' }}
            </button>
            <button 
              class="control-btn" 
              @click="resetTime"
              title="重置时间"
            >
              ↺
            </button>
            <button 
              class="control-btn" 
              @click="toggleFullscreen"
              title="全屏"
            >
              ⛶
            </button>
          </div>
          
          <!-- 状态信息 -->
          <div class="stats-overlay">
            <span>时间: {{ displayTime.toFixed(2) }}s</span>
            <span v-if="hasMouse">鼠标: {{ mousePos.x.toFixed(2) }}, {{ mousePos.y.toFixed(2) }}</span>
          </div>
        </div>
        
        <!-- 参数控制（如果有） -->
        <div class="params-panel" v-if="hasParams">
          <h3>参数调节</h3>
          <div class="param-item" v-if="hasMouse">
            <label>鼠标交互</label>
            <span class="param-hint">移动鼠标到画布上</span>
          </div>
        </div>
      </div>
      
      <!-- 右侧：代码和讲解 -->
      <div class="info-section">
        <div class="tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            :class="['tab-btn', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            {{ tab.name }}
          </button>
        </div>
        
        <div class="tab-content">
          <!-- 顶点着色器 -->
          <div v-show="activeTab === 'vertex'" class="code-panel">
            <div class="code-header">
              <span class="code-title">顶点着色器 (Vertex Shader)</span>
              <button class="copy-btn" @click="copyCode(shader.vertexShader)">
                {{ copied === 'vertex' ? '✓ 已复制' : '复制代码' }}
              </button>
            </div>
            <pre class="code-block"><code v-html="highlightedVertex"></code></pre>
          </div>
          
          <!-- 片段着色器 -->
          <div v-show="activeTab === 'fragment'" class="code-panel">
            <div class="code-header">
              <span class="code-title">片段着色器 (Fragment Shader)</span>
              <button class="copy-btn" @click="copyCode(shader.fragmentShader)">
                {{ copied === 'fragment' ? '✓ 已复制' : '复制代码' }}
              </button>
            </div>
            <pre class="code-block"><code v-html="highlightedFragment"></code></pre>
          </div>
          
          <!-- 讲解文档 -->
          <div v-show="activeTab === 'explanation'" class="explanation-panel">
            <div class="markdown-content" v-html="renderedExplanation"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部导航 -->
    <nav class="demo-nav">
      <router-link 
        v-if="prevShader" 
        :to="`/shader/${prevShader.id}`" 
        class="nav-btn prev"
      >
        <span class="nav-arrow">←</span>
        <div class="nav-info">
          <span class="nav-label">上一个</span>
          <span class="nav-title">{{ prevShader.title }}</span>
        </div>
      </router-link>
      <div v-else class="nav-placeholder"></div>
      
      <router-link 
        v-if="nextShader" 
        :to="`/shader/${nextShader.id}`" 
        class="nav-btn next"
      >
        <div class="nav-info">
          <span class="nav-label">下一个</span>
          <span class="nav-title">{{ nextShader.title }}</span>
        </div>
        <span class="nav-arrow">→</span>
      </router-link>
      <div v-else class="nav-placeholder"></div>
    </nav>
  </div>
  
  <!-- 未找到 -->
  <div v-else class="not-found">
    <h2>未找到该Shader示例</h2>
    <router-link to="/">返回首页</router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { shaders } from '../data/shaders'
import { initShaderProgram, resizeCanvas } from '../utils/webgl'
import { init3DScene, render3DScene, type WebGL3DContext } from '../utils/webgl-3d'
import hljs from 'highlight.js/lib/core'
import glsl from 'highlight.js/lib/languages/glsl'

// 注册GLSL语言高亮
hljs.registerLanguage('glsl', glsl)

const route = useRoute()
const props = defineProps(['id'])

// 状态
const shaderCanvas = ref(null)
const isPlaying = ref(true)
const displayTime = ref(0)
const mousePos = ref({ x: 0.5, y: 0.5 })
const activeTab = ref('fragment')
const copied = ref(null)

// WebGL相关
let gl = null
let program = null
let uniforms = {}
let animationId = null
let startTime = Date.now()
let pausedTime = 0

// 3D 渲染相关
let context3D: WebGL3DContext | null = null

// 计算属性
const shader = computed(() => {
  return shaders.find(s => s.id === props.id || s.id === route.params.id)
})

const shaderIndex = computed(() => {
  return shaders.findIndex(s => s.id === (props.id || route.params.id))
})

const prevShader = computed(() => {
  return shaderIndex.value > 0 ? shaders[shaderIndex.value - 1] : null
})

const nextShader = computed(() => {
  return shaderIndex.value < shaders.length - 1 ? shaders[shaderIndex.value + 1] : null
})

const levelName = computed(() => {
  const map = { basic: '基础', intermediate: '中级', advanced: '高级' }
  return map[shader.value?.level] || ''
})

const hasMouse = computed(() => {
  return shader.value?.uniforms?.includes('u_mouse')
})

const hasParams = computed(() => {
  return hasMouse.value
})

const tabs = [
  { id: 'fragment', name: '片段着色器' },
  { id: 'vertex', name: '顶点着色器' },
  { id: 'explanation', name: '原理讲解' }
]

// 代码高亮
const highlightedVertex = computed(() => {
  if (!shader.value) return ''
  return hljs.highlight(shader.value.vertexShader.trim(), { language: 'glsl' }).value
})

const highlightedFragment = computed(() => {
  if (!shader.value) return ''
  return hljs.highlight(shader.value.fragmentShader.trim(), { language: 'glsl' }).value
})

// 简单的Markdown渲染
const renderedExplanation = computed(() => {
  if (!shader.value?.explanation) return ''
  
  let html = shader.value.explanation
  
  // 代码块
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const highlighted = lang === 'glsl' 
      ? hljs.highlight(code.trim(), { language: 'glsl' }).value
      : code.trim()
    return `<pre class="code-block"><code>${highlighted}</code></pre>`
  })
  
  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
  
  // 标题
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  
  // 列表
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
  
  // 表格（简单处理）
  html = html.replace(/\|(.+)\|/g, (match, content) => {
    const cells = content.split('|').map(c => c.trim())
    return '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>'
  })
  html = html.replace(/(<tr>.*<\/tr>\n?)+/g, '<table>$&</table>')
  
  // 粗体
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  
  // 段落
  html = html.replace(/\n\n/g, '</p><p>')
  html = '<p>' + html + '</p>'
  
  return html
})

// 方法
const initWebGL = () => {
  const canvas = shaderCanvas.value
  if (!canvas || !shader.value) return
  
  // 检查是否是 3D 场景
  if (shader.value.is3D) {
    // 根据 shader ID 确定几何体类型
    let geometryType: 'cube' | 'sphere' | 'particles' = 'cube'
    if (shader.value.id.includes('sphere')) {
      geometryType = 'sphere'
    } else if (shader.value.id.includes('particles')) {
      geometryType = 'particles'
    }
    
    context3D = init3DScene(
      canvas,
      shader.value.vertexShader,
      shader.value.fragmentShader,
      geometryType,
      shader.value.particleCount
    )
    
    if (!context3D) {
      console.error('3D 场景初始化失败')
      return
    }
    
    gl = context3D.gl
    startTime = Date.now()
    animate3D()
    return
  }
  
  // 2D 场景的原有逻辑
  const uniformNames = ['u_time', 'u_resolution', 'u_mouse']
  
  const result = initShaderProgram(
    canvas,
    shader.value.vertexShader,
    shader.value.fragmentShader,
    uniformNames
  )
  
  if (!result) {
    console.error('WebGL初始化失败')
    return
  }
  
  gl = result.gl
  program = result.program
  uniforms = result.uniforms
  
  // 设置初始尺寸
  resizeCanvas(canvas, gl)
  
  // 开始动画
  startTime = Date.now()
  animate()
}

const animate = () => {
  if (!gl || !isPlaying.value) {
    animationId = requestAnimationFrame(animate)
    return
  }
  
  const currentTime = (Date.now() - startTime) / 1000 + pausedTime
  displayTime.value = currentTime
  
  // 更新canvas尺寸
  resizeCanvas(shaderCanvas.value, gl)
  
  // 设置uniforms
  if (uniforms.u_time) {
    gl.uniform1f(uniforms.u_time, currentTime)
  }
  
  if (uniforms.u_resolution) {
    gl.uniform2f(uniforms.u_resolution, shaderCanvas.value.width, shaderCanvas.value.height)
  }
  
  if (uniforms.u_mouse) {
    gl.uniform2f(uniforms.u_mouse, mousePos.value.x, mousePos.value.y)
  }
  
  // 绘制
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  
  animationId = requestAnimationFrame(animate)
}

// 3D 场景动画循环
const animate3D = () => {
  if (!context3D || !isPlaying.value) {
    animationId = requestAnimationFrame(animate3D)
    return
  }
  
  const currentTime = (Date.now() - startTime) / 1000 + pausedTime
  displayTime.value = currentTime
  
  render3DScene(context3D, currentTime, mousePos.value, shaderCanvas.value)
  
  animationId = requestAnimationFrame(animate3D)
}

const togglePlay = () => {
  if (isPlaying.value) {
    pausedTime = displayTime.value
  } else {
    startTime = Date.now()
  }
  isPlaying.value = !isPlaying.value
}

const resetTime = () => {
  startTime = Date.now()
  pausedTime = 0
  displayTime.value = 0
}

const toggleFullscreen = () => {
  const canvas = shaderCanvas.value
  if (!canvas) return
  
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    canvas.requestFullscreen()
  }
}

const handleMouseMove = (e) => {
  const canvas = shaderCanvas.value
  if (!canvas) return
  
  const rect = canvas.getBoundingClientRect()
  mousePos.value = {
    x: (e.clientX - rect.left) / rect.width,
    y: 1.0 - (e.clientY - rect.top) / rect.height
  }
}

const copyCode = async (code) => {
  try {
    await navigator.clipboard.writeText(code.trim())
    copied.value = activeTab.value
    setTimeout(() => {
      copied.value = null
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

// 生命周期
onMounted(() => {
  initWebGL()
  
  // 添加鼠标监听
  shaderCanvas.value?.addEventListener('mousemove', handleMouseMove)
  
  // 窗口大小变化
  window.addEventListener('resize', () => {
    if (gl && shaderCanvas.value) {
      resizeCanvas(shaderCanvas.value, gl)
    }
  })
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  shaderCanvas.value?.removeEventListener('mousemove', handleMouseMove)
  
  // 清理 3D 资源
  context3D = null
})

// 监听路由变化，重新初始化
watch(() => route.params.id, () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  
  // 清理旧的 3D 资源
  context3D = null
  gl = null
  program = null
  uniforms = {}
  
  pausedTime = 0
  displayTime.value = 0
  isPlaying.value = true
  
  // 延迟初始化，等待DOM更新
  setTimeout(initWebGL, 50)
})
</script>

<style scoped>
.shader-demo {
  padding: 24px 40px 60px;
  max-width: 1600px;
  margin: 0 auto;
}

/* 返回按钮 */
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
  text-shadow: none;
}

.back-icon {
  font-size: 1.2rem;
}

/* 标题区域 */
.demo-header {
  margin-bottom: 32px;
}

.level-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.level-badge.basic {
  background: rgba(0, 245, 212, 0.2);
  color: var(--neon-green);
}

.level-badge.intermediate {
  background: rgba(255, 214, 10, 0.2);
  color: var(--neon-yellow);
}

.level-badge.advanced {
  background: rgba(255, 0, 255, 0.2);
  color: var(--neon-pink);
}

.demo-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 12px;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.demo-desc {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.demo-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

/* 主内容区 */
.demo-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 48px;
}

/* 渲染区域 */
.render-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.canvas-wrapper {
  position: relative;
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.shader-canvas {
  width: 100%;
  height: 500px;
  display: block;
}

.controls-overlay {
  position: absolute;
  bottom: 16px;
  left: 16px;
  display: flex;
  gap: 8px;
}

.control-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  color: white;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.control-btn:hover {
  background: rgba(0, 255, 245, 0.2);
  border-color: var(--neon-cyan);
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

.params-panel {
  background: var(--bg-card);
  padding: 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.params-panel h3 {
  font-size: 1rem;
  margin-bottom: 16px;
  color: var(--neon-cyan);
}

.param-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.param-item label {
  font-weight: 500;
}

.param-hint {
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* 信息区域 */
.info-section {
  display: flex;
  flex-direction: column;
  min-height: 500px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tab-btn {
  padding: 10px 20px;
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-weight: 500;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  background: var(--bg-card);
  color: var(--text-primary);
}

.tab-btn.active {
  background: linear-gradient(135deg, rgba(0, 255, 245, 0.2), rgba(157, 78, 221, 0.2));
  color: var(--neon-cyan);
  border: 1px solid var(--neon-cyan);
}

.tab-content {
  flex: 1;
  overflow: hidden;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  background: var(--bg-card);
}

.code-panel,
.explanation-panel {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.code-title {
  font-weight: 600;
  color: var(--neon-cyan);
}

.copy-btn {
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.copy-btn:hover {
  background: var(--neon-cyan);
  color: var(--bg-primary);
}

.code-block {
  background: var(--bg-secondary);
  padding: 20px;
  border-radius: var(--radius-md);
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  line-height: 1.6;
}

.code-block code {
  color: var(--text-primary);
}

/* GLSL语法高亮 */
:deep(.hljs-keyword) { color: #ff79c6; }
:deep(.hljs-type) { color: #8be9fd; }
:deep(.hljs-built_in) { color: #50fa7b; }
:deep(.hljs-number) { color: #bd93f9; }
:deep(.hljs-comment) { color: #6272a4; }
:deep(.hljs-string) { color: #f1fa8c; }
:deep(.hljs-function) { color: #50fa7b; }

/* 讲解内容 */
.explanation-panel {
  padding: 24px 28px;
}

.markdown-content {
  line-height: 1.8;
}

.markdown-content h2 {
  font-size: 1.5rem;
  margin: 32px 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
  color: var(--neon-cyan);
}

.markdown-content h2:first-child {
  margin-top: 0;
}

.markdown-content h3 {
  font-size: 1.15rem;
  margin: 24px 0 12px;
  color: var(--neon-purple);
}

.markdown-content p {
  margin-bottom: 16px;
  color: var(--text-secondary);
}

.markdown-content ul {
  margin: 16px 0;
  padding-left: 24px;
}

.markdown-content li {
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.markdown-content strong {
  color: var(--text-primary);
}

.markdown-content :deep(.inline-code) {
  background: var(--bg-tertiary);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.9em;
  color: var(--neon-pink);
}

.markdown-content :deep(.code-block) {
  margin: 16px 0;
}

.markdown-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.markdown-content td {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.markdown-content tr:first-child td {
  background: var(--bg-tertiary);
  font-weight: 600;
  color: var(--text-primary);
}

/* 底部导航 */
.demo-nav {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding-top: 32px;
  border-top: 1px solid var(--border-color);
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  flex: 1;
  max-width: 45%;
  transition: all 0.3s ease;
  color: var(--text-primary);
}

.nav-btn:hover {
  border-color: var(--neon-cyan);
  box-shadow: var(--glow-cyan);
  text-shadow: none;
}

.nav-btn.prev {
  justify-content: flex-start;
}

.nav-btn.next {
  justify-content: flex-end;
  text-align: right;
}

.nav-arrow {
  font-size: 1.5rem;
  color: var(--neon-cyan);
}

.nav-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-label {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.nav-title {
  font-weight: 600;
}

.nav-placeholder {
  flex: 1;
  max-width: 45%;
}

/* 未找到页面 */
.not-found {
  text-align: center;
  padding: 100px 20px;
}

.not-found h2 {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: var(--text-secondary);
}

/* 响应式 */
@media (max-width: 1200px) {
  .demo-content {
    grid-template-columns: 1fr;
  }
  
  .shader-canvas {
    height: 400px;
  }
  
  .info-section {
    min-height: auto;
  }
  
  .tab-content {
    height: 500px;
  }
}

@media (max-width: 768px) {
  .shader-demo {
    padding: 16px 20px 40px;
  }
  
  .demo-title {
    font-size: 1.8rem;
  }
  
  .shader-canvas {
    height: 300px;
  }
  
  .tabs {
    flex-wrap: wrap;
  }
  
  .tab-btn {
    flex: 1;
    text-align: center;
    padding: 8px 12px;
    font-size: 0.9rem;
  }
  
  .demo-nav {
    flex-direction: column;
  }
  
  .nav-btn {
    max-width: 100%;
  }
}
</style>
