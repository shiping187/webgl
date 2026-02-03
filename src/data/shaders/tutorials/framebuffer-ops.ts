/**
 * 帧缓冲与像素操作 - 渲染管线的最终阶段
 * 深入理解深度测试、模板测试、混合等帧缓冲操作
 */
import type { ShaderExample } from '../../../types'

const framebufferOps: ShaderExample = {
  id: 'framebuffer-ops',
  title: '帧缓冲与像素操作',
  description: '深入理解渲染管线的最终阶段：深度测试、模板测试、Alpha混合、以及帧缓冲的读写操作。',
  level: 'advanced',
  tags: ['帧缓冲', '深度测试', '混合', '教学'],

  vertexShader: /* glsl */ `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_uv = a_position * 0.5 + 0.5;
}`,

  fragmentShader: /* glsl */ `
// ╔════════════════════════════════════════════════════════════════════════════╗
// ║             帧缓冲操作 - 片段着色器之后发生的事情                            ║
// ╚════════════════════════════════════════════════════════════════════════════╝
//
// 片段着色器输出 gl_FragColor 后，GPU还会执行：
// 1. 裁剪测试 (Scissor Test)
// 2. Alpha测试 (Alpha Test) - 已弃用，用discard代替
// 3. 模板测试 (Stencil Test)  
// 4. 深度测试 (Depth Test)
// 5. 混合 (Blending)
// 6. 写入帧缓冲

precision highp float;

varying vec2 v_uv;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

// ============================================
// 辅助函数
// ============================================

float drawBox(vec2 p, vec2 center, vec2 size) {
    vec2 d = abs(p - center) - size;
    return 1.0 - smoothstep(0.0, 0.02, length(max(d, 0.0)));
}

float drawBoxOutline(vec2 p, vec2 center, vec2 size, float thickness) {
    vec2 d = abs(p - center) - size;
    float outer = length(max(d, 0.0));
    float inner = length(max(d + thickness, 0.0));
    return smoothstep(0.01, 0.0, outer) - smoothstep(0.01, 0.0, inner - thickness);
}

float drawLine(vec2 p, vec2 a, vec2 b, float thickness) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return smoothstep(thickness + 0.003, thickness, length(pa - ba * h));
}

float drawPoint(vec2 p, vec2 center, float radius) {
    return smoothstep(radius + 0.008, radius - 0.008, length(p - center));
}

float drawCircle(vec2 p, vec2 center, float radius, float thickness) {
    return smoothstep(thickness, 0.0, abs(length(p - center) - radius));
}

float drawArrow(vec2 p, vec2 start, vec2 end, float thickness) {
    float line = drawLine(p, start, end, thickness);
    vec2 dir = normalize(end - start);
    vec2 perp = vec2(-dir.y, dir.x);
    float head1 = drawLine(p, end, end - dir * 0.04 + perp * 0.025, thickness);
    float head2 = drawLine(p, end, end - dir * 0.04 - perp * 0.025, thickness);
    return max(max(line, head1), head2);
}

// 棋盘格
float checkerboard(vec2 p, float size) {
    vec2 c = floor(p / size);
    return mod(c.x + c.y, 2.0);
}

void main() {
    vec2 uv = v_uv;
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    
    vec3 color = vec3(0.02, 0.025, 0.05);
    
    // 分成三个主要区域
    float section = floor(uv.x * 3.0);
    vec2 localUV = vec2(fract(uv.x * 3.0), uv.y);
    vec2 p = (localUV - 0.5) * 2.0;
    
    // ════════════════════════════════════════════════════════════
    // 【区域1】深度测试可视化
    // ════════════════════════════════════════════════════════════
    if (section == 0.0) {
        color = vec3(0.03, 0.04, 0.08);
        
        // 标题区域
        if (localUV.y > 0.88) {
            color = vec3(0.08, 0.1, 0.15);
        }
        
        // 深度缓冲可视化
        float t = u_time * 0.5;
        
        // 模拟几个不同深度的物体
        // 深度值: 0 = 最近, 1 = 最远
        
        // 物体1: 红色方块 (z=0.3)
        vec2 pos1 = vec2(-0.3 + sin(t) * 0.2, 0.1);
        float depth1 = 0.3;
        float obj1 = drawBox(p, pos1, vec2(0.25, 0.2));
        
        // 物体2: 绿色方块 (z=0.5)
        vec2 pos2 = vec2(0.0, -0.1 + cos(t * 0.7) * 0.15);
        float depth2 = 0.5;
        float obj2 = drawBox(p, pos2, vec2(0.22, 0.22));
        
        // 物体3: 蓝色方块 (z=0.7)
        vec2 pos3 = vec2(0.25 + sin(t * 1.3) * 0.1, 0.2);
        float depth3 = 0.7;
        float obj3 = drawBox(p, pos3, vec2(0.2, 0.18));
        
        // 深度测试逻辑：只显示最近的物体
        float currentDepth = 1.0;  // 初始化为最远
        vec3 currentColor = color;
        
        // 按深度排序渲染（模拟深度测试）
        if (obj3 > 0.5 && depth3 < currentDepth) {
            currentDepth = depth3;
            currentColor = vec3(0.2, 0.3, 0.9);
        }
        if (obj2 > 0.5 && depth2 < currentDepth) {
            currentDepth = depth2;
            currentColor = vec3(0.2, 0.9, 0.3);
        }
        if (obj1 > 0.5 && depth1 < currentDepth) {
            currentDepth = depth1;
            currentColor = vec3(0.9, 0.3, 0.2);
        }
        
        // 应用结果
        if (currentDepth < 1.0) {
            color = currentColor;
            
            // 显示深度值（作为亮度变化）
            color *= (1.0 - currentDepth * 0.3);
        }
        
        // 绘制轮廓
        float outline1 = drawBoxOutline(p, pos1, vec2(0.25, 0.2), 0.02);
        float outline2 = drawBoxOutline(p, pos2, vec2(0.22, 0.22), 0.02);
        float outline3 = drawBoxOutline(p, pos3, vec2(0.2, 0.18), 0.02);
        
        color = mix(color, vec3(1.0, 0.5, 0.5), outline1 * 0.5);
        color = mix(color, vec3(0.5, 1.0, 0.5), outline2 * 0.5);
        color = mix(color, vec3(0.5, 0.5, 1.0), outline3 * 0.5);
        
        // 深度条指示器
        float barY = -0.75;
        float barWidth = 0.7;
        
        // 背景条
        float depthBar = drawBox(p, vec2(0.0, barY), vec2(barWidth, 0.04));
        color = mix(color, vec3(0.15), depthBar);
        
        // 深度标记
        float mark1 = drawPoint(p, vec2(-barWidth + barWidth * 2.0 * depth1, barY), 0.025);
        float mark2 = drawPoint(p, vec2(-barWidth + barWidth * 2.0 * depth2, barY), 0.025);
        float mark3 = drawPoint(p, vec2(-barWidth + barWidth * 2.0 * depth3, barY), 0.025);
        
        color = mix(color, vec3(1.0, 0.3, 0.3), mark1);
        color = mix(color, vec3(0.3, 1.0, 0.3), mark2);
        color = mix(color, vec3(0.3, 0.3, 1.0), mark3);
        
        // 近/远标签
        float nearLabel = drawPoint(p, vec2(-barWidth - 0.08, barY), 0.015);
        float farLabel = drawPoint(p, vec2(barWidth + 0.08, barY), 0.015);
        color = mix(color, vec3(1.0), nearLabel + farLabel);
    }
    
    // ════════════════════════════════════════════════════════════
    // 【区域2】Alpha混合可视化
    // ════════════════════════════════════════════════════════════
    else if (section == 1.0) {
        color = vec3(0.03, 0.035, 0.06);
        
        if (localUV.y > 0.88) {
            color = vec3(0.08, 0.1, 0.15);
        }
        
        float t = u_time * 0.4;
        
        // 背景棋盘格（表示透明背景）
        float checker = checkerboard(p * 8.0, 1.0);
        color = mix(vec3(0.1), vec3(0.15), checker);
        
        // 三个半透明圆形
        vec2 center1 = vec2(-0.25, 0.15);
        vec2 center2 = vec2(0.15 + sin(t) * 0.1, 0.0);
        vec2 center3 = vec2(-0.05, -0.2 + cos(t * 0.8) * 0.1);
        
        float radius = 0.28;
        
        // 计算每个圆的距离
        float d1 = length(p - center1) - radius;
        float d2 = length(p - center2) - radius;
        float d3 = length(p - center3) - radius;
        
        // Alpha混合公式：
        // result = src * srcAlpha + dst * (1 - srcAlpha)
        
        // 第一层：红色，alpha=0.6
        if (d1 < 0.0) {
            vec3 srcColor = vec3(0.95, 0.2, 0.2);
            float srcAlpha = 0.6;
            color = srcColor * srcAlpha + color * (1.0 - srcAlpha);
        }
        
        // 第二层：绿色，alpha=0.5
        if (d2 < 0.0) {
            vec3 srcColor = vec3(0.2, 0.95, 0.2);
            float srcAlpha = 0.5;
            color = srcColor * srcAlpha + color * (1.0 - srcAlpha);
        }
        
        // 第三层：蓝色，alpha=0.7
        if (d3 < 0.0) {
            vec3 srcColor = vec3(0.2, 0.2, 0.95);
            float srcAlpha = 0.7;
            color = srcColor * srcAlpha + color * (1.0 - srcAlpha);
        }
        
        // 绘制圆形轮廓
        float outline1 = drawCircle(p, center1, radius, 0.015);
        float outline2 = drawCircle(p, center2, radius, 0.015);
        float outline3 = drawCircle(p, center3, radius, 0.015);
        
        color = mix(color, vec3(1.0, 0.6, 0.6), outline1 * 0.7);
        color = mix(color, vec3(0.6, 1.0, 0.6), outline2 * 0.7);
        color = mix(color, vec3(0.6, 0.6, 1.0), outline3 * 0.7);
        
        // 混合公式展示区域
        if (localUV.y < 0.15) {
            color = vec3(0.05, 0.06, 0.1);
            
            // 绘制公式示意
            // src * α + dst * (1-α)
            float formulaY = 0.075;
            
            // 源颜色方块
            float srcBox = drawBox(localUV, vec2(0.15, formulaY), vec2(0.06, 0.04));
            color = mix(color, vec3(0.8, 0.3, 0.3), srcBox);
            
            // 乘号
            float mult1 = drawPoint(localUV, vec2(0.25, formulaY), 0.012);
            color = mix(color, vec3(0.8), mult1);
            
            // alpha
            float alphaBox = drawBox(localUV, vec2(0.32, formulaY), vec2(0.04, 0.04));
            color = mix(color, vec3(0.5, 0.5, 0.8), alphaBox);
            
            // 加号
            float plus = 0.0;
            plus = max(plus, drawLine(localUV, vec2(0.4, formulaY - 0.02), vec2(0.4, formulaY + 0.02), 0.008));
            plus = max(plus, drawLine(localUV, vec2(0.38, formulaY), vec2(0.42, formulaY), 0.008));
            color = mix(color, vec3(0.8), plus);
            
            // 目标颜色方块
            float dstBox = drawBox(localUV, vec2(0.5, formulaY), vec2(0.06, 0.04));
            color = mix(color, vec3(0.3, 0.8, 0.3), dstBox);
            
            // 乘号
            float mult2 = drawPoint(localUV, vec2(0.6, formulaY), 0.012);
            color = mix(color, vec3(0.8), mult2);
            
            // (1-alpha)
            float oneMinusAlpha = drawBox(localUV, vec2(0.72, formulaY), vec2(0.08, 0.04));
            color = mix(color, vec3(0.5, 0.8, 0.5), oneMinusAlpha);
        }
    }
    
    // ════════════════════════════════════════════════════════════
    // 【区域3】帧缓冲结构
    // ════════════════════════════════════════════════════════════
    else {
        color = vec3(0.025, 0.03, 0.055);
        
        if (localUV.y > 0.88) {
            color = vec3(0.08, 0.1, 0.15);
        }
        
        // 帧缓冲结构图
        float t = u_time;
        
        // 主帧缓冲框
        float mainFrame = drawBoxOutline(p, vec2(0.0, 0.2), vec2(0.6, 0.35), 0.025);
        color = mix(color, vec3(0.4, 0.5, 0.7), mainFrame);
        
        // 颜色附件
        float colorAttach = drawBox(p, vec2(-0.35, 0.35), vec2(0.2, 0.12));
        color = mix(color, vec3(0.8, 0.3, 0.3), colorAttach);
        float colorBorder = drawBoxOutline(p, vec2(-0.35, 0.35), vec2(0.2, 0.12), 0.015);
        color = mix(color, vec3(1.0, 0.5, 0.5), colorBorder);
        
        // 深度附件
        float depthAttach = drawBox(p, vec2(0.0, 0.35), vec2(0.2, 0.12));
        color = mix(color, vec3(0.3, 0.3, 0.3) + vec3(0.5) * (1.0 - localUV.y), depthAttach);
        float depthBorder = drawBoxOutline(p, vec2(0.0, 0.35), vec2(0.2, 0.12), 0.015);
        color = mix(color, vec3(0.7), depthBorder);
        
        // 模板附件
        float stencilAttach = drawBox(p, vec2(0.35, 0.35), vec2(0.2, 0.12));
        // 模板图案
        float stencilPattern = step(0.5, checkerboard((p - vec2(0.35, 0.35)) * 20.0, 1.0));
        color = mix(color, vec3(0.5, 0.5, 0.2) * (0.5 + stencilPattern * 0.5), stencilAttach);
        float stencilBorder = drawBoxOutline(p, vec2(0.35, 0.35), vec2(0.2, 0.12), 0.015);
        color = mix(color, vec3(0.8, 0.8, 0.4), stencilBorder);
        
        // 数据流箭头
        // 从片段着色器到帧缓冲
        float arrow1 = drawArrow(p, vec2(0.0, -0.4), vec2(0.0, -0.05), 0.012);
        float flowPhase = fract(t * 0.5);
        vec3 arrowColor = mix(vec3(0.3), vec3(0.0, 0.9, 0.8), flowPhase);
        color = mix(color, arrowColor, arrow1);
        
        // 片段着色器输出表示
        float fragOutput = drawBox(p, vec2(0.0, -0.55), vec2(0.25, 0.1));
        vec3 fragColor = vec3(
            0.5 + 0.5 * sin(t * 2.0),
            0.5 + 0.5 * sin(t * 2.0 + 2.094),
            0.5 + 0.5 * sin(t * 2.0 + 4.188)
        );
        color = mix(color, fragColor, fragOutput);
        float fragBorder = drawBoxOutline(p, vec2(0.0, -0.55), vec2(0.25, 0.1), 0.015);
        color = mix(color, vec3(0.9), fragBorder);
        
        // 测试阶段指示器
        float testY = -0.25;
        float testWidth = 0.12;
        float testSpacing = 0.3;
        
        // 各个测试阶段
        vec2 testCenters[4];
        testCenters[0] = vec2(-0.45, testY);  // Scissor
        testCenters[1] = vec2(-0.15, testY);  // Stencil
        testCenters[2] = vec2(0.15, testY);   // Depth
        testCenters[3] = vec2(0.45, testY);   // Blend
        
        vec3 testColors[4];
        testColors[0] = vec3(0.6, 0.4, 0.8);
        testColors[1] = vec3(0.8, 0.8, 0.3);
        testColors[2] = vec3(0.5, 0.5, 0.7);
        testColors[3] = vec3(0.3, 0.7, 0.9);
        
        for (int i = 0; i < 4; i++) {
            float testBox = drawBox(p, testCenters[i], vec2(testWidth, 0.06));
            float testOutline = drawBoxOutline(p, testCenters[i], vec2(testWidth, 0.06), 0.012);
            
            // 动画高亮
            float highlight = smoothstep(0.0, 0.25, fract(t * 0.3 - float(i) * 0.25)) *
                              smoothstep(0.5, 0.25, fract(t * 0.3 - float(i) * 0.25));
            
            color = mix(color, testColors[i] * (0.6 + highlight * 0.4), testBox);
            color = mix(color, vec3(1.0), testOutline * (0.5 + highlight * 0.5));
            
            // 连接箭头
            if (i < 3) {
                float conn = drawLine(p, 
                    testCenters[i] + vec2(testWidth + 0.02, 0.0),
                    testCenters[i + 1] - vec2(testWidth + 0.02, 0.0),
                    0.008);
                color = mix(color, vec3(0.5), conn);
            }
        }
        
        // 通过/丢弃指示
        float passArrow = drawArrow(p, vec2(0.45, testY - 0.08), vec2(0.45, 0.05), 0.01);
        color = mix(color, vec3(0.3, 0.9, 0.3), passArrow * 0.8);
        
        float discardArrow = drawArrow(p, vec2(-0.15, testY + 0.08), vec2(-0.15, testY + 0.2), 0.008);
        color = mix(color, vec3(0.9, 0.3, 0.3), discardArrow * 0.6);
    }
    
    // 区域分割线
    float divider1 = smoothstep(0.008, 0.0, abs(uv.x - 1.0/3.0));
    float divider2 = smoothstep(0.008, 0.0, abs(uv.x - 2.0/3.0));
    color = mix(color, vec3(0.4, 0.45, 0.55), divider1 + divider2);
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## 帧缓冲与像素操作 - 渲染管线的最终阶段

### 🎯 概述

片段着色器输出颜色后，GPU还需要进行一系列测试和操作，才能最终将像素写入屏幕。

---

## 帧缓冲结构

### 组成部分

\`\`\`
┌─────────────────────────────────────┐
│           帧缓冲 (Framebuffer)       │
├─────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐│
│  │颜色附件 │ │深度附件 │ │模板附件 ││
│  │(Color)  │ │(Depth)  │ │(Stencil)││
│  │ RGBA    │ │ 24bit   │ │ 8bit    ││
│  └─────────┘ └─────────┘ └─────────┘│
└─────────────────────────────────────┘
\`\`\`

| 附件 | 格式 | 用途 |
|-----|------|------|
| 颜色 | RGBA8/RGBA16F | 最终显示的颜色 |
| 深度 | DEPTH24 | 遮挡关系判断 |
| 模板 | STENCIL8 | 高级遮罩效果 |

---

## 片段测试流程

\`\`\`
片段着色器输出
        │
        ▼
┌───────────────┐
│  裁剪测试     │ ← 超出裁剪区域则丢弃
└───────┬───────┘
        ▼
┌───────────────┐
│  模板测试     │ ← 根据模板缓冲决定是否绘制
└───────┬───────┘
        ▼
┌───────────────┐
│  深度测试     │ ← 根据深度缓冲决定是否绘制
└───────┬───────┘
        ▼
┌───────────────┐
│  混合操作     │ ← 与现有颜色混合
└───────┬───────┘
        ▼
    写入帧缓冲
\`\`\`

---

## 深度测试 (Depth Test)

### 目的
实现正确的遮挡关系：近处物体遮挡远处物体。

### 启用方式
\`\`\`javascript
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LESS);  // 深度更小（更近）才通过
\`\`\`

### 深度函数选项

| 函数 | 条件 | 用途 |
|-----|------|------|
| gl.LESS | 新深度 < 旧深度 | 标准不透明渲染 |
| gl.LEQUAL | 新深度 ≤ 旧深度 | 允许深度相等 |
| gl.GREATER | 新深度 > 旧深度 | 反向深度 |
| gl.ALWAYS | 始终通过 | 调试/特效 |
| gl.NEVER | 始终失败 | 调试 |

### 深度写入控制
\`\`\`javascript
gl.depthMask(true);   // 允许写入深度
gl.depthMask(false);  // 禁止写入（用于透明物体）
\`\`\`

---

## Alpha混合 (Blending)

### 混合公式

\`\`\`
最终颜色 = 源颜色 × 源因子 + 目标颜色 × 目标因子
\`\`\`

### 启用方式
\`\`\`javascript
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
\`\`\`

### 常见混合模式

| 模式 | srcFactor | dstFactor | 效果 |
|-----|-----------|-----------|------|
| 标准透明 | SRC_ALPHA | ONE_MINUS_SRC_ALPHA | 半透明叠加 |
| 加法 | ONE | ONE | 发光效果 |
| 乘法 | DST_COLOR | ZERO | 滤镜效果 |
| 预乘Alpha | ONE | ONE_MINUS_SRC_ALPHA | 避免边缘问题 |

### 透明物体渲染顺序

\`\`\`
1. 先渲染所有不透明物体（开启深度测试和写入）
2. 关闭深度写入
3. 按从远到近排序渲染透明物体
4. 恢复深度写入
\`\`\`

---

## 模板测试 (Stencil Test)

### 用途
- 镜面反射效果
- 阴影体积
- 门户效果
- 任意形状的遮罩

### 使用流程
\`\`\`javascript
gl.enable(gl.STENCIL_TEST);

// 第一遍：写入模板值
gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
// 绘制遮罩形状...

// 第二遍：根据模板值绘制
gl.stencilFunc(gl.EQUAL, 1, 0xFF);
gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
// 绘制被遮罩的内容...
\`\`\`

---

## 离屏渲染 (Off-screen Rendering)

### 自定义帧缓冲
\`\`\`javascript
// 创建帧缓冲对象
const fbo = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

// 创建颜色纹理
const colorTexture = gl.createTexture();
// ... 配置纹理 ...
gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    colorTexture,
    0
);

// 创建深度/模板渲染缓冲
const depthBuffer = gl.createRenderbuffer();
// ... 配置 ...
gl.framebufferRenderbuffer(
    gl.FRAMEBUFFER,
    gl.DEPTH_STENCIL_ATTACHMENT,
    gl.RENDERBUFFER,
    depthBuffer
);
\`\`\`

### 常见用途
- 后处理效果（模糊、泛光）
- 阴影贴图
- 反射/折射
- 延迟渲染

---

## 三个演示区域

| 区域 | 演示内容 |
|-----|---------|
| 左 | 深度测试 - 三个不同深度的物体，观察遮挡关系 |
| 中 | Alpha混合 - 三个半透明圆的叠加效果 |
| 右 | 帧缓冲结构 - 可视化帧缓冲组成和数据流 |

---

## 性能提示

### Early-Z
\`\`\`
如果片段着色器不修改深度且不使用discard：
GPU可以在片段着色器执行前进行深度测试，
跳过被遮挡的片段，大幅提高性能！

注意：使用 discard 会禁用 Early-Z！
\`\`\`

### 减少帧缓冲切换
\`\`\`
帧缓冲切换开销很大：
1. 尽量合并渲染pass
2. 使用MRT一次写入多个目标
3. 避免频繁的FBO切换
\`\`\`

### 清除优化
\`\`\`javascript
// 在帧开始时一次性清除所有缓冲
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
\`\`\`
`,

  uniforms: ['u_time', 'u_resolution', 'u_mouse']
}

export default framebufferOps
