/**
 * 基础级别 Shader 示例
 * 适合初学者入门学习
 */
import type { ShaderExample } from '../../../types'

import solidColor from './solid-color'
import linearGradient from './linear-gradient'
import radialGradient from './radial-gradient'
import stripes from './stripes'
import checkerboard from './checkerboard'

export const basicShaders: ShaderExample[] = [
  solidColor,
  linearGradient,
  radialGradient,
  stripes,
  checkerboard
]

export default basicShaders
