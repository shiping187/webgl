/**
 * ============================================
 * WebGL Shader 示例数据库 - 主入口
 * ============================================
 * 
 * 目录结构:
 * src/data/shaders/
 * ├── index.ts              # 主入口文件（本文件）
 * ├── basic/                # 基础级别示例
 * │   ├── index.ts
 * │   ├── solid-color.ts
 * │   ├── linear-gradient.ts
 * │   ├── radial-gradient.ts
 * │   ├── stripes.ts
 * │   └── checkerboard.ts
 * ├── intermediate/         # 中级级别示例
 * │   ├── index.ts
 * │   ├── animated-wave.ts
 * │   ├── circle-sdf.ts
 * │   ├── noise-basic.ts
 * │   ├── fbm-noise.ts
 * │   ├── mouse-interaction.ts
 * │   └── rotating-pattern.ts
 * ├── advanced/             # 高级级别示例
 * │   ├── index.ts
 * │   ├── raymarching-sphere.ts
 * │   ├── plasma-effect.ts
 * │   ├── fire-effect.ts
 * │   ├── water-ripple.ts
 * │   ├── voronoi-pattern.ts
 * │   ├── glitch-effect.ts
 * │   └── metaball.ts
 * └── tutorials/            # 深度教学示例
 *     ├── index.ts
 *     ├── gpu-pipeline.ts
 *     ├── coordinate-spaces.ts
 *     ├── sdf-operations.ts
 *     ├── lighting-models.ts
 *     └── post-processing.ts
 * 
 * 添加新示例:
 * 1. 在对应级别目录下创建新的 .ts 文件
 * 2. 导出包含 id, title, description, level, tags, 
 *    vertexShader, fragmentShader, explanation, uniforms 的对象
 * 3. 在该级别的 index.ts 中导入并添加到数组
 */

import type { ShaderExample } from '../../types'
import { basicShaders } from './basic/index'
import { intermediateShaders } from './intermediate/index'
import { advancedShaders } from './advanced/index'
import { tutorialShaders } from './tutorials/index'

// 合并所有级别的shader
export const shaders: ShaderExample[] = [
  ...basicShaders,
  ...intermediateShaders,
  ...advancedShaders,
  ...tutorialShaders
]

// 按级别分类导出
export { basicShaders, intermediateShaders, advancedShaders, tutorialShaders }

// 默认导出所有shader
export default shaders
