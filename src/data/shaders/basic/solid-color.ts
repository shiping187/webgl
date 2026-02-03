/**
 * 纯色渲染 - Shader入门第一课
 * 最简单的shader，输出单一颜色
 */
import type { ShaderExample } from '../../../types'

const solidColor: ShaderExample = {
  id: 'solid-color',
  title: '纯色渲染',
  description: '最简单的shader，输出单一颜色。理解shader基本结构的起点。',
  level: 'basic',
  tags: ['入门', 'gl_FragColor', 'vec4'],
  
  vertexShader: `
// 顶点着色器 - 处理顶点位置
attribute vec2 a_position;

void main() {
    // 直接将2D坐标转换为4D裁剪坐标
    // vec4(x, y, z, w) - w通常为1.0
    gl_Position = vec4(a_position, 0.0, 1.0);
}`,

  fragmentShader: `
// 片段着色器 - 决定每个像素的颜色
precision mediump float;

void main() {
    // gl_FragColor 是内置变量，表示当前片段的颜色
    // vec4(r, g, b, a) - 红、绿、蓝、透明度，范围0.0-1.0
    gl_FragColor = vec4(0.0, 0.96, 0.88, 1.0); // 青色
}`,

  explanation: `
## 纯色渲染 - Shader入门第一课

### 什么是Shader？

Shader（着色器）是运行在GPU上的小程序，用于控制图形的渲染过程。WebGL中有两种主要的着色器：
1. **顶点着色器（Vertex Shader）**：处理每个顶点的位置
2. **片段着色器（Fragment Shader）**：决定每个像素的颜色

### 代码解析

#### 顶点着色器
\`\`\`glsl
attribute vec2 a_position;  // 从JavaScript传入的顶点坐标
\`\`\`
- \`attribute\` 关键字表示这是从CPU传来的数据
- \`vec2\` 是二维向量类型，包含x和y两个分量

#### 片段着色器
\`\`\`glsl
gl_FragColor = vec4(0.0, 0.96, 0.88, 1.0);
\`\`\`
- \`gl_FragColor\` 是内置输出变量
- \`vec4\` 表示RGBA四个通道
- 颜色值范围是0.0到1.0（不是0-255）

### 核心知识点

- GLSL使用C语言风格的语法
- 所有shader都必须有 \`main()\` 函数
- 颜色使用归一化的浮点数（0.0-1.0）
`,

  uniforms: []
}

export default solidColor
