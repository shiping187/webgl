/**
 * 鼠标交互 - 让Shader活起来
 * 响应鼠标位置的交互式效果
 */
export default {
  id: 'mouse-interaction',
  title: '鼠标交互',
  description: '响应鼠标位置的交互式效果，学习uniform变量的高级应用。',
  level: 'intermediate',
  tags: ['交互', 'uniform', '鼠标'],

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
uniform vec2 u_mouse;  // 鼠标位置 (0-1)

void main() {
    // 计算当前像素到鼠标的距离
    float dist = length(v_uv - u_mouse);
    
    // 创建波纹效果
    float ripple = sin(dist * 30.0 - u_time * 5.0);
    ripple = ripple * 0.5 + 0.5;
    
    // 波纹衰减
    float falloff = 1.0 - smoothstep(0.0, 0.5, dist);
    ripple *= falloff;
    
    // 中心光点
    float spot = 1.0 - smoothstep(0.0, 0.15, dist);
    
    // 组合颜色
    vec3 bgColor = vec3(0.02, 0.02, 0.05);
    vec3 rippleColor = vec3(0.0, 0.5, 0.6);
    vec3 spotColor = vec3(0.0, 0.96, 0.88);
    
    vec3 color = bgColor;
    color += rippleColor * ripple * 0.8;
    color += spotColor * spot;
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## 鼠标交互 - 让Shader活起来

### u_mouse变量

\`\`\`glsl
uniform vec2 u_mouse;  // (0-1)范围的鼠标位置
\`\`\`

JavaScript端需要监听鼠标移动并更新这个uniform：
\`\`\`javascript
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;
    gl.uniform2f(mouseLocation, x, y);
});
\`\`\`

### 波纹效果

\`\`\`glsl
float ripple = sin(dist * 30.0 - u_time * 5.0);
\`\`\`

- \`dist * 30.0\`：距离越远，相位越大
- \`- u_time * 5.0\`：负号让波纹向外扩散

### 衰减函数

\`\`\`glsl
float falloff = 1.0 - smoothstep(0.0, 0.5, dist);
\`\`\`

让波纹随距离衰减，避免整个画面都是波纹。

### 交互设计原则

1. **即时反馈**：效果应该立即响应输入
2. **平滑过渡**：避免突兀的变化
3. **视觉层次**：主要效果（光点）+ 辅助效果（波纹）

### 扩展想法

- 记录鼠标轨迹
- 多点触控支持
- 点击爆发效果
- 拖拽影响参数
`,

  uniforms: ['u_time', 'u_mouse']
}
