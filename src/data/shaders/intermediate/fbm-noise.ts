/**
 * FBM分形噪声 - 自然纹理的秘密
 * 分形布朗运动，通过叠加多层噪声创造丰富的细节
 */
import type { ShaderExample } from '../../../types'

const fbmNoise: ShaderExample = {
  id: 'fbm-noise',
  title: 'FBM分形噪声',
  description: '分形布朗运动，通过叠加多层噪声创造丰富的细节。',
  level: 'intermediate',
  tags: ['FBM', '分形', '噪声'],

  vertexShader: /* wgsl */ `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}`,

  fragmentShader: /* wgsl */ `
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

// FBM - 分形布朗运动
// 叠加多层不同频率和振幅的噪声
float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;  // 振幅
    float frequency = 1.0;  // 频率
    
    // 叠加5层噪声（称为"倍频程"）
    for(int i = 0; i < 5; i++) {
        value += amplitude * noise(p * frequency);
        frequency *= 2.0;   // 频率翻倍
        amplitude *= 0.5;   // 振幅减半
    }
    
    return value;
}

void main() {
    vec2 uv = v_uv * 3.0;
    
    // 让噪声缓慢流动
    float t = u_time * 0.2;
    float n = fbm(uv + vec2(t, t * 0.5));
    
    // 创建更有趣的颜色映射
    vec3 color1 = vec3(0.02, 0.02, 0.08);
    vec3 color2 = vec3(0.0, 0.4, 0.5);
    vec3 color3 = vec3(0.0, 0.96, 0.88);
    
    vec3 color = mix(color1, color2, n);
    color = mix(color, color3, pow(n, 2.0));
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## FBM分形噪声 - 自然纹理的秘密

### 什么是FBM？

**Fractal Brownian Motion（分形布朗运动）** 是一种通过叠加多层噪声创造复杂细节的技术。

### 分形的核心思想

自然界的许多形态都是**自相似**的：
- 山脉轮廓放大后还是像山脉
- 云朵的边缘有着相似的蓬松感
- 海岸线在任何比例下都很曲折

### FBM算法

\`\`\`glsl
for(int i = 0; i < 5; i++) {
    value += amplitude * noise(p * frequency);
    frequency *= 2.0;   // 频率翻倍：细节更密
    amplitude *= 0.5;   // 振幅减半：影响更小
}
\`\`\`

每一层叫做一个**倍频程（Octave）**：

| 层 | 频率 | 振幅 | 效果 |
|----|------|------|------|
| 1 | 1x | 0.5 | 大的形状 |
| 2 | 2x | 0.25 | 中等细节 |
| 3 | 4x | 0.125 | 小细节 |
| 4 | 8x | 0.0625 | 更细节 |
| 5 | 16x | 0.03125 | 微细节 |

### 参数调节

- **层数**：更多层 = 更多细节（但更慢）
- **频率倍数**：通常2.0，称为"lacunarity"
- **振幅倍数**：通常0.5，称为"gain"或"persistence"

### 创意应用

修改FBM的输入或输出：
- 添加时间：流动效果
- 变形UV：扭曲效果
- 嵌套FBM：更复杂的图案
`,

  uniforms: ['u_time']
}

export default fbmNoise
