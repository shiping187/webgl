/**
 * 中级级别 Shader 示例
 * 涉及动画、噪声、交互等进阶技术
 */
import type { ShaderExample } from '../../../types'

import animatedWave from './animated-wave'
import circleSdf from './circle-sdf'
import noiseBasic from './noise-basic'
import fbmNoise from './fbm-noise'
import mouseInteraction from './mouse-interaction'
import rotatingPattern from './rotating-pattern'

export const intermediateShaders: ShaderExample[] = [
  animatedWave,
  circleSdf,
  noiseBasic,
  fbmNoise,
  mouseInteraction,
  rotatingPattern
]

export default intermediateShaders
