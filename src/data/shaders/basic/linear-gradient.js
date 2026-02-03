/**
 * 线性渐变 - 理解UV坐标
 * 使用UV坐标创建从左到右的颜色渐变效果
 */
export default {
  id: 'linear-gradient',
  title: '线性渐变',
  description: '使用UV坐标创建从左到右的颜色渐变效果。',
  level: 'basic',
  tags: ['UV坐标', 'mix', '渐变'],

  vertexShader: `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
    // 将顶点坐标从 [-1,1] 映射到 [0,1] 作为UV坐标
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}`,

  fragmentShader: `
precision mediump float;
varying vec2 v_uv;

void main() {
    // 定义两个颜色
    vec3 color1 = vec3(0.0, 0.96, 0.88);  // 青色
    vec3 color2 = vec3(0.616, 0.306, 0.867); // 紫色
    
    // 使用 mix 函数根据UV的x坐标混合颜色
    // mix(a, b, t) = a * (1-t) + b * t
    vec3 color = mix(color1, color2, v_uv.x);
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## 线性渐变 - 理解UV坐标

### 什么是UV坐标？

UV坐标是一种将2D纹理映射到3D表面的坐标系统。在2D shader中：
- **U** 对应水平方向（从左0到右1）
- **V** 对应垂直方向（从下0到上1）

### varying 变量

\`\`\`glsl
varying vec2 v_uv;
\`\`\`

\`varying\` 关键字用于在顶点着色器和片段着色器之间传递数据。GPU会自动对varying变量进行**插值**，这是实现平滑渐变的关键。

### mix 函数

\`\`\`glsl
vec3 color = mix(color1, color2, v_uv.x);
\`\`\`

\`mix\` 是GLSL的内置插值函数：
- 当 \`v_uv.x = 0\` 时，返回 \`color1\`
- 当 \`v_uv.x = 1\` 时，返回 \`color2\`
- 中间值平滑过渡

### 实验建议

试着修改代码：
1. 将 \`v_uv.x\` 改为 \`v_uv.y\` 看看效果
2. 使用 \`length(v_uv - 0.5)\` 创建径向渐变
`,

  uniforms: []
}
