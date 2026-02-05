/**
 * 深度教学 Shader 示例
 * 专注于深入理解Shader原理的教学内容
 */
import type { ShaderExample } from '../../../types'

// 渲染管线底层原理系列
import pipelineDeepDive from './pipeline-deep-dive'
import vertexProcessing from './vertex-processing'
import rasterization from './rasterization'
import framebufferOps from './framebuffer-ops'

// WebGL版本与基础
import webglVersions from './webgl-versions'

// 原有教学示例
import gpuPipeline from './gpu-pipeline'
import coordinateSpaces from './coordinate-spaces'
import sdfOperations from './sdf-operations'
import lightingModels from './lighting-models'
import postProcessing from './post-processing'

export const tutorialShaders: ShaderExample[] = [
  // 渲染管线底层原理（推荐学习顺序）
  pipelineDeepDive,     // 1. GPU渲染管线深度解析
  vertexProcessing,     // 2. 顶点处理阶段详解
  rasterization,        // 3. 光栅化与插值原理
  framebufferOps,       // 4. 帧缓冲与像素操作
  
  // WebGL版本对比
  webglVersions,        // WebGL 1.0 vs 2.0 完整对比
  
  // 其他教学内容
  gpuPipeline,          // GPU管线原理（简版）
  coordinateSpaces,     // 坐标空间与变换
  sdfOperations,        // SDF组合与形变
  lightingModels,       // 光照模型
  postProcessing        // 后处理效果
]

export default tutorialShaders
