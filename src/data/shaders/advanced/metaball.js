/**
 * Metaball融球 - 有机形态的秘密
 * 有机形态的融合效果，两个或多个形状相互融合的经典技术
 */
export default {
  id: 'metaball',
  title: 'Metaball融球',
  description: '有机形态的融合效果，两个或多个形状相互融合的经典技术。',
  level: 'advanced',
  tags: ['Metaball', '有机', '融合'],

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

// Metaball函数
// 返回该点受到的"能量"值
float metaball(vec2 p, vec2 center, float radius) {
    float d = length(p - center);
    // 能量与距离平方成反比
    return radius * radius / (d * d + 0.0001);
}

void main() {
    // 调整UV范围
    vec2 uv = v_uv * 2.0 - 1.0;
    float t = u_time;
    
    // 定义多个metaball的位置（动画化）
    vec2 ball1 = vec2(sin(t * 1.2) * 0.4, cos(t * 0.8) * 0.4);
    vec2 ball2 = vec2(sin(t * 0.9 + 2.0) * 0.5, cos(t * 1.1 + 1.0) * 0.3);
    vec2 ball3 = vec2(sin(t * 0.7 + 4.0) * 0.3, cos(t * 1.3 + 3.0) * 0.5);
    vec2 ball4 = vec2(cos(t * 1.0) * 0.35, sin(t * 0.6) * 0.45);
    
    // 计算总能量
    float energy = 0.0;
    energy += metaball(uv, ball1, 0.3);
    energy += metaball(uv, ball2, 0.25);
    energy += metaball(uv, ball3, 0.2);
    energy += metaball(uv, ball4, 0.22);
    
    // 阈值化 - 能量超过阈值的区域为"内部"
    float threshold = 1.0;
    float inside = smoothstep(threshold - 0.1, threshold + 0.1, energy);
    
    // 边缘检测
    float edge = smoothstep(threshold - 0.05, threshold, energy) 
               - smoothstep(threshold, threshold + 0.05, energy);
    
    // 颜色
    vec3 bgColor = vec3(0.02, 0.02, 0.05);
    vec3 blobColor = vec3(0.0, 0.7, 0.65);
    vec3 edgeColor = vec3(0.0, 0.96, 0.88);
    vec3 glowColor = vec3(0.616, 0.306, 0.867);
    
    // 内部渐变（基于能量）
    vec3 innerColor = mix(blobColor, vec3(1.0, 0.9, 0.9), (energy - threshold) * 0.3);
    
    // 外部辉光
    float glow = smoothstep(1.0, 0.0, energy / threshold) * 0.5;
    
    // 组合
    vec3 color = bgColor;
    color += glowColor * glow * (1.0 - inside);  // 辉光
    color = mix(color, innerColor, inside);       // 内部
    color = mix(color, edgeColor, edge * 2.0);   // 边缘高亮
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## Metaball - 有机形态的秘密

### 什么是Metaball？

Metaball是一种建模技术，通过在空间中定义"能量场"，然后显示能量超过阈值的区域。

最神奇的是：当两个metaball靠近时，它们会**自然融合**！

### 能量函数

\`\`\`glsl
float metaball(vec2 p, vec2 center, float radius) {
    float d = length(p - center);
    return radius * radius / (d * d + 0.0001);
}
\`\`\`

能量与距离平方成反比：
- 中心能量无穷大（理论上）
- 距离越远能量衰减越快
- \`+ 0.0001\` 防止除以零

### 能量叠加

\`\`\`glsl
energy += metaball(uv, ball1, 0.3);
energy += metaball(uv, ball2, 0.25);
\`\`\`

关键洞察：能量是**可叠加**的！

当两个球靠近时，它们之间的能量相加，可能超过阈值，形成连接的"桥"。

### 等值面提取

\`\`\`glsl
float inside = smoothstep(threshold - 0.1, threshold + 0.1, energy);
\`\`\`

显示所有 \`energy > threshold\` 的区域。\`smoothstep\` 提供抗锯齿边缘。

### 边缘检测

\`\`\`glsl
float edge = smoothstep(a, b, energy) - smoothstep(b, c, energy);
\`\`\`

这创造了一个只在阈值附近为正的"带"——即边缘！

### 应用场景

- 液体模拟
- 有机UI元素
- 游戏中的blob怪物
- Logo动画
- 数据可视化

### 3D Metaball

同样的概念可以扩展到3D，结合Ray Marching可以创造惊艳的有机形态动画。
`,

  uniforms: ['u_time']
}
