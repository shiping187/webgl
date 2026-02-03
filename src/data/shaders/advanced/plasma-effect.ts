/**
 * 等离子效果 - 演示场景的经典
 * 经典的演示场景特效，通过叠加正弦函数创造迷幻的色彩
 */
import type { ShaderExample } from '../../../types'

const plasmaEffect: ShaderExample = {
  id: 'plasma-effect',
  title: '等离子效果',
  description: '经典的演示场景特效，通过叠加正弦函数创造迷幻的色彩。',
  level: 'advanced',
  tags: ['等离子', '演示场景', '色彩'],

  vertexShader: `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}`,

  fragmentShader: `
precision highp float;
varying vec2 v_uv;
uniform float u_time;

void main() {
    vec2 uv = v_uv * 4.0 - 2.0;
    float t = u_time * 0.5;
    
    // 叠加多个正弦波
    float v1 = sin(uv.x * 3.0 + t);
    float v2 = sin(uv.y * 3.0 + t);
    float v3 = sin((uv.x + uv.y) * 2.0 + t);
    float v4 = sin(length(uv) * 3.0 - t);
    
    // 添加更复杂的变化
    float v5 = sin(uv.x * sin(t * 0.3) * 5.0 + uv.y * cos(t * 0.4) * 5.0);
    
    // 组合所有值
    float v = (v1 + v2 + v3 + v4 + v5) * 0.2;
    
    // 创建多彩的颜色
    vec3 color;
    color.r = sin(v * 3.14159 + 0.0) * 0.5 + 0.5;
    color.g = sin(v * 3.14159 + 2.094) * 0.5 + 0.5;
    color.b = sin(v * 3.14159 + 4.188) * 0.5 + 0.5;
    
    // 增强对比度
    color = pow(color, vec3(0.8));
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## 等离子效果 - 演示场景的经典

### 历史背景

等离子效果起源于1990年代的**Demoscene**（演示场景）文化。程序员们竞相用最少的代码创造最惊艳的视觉效果。

### 核心技术：正弦叠加

\`\`\`glsl
float v1 = sin(uv.x * 3.0 + t);
float v2 = sin(uv.y * 3.0 + t);
float v3 = sin((uv.x + uv.y) * 2.0 + t);
float v4 = sin(length(uv) * 3.0 - t);
\`\`\`

每个正弦波贡献不同的"波纹"：
- v1：垂直条纹
- v2：水平条纹
- v3：对角条纹
- v4：圆形波纹

### 彩虹色映射

\`\`\`glsl
color.r = sin(v * PI + 0.0) * 0.5 + 0.5;
color.g = sin(v * PI + 2.094) * 0.5 + 0.5;  // +120°
color.b = sin(v * PI + 4.188) * 0.5 + 0.5;  // +240°
\`\`\`

2.094 ≈ 2π/3，4.188 ≈ 4π/3

三个通道相位差120°，形成色环！

### 数学之美

整个效果只用了最基本的函数：
- \`sin\` - 正弦
- \`length\` - 距离
- \`+\` - 加法

却创造了无穷无尽的变化。

### 实验方向

- 调整频率参数
- 添加更多正弦层
- 使用不同的组合方式（乘法、取模等）
- 尝试方波(\`sign(sin(...))\`)
`,

  uniforms: ['u_time']
}

export default plasmaEffect
