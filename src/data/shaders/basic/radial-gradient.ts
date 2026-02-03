/**
 * 径向渐变 - 距离函数的应用
 * 从中心向外扩散的圆形渐变效果
 */
import type { ShaderExample } from '../../../types'

const radialGradient: ShaderExample = {
  id: 'radial-gradient',
  title: '径向渐变',
  description: '从中心向外扩散的圆形渐变效果。',
  level: 'basic',
  tags: ['distance', '径向', 'length'],

  
  vertexShader: /* wgsl */ `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}`,

  fragmentShader: /* wgsl */ `
precision mediump float;
varying vec2 v_uv;

void main() {
    // 计算当前像素到中心点的距离
    vec2 center = vec2(0.5, 0.5);
    float dist = length(v_uv - center);
    
    // 定义颜色
    vec3 innerColor = vec3(1.0, 0.42, 0.42); // 珊瑚红
    vec3 outerColor = vec3(0.067, 0.067, 0.12); // 深色背景
    
    // 使用距离值混合颜色
    // 乘以2是因为最大距离约为0.707（对角线/2）
    vec3 color = mix(innerColor, outerColor, dist * 1.5);
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## 径向渐变 - 距离函数的应用

### length 函数

\`\`\`glsl
float dist = length(v_uv - center);
\`\`\`

\`length()\` 计算向量的长度（模），相当于：
\`\`\`
sqrt(x*x + y*y)
\`\`\`

这给了我们每个像素到中心的**欧几里得距离**。

### 距离的范围

- 中心点距离 = 0
- 边缘中点距离 = 0.5
- 角落距离 ≈ 0.707 (√2/2)

### 归一化距离

乘以系数调整渐变范围：
\`\`\`glsl
dist * 1.5  // 让渐变更快到达外圈颜色
\`\`\`

### 应用场景

径向渐变常用于：
- 聚光灯效果
- 体积光/光晕
- UI高亮效果
- 暗角（Vignette）
`,

  uniforms: []
}

export default radialGradient
