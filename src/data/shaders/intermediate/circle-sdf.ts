/**
 * 圆形 SDF - 有符号距离场基础
 * 使用SDF绘制圆形，这是高级图形技术的基础
 */
import type { ShaderExample } from '../../../types'

const circleSdf: ShaderExample = {
  id: 'circle-sdf',
  title: '圆形 SDF',
  description: '使用有符号距离场（SDF）绘制圆形，这是高级图形技术的基础。',
  level: 'intermediate',
  tags: ['SDF', '距离场', 'smoothstep'],

  vertexShader: `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}`,

  fragmentShader: `
precision mediump float;
varying vec2 v_uv;
uniform float u_time;

// 圆形的SDF函数
// 返回点p到圆心的距离减去半径
// 内部为负，外部为正，边界为0
float circleSDF(vec2 p, vec2 center, float radius) {
    return length(p - center) - radius;
}

void main() {
    // 调整UV使圆形不被拉伸（假设是正方形canvas）
    vec2 uv = v_uv;
    
    // 绘制一个动画的圆
    float radius = 0.25 + sin(u_time) * 0.05;
    float d = circleSDF(uv, vec2(0.5), radius);
    
    // 使用smoothstep创建抗锯齿边缘
    // smoothstep(a, b, x) 在a到b之间平滑过渡
    float circle = 1.0 - smoothstep(0.0, 0.02, d);
    
    // 添加发光边缘
    float glow = 1.0 - smoothstep(0.0, 0.15, abs(d));
    
    // 组合颜色
    vec3 circleColor = vec3(0.0, 0.96, 0.88);
    vec3 glowColor = vec3(0.616, 0.306, 0.867);
    vec3 bgColor = vec3(0.05, 0.05, 0.08);
    
    vec3 color = bgColor;
    color += glowColor * glow * 0.5;
    color = mix(color, circleColor, circle);
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## 有符号距离场 (SDF) - 图形程序员的秘密武器

### 什么是SDF？

**Signed Distance Field（有符号距离场）** 是一个函数，返回空间中任意点到图形边界的最短距离。

关键特性：
- 图形**内部**返回**负值**
- 图形**外部**返回**正值**
- **边界**处返回**0**

### 圆形SDF

\`\`\`glsl
float circleSDF(vec2 p, vec2 center, float radius) {
    return length(p - center) - radius;
}
\`\`\`

理解这个公式：
- \`length(p - center)\` = 点到圆心的距离
- 减去 \`radius\` = 到边界的距离

### smoothstep - 抗锯齿神器

\`\`\`glsl
float circle = 1.0 - smoothstep(0.0, 0.02, d);
\`\`\`

\`smoothstep(a, b, x)\` 的曲线：
- x < a → 0
- x > b → 1
- a到b之间 → 平滑过渡 (S曲线)

这给我们一个平滑的边缘，避免锯齿！

### 为什么SDF这么强大？

1. **布尔运算**：\`min(d1, d2)\` = 并集，\`max(d1, d2)\` = 交集
2. **圆角**：\`d - radius\` 给任何形状加圆角
3. **描边**：\`abs(d) - thickness\` 创建轮廓线
4. **动画友好**：距离值可以平滑动画

SDF是实现复杂2D/3D图形的核心技术！
`,

  uniforms: ['u_time']
}

export default circleSdf
