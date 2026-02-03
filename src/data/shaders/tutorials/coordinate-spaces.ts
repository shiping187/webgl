/**
 * 坐标空间与变换 - 理解Shader中的坐标系统
 * 可视化展示不同坐标空间及其变换关系
 */
import type { ShaderExample } from '../../../types'

const coordinateSpaces: ShaderExample = {
  id: 'coordinate-spaces',
  title: '坐标空间与变换',
  description: '深入理解Shader中的各种坐标空间：NDC、UV、屏幕空间，以及它们之间的变换。',
  level: 'intermediate',
  tags: ['坐标', '变换', 'NDC', 'UV', '教学'],

  vertexShader: /* wgsl */ `
attribute vec2 a_position;
varying vec2 v_position;  // 原始NDC坐标 [-1, 1]
varying vec2 v_uv;        // UV坐标 [0, 1]

void main() {
    // 保存原始NDC坐标用于可视化
    v_position = a_position;
    
    // 转换为UV坐标
    v_uv = a_position * 0.5 + 0.5;
    
    gl_Position = vec4(a_position, 0.0, 1.0);
}`,

  fragmentShader: /* wgsl */ `
precision mediump float;

varying vec2 v_position;  // NDC: [-1, 1]
varying vec2 v_uv;        // UV: [0, 1]

uniform float u_time;
uniform vec2 u_resolution;

// ============================================
// 辅助函数
// ============================================

// 绘制坐标轴
float drawAxis(vec2 p, float thickness) {
    float xAxis = smoothstep(thickness, 0.0, abs(p.y));
    float yAxis = smoothstep(thickness, 0.0, abs(p.x));
    return max(xAxis, yAxis);
}

// 绘制网格
float drawGrid(vec2 p, float spacing, float thickness) {
    vec2 grid = abs(fract(p / spacing) - 0.5) * 2.0 * spacing;
    float lines = min(grid.x, grid.y);
    return smoothstep(thickness, 0.0, lines);
}

// 绘制数字刻度（简化版）
float drawTick(vec2 p, float spacing, float size) {
    vec2 grid = abs(fract(p / spacing + 0.5) - 0.5) * 2.0 * spacing;
    float tick = smoothstep(size, 0.0, min(abs(p.x), abs(p.y)));
    tick *= step(grid.x + grid.y, spacing * 0.2);
    return tick;
}

// 绘制圆形
float circle(vec2 p, vec2 center, float radius) {
    return smoothstep(radius + 0.02, radius, length(p - center));
}

void main() {
    vec2 ndc = v_position;  // [-1, 1]
    vec2 uv = v_uv;         // [0, 1]
    
    // 屏幕像素坐标
    vec2 pixel = gl_FragCoord.xy;
    
    // 宽高比校正的坐标
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 centered = (uv - 0.5) * aspect;
    
    vec3 color = vec3(0.05, 0.05, 0.08);  // 深色背景
    
    // ============================================
    // 可视化四种坐标空间
    // ============================================
    
    // 分成四个区域（模拟四视图）
    vec2 quadrant = floor(uv * 2.0);
    vec2 localUV = fract(uv * 2.0);
    vec2 localNDC = localUV * 2.0 - 1.0;
    
    if (quadrant.x == 0.0 && quadrant.y == 1.0) {
        // 【左上】NDC空间演示 (-1 to 1)
        
        // 网格
        float grid = drawGrid(localNDC, 0.5, 0.01);
        color += vec3(0.1, 0.2, 0.3) * grid;
        
        // 坐标轴（红X，绿Y）
        float axis = drawAxis(localNDC, 0.02);
        vec3 axisColor = mix(vec3(0.8, 0.2, 0.2), vec3(0.2, 0.8, 0.2), 
                             step(abs(localNDC.y), abs(localNDC.x)));
        color = mix(color, axisColor, axis);
        
        // 动态点
        float t = u_time * 0.5;
        vec2 point = vec2(sin(t), cos(t * 0.7)) * 0.6;
        color = mix(color, vec3(0.0, 0.96, 0.88), circle(localNDC, point, 0.08));
        
        // 标题区域
        if (localUV.y > 0.9) {
            color = vec3(0.1, 0.1, 0.15);
        }
    }
    else if (quadrant.x == 1.0 && quadrant.y == 1.0) {
        // 【右上】UV空间演示 (0 to 1)
        
        // 网格
        float grid = drawGrid(localUV, 0.25, 0.005);
        color += vec3(0.2, 0.15, 0.25) * grid;
        
        // 颜色编码UV
        color = mix(color, vec3(localUV, 0.5), 0.3);
        
        // 边界框
        float border = step(0.98, max(localUV.x, localUV.y)) + 
                       step(localUV.x, 0.02) + step(localUV.y, 0.02);
        color = mix(color, vec3(1.0, 0.8, 0.0), border);
        
        // 动态点
        float t = u_time * 0.5;
        vec2 point = vec2(sin(t) * 0.3 + 0.5, cos(t * 0.7) * 0.3 + 0.5);
        color = mix(color, vec3(0.96, 0.4, 0.4), circle(localUV, point, 0.04));
        
        if (localUV.y > 0.9) color = vec3(0.1, 0.1, 0.15);
    }
    else if (quadrant.x == 0.0 && quadrant.y == 0.0) {
        // 【左下】极坐标演示
        
        vec2 polar_center = localNDC;
        float radius = length(polar_center);
        float angle = atan(polar_center.y, polar_center.x);
        
        // 同心圆
        float circles = smoothstep(0.02, 0.0, abs(fract(radius * 4.0) - 0.5) - 0.4);
        color += vec3(0.0, 0.4, 0.5) * circles;
        
        // 放射线
        float rays = smoothstep(0.02, 0.0, abs(fract(angle / 3.14159 * 4.0) - 0.5) - 0.4);
        color += vec3(0.4, 0.2, 0.5) * rays * step(radius, 0.9);
        
        // 中心标记
        color = mix(color, vec3(1.0, 1.0, 0.0), circle(polar_center, vec2(0.0), 0.05));
        
        // 动态旋转点
        float t = u_time;
        vec2 rotPoint = vec2(cos(t), sin(t)) * 0.5;
        color = mix(color, vec3(0.0, 0.96, 0.88), circle(polar_center, rotPoint, 0.06));
        
        if (localUV.y > 0.9) color = vec3(0.1, 0.1, 0.15);
    }
    else {
        // 【右下】屏幕空间/像素坐标演示
        
        // 像素网格（当放大时可见）
        vec2 pixelGrid = fract(gl_FragCoord.xy / 10.0);
        float grid = step(0.9, max(pixelGrid.x, pixelGrid.y));
        color += vec3(0.15, 0.15, 0.2) * grid;
        
        // 基于像素坐标的图案
        float pattern = mod(floor(gl_FragCoord.x / 20.0) + floor(gl_FragCoord.y / 20.0), 2.0);
        color = mix(color, vec3(0.2, 0.3, 0.4), pattern * 0.3);
        
        // 对角线（演示gl_FragCoord）
        float diag = smoothstep(5.0, 0.0, abs(gl_FragCoord.x - gl_FragCoord.y + 200.0 * sin(u_time)));
        color = mix(color, vec3(0.8, 0.4, 0.2), diag);
        
        if (localUV.y > 0.9) color = vec3(0.1, 0.1, 0.15);
    }
    
    // 象限分割线
    float divider = smoothstep(0.005, 0.0, abs(uv.x - 0.5)) + 
                    smoothstep(0.005, 0.0, abs(uv.y - 0.5));
    color = mix(color, vec3(0.5, 0.5, 0.6), divider);
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## 坐标空间与变换 - Shader中的数学基础

### 为什么需要不同的坐标空间？

不同的坐标空间为不同的任务优化：
- **NDC**：标准化，GPU可直接使用
- **UV**：纹理采样，范围直观
- **屏幕空间**：后处理效果
- **极坐标**：圆形/旋转效果

### 四种常见坐标空间

#### 1. NDC（归一化设备坐标）
\`\`\`
范围：x ∈ [-1, 1], y ∈ [-1, 1]
原点：画面中心
用途：GPU裁剪、顶点定义
\`\`\`

这是 \`gl_Position\` 所使用的坐标空间。

#### 2. UV/纹理坐标
\`\`\`
范围：u ∈ [0, 1], v ∈ [0, 1]
原点：左下角
用途：纹理采样、图案生成
\`\`\`

从NDC到UV的转换：
\`\`\`glsl
vec2 uv = ndc * 0.5 + 0.5;
\`\`\`

#### 3. 极坐标
\`\`\`
参数：radius（半径）, angle（角度）
原点：自定义（通常是中心）
用途：旋转效果、放射图案
\`\`\`

笛卡尔到极坐标：
\`\`\`glsl
float radius = length(p);
float angle = atan(p.y, p.x);  // 范围 [-π, π]
\`\`\`

#### 4. 屏幕/像素坐标
\`\`\`
范围：x ∈ [0, width], y ∈ [0, height]
原点：左下角（WebGL）
用途：像素级效果、抖动
\`\`\`

使用内置变量 \`gl_FragCoord\`。

### 坐标变换矩阵

常见的2D变换：

**平移**
\`\`\`glsl
vec2 translated = p + offset;
\`\`\`

**缩放**
\`\`\`glsl
vec2 scaled = p * scale;
\`\`\`

**旋转**
\`\`\`glsl
mat2 rotate(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
}
vec2 rotated = rotate(angle) * p;
\`\`\`

### 宽高比校正

当画布不是正方形时，圆会变成椭圆！解决方案：

\`\`\`glsl
float aspect = u_resolution.x / u_resolution.y;
vec2 p = uv;
p.x *= aspect;  // 校正X轴
\`\`\`

### 四个象限演示

| 位置 | 坐标空间 | 特点 |
|------|----------|------|
| 左上 | NDC | 中心为原点，范围-1到1 |
| 右上 | UV | 左下为原点，范围0到1 |
| 左下 | 极坐标 | 半径+角度描述位置 |
| 右下 | 屏幕空间 | 像素为单位 |

### 选择坐标空间的原则

1. **居中效果**（如圆形）→ 使用以中心为原点的坐标
2. **纹理采样** → 使用UV坐标
3. **旋转/放射效果** → 使用极坐标
4. **像素级精确控制** → 使用屏幕坐标
`,

  uniforms: ['u_time', 'u_resolution']
}

export default coordinateSpaces
