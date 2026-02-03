/**
 * 顶点处理阶段详解 - 从原始数据到裁剪空间
 * 深入理解顶点着色器的输入、处理和输出
 */
import type { ShaderExample } from '../../../types'

const vertexProcessing: ShaderExample = {
  id: 'vertex-processing',
  title: '顶点处理阶段详解',
  description: '深入理解顶点数据如何从CPU传输到GPU，顶点着色器的执行机制，以及坐标变换的数学原理。',
  level: 'intermediate',
  tags: ['顶点', 'attribute', 'MVP变换', '教学'],

  vertexShader: /* glsl */ `
// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                      顶点处理 - 数据输入与变换详解                          ║
// ╚════════════════════════════════════════════════════════════════════════════╝

// ============================================
// 【Attribute】顶点属性 - 逐顶点数据
// ============================================
// 
// attribute 变量的特点：
// 1. 只能在顶点着色器中声明和使用
// 2. 每个顶点可以有不同的值
// 3. 从 Vertex Buffer Object (VBO) 中读取
// 4. 通过 gl.vertexAttribPointer() 配置

attribute vec2 a_position;  // 2D位置

// ============================================
// 【Varying】传递变量 - 顶点→片段
// ============================================
// 
// varying 变量的特点：
// 1. 在顶点着色器中写入
// 2. 在片段着色器中读取
// 3. 光栅化时自动进行透视正确插值
// 4. 是两个着色器之间的"桥梁"

varying vec2 v_uv;
varying vec2 v_position;
varying vec3 v_vertexColor;
varying float v_distFromCenter;

// ============================================
// 【Uniform】全局常量
// ============================================
uniform float u_time;

void main() {
    // ════════════════════════════════════════════════════════════
    // 【数据流】CPU → GPU 的数据如何到达这里？
    // ════════════════════════════════════════════════════════════
    // 
    // JavaScript/CPU端:
    // ─────────────────────────────────────────────
    // // 1. 创建顶点数据
    // const positions = [-1,-1, 1,-1, -1,1, 1,1];
    // 
    // // 2. 上传到GPU
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    // 
    // // 3. 告诉GPU如何解释这些数据
    // gl.vertexAttribPointer(
    //     positionLoc,  // attribute位置
    //     2,            // 每个顶点2个分量(x,y)
    //     gl.FLOAT,     // 数据类型
    //     false,        // 是否归一化
    //     0,            // 步长（连续存储）
    //     0             // 偏移量
    // );
    // ─────────────────────────────────────────────
    // 
    // 当 gl.drawArrays() 调用时：
    // - GPU为每个顶点启动一个顶点着色器实例
    // - 自动从VBO读取对应顶点的数据到 a_position
    
    // ════════════════════════════════════════════════════════════
    // 【步骤1】坐标变换
    // ════════════════════════════════════════════════════════════
    
    // 添加一点动画效果来展示顶点处理
    vec2 pos = a_position;
    
    // 呼吸效果
    float breathe = 1.0 + sin(u_time * 2.0) * 0.05;
    pos *= breathe;
    
    // 波浪扭曲（每个顶点不同的处理）
    float wave = sin(pos.x * 3.14159 + u_time * 3.0) * 0.03;
    pos.y += wave;
    
    // 设置最终位置（裁剪空间）
    gl_Position = vec4(pos, 0.0, 1.0);
    
    // ════════════════════════════════════════════════════════════
    // 【步骤2】计算要传递给片段着色器的数据
    // ════════════════════════════════════════════════════════════
    
    // UV坐标（0到1）
    v_uv = a_position * 0.5 + 0.5;
    
    // 保存原始位置
    v_position = a_position;
    
    // 根据顶点位置计算颜色（演示逐顶点计算）
    // 四个顶点会有四种不同颜色
    v_vertexColor = vec3(
        v_uv.x,                      // R: 水平位置
        v_uv.y,                      // G: 垂直位置  
        0.5 + 0.5 * sin(u_time)      // B: 时间变化
    );
    
    // 到中心的距离
    v_distFromCenter = length(a_position);
    
    // ════════════════════════════════════════════════════════════
    // 【重要理解】gl_Position 的含义
    // ════════════════════════════════════════════════════════════
    // 
    // gl_Position 是一个 vec4(x, y, z, w)
    // 
    // 裁剪空间规则：
    // - 如果 |x| <= w 且 |y| <= w 且 |z| <= w，顶点可见
    // - 否则会被裁剪
    // 
    // NDC变换（GPU自动完成）：
    // NDC.x = x / w
    // NDC.y = y / w  
    // NDC.z = z / w
    // 
    // NDC范围：[-1, 1] × [-1, 1] × [-1, 1]
    // 
    // 2D情况下 w=1，所以 NDC = 裁剪空间
}`,

  fragmentShader: /* glsl */ `
// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    可视化顶点处理阶段的结果                                 ║
// ╚════════════════════════════════════════════════════════════════════════════╝

precision highp float;

// 从顶点着色器接收的数据（已被插值！）
varying vec2 v_uv;
varying vec2 v_position;
varying vec3 v_vertexColor;
varying float v_distFromCenter;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

// ============================================
// 辅助函数
// ============================================

float drawGrid(vec2 p, float size, float thickness) {
    vec2 grid = abs(fract(p / size - 0.5) - 0.5) * size;
    return smoothstep(thickness + 0.002, thickness, min(grid.x, grid.y));
}

float drawPoint(vec2 p, vec2 center, float radius) {
    return smoothstep(radius + 0.01, radius - 0.01, length(p - center));
}

float drawCircle(vec2 p, vec2 center, float radius, float thickness) {
    float dist = length(p - center);
    return smoothstep(thickness, 0.0, abs(dist - radius));
}

float drawLine(vec2 p, vec2 a, vec2 b, float thickness) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return smoothstep(thickness + 0.002, thickness, length(pa - ba * h));
}

// 绘制坐标轴
float drawAxis(vec2 p, float thickness) {
    float xAxis = smoothstep(thickness + 0.003, thickness, abs(p.y));
    float yAxis = smoothstep(thickness + 0.003, thickness, abs(p.x));
    return max(xAxis, yAxis);
}

void main() {
    vec2 uv = v_uv;
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    
    vec3 color = vec3(0.02, 0.03, 0.06);
    
    // ════════════════════════════════════════════════════════════
    // 分区显示不同的概念
    // ════════════════════════════════════════════════════════════
    
    // 分成2x2四个区域
    vec2 quadrant = floor(uv * 2.0);
    vec2 localUV = fract(uv * 2.0);
    vec2 localP = (localUV - 0.5) * 2.0;
    
    // ============================================
    // 【左上】Attribute数据可视化
    // ============================================
    if (quadrant.x == 0.0 && quadrant.y == 1.0) {
        color = vec3(0.03, 0.04, 0.08);
        
        // NDC空间网格
        float grid = drawGrid(localP, 0.5, 0.008);
        color += vec3(0.08, 0.12, 0.18) * grid;
        
        // 坐标轴
        float axis = drawAxis(localP, 0.015);
        vec3 axisColor = localP.x > localP.y ? vec3(0.8, 0.2, 0.2) : vec3(0.2, 0.8, 0.2);
        color = mix(color, axisColor, axis * 0.8);
        
        // 显示四个顶点位置
        vec2 vertices[4];
        vertices[0] = vec2(-0.7, -0.7);  // 左下
        vertices[1] = vec2(0.7, -0.7);   // 右下
        vertices[2] = vec2(-0.7, 0.7);   // 左上
        vertices[3] = vec2(0.7, 0.7);    // 右上
        
        // 顶点动画
        float t = u_time * 0.5;
        for (int i = 0; i < 4; i++) {
            vec2 v = vertices[i];
            // 添加动画
            v += vec2(sin(t + float(i)), cos(t * 0.7 + float(i))) * 0.05;
            
            // 绘制顶点
            vec3 vColor = vec3(
                0.5 + v.x * 0.5,
                0.5 + v.y * 0.5,
                0.7
            );
            color = mix(color, vColor, drawPoint(localP, v, 0.08));
            
            // 顶点索引标记
            float ring = drawCircle(localP, v, 0.12, 0.02);
            color = mix(color, vec3(1.0), ring * 0.6);
        }
        
        // 标签：显示这是attribute数据
        if (localUV.y > 0.88) {
            color = mix(color, vec3(0.15, 0.2, 0.3), 0.8);
        }
    }
    
    // ============================================
    // 【右上】Varying插值可视化
    // ============================================
    else if (quadrant.x == 1.0 && quadrant.y == 1.0) {
        // 直接显示从顶点着色器传来的插值颜色
        color = v_vertexColor;
        
        // 网格辅助理解插值
        float grid = drawGrid(localUV, 0.1, 0.003);
        color = mix(color, vec3(1.0), grid * 0.2);
        
        // 显示等值线
        float isoR = smoothstep(0.02, 0.0, abs(fract(v_vertexColor.r * 8.0) - 0.5) - 0.4);
        float isoG = smoothstep(0.02, 0.0, abs(fract(v_vertexColor.g * 8.0) - 0.5) - 0.4);
        color = mix(color, vec3(1.0, 0.8, 0.8), isoR * 0.3);
        color = mix(color, vec3(0.8, 1.0, 0.8), isoG * 0.3);
        
        if (localUV.y > 0.88) {
            color = mix(color, vec3(0.15, 0.2, 0.3), 0.8);
        }
    }
    
    // ============================================
    // 【左下】坐标变换演示
    // ============================================
    else if (quadrant.x == 0.0 && quadrant.y == 0.0) {
        color = vec3(0.03, 0.05, 0.08);
        
        // 显示变换前后的对比
        float t = u_time * 0.3;
        float transformPhase = fract(t);
        
        // 原始矩形顶点
        vec2 origVerts[4];
        origVerts[0] = vec2(-0.3, -0.2);
        origVerts[1] = vec2(0.3, -0.2);
        origVerts[2] = vec2(-0.3, 0.2);
        origVerts[3] = vec2(0.3, 0.2);
        
        // 计算变换后的顶点（旋转+缩放）
        float angle = transformPhase * 6.28318;
        float scale = 0.8 + sin(transformPhase * 6.28318 * 2.0) * 0.3;
        mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
        
        // 绘制原始形状（淡化）
        float origShape = 0.0;
        origShape = max(origShape, drawLine(localP, origVerts[0], origVerts[1], 0.008));
        origShape = max(origShape, drawLine(localP, origVerts[1], origVerts[3], 0.008));
        origShape = max(origShape, drawLine(localP, origVerts[3], origVerts[2], 0.008));
        origShape = max(origShape, drawLine(localP, origVerts[2], origVerts[0], 0.008));
        color = mix(color, vec3(0.3, 0.3, 0.4), origShape);
        
        // 绘制变换后的形状
        vec2 transVerts[4];
        for (int i = 0; i < 4; i++) {
            transVerts[i] = rotation * origVerts[i] * scale;
        }
        
        float transShape = 0.0;
        transShape = max(transShape, drawLine(localP, transVerts[0], transVerts[1], 0.012));
        transShape = max(transShape, drawLine(localP, transVerts[1], transVerts[3], 0.012));
        transShape = max(transShape, drawLine(localP, transVerts[3], transVerts[2], 0.012));
        transShape = max(transShape, drawLine(localP, transVerts[2], transVerts[0], 0.012));
        color = mix(color, vec3(0.0, 0.85, 0.95), transShape);
        
        // 绘制变换后的顶点
        for (int i = 0; i < 4; i++) {
            color = mix(color, vec3(1.0, 0.5, 0.2), drawPoint(localP, transVerts[i], 0.04));
        }
        
        // 原点标记
        color = mix(color, vec3(1.0, 1.0, 0.0), drawPoint(localP, vec2(0.0), 0.03));
        
        // 坐标轴
        float axis = drawAxis(localP, 0.005);
        color = mix(color, vec3(0.4), axis);
        
        if (localUV.y > 0.88) {
            color = mix(color, vec3(0.15, 0.2, 0.3), 0.8);
        }
    }
    
    // ============================================
    // 【右下】gl_Position输出解析
    // ============================================
    else {
        color = vec3(0.04, 0.04, 0.08);
        
        // 显示裁剪空间范围
        float clipBorder = 0.0;
        clipBorder = max(clipBorder, drawLine(localP, vec2(-0.8, -0.8), vec2(0.8, -0.8), 0.015));
        clipBorder = max(clipBorder, drawLine(localP, vec2(0.8, -0.8), vec2(0.8, 0.8), 0.015));
        clipBorder = max(clipBorder, drawLine(localP, vec2(0.8, 0.8), vec2(-0.8, 0.8), 0.015));
        clipBorder = max(clipBorder, drawLine(localP, vec2(-0.8, 0.8), vec2(-0.8, -0.8), 0.015));
        color = mix(color, vec3(0.6, 0.2, 0.2), clipBorder);
        
        // NDC有效区域
        vec2 ndcP = localP / 0.8;
        bool inNDC = abs(ndcP.x) <= 1.0 && abs(ndcP.y) <= 1.0;
        
        if (inNDC) {
            // 网格
            float grid = drawGrid(ndcP, 0.5, 0.015);
            color += vec3(0.1, 0.15, 0.2) * grid;
            
            // 演示一个在空间中移动的点
            float t = u_time;
            vec2 movingPoint = vec2(sin(t) * 1.2, cos(t * 0.7) * 1.2);
            
            // 裁剪后的点（限制在[-1,1]范围）
            vec2 clippedPoint = clamp(movingPoint, vec2(-1.0), vec2(1.0));
            
            // 显示原始位置（可能在外面）
            vec2 dispOrig = movingPoint * 0.8;
            if (abs(movingPoint.x) <= 1.5 && abs(movingPoint.y) <= 1.5) {
                float origDot = drawPoint(localP, dispOrig, 0.05);
                bool outside = abs(movingPoint.x) > 1.0 || abs(movingPoint.y) > 1.0;
                vec3 dotColor = outside ? vec3(0.8, 0.3, 0.3) : vec3(0.3, 0.8, 0.3);
                color = mix(color, dotColor, origDot);
            }
            
            // 如果被裁剪，显示连线
            if (abs(movingPoint.x) > 1.0 || abs(movingPoint.y) > 1.0) {
                vec2 dispClip = clippedPoint * 0.8;
                float clipLine = drawLine(localP, dispOrig, dispClip, 0.008);
                color = mix(color, vec3(0.8, 0.8, 0.3), clipLine * 0.5);
                
                // 裁剪后的点
                float clipDot = drawPoint(localP, dispClip, 0.04);
                color = mix(color, vec3(0.3, 0.9, 0.3), clipDot);
            }
        }
        
        // 坐标轴
        float axis = drawAxis(localP, 0.008);
        color = mix(color, vec3(0.5), axis);
        
        // 标注NDC范围
        float labelN1 = drawPoint(localP, vec2(-0.8, 0.0), 0.02);
        float labelP1 = drawPoint(localP, vec2(0.8, 0.0), 0.02);
        color = mix(color, vec3(1.0), labelN1 + labelP1);
        
        if (localUV.y > 0.88) {
            color = mix(color, vec3(0.15, 0.2, 0.3), 0.8);
        }
    }
    
    // 分割线
    float dividerH = smoothstep(0.008, 0.0, abs(uv.y - 0.5));
    float dividerV = smoothstep(0.005, 0.0, abs(uv.x - 0.5));
    color = mix(color, vec3(0.3, 0.4, 0.5), max(dividerH, dividerV));
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## 顶点处理阶段详解 - 深入理解Attribute与Varying

### 🎯 概述

顶点着色器是渲染管线中第一个可编程阶段，负责处理每个顶点的数据变换。

---

## 数据类型详解

### 1. Attribute（顶点属性）

\`\`\`glsl
attribute vec3 a_position;  // 位置
attribute vec3 a_normal;    // 法线
attribute vec2 a_texCoord;  // 纹理坐标
attribute vec4 a_color;     // 顶点颜色
\`\`\`

**特点**：
- ✅ 只能在顶点着色器中使用
- ✅ 每个顶点可以有不同的值
- ✅ 从 VBO (Vertex Buffer Object) 读取
- ✅ 只读，不能修改

**CPU端配置**：
\`\`\`javascript
// 1. 创建并绑定缓冲区
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

// 2. 上传数据
gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

// 3. 配置attribute
gl.vertexAttribPointer(
    location,   // attribute位置
    size,       // 每个顶点的分量数（1-4）
    type,       // 数据类型
    normalized, // 是否归一化
    stride,     // 步长
    offset      // 偏移
);

// 4. 启用attribute
gl.enableVertexAttribArray(location);
\`\`\`

### 2. Varying（传递变量）

\`\`\`glsl
// 顶点着色器中声明并写入
varying vec2 v_texCoord;
void main() {
    v_texCoord = a_texCoord;  // 写入
}

// 片段着色器中声明并读取
varying vec2 v_texCoord;
void main() {
    vec2 uv = v_texCoord;     // 读取（已插值）
}
\`\`\`

**特点**：
- ✅ 顶点着色器写入，片段着色器读取
- ✅ 光栅化时自动插值
- ✅ 透视正确插值（perspective-correct）
- ⚠️ 精度可能降低（数据量大）

### 3. Uniform（全局常量）

\`\`\`glsl
uniform mat4 u_modelMatrix;
uniform vec3 u_lightPosition;
uniform float u_time;
\`\`\`

**特点**：
- ✅ 对所有顶点/片段相同
- ✅ 每帧可以更新
- ✅ 两种着色器都可以使用

---

## 坐标变换详解

### MVP矩阵变换链

\`\`\`
局部坐标 (a_position)
    │
    │ Model矩阵
    ▼
世界坐标
    │
    │ View矩阵  
    ▼
观察坐标（眼睛空间）
    │
    │ Projection矩阵
    ▼
裁剪坐标 (gl_Position)
    │
    │ 透视除法 (GPU自动)
    ▼
NDC坐标 [-1,1]³
    │
    │ 视口变换 (GPU自动)
    ▼
屏幕坐标
\`\`\`

### 各矩阵作用

**Model矩阵**：物体的位置、旋转、缩放
\`\`\`glsl
mat4 model = translate * rotate * scale;
\`\`\`

**View矩阵**：摄像机的位置和朝向
\`\`\`glsl
mat4 view = lookAt(cameraPos, target, up);
\`\`\`

**Projection矩阵**：投影方式（透视/正交）
\`\`\`glsl
// 透视投影
mat4 proj = perspective(fov, aspect, near, far);

// 正交投影
mat4 proj = ortho(left, right, bottom, top, near, far);
\`\`\`

---

## gl_Position详解

### 裁剪空间

\`\`\`glsl
gl_Position = vec4(x, y, z, w);
\`\`\`

**可见性条件**：
\`\`\`
-w <= x <= w
-w <= y <= w  
-w <= z <= w
\`\`\`

### 透视除法

GPU自动执行：
\`\`\`
NDC.x = x / w
NDC.y = y / w
NDC.z = z / w
\`\`\`

**2D情况**：w = 1，所以裁剪坐标 = NDC

---

## 四个演示区域

| 区域 | 演示内容 |
|-----|---------|
| 左上 | Attribute数据 - 四个顶点在NDC空间中的位置 |
| 右上 | Varying插值 - 颜色如何从顶点平滑过渡 |
| 左下 | 坐标变换 - 旋转缩放的矩阵变换效果 |
| 右下 | gl_Position - 裁剪空间和NDC范围 |

---

## 性能建议

1. **减少attribute数量**：每个attribute都需要GPU读取
2. **利用顶点着色器**：能在顶点算的别在片段算
3. **合理使用varying**：太多varying会增加插值开销
4. **批量绘制**：减少draw call数量

---

## 常见陷阱

❌ 错误：在片段着色器中访问attribute
\`\`\`glsl
// 这是错误的！attribute只能在顶点着色器中使用
float x = a_position.x;  // 编译错误
\`\`\`

✅ 正确：通过varying传递
\`\`\`glsl
// 顶点着色器
varying vec3 v_position;
v_position = a_position;

// 片段着色器
float x = v_position.x;  // 正确
\`\`\`
`,

  uniforms: ['u_time', 'u_resolution', 'u_mouse']
}

export default vertexProcessing
