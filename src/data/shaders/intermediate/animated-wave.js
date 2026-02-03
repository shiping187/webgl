/**
 * 波浪动画 - 时间与三角函数
 * 使用正弦函数创建流动的波浪效果
 */
export default {
  id: 'animated-wave',
  title: '波浪动画',
  description: '使用正弦函数创建流动的波浪效果，理解时间变量的使用。',
  level: 'intermediate',
  tags: ['sin', '动画', 'u_time'],

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
    // 创建波浪效果
    // sin函数的值在-1到1之间震荡
    float wave = sin(v_uv.x * 10.0 + u_time * 2.0) * 0.5 + 0.5;
    
    // 添加第二个波浪，创建更复杂的效果
    float wave2 = sin(v_uv.x * 15.0 - u_time * 3.0) * 0.5 + 0.5;
    
    // 混合两个波浪
    float finalWave = (wave + wave2) * 0.5;
    
    // 根据y坐标和波浪值判断颜色
    float threshold = finalWave * 0.3 + 0.35;
    float inWave = step(v_uv.y, threshold);
    
    // 定义颜色
    vec3 waveColor = vec3(0.0, 0.62, 0.85);
    vec3 bgColor = vec3(0.02, 0.02, 0.05);
    
    // 添加渐变效果
    waveColor = mix(vec3(0.0, 0.96, 0.88), waveColor, v_uv.y);
    
    vec3 color = mix(bgColor, waveColor, inWave);
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## 波浪动画 - 时间与三角函数

### uniform 变量

\`\`\`glsl
uniform float u_time;
\`\`\`

\`uniform\` 是从JavaScript传入的全局变量，对所有像素相同。
\`u_time\` 通常是从程序启动开始的秒数。

### sin 函数创造波浪

\`\`\`glsl
float wave = sin(v_uv.x * 10.0 + u_time * 2.0);
\`\`\`

分解这个公式：
- \`v_uv.x * 10.0\` - 控制波浪的**频率**（数字越大，波浪越密）
- \`u_time * 2.0\` - 控制波浪的**速度**（数字越大，移动越快）
- \`sin()\` - 返回-1到1的平滑震荡值

### 值域变换

\`\`\`glsl
sin(...) * 0.5 + 0.5
\`\`\`

将sin的范围从[-1, 1]映射到[0, 1]：

| sin值 | 变换后 |
|-------|--------|
| -1    | 0      |
| 0     | 0.5    |
| 1     | 1      |

### 波浪叠加

多个不同频率和速度的波浪叠加，创造更自然的效果。这是**傅里叶分析**的基本原理！

### 动画原理

每一帧，\`u_time\` 增加一点点，导致：
- \`sin\` 的输入改变
- 输出值改变
- 波浪位置移动
- 视觉上形成动画！
`,

  uniforms: ['u_time']
}
