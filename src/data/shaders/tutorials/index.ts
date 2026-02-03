/**
 * 深度教学 Shader 示例
 * 专注于深入理解Shader原理的教学内容
 */
import type { ShaderExample } from '../../../types'

import gpuPipeline from './gpu-pipeline'
import coordinateSpaces from './coordinate-spaces'
import sdfOperations from './sdf-operations'
import lightingModels from './lighting-models'
import postProcessing from './post-processing'

export const tutorialShaders: ShaderExample[] = [
  gpuPipeline,
  coordinateSpaces,
  sdfOperations,
  lightingModels,
  postProcessing
]

export default tutorialShaders
