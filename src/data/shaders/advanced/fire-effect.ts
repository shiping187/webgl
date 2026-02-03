/**
 * 火焰效果 - 噪声的艺术应用
 * 使用噪声函数模拟火焰的流动与色彩变化
 */
import type { ShaderExample } from '../../../types'

const fireEffect: ShaderExample = {
  id: 'fire-effect',
  title: '火焰效果',
  description: '使用噪声函数模拟火焰的流动与色彩变化。',
  level: 'advanced',
  tags: ['火焰', '噪声', '模拟'],

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

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for(int i = 0; i < 6; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 uv = v_uv;
    
    // 调整坐标，让火焰从底部升起
    uv.y = 1.0 - uv.y;  // 翻转Y
    
    // 创建火焰的流动
    vec2 noiseCoord = uv * vec2(3.0, 4.0);
    noiseCoord.y -= u_time * 2.0;  // 向上流动
    
    // 添加水平扰动
    float distortion = fbm(noiseCoord * 0.5 + u_time * 0.5) * 0.3;
    noiseCoord.x += distortion;
    
    // 火焰强度
    float fire = fbm(noiseCoord);
    
    // 基于高度衰减
    fire *= smoothstep(1.0, 0.0, uv.y);
    
    // 底部更强
    fire *= 1.0 + (1.0 - uv.y) * 0.5;
    
    // 收窄火焰形状
    float centerFalloff = 1.0 - pow(abs(uv.x - 0.5) * 2.0, 2.0);
    fire *= centerFalloff;
    
    // 火焰颜色渐变
    vec3 color = vec3(0.0);
    
    // 核心：白-黄
    color += vec3(1.0, 0.9, 0.7) * smoothstep(0.6, 1.0, fire);
    // 中层：橙
    color += vec3(1.0, 0.5, 0.0) * smoothstep(0.3, 0.7, fire);
    // 外层：红
    color += vec3(0.8, 0.2, 0.0) * smoothstep(0.1, 0.4, fire);
    // 边缘：暗红
    color += vec3(0.3, 0.05, 0.0) * smoothstep(0.0, 0.2, fire);
    
    // 背景
    vec3 bgColor = vec3(0.02, 0.02, 0.03);
    color = max(color, bgColor);
    
    // 添加一点辉光
    float glow = fire * 0.3;
    color += vec3(1.0, 0.3, 0.0) * glow * centerFalloff;
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## 火焰效果 - 噪声的艺术应用

### 火焰的特征

真实火焰的视觉特征：
1. **向上流动** - 热空气上升
2. **不规则边缘** - 湍流造成
3. **颜色渐变** - 温度决定颜色
4. **底部收敛** - 火源位置

### 流动效果

\`\`\`glsl
noiseCoord.y -= u_time * 2.0;
\`\`\`

让噪声坐标随时间向下移动，在视觉上火焰就向上流动了。

### 颜色温度映射

火焰颜色对应温度：
- **白色/黄色**（~1400°C）→ 最热，核心
- **橙色**（~1100°C）→ 中等热度
- **红色**（~800°C）→ 较冷边缘
- **暗红/黑**（<600°C）→ 几乎熄灭

\`\`\`glsl
color += vec3(1.0, 0.9, 0.7) * smoothstep(0.6, 1.0, fire);
\`\`\`

使用 \`smoothstep\` 创建柔和的颜色过渡。

### 形状控制

\`\`\`glsl
float centerFalloff = 1.0 - pow(abs(uv.x - 0.5) * 2.0, 2.0);
fire *= centerFalloff;
\`\`\`

创建一个中间高、两边低的曲线，让火焰呈现倒锥形。

### 高度衰减

\`\`\`glsl
fire *= smoothstep(1.0, 0.0, uv.y);
\`\`\`

火焰向上逐渐消散。

### 优化思路

- 使用更快的噪声函数
- 减少FBM层数
- 预计算噪声纹理
`,

  uniforms: ['u_time']
}

export default fireEffect
