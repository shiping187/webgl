/**
 * 线性渐变 - UV坐标基础
 * 使用UV坐标创建水平渐变效果
 */
import type { ShaderExample } from '../../../types'

const linearGradient: ShaderExample = {
  id: 'linear-gradient',
  title: '线性渐变',
  description: '使用UV坐标创建水平渐变效果，理解坐标系统。',
  level: 'basic',
  tags: ['UV', 'varying', 'mix'],

  vertexShader: `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
    // 将坐标从[-1,1]映射到[0,1]
    // 这就是UV坐标的来源
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}`,

  fragmentShader: `
precision mediump float;
varying vec2 v_uv;

void main() {
    // 定义渐变的两个颜色
    vec3 colorA = vec3(0.0, 0.96, 0.88);  // 青色
    vec3 colorB = vec3(0.616, 0.306, 0.867);  // 紫色
    
    // 使用UV的x分量作为混合因子
    // mix(a, b, t) = a * (1-t) + b * t
    vec3 color = mix(colorA, colorB, v_uv.x);
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## 线性渐变 - UV坐标基础

### UV坐标系统

UV坐标是纹理坐标系统，范围通常是[0,1]：
- **U轴**：水平方向，从左(0)到右(1)
- **V轴**：垂直方向，从下(0)到上(1)

### varying 变量

\`\`\`glsl
varying vec2 v_uv;
\`\`\`

\`varying\` 关键字定义的变量会在顶点着色器和片段着色器之间**插值传递**。

GPU会自动对三角形内的每个像素进行插值计算。

### mix 函数

\`\`\`glsl
mix(a, b, t) = a * (1.0 - t) + b * t
\`\`\`

这是**线性插值**公式：
- 当 t = 0 时，结果是 a
- 当 t = 1 时，结果是 b
- 当 t = 0.5 时，结果是 a 和 b 的中间值

### 坐标变换

\`\`\`glsl
v_uv = a_position * 0.5 + 0.5;
\`\`\`

| a_position | 计算过程 | v_uv |
|------------|----------|------|
| -1.0       | -1.0 * 0.5 + 0.5 | 0.0 |
| 0.0        | 0.0 * 0.5 + 0.5  | 0.5 |
| 1.0        | 1.0 * 0.5 + 0.5  | 1.0 |

这是一个从[-1,1]到[0,1]的**线性映射**。
`,

  uniforms: []
}

export default linearGradient
