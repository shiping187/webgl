/**
 * 后处理效果原理 - 图像特效的数学
 * 展示常见后处理效果的实现原理
 */
import type { ShaderExample } from '../../../types'

const postProcessing: ShaderExample = {
  id: 'post-processing',
  title: '后处理效果原理',
  description: '学习常见后处理效果：模糊、锐化、边缘检测、色调映射、暗角等的实现原理。',
  level: 'advanced',
  tags: ['后处理', '模糊', '边缘检测', '卷积', '教学'],

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
uniform vec2 u_resolution;

// ============================================
// 生成测试图像
// ============================================
vec3 sampleScene(vec2 uv) {
    // 创建一个有细节的测试图案
    vec3 color = vec3(0.0);
    
    // 棋盘格
    vec2 checker = floor(uv * 8.0);
    float pattern = mod(checker.x + checker.y, 2.0);
    color = mix(vec3(0.2, 0.3, 0.4), vec3(0.4, 0.5, 0.6), pattern);
    
    // 圆形
    float circle = smoothstep(0.32, 0.3, length(uv - 0.5));
    color = mix(color, vec3(0.0, 0.8, 0.75), circle);
    
    // 添加一些小细节
    float details = sin(uv.x * 50.0) * sin(uv.y * 50.0) * 0.1;
    color += details;
    
    return color;
}

// ============================================
// 后处理效果函数
// ============================================

// 高斯模糊（简化版 - 9个采样点）
vec3 gaussianBlur(vec2 uv, float radius) {
    vec2 texelSize = 1.0 / u_resolution;
    
    vec3 result = vec3(0.0);
    float total = 0.0;
    
    // 3x3 高斯核
    for(float x = -1.0; x <= 1.0; x += 1.0) {
        for(float y = -1.0; y <= 1.0; y += 1.0) {
            vec2 offset = vec2(x, y) * texelSize * radius;
            // 高斯权重
            float weight = exp(-(x*x + y*y) / 2.0);
            result += sampleScene(uv + offset) * weight;
            total += weight;
        }
    }
    
    return result / total;
}

// Sobel边缘检测
float sobelEdge(vec2 uv) {
    vec2 texelSize = 1.0 / u_resolution;
    
    // 采样3x3邻域的亮度
    float tl = dot(sampleScene(uv + texelSize * vec2(-1, 1)), vec3(0.299, 0.587, 0.114));
    float t  = dot(sampleScene(uv + texelSize * vec2(0, 1)), vec3(0.299, 0.587, 0.114));
    float tr = dot(sampleScene(uv + texelSize * vec2(1, 1)), vec3(0.299, 0.587, 0.114));
    float l  = dot(sampleScene(uv + texelSize * vec2(-1, 0)), vec3(0.299, 0.587, 0.114));
    float r  = dot(sampleScene(uv + texelSize * vec2(1, 0)), vec3(0.299, 0.587, 0.114));
    float bl = dot(sampleScene(uv + texelSize * vec2(-1, -1)), vec3(0.299, 0.587, 0.114));
    float b  = dot(sampleScene(uv + texelSize * vec2(0, -1)), vec3(0.299, 0.587, 0.114));
    float br = dot(sampleScene(uv + texelSize * vec2(1, -1)), vec3(0.299, 0.587, 0.114));
    
    // Sobel算子
    float gx = -tl - 2.0*l - bl + tr + 2.0*r + br;
    float gy = -tl - 2.0*t - tr + bl + 2.0*b + br;
    
    return sqrt(gx*gx + gy*gy);
}

// 锐化
vec3 sharpen(vec2 uv, float strength) {
    vec2 texelSize = 1.0 / u_resolution;
    
    vec3 center = sampleScene(uv);
    vec3 blur = (
        sampleScene(uv + texelSize * vec2(-1, 0)) +
        sampleScene(uv + texelSize * vec2(1, 0)) +
        sampleScene(uv + texelSize * vec2(0, -1)) +
        sampleScene(uv + texelSize * vec2(0, 1))
    ) * 0.25;
    
    // 锐化 = 原图 + (原图 - 模糊) * 强度
    return center + (center - blur) * strength;
}

// 暗角效果
vec3 vignette(vec3 color, vec2 uv, float amount) {
    float dist = length(uv - 0.5);
    float vig = 1.0 - smoothstep(0.3, 0.8, dist * amount);
    return color * vig;
}

// 色调映射（简化的ACES）
vec3 toneMapping(vec3 color) {
    // 简化的ACES色调映射
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((color * (a * color + b)) / (color * (c * color + d) + e), 0.0, 1.0);
}

// 色彩分离（RGB偏移）
vec3 chromaticAberration(vec2 uv, float amount) {
    vec2 dir = (uv - 0.5) * amount;
    vec3 color;
    color.r = sampleScene(uv + dir).r;
    color.g = sampleScene(uv).g;
    color.b = sampleScene(uv - dir).b;
    return color;
}

void main() {
    // 分成2x3网格
    vec2 grid = floor(v_uv * vec2(2.0, 3.0));
    vec2 localUV = fract(v_uv * vec2(2.0, 3.0));
    
    vec3 color = vec3(0.0);
    float t = u_time;
    
    if (grid.x == 0.0 && grid.y == 2.0) {
        // 【左上】原始图像
        color = sampleScene(localUV);
    }
    else if (grid.x == 1.0 && grid.y == 2.0) {
        // 【右上】高斯模糊
        float blurAmount = (sin(t) * 0.5 + 0.5) * 5.0 + 1.0;
        color = gaussianBlur(localUV, blurAmount);
    }
    else if (grid.x == 0.0 && grid.y == 1.0) {
        // 【左中】边缘检测
        float edge = sobelEdge(localUV);
        color = vec3(edge);
        // 上色
        color = mix(vec3(0.02, 0.02, 0.05), vec3(0.0, 0.96, 0.88), edge);
    }
    else if (grid.x == 1.0 && grid.y == 1.0) {
        // 【右中】锐化
        float sharpAmount = sin(t) * 2.0 + 2.0;
        color = sharpen(localUV, sharpAmount);
    }
    else if (grid.x == 0.0 && grid.y == 0.0) {
        // 【左下】暗角 + 色调映射
        color = sampleScene(localUV);
        color = vignette(color, localUV, 2.0);
        color = toneMapping(color * 1.5);
    }
    else if (grid.x == 1.0 && grid.y == 0.0) {
        // 【右下】色彩分离
        float aberration = (sin(t * 2.0) * 0.5 + 0.5) * 0.02;
        color = chromaticAberration(localUV, aberration);
    }
    
    // 网格分割线
    float gridLine = smoothstep(0.01, 0.0, min(
        min(localUV.x, 1.0 - localUV.x),
        min(localUV.y, 1.0 - localUV.y)
    ));
    color = mix(color, vec3(0.3), gridLine);
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## 后处理效果原理 - 图像特效的数学

### 什么是后处理？

后处理（Post-Processing）是在3D场景渲染完成后，对整个画面进行的图像处理。就像照片的滤镜一样。

### 核心概念：卷积

大多数后处理效果基于**卷积**操作：用一个小矩阵（核/kernel）在图像上滑动，计算加权平均。

\`\`\`
结果 = Σ(邻域像素 × 对应权重)
\`\`\`

### 高斯模糊

最常见的模糊效果，使用高斯函数作为权重。

\`\`\`glsl
float weight = exp(-(x*x + y*y) / 2.0);
\`\`\`

**高斯核示例（3x3）**：
\`\`\`
[1 2 1]      归一化后：  [1/16 2/16 1/16]
[2 4 2]  →              [2/16 4/16 2/16]
[1 2 1]                 [1/16 2/16 1/16]
\`\`\`

### Sobel边缘检测

检测图像中亮度变化剧烈的区域。

**Sobel算子**：
\`\`\`
Gx（水平）：        Gy（垂直）：
[-1 0 +1]          [-1 -2 -1]
[-2 0 +2]          [ 0  0  0]
[-1 0 +1]          [+1 +2 +1]

边缘强度 = sqrt(Gx² + Gy²)
\`\`\`

### 锐化

增强边缘，让图像更清晰。

原理：原图 + (原图 - 模糊图) × 强度

\`\`\`glsl
vec3 sharp = center + (center - blur) * strength;
\`\`\`

实际上是在**增强高频信息**。

### 暗角（Vignette）

让画面边缘变暗，聚焦中心。

\`\`\`glsl
float dist = length(uv - 0.5);
float vig = 1.0 - smoothstep(0.3, 0.8, dist);
color *= vig;
\`\`\`

模拟老式相机镜头的光学特性。

### 色调映射（Tone Mapping）

将HDR（高动态范围）颜色压缩到屏幕可显示的范围。

**ACES色调映射**（电影工业标准）：
\`\`\`glsl
color = (color * (2.51 * color + 0.03)) / 
        (color * (2.43 * color + 0.59) + 0.14);
\`\`\`

### 色彩分离（Chromatic Aberration）

模拟镜头的色散缺陷，RGB三通道采样位置略有偏移。

\`\`\`glsl
color.r = sampleScene(uv + dir).r;
color.g = sampleScene(uv).g;
color.b = sampleScene(uv - dir).b;
\`\`\`

常用于科幻/赛博朋克风格。

### 六个演示区域

| 位置 | 效果 | 应用场景 |
|------|------|----------|
| 左上 | 原始图像 | 对比参考 |
| 右上 | 高斯模糊 | 景深、辉光 |
| 左中 | 边缘检测 | 卡通风格、特殊效果 |
| 右中 | 锐化 | 提升细节 |
| 左下 | 暗角+色调映射 | 电影感 |
| 右下 | 色彩分离 | 故障/科幻风格 |

### 性能考虑

后处理通常是**全屏效果**，每个像素都需要计算。

优化技巧：
- 降采样后处理，再升采样
- 分离式卷积（先水平后垂直）
- 使用GPU纹理采样硬件
`,

  uniforms: ['u_time', 'u_resolution']
}

export default postProcessing
