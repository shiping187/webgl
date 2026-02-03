/**
 * 条纹图案 - fract 和 step 函数
 * 使用数学函数创建重复的条纹图案
 */
export default {
  id: 'stripes',
  title: '条纹图案',
  description: '使用数学函数创建重复的条纹图案。',
  level: 'basic',
  tags: ['fract', 'step', '图案'],

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

void main() {
    // 将UV坐标放大来创建多个条纹
    float stripes = 10.0; // 条纹数量
    float pattern = fract(v_uv.x * stripes);
    
    // 使用 step 创建硬边条纹
    // step(edge, x) 当 x < edge 返回0，否则返回1
    float stripe = step(0.5, pattern);
    
    // 定义两种颜色
    vec3 color1 = vec3(0.0, 0.96, 0.88);
    vec3 color2 = vec3(0.18, 0.18, 0.24);
    
    vec3 color = mix(color2, color1, stripe);
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## 条纹图案 - fract 和 step 函数

### fract 函数 - 创建重复

\`\`\`glsl
float pattern = fract(v_uv.x * stripes);
\`\`\`

\`fract(x)\` 返回x的小数部分，范围始终是 [0, 1)。

当我们将UV乘以10：
- uv.x = 0.0 → 0.0
- uv.x = 0.1 → 0.0
- uv.x = 0.15 → 0.5
- uv.x = 0.2 → 0.0
- ...以此类推

这创造了**重复的锯齿波**！

### step 函数 - 硬边界

\`\`\`glsl
float stripe = step(0.5, pattern);
\`\`\`

\`step(edge, x)\` 是阶跃函数：
- x < edge → 返回 0.0
- x >= edge → 返回 1.0

结合 \`fract\`，我们得到了0和1交替的条纹。

### 公式总结

\`\`\`
条纹 = step(阈值, fract(坐标 * 数量))
\`\`\`

### 变体挑战

试试这些修改：
1. 斜条纹：\`fract((v_uv.x + v_uv.y) * stripes)\`
2. 软边条纹：用 \`smoothstep\` 替代 \`step\`
3. 棋盘格：结合x和y方向的条纹
`,

  uniforms: ['u_time']
}
