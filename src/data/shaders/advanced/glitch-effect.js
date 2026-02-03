/**
 * 故障艺术 - 数字美学的另一面
 * 数字故障/毛刺效果，模拟视频信号干扰的视觉风格
 */
export default {
  id: 'glitch-effect',
  title: '故障艺术',
  description: '数字故障/毛刺效果，模拟视频信号干扰的视觉风格。',
  level: 'advanced',
  tags: ['故障', '艺术', 'RGB分离'],

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

float hash(float n) {
    return fract(sin(n) * 43758.5453);
}

float hash2(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// 阶跃随机
float stepRandom(float x, float freq) {
    return hash(floor(x * freq));
}

void main() {
    vec2 uv = v_uv;
    float t = u_time;
    
    // 故障强度随时间变化
    float glitchStrength = stepRandom(t, 3.0);
    glitchStrength = pow(glitchStrength, 3.0);  // 让故障更稀疏
    
    // 水平条纹位移
    float lineOffset = 0.0;
    if(glitchStrength > 0.5) {
        float lineY = floor(uv.y * 30.0);
        lineOffset = (stepRandom(lineY + t * 10.0, 1.0) - 0.5) * 0.1;
        lineOffset *= step(0.8, stepRandom(lineY * 0.3 + t, 1.0));
    }
    
    // 整体位移
    float blockOffset = 0.0;
    if(glitchStrength > 0.7) {
        blockOffset = (stepRandom(t * 20.0, 1.0) - 0.5) * 0.05;
    }
    
    // RGB分离
    float rgbSplit = 0.0;
    if(glitchStrength > 0.3) {
        rgbSplit = stepRandom(t * 15.0, 1.0) * 0.02;
    }
    
    // 应用位移
    vec2 uvR = uv + vec2(lineOffset + blockOffset + rgbSplit, 0.0);
    vec2 uvG = uv + vec2(lineOffset + blockOffset, 0.0);
    vec2 uvB = uv + vec2(lineOffset + blockOffset - rgbSplit, 0.0);
    
    // 基础图案（可以替换为任何图像）
    // 这里创建一个简单的几何图案
    vec3 colorR = vec3(0.0);
    vec3 colorG = vec3(0.0);
    vec3 colorB = vec3(0.0);
    
    // 圆形图案
    float circle = length(uvR - 0.5);
    colorR.r = smoothstep(0.3, 0.28, circle);
    
    circle = length(uvG - 0.5);
    colorG.g = smoothstep(0.3, 0.28, circle);
    
    circle = length(uvB - 0.5);
    colorB.b = smoothstep(0.3, 0.28, circle);
    
    // 条纹背景
    float stripes = step(0.5, fract(uv.y * 50.0 + t));
    vec3 bgColor = vec3(0.1, 0.1, 0.12) + stripes * 0.02;
    
    // 组合
    vec3 color = colorR + colorG + colorB;
    color = mix(bgColor, color, max(max(colorR.r, colorG.g), colorB.b));
    
    // 扫描线
    float scanline = sin(uv.y * 400.0 + t * 10.0) * 0.04;
    color -= scanline;
    
    // 随机噪点
    float noise = hash2(uv * 500.0 + t) * 0.1;
    color += noise * glitchStrength;
    
    // 色差/颜色偏移
    if(glitchStrength > 0.6) {
        float colorShift = stepRandom(t * 8.0, 1.0);
        if(colorShift > 0.5) {
            color = color.gbr;  // 随机颜色通道交换
        }
    }
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## 故障艺术 - 数字美学的另一面

### 什么是故障艺术？

故障艺术（Glitch Art）将技术故障、信号干扰、数据损坏转化为艺术表达。它代表了对完美数字世界的反叛。

### 典型故障特征

1. **RGB分离** - 三个颜色通道错位
2. **水平撕裂** - 某些行被平移
3. **块状位移** - 大块区域跳动
4. **噪点** - 随机的彩色点
5. **扫描线** - 模拟CRT电视效果

### 时间控制的随机

\`\`\`glsl
float stepRandom(float x, float freq) {
    return hash(floor(x * freq));
}
\`\`\`

\`floor(x * freq)\` 创造"阶梯状"的时间——在特定时刻跳变而非平滑过渡。这让故障感觉更真实。

### 稀疏化故障

\`\`\`glsl
glitchStrength = pow(glitchStrength, 3.0);
\`\`\`

立方会让小值变得更小，只有接近1的值才明显。这让故障只在某些时刻发生。

### RGB分离

\`\`\`glsl
vec2 uvR = uv + vec2(rgbSplit, 0.0);
vec2 uvG = uv;
vec2 uvB = uv - vec2(rgbSplit, 0.0);
\`\`\`

对三个颜色通道使用不同的UV采样位置，造成色散效果。

### 颜色通道交换

\`\`\`glsl
color = color.gbr;  // R→G, G→B, B→R
\`\`\`

GLSL的**swizzle**语法允许任意重排向量分量。

### 创意方向

- 结合图片/视频
- 音频响应的故障
- 鼠标触发的故障
- 与其他效果叠加
`,

  uniforms: ['u_time']
}
