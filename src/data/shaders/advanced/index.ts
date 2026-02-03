/**
 * 高级级别 Shader 示例
 * 涉及3D渲染、复杂特效等专业技术
 */
import type { ShaderExample } from '../../../types'

import raymarchingSphere from './raymarching-sphere'
import plasmaEffect from './plasma-effect'
import fireEffect from './fire-effect'
import waterRipple from './water-ripple'
import voronoiPattern from './voronoi-pattern'
import glitchEffect from './glitch-effect'
import metaball from './metaball'
import cube3D from './cube-3d'
import sphereDeform from './sphere-deform'
import particles3D from './particles-3d'

export const advancedShaders: ShaderExample[] = [
  raymarchingSphere,
  plasmaEffect,
  fireEffect,
  waterRipple,
  voronoiPattern,
  glitchEffect,
  metaball,
  cube3D,
  sphereDeform,
  particles3D
]

export default advancedShaders
