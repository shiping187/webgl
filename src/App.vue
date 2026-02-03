<template>
  <div class="app">
    <!-- 动态背景 -->
    <div class="background-effects">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>
    
    <!-- 导航栏 -->
    <nav class="navbar">
      <router-link to="/" class="logo">
        <span class="logo-icon">◈</span>
        <span class="logo-text">Shader<span class="highlight">Lab</span></span>
      </router-link>
      
      <div class="nav-links">
        <router-link to="/" class="nav-link">
          <span class="nav-icon">◉</span>
          首页
        </router-link>
        <a href="https://webglfundamentals.org/" target="_blank" class="nav-link">
          <span class="nav-icon">◎</span>
          学习资源
        </a>
      </div>
    </nav>
    
    <!-- 主内容区 -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    
    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-content">
        <p>🎨 WebGL Shader 特效展示馆 - 探索图形编程的无限可能</p>
        <p class="footer-sub">使用 Vue 3 + WebGL 构建</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
// App主组件 - 提供整体布局和路由容器
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 背景效果 */
.background-effects {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: var(--neon-purple);
  top: -200px;
  right: -100px;
  animation: float 8s ease-in-out infinite;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: var(--neon-cyan);
  bottom: -150px;
  left: -100px;
  animation: float 10s ease-in-out infinite reverse;
}

.orb-3 {
  width: 300px;
  height: 300px;
  background: var(--neon-pink);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: float 12s ease-in-out infinite;
}

/* 导航栏 */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 40px;
  background: rgba(10, 10, 15, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-color);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.logo:hover {
  color: var(--text-primary);
  text-shadow: none;
}

.logo-icon {
  font-size: 2rem;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: pulse-glow 2s ease-in-out infinite;
}

.logo-text {
  font-family: var(--font-mono);
}

.logo-text .highlight {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-links {
  display: flex;
  gap: 24px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-weight: 500;
  transition: all 0.3s ease;
}

.nav-link:hover {
  color: var(--neon-cyan);
  background: rgba(0, 255, 245, 0.1);
  text-shadow: var(--glow-cyan);
}

.nav-icon {
  font-size: 0.8rem;
}

/* 主内容区 */
.main-content {
  flex: 1;
  position: relative;
  z-index: 1;
}

/* 页面切换动画 */
.page-enter-active,
.page-leave-active {
  transition: all 0.4s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 页脚 */
.footer {
  position: relative;
  z-index: 1;
  padding: 40px;
  text-align: center;
  border-top: 1px solid var(--border-color);
  background: rgba(10, 10, 15, 0.6);
  backdrop-filter: blur(10px);
}

.footer-content p {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.footer-sub {
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 0.85rem;
}

/* 响应式 */
@media (max-width: 768px) {
  .navbar {
    padding: 12px 20px;
  }
  
  .logo-text {
    display: none;
  }
  
  .nav-links {
    gap: 12px;
  }
  
  .nav-link span:last-child {
    display: none;
  }
}
</style>
