/**
 * ============================================
 * WebGL Shader 示例数据库 - 主入口
 * ============================================
 * 
 * 目录结构:
 * src/data/shaders/
 * ├── index.js              # 主入口文件（本文件）
 * ├── basic/                # 基础级别示例
 * │   ├── index.js
 * │   ├── solid-color.js
 * │   ├── linear-gradient.js
 * │   ├── radial-gradient.js
 * │   ├── stripes.js
 * │   └── checkerboard.js
 * ├── intermediate/         # 中级级别示例
 * │   ├── index.js
 * │   ├── animated-wave.js
 * │   ├── circle-sdf.js
 * │   ├── noise-basic.js
 * │   ├── fbm-noise.js
 * │   ├── mouse-interaction.js
 * │   └── rotating-pattern.js
 * └── advanced/             # 高级级别示例
 *     ├── index.js
 *     ├── raymarching-sphere.js
 *     ├── plasma-effect.js
 *     ├── fire-effect.js
 *     ├── water-ripple.js
 *     ├── voronoi-pattern.js
 *     ├── glitch-effect.js
 *     └── metaball.js
 * 
 * 添加新示例:
 * 1. 在对应级别目录下创建新的 .js 文件
 * 2. 导出包含 id, title, description, level, tags, 
 *    vertexShader, fragmentShader, explanation, uniforms 的对象
 * 3. 在该级别的 index.js 中导入并添加到数组
 */

import { basicShaders } from './basic/index.js'
import { intermediateShaders } from './intermediate/index.js'
import { advancedShaders } from './advanced/index.js'

// 合并所有级别的shader
export const shaders = [
  ...basicShaders,
  ...intermediateShaders,
  ...advancedShaders
]

// 按级别分类导出
export { basicShaders, intermediateShaders, advancedShaders }

// 默认导出所有shader
export default shaders
