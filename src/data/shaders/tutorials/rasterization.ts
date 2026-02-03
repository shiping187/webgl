/**
 * 光栅化与插值原理 - 从三角形到像素的神奇转换
 * 深入理解GPU如何将连续几何体转换为离散像素
 */
import type { ShaderExample } from '../../../types'

const rasterization: ShaderExample = {
  id: 'rasterization',
  title: '光栅化与插值原理',
  description: '深入理解光栅化过程：三角形覆盖测试、重心坐标计算、透视正确插值的完整数学原理。',
  level: 'advanced',
  tags: ['光栅化', '重心坐标', '插值', '教学'],

  vertexShader: /* glsl */ `
// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                        光栅化前的顶点准备                                   ║
// ╚════════════════════════════════════════════════════════════════════════════╝

attribute vec2 a_position;

varying vec2 v_uv;
varying vec2 v_ndcPos;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_uv = a_position * 0.5 + 0.5;
    v_ndcPos = a_position;
    
    // ════════════════════════════════════════════════════════════
    // 【顶点着色器之后，光栅化之前】
    // ════════════════════════════════════════════════════════════
    // 
    // 此时GPU已经完成了：
    // 1. 所有顶点的变换计算
    // 2. 图元装配（连接顶点成三角形）
    // 3. 裁剪测试
    // 4. 透视除法 → NDC坐标
    // 5. 视口变换 → 屏幕坐标
    //
    // 接下来进入光栅化阶段...
}`,

  fragmentShader: /* glsl */ `
// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    光栅化原理可视化 - 从三角形到像素                        ║
// ╚════════════════════════════════════════════════════════════════════════════╝

precision highp float;

varying vec2 v_uv;
varying vec2 v_ndcPos;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

// ============================================
// 重心坐标计算 - 光栅化的核心！
// ============================================
//
// 重心坐标 (λ0, λ1, λ2) 满足：
// - P = λ0*V0 + λ1*V1 + λ2*V2
// - λ0 + λ1 + λ2 = 1
//
// 如果所有 λ >= 0，点P在三角形内部

vec3 barycentric(vec2 p, vec2 v0, vec2 v1, vec2 v2) {
    vec2 v0v1 = v1 - v0;
    vec2 v0v2 = v2 - v0;
    vec2 v0p = p - v0;
    
    float d00 = dot(v0v1, v0v1);
    float d01 = dot(v0v1, v0v2);
    float d11 = dot(v0v2, v0v2);
    float d20 = dot(v0p, v0v1);
    float d21 = dot(v0p, v0v2);
    
    float denom = d00 * d11 - d01 * d01;
    
    float v = (d11 * d20 - d01 * d21) / denom;
    float w = (d00 * d21 - d01 * d20) / denom;
    float u = 1.0 - v - w;
    
    return vec3(u, v, w);
}

// 边函数 - 另一种三角形内部测试方法
// 对于三角形边 V0→V1，计算点P在哪一侧
float edgeFunction(vec2 v0, vec2 v1, vec2 p) {
    return (p.x - v0.x) * (v1.y - v0.y) - (p.y - v0.y) * (v1.x - v0.x);
}

// 辅助绘图函数
float drawPoint(vec2 p, vec2 center, float radius) {
    return smoothstep(radius + 0.005, radius - 0.005, length(p - center));
}

float drawLine(vec2 p, vec2 a, vec2 b, float thickness) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return smoothstep(thickness + 0.003, thickness, length(pa - ba * h));
}

float drawGrid(vec2 p, float size, float thickness) {
    vec2 grid = abs(fract(p / size - 0.5) - 0.5) * size;
    return smoothstep(thickness + 0.002, thickness, min(grid.x, grid.y));
}

float drawCircle(vec2 p, vec2 center, float radius, float thickness) {
    return smoothstep(thickness, 0.0, abs(length(p - center) - radius));
}

void main() {
    vec2 uv = v_uv;
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    
    vec3 color = vec3(0.015, 0.02, 0.04);
    
    // 分成上下两个主区域
    bool isTop = uv.y > 0.5;
    
    // ════════════════════════════════════════════════════════════
    // 【上半部分】像素级光栅化演示
    // ════════════════════════════════════════════════════════════
    if (isTop) {
        vec2 topUV = vec2(uv.x, (uv.y - 0.5) * 2.0);
        
        // 像素网格参数
        float pixelCount = 16.0;
        vec2 pixelUV = topUV * pixelCount;
        vec2 pixelCoord = floor(pixelUV);
        vec2 pixelCenter = (pixelCoord + 0.5) / pixelCount;
        vec2 localPixel = fract(pixelUV);
        
        // 定义演示三角形（在像素坐标中）
        float t = u_time * 0.3;
        vec2 triV0 = vec2(3.0, 3.0);
        vec2 triV1 = vec2(13.0, 4.0 + sin(t) * 2.0);
        vec2 triV2 = vec2(7.0, 13.0 + cos(t * 0.7) * 1.5);
        
        // 绘制像素网格
        float gridLine = drawGrid(topUV, 1.0 / pixelCount, 0.002);
        color = mix(color, vec3(0.1, 0.12, 0.18), gridLine);
        
        // 检测当前像素是否被三角形覆盖
        // 使用像素中心点测试
        vec3 bary = barycentric(pixelCoord + 0.5, triV0, triV1, triV2);
        bool inside = bary.x >= 0.0 && bary.y >= 0.0 && bary.z >= 0.0;
        
        if (inside) {
            // 被覆盖的像素 - 使用重心坐标着色
            vec3 c0 = vec3(1.0, 0.2, 0.2);  // V0: 红
            vec3 c1 = vec3(0.2, 1.0, 0.2);  // V1: 绿
            vec3 c2 = vec3(0.2, 0.2, 1.0);  // V2: 蓝
            
            // 重心坐标插值
            vec3 interpColor = c0 * bary.x + c1 * bary.y + c2 * bary.z;
            
            // 像素填充动画
            float fillDelay = (pixelCoord.x + pixelCoord.y) * 0.05;
            float fillPhase = fract(u_time * 0.5 - fillDelay);
            float fillAmount = smoothstep(0.0, 0.3, fillPhase);
            
            // 填充像素（带边距）
            float pixelFill = step(0.08, localPixel.x) * step(localPixel.x, 0.92) *
                              step(0.08, localPixel.y) * step(localPixel.y, 0.92);
            
            color = mix(color, interpColor * 0.85, pixelFill * fillAmount);
            
            // 显示像素中心采样点
            float samplePoint = drawPoint(topUV, pixelCenter, 0.008);
            color = mix(color, vec3(1.0, 1.0, 0.5), samplePoint);
        } else {
            // 未覆盖的像素 - 淡色背景
            float pixelBg = step(0.1, localPixel.x) * step(localPixel.x, 0.9) *
                            step(0.1, localPixel.y) * step(localPixel.y, 0.9);
            color = mix(color, vec3(0.04, 0.05, 0.08), pixelBg);
        }
        
        // 绘制三角形轮廓
        vec2 tv0 = triV0 / pixelCount;
        vec2 tv1 = triV1 / pixelCount;
        vec2 tv2 = triV2 / pixelCount;
        
        float triEdge = 0.0;
        triEdge = max(triEdge, drawLine(topUV, tv0, tv1, 0.008));
        triEdge = max(triEdge, drawLine(topUV, tv1, tv2, 0.008));
        triEdge = max(triEdge, drawLine(topUV, tv2, tv0, 0.008));
        color = mix(color, vec3(1.0, 0.8, 0.3), triEdge);
        
        // 绘制顶点
        color = mix(color, vec3(1.0, 0.3, 0.3), drawPoint(topUV, tv0, 0.02));
        color = mix(color, vec3(0.3, 1.0, 0.3), drawPoint(topUV, tv1, 0.02));
        color = mix(color, vec3(0.3, 0.3, 1.0), drawPoint(topUV, tv2, 0.02));
    }
    
    // ════════════════════════════════════════════════════════════
    // 【下半部分】分成左右两个区域
    // ════════════════════════════════════════════════════════════
    else {
        vec2 bottomUV = vec2(uv.x, uv.y * 2.0);
        bool isLeft = uv.x < 0.5;
        
        // ============================================
        // 【左下】重心坐标可视化
        // ============================================
        if (isLeft) {
            vec2 leftUV = vec2(uv.x * 2.0, bottomUV.y);
            vec2 p = (leftUV - 0.5) * 2.0 * vec2(0.9, 0.9);
            
            color = vec3(0.02, 0.03, 0.06);
            
            // 三角形顶点
            vec2 v0 = vec2(-0.6, -0.5);
            vec2 v1 = vec2(0.7, -0.4);
            vec2 v2 = vec2(0.0, 0.65);
            
            // 计算重心坐标
            vec3 bary = barycentric(p, v0, v1, v2);
            bool inside = bary.x >= 0.0 && bary.y >= 0.0 && bary.z >= 0.0;
            
            // 绘制三角形背景
            if (inside) {
                // 显示重心坐标等值线
                float iso0 = smoothstep(0.015, 0.0, abs(fract(bary.x * 10.0) - 0.5) - 0.45);
                float iso1 = smoothstep(0.015, 0.0, abs(fract(bary.y * 10.0) - 0.5) - 0.45);
                float iso2 = smoothstep(0.015, 0.0, abs(fract(bary.z * 10.0) - 0.5) - 0.45);
                
                // 重心坐标着色
                vec3 fillColor = vec3(bary.x, bary.y, bary.z);
                color = mix(vec3(0.1), fillColor, 0.7);
                
                // 添加等值线
                color = mix(color, vec3(1.0, 0.6, 0.6), iso0 * 0.4);
                color = mix(color, vec3(0.6, 1.0, 0.6), iso1 * 0.4);
                color = mix(color, vec3(0.6, 0.6, 1.0), iso2 * 0.4);
                
                // 重心点（λ0=λ1=λ2=1/3）
                vec2 centroid = (v0 + v1 + v2) / 3.0;
                float centroidDot = drawPoint(p, centroid, 0.03);
                color = mix(color, vec3(1.0, 1.0, 0.0), centroidDot);
            }
            
            // 绘制三角形边
            float edge = 0.0;
            edge = max(edge, drawLine(p, v0, v1, 0.012));
            edge = max(edge, drawLine(p, v1, v2, 0.012));
            edge = max(edge, drawLine(p, v2, v0, 0.012));
            color = mix(color, vec3(0.8, 0.85, 0.9), edge);
            
            // 绘制从各顶点到对边的中线
            vec2 m0 = (v1 + v2) * 0.5;  // V1V2中点
            vec2 m1 = (v0 + v2) * 0.5;  // V0V2中点
            vec2 m2 = (v0 + v1) * 0.5;  // V0V1中点
            
            float median = 0.0;
            median = max(median, drawLine(p, v0, m0, 0.005));
            median = max(median, drawLine(p, v1, m1, 0.005));
            median = max(median, drawLine(p, v2, m2, 0.005));
            color = mix(color, vec3(0.5, 0.5, 0.6), median * 0.5);
            
            // 顶点标记
            color = mix(color, vec3(1.0, 0.3, 0.3), drawPoint(p, v0, 0.04));
            color = mix(color, vec3(0.3, 1.0, 0.3), drawPoint(p, v1, 0.04));
            color = mix(color, vec3(0.3, 0.3, 1.0), drawPoint(p, v2, 0.04));
            
            // 鼠标位置显示重心坐标
            vec2 mousePos = u_mouse / u_resolution;
            if (mousePos.x < 0.5 && mousePos.y < 0.5) {
                vec2 mouseP = (mousePos * vec2(2.0, 2.0) - 0.5) * 2.0 * vec2(0.9, 0.9);
                vec3 mouseBary = barycentric(mouseP, v0, v1, v2);
                
                if (length(p - mouseP) < 0.05) {
                    color = mix(color, vec3(1.0, 1.0, 0.0), 0.8);
                }
            }
        }
        
        // ============================================
        // 【右下】边函数与覆盖测试
        // ============================================
        else {
            vec2 rightUV = vec2((uv.x - 0.5) * 2.0, bottomUV.y);
            vec2 p = (rightUV - 0.5) * 2.0 * vec2(0.9, 0.9);
            
            color = vec3(0.02, 0.025, 0.05);
            
            // 三角形顶点（顺时针）
            vec2 v0 = vec2(-0.5, -0.5);
            vec2 v1 = vec2(0.6, -0.3);
            vec2 v2 = vec2(0.1, 0.6);
            
            // 计算三条边的边函数值
            float e0 = edgeFunction(v0, v1, p);  // V0→V1
            float e1 = edgeFunction(v1, v2, p);  // V1→V2
            float e2 = edgeFunction(v2, v0, p);  // V2→V0
            
            // 标准化边函数用于可视化
            float maxE = 0.5;
            
            // 显示边函数值（正/负区域）
            // 边0的影响区域
            float e0Vis = e0 / maxE;
            vec3 e0Color = e0 > 0.0 ? vec3(0.3, 0.1, 0.1) : vec3(0.1, 0.3, 0.1);
            color = mix(color, e0Color, 0.15);
            
            // 三角形内部（所有边函数同号）
            bool inside = (e0 >= 0.0 && e1 >= 0.0 && e2 >= 0.0) ||
                          (e0 <= 0.0 && e1 <= 0.0 && e2 <= 0.0);
            
            if (inside) {
                // 内部高亮
                color = vec3(0.15, 0.25, 0.35);
                
                // 显示到各边的相对距离
                float totalArea = abs(e0) + abs(e1) + abs(e2);
                float dist0 = abs(e0) / totalArea;
                float dist1 = abs(e1) / totalArea;
                float dist2 = abs(e2) / totalArea;
                
                // 着色
                color = vec3(dist0 * 0.8 + 0.2, dist1 * 0.8 + 0.2, dist2 * 0.8 + 0.2);
            }
            
            // 绘制边和对应的法线方向指示
            float edge = 0.0;
            edge = max(edge, drawLine(p, v0, v1, 0.01));
            edge = max(edge, drawLine(p, v1, v2, 0.01));
            edge = max(edge, drawLine(p, v2, v0, 0.01));
            color = mix(color, vec3(0.9), edge);
            
            // 绘制边的外向法线
            vec2 mid01 = (v0 + v1) * 0.5;
            vec2 mid12 = (v1 + v2) * 0.5;
            vec2 mid20 = (v2 + v0) * 0.5;
            
            vec2 n01 = normalize(vec2(v1.y - v0.y, v0.x - v1.x)) * 0.12;
            vec2 n12 = normalize(vec2(v2.y - v1.y, v1.x - v2.x)) * 0.12;
            vec2 n20 = normalize(vec2(v0.y - v2.y, v2.x - v0.x)) * 0.12;
            
            float normal = 0.0;
            normal = max(normal, drawLine(p, mid01, mid01 + n01, 0.008));
            normal = max(normal, drawLine(p, mid12, mid12 + n12, 0.008));
            normal = max(normal, drawLine(p, mid20, mid20 + n20, 0.008));
            color = mix(color, vec3(1.0, 0.6, 0.2), normal);
            
            // 顶点
            color = mix(color, vec3(1.0, 0.4, 0.4), drawPoint(p, v0, 0.035));
            color = mix(color, vec3(0.4, 1.0, 0.4), drawPoint(p, v1, 0.035));
            color = mix(color, vec3(0.4, 0.4, 1.0), drawPoint(p, v2, 0.035));
            
            // 边缘指示符号
            float e0Sign = step(0.0, e0);
            float e1Sign = step(0.0, e1);
            float e2Sign = step(0.0, e2);
        }
        
        // 分割线
        float divider = smoothstep(0.006, 0.0, abs(uv.x - 0.5)) * step(uv.y, 0.5);
        color = mix(color, vec3(0.4, 0.45, 0.5), divider);
    }
    
    // 主分割线
    float mainDivider = smoothstep(0.006, 0.0, abs(uv.y - 0.5));
    color = mix(color, vec3(0.5, 0.55, 0.6), mainDivider);
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## 光栅化与插值原理 - 从三角形到像素的神奇转换

### 🎯 光栅化是什么？

光栅化（Rasterization）是将连续的几何图元（三角形、线段等）转换为离散像素的过程。这是GPU硬件实现的，非常高效。

---

## 光栅化的核心问题

### 问题1：哪些像素被覆盖？

对于每个像素，需要判断其中心点是否在三角形内部。

### 问题2：覆盖的像素如何着色？

需要根据像素位置，对顶点属性进行插值。

---

## 三角形覆盖测试方法

### 方法一：重心坐标法

\`\`\`glsl
vec3 barycentric(vec2 p, vec2 v0, vec2 v1, vec2 v2) {
    // 计算重心坐标 (λ0, λ1, λ2)
    // 满足: P = λ0*V0 + λ1*V1 + λ2*V2
    // 且: λ0 + λ1 + λ2 = 1
    
    vec2 v0v1 = v1 - v0;
    vec2 v0v2 = v2 - v0;
    vec2 v0p = p - v0;
    
    float d00 = dot(v0v1, v0v1);
    float d01 = dot(v0v1, v0v2);
    float d11 = dot(v0v2, v0v2);
    float d20 = dot(v0p, v0v1);
    float d21 = dot(v0p, v0v2);
    
    float denom = d00 * d11 - d01 * d01;
    float v = (d11 * d20 - d01 * d21) / denom;
    float w = (d00 * d21 - d01 * d20) / denom;
    float u = 1.0 - v - w;
    
    return vec3(u, v, w);
}

// 测试是否在三角形内
bool inside = (bary.x >= 0.0 && bary.y >= 0.0 && bary.z >= 0.0);
\`\`\`

### 方法二：边函数法

\`\`\`glsl
// 边函数：计算点P相对于边V0→V1的位置
float edgeFunction(vec2 v0, vec2 v1, vec2 p) {
    return (p.x - v0.x) * (v1.y - v0.y) - 
           (p.y - v0.y) * (v1.x - v0.x);
}

// 测试三条边
float e0 = edgeFunction(v0, v1, p);
float e1 = edgeFunction(v1, v2, p);
float e2 = edgeFunction(v2, v0, p);

// 所有边函数同号 → 在三角形内
bool inside = (e0 >= 0 && e1 >= 0 && e2 >= 0) ||
              (e0 <= 0 && e1 <= 0 && e2 <= 0);
\`\`\`

**优势**：边函数可以增量计算，适合硬件并行

---

## 重心坐标插值 ⭐⭐⭐

### 核心公式

\`\`\`
属性值(P) = λ0 × 属性(V0) + λ1 × 属性(V1) + λ2 × 属性(V2)
\`\`\`

### 几何意义

| 坐标 | 含义 | 范围 |
|-----|------|------|
| λ0 | 点P到边V1V2的相对距离 | [0, 1] |
| λ1 | 点P到边V0V2的相对距离 | [0, 1] |
| λ2 | 点P到边V0V1的相对距离 | [0, 1] |

### 特殊点

| 位置 | 重心坐标 |
|-----|---------|
| 顶点V0 | (1, 0, 0) |
| 顶点V1 | (0, 1, 0) |
| 顶点V2 | (0, 0, 1) |
| 重心 | (1/3, 1/3, 1/3) |
| 边V0V1中点 | (0.5, 0.5, 0) |

---

## 透视正确插值

### 问题

在透视投影下，简单线性插值会导致视觉错误！

### 原因

屏幕空间的线性插值 ≠ 世界空间的线性插值

### 解决方案

\`\`\`glsl
// 透视正确插值公式
// 1. 对 属性/w 进行线性插值
// 2. 对 1/w 进行线性插值
// 3. 最终属性 = 插值(属性/w) / 插值(1/w)

// GPU自动完成！varying变量默认透视正确插值
\`\`\`

在GLSL中可以使用：
\`\`\`glsl
// 禁用透视校正（用于UI等不需要的情况）
varying vec2 v_uv;  // 默认透视正确
// GLSL ES 3.0:
flat varying int v_id;  // 不插值
noperspective varying vec2 v_screenUV;  // 线性插值
\`\`\`

---

## GPU光栅化流程

\`\`\`
1. 包围盒计算
   └─→ 确定三角形覆盖的像素范围

2. 像素遍历（并行！）
   └─→ 对每个候选像素：
       ├─→ 计算像素中心
       ├─→ 边函数测试
       └─→ 如果通过，计算重心坐标

3. varying插值
   └─→ 使用重心坐标对所有varying进行插值

4. 片段生成
   └─→ 创建片段，传递给片段着色器
\`\`\`

---

## 演示区域说明

| 区域 | 演示内容 |
|-----|---------|
| 上方 | 像素级光栅化过程 - 观察哪些像素被三角形覆盖 |
| 左下 | 重心坐标可视化 - RGB对应三个重心坐标分量 |
| 右下 | 边函数测试 - 显示边的方向和符号区域 |

---

## 抗锯齿技术

### MSAA (多重采样抗锯齿)

\`\`\`
每个像素多个采样点：
┌─────────┐
│ ○   ○   │  4个采样点
│    ╳    │  × = 像素中心
│ ○   ○   │
└─────────┘

覆盖率 = 被覆盖的采样点数 / 总采样点数
最终颜色 = 三角形颜色 × 覆盖率 + 背景 × (1-覆盖率)
\`\`\`

### SSAA (超采样抗锯齿)

以更高分辨率渲染，然后降采样。质量最好但成本最高。

---

## 性能考虑

### 光栅化瓶颈

| 因素 | 影响 | 优化 |
|-----|------|------|
| 三角形数量 | 设置开销 | 合并绘制调用 |
| 三角形大小 | 像素填充 | 适当LOD |
| 过度绘制 | 片段处理 | 前后排序 |

### Early-Z优化

\`\`\`
GPU可以在片段着色器之前进行深度测试：
1. 如果片段被遮挡 → 跳过着色
2. 大幅减少不必要的计算

注意：如果片段着色器修改深度或丢弃片段，会禁用Early-Z
\`\`\`
`,

  uniforms: ['u_time', 'u_resolution', 'u_mouse']
}

export default rasterization
