/**
 * 噪声基础 - 程序化纹理的基石
 * 实现简单的伪随机噪声函数
 */
export default {
  id: 'noise-basic',
  title: '噪声基础',
  description: '实现简单的伪随机噪声函数，创造自然的随机效果。',
  level: 'intermediate',
  tags: ['噪声', 'hash', '随机'],

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

// 简单的哈希函数 - 将2D坐标转换为伪随机数
float hash(vec2 p) {
    // 使用点积和sin创造混沌
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// 值噪声 - Value Noise
float noise(vec2 p) {
    vec2 i = floor(p);  // 整数部分（格子坐标）
    vec2 f = fract(p);  // 小数部分（格子内位置）
    
    // 平滑插值曲线: 3x² - 2x³
    f = f * f * (3.0 - 2.0 * f);
    
    // 获取四个角的随机值
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    // 双线性插值
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
    // 放大UV来看到更多噪声细节
    vec2 uv = v_uv * 8.0;
    
    // 添加时间让噪声流动
    uv += u_time * 0.5;
    
    float n = noise(uv);
    
    // 创建颜色映射
    vec3 color1 = vec3(0.02, 0.02, 0.05);
    vec3 color2 = vec3(0.0, 0.96, 0.88);
    
    vec3 color = mix(color1, color2, n);
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## 噪声函数 - 程序化纹理的基石

### 为什么需要噪声？

自然界充满了"有序的随机性"——云朵、山脉、火焰。纯随机太混乱，规则图案太人工。**噪声函数**介于两者之间。

### Hash函数

\`\`\`glsl
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
\`\`\`

这不是真正的随机！它是**确定性的**——相同输入永远返回相同输出。但结果看起来足够随机。

数学技巧：
1. \`dot()\` 将2D坐标变成1个数
2. \`sin()\` 创造混沌（因为大数的sin难以预测）
3. 乘大数放大混沌
4. \`fract()\` 只取小数部分

### 值噪声算法

1. 把空间分成格子
2. 每个格点有一个随机值
3. 格子内部的点通过**插值**计算

### 平滑插值

\`\`\`glsl
f = f * f * (3.0 - 2.0 * f);
\`\`\`

这是 \`smoothstep\` 的公式！让过渡更平滑，避免锯齿状边界。

### 噪声的应用

- 云朵和烟雾
- 地形生成
- 水面波纹
- 做旧和磨损效果
- 动态背景
`,

  uniforms: ['u_time']
}
