/**
 * WebGL版本对比 - WebGL 1.0 vs WebGL 2.0 完整指南
 * 详细展示两个版本之间的语法差异、新特性和最佳实践
 */
import type { ShaderExample } from '../../../types'

const webglVersions: ShaderExample = {
  id: 'webgl-versions',
  title: 'WebGL版本对比指南',
  description: '全面对比WebGL 1.0与WebGL 2.0的区别：GLSL语法变化、新增特性、内置变量、纹理功能等。',
  level: 'intermediate',
  tags: ['WebGL2', 'GLSL', '版本对比', '教学'],

  // 注意：本示例使用WebGL 1.0语法以保持兼容性
  // 在explanation中详细说明WebGL 2.0的写法
  vertexShader: /* glsl */ `
// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    WebGL 1.0 顶点着色器语法                                 ║
// ╚════════════════════════════════════════════════════════════════════════════╝
// GLSL ES 1.00 - 无需版本声明（默认）

// ════════════════════════════════════════════════════════════════════════════
// 【WebGL 1.0】使用 attribute 声明顶点输入
// 【WebGL 2.0】改用 in 关键字
// ════════════════════════════════════════════════════════════════════════════
attribute vec2 a_position;

// ════════════════════════════════════════════════════════════════════════════
// 【WebGL 1.0】使用 varying 传递数据给片段着色器
// 【WebGL 2.0】改用 out 关键字
// ════════════════════════════════════════════════════════════════════════════
varying vec2 v_uv;
varying vec2 v_position;

// ════════════════════════════════════════════════════════════════════════════
// 【两个版本相同】uniform 声明方式不变
// ════════════════════════════════════════════════════════════════════════════
uniform float u_time;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_uv = a_position * 0.5 + 0.5;
    v_position = a_position;
    
    // ════════════════════════════════════════════════════════════════════════
    // 【WebGL 2.0 独有】内置变量
    // ════════════════════════════════════════════════════════════════════════
    // gl_VertexID   - 当前顶点的索引（整数）
    // gl_InstanceID - 实例化渲染时的实例索引
    //
    // WebGL 1.0 中没有这些变量，需要通过attribute手动传递
}`,

  fragmentShader: /* glsl */ `
// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    WebGL 1.0 片段着色器语法                                 ║
// ╚════════════════════════════════════════════════════════════════════════════╝
// GLSL ES 1.00

// 精度声明（WebGL 1.0 必须在片段着色器中声明）
precision highp float;

// ════════════════════════════════════════════════════════════════════════════
// 【WebGL 1.0】使用 varying 接收来自顶点着色器的数据
// 【WebGL 2.0】改用 in 关键字
// ════════════════════════════════════════════════════════════════════════════
varying vec2 v_uv;
varying vec2 v_position;

uniform float u_time;
uniform vec2 u_resolution;

// ════════════════════════════════════════════════════════════════════════════
// 辅助函数
// ════════════════════════════════════════════════════════════════════════════

float drawBox(vec2 p, vec2 center, vec2 size) {
    vec2 d = abs(p - center) - size;
    return 1.0 - smoothstep(0.0, 0.015, length(max(d, 0.0)));
}

float drawBoxOutline(vec2 p, vec2 center, vec2 size, float thickness) {
    vec2 d = abs(p - center) - size;
    float outer = length(max(d, 0.0));
    vec2 dInner = abs(p - center) - (size - thickness);
    float inner = length(max(dInner, 0.0));
    return smoothstep(0.01, 0.0, outer) * (1.0 - smoothstep(0.01, 0.0, inner));
}

float drawLine(vec2 p, vec2 a, vec2 b, float thickness) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return smoothstep(thickness + 0.003, thickness, length(pa - ba * h));
}

float drawPoint(vec2 p, vec2 center, float radius) {
    return smoothstep(radius + 0.005, radius - 0.005, length(p - center));
}

float drawArrow(vec2 p, vec2 start, vec2 end, float thickness) {
    float line = drawLine(p, start, end, thickness);
    vec2 dir = normalize(end - start);
    vec2 perp = vec2(-dir.y, dir.x);
    float head1 = drawLine(p, end, end - dir * 0.03 + perp * 0.02, thickness);
    float head2 = drawLine(p, end, end - dir * 0.03 - perp * 0.02, thickness);
    return max(max(line, head1), head2);
}

// 绘制对比卡片
float drawCard(vec2 p, vec2 center, vec2 size) {
    vec2 d = abs(p - center) - size;
    return smoothstep(0.02, 0.0, length(max(d, 0.0)));
}

void main() {
    vec2 uv = v_uv;
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    
    vec3 color = vec3(0.02, 0.025, 0.05);
    
    // 标题区域
    if (uv.y > 0.9) {
        color = vec3(0.08, 0.1, 0.18);
    }
    
    // 主内容区域 - 分成左右两栏
    else {
        vec2 contentUV = vec2(uv.x, uv.y / 0.9);
        bool isLeft = contentUV.x < 0.5;
        
        vec2 localUV = isLeft ? 
            vec2(contentUV.x * 2.0, contentUV.y) :
            vec2((contentUV.x - 0.5) * 2.0, contentUV.y);
        
        vec2 p = (localUV - 0.5) * 2.0;
        
        // ════════════════════════════════════════════════════════════
        // 【左栏】WebGL 1.0 特性展示
        // ════════════════════════════════════════════════════════════
        if (isLeft) {
            // 背景
            color = vec3(0.04, 0.03, 0.06);
            
            // 标题卡片
            float titleCard = drawCard(p, vec2(0.0, 0.75), vec2(0.7, 0.12));
            color = mix(color, vec3(0.15, 0.1, 0.2), titleCard);
            
            // 版本号装饰
            float v1Circle = drawPoint(p, vec2(-0.5, 0.75), 0.06);
            color = mix(color, vec3(0.8, 0.4, 0.2), v1Circle);
            
            // 特性列表卡片
            float cardY = 0.4;
            float cardSpacing = 0.28;
            
            // 卡片1: GLSL版本
            float card1 = drawCard(p, vec2(0.0, cardY), vec2(0.65, 0.1));
            color = mix(color, vec3(0.08, 0.06, 0.12), card1);
            float card1Border = drawBoxOutline(p, vec2(0.0, cardY), vec2(0.65, 0.1), 0.015);
            color = mix(color, vec3(0.5, 0.3, 0.6), card1Border);
            
            // 卡片2: 关键字
            cardY -= cardSpacing;
            float card2 = drawCard(p, vec2(0.0, cardY), vec2(0.65, 0.1));
            color = mix(color, vec3(0.08, 0.06, 0.12), card2);
            float card2Border = drawBoxOutline(p, vec2(0.0, cardY), vec2(0.65, 0.1), 0.015);
            color = mix(color, vec3(0.5, 0.3, 0.6), card2Border);
            
            // 卡片3: 纹理函数
            cardY -= cardSpacing;
            float card3 = drawCard(p, vec2(0.0, cardY), vec2(0.65, 0.1));
            color = mix(color, vec3(0.08, 0.06, 0.12), card3);
            float card3Border = drawBoxOutline(p, vec2(0.0, cardY), vec2(0.65, 0.1), 0.015);
            color = mix(color, vec3(0.5, 0.3, 0.6), card3Border);
            
            // 卡片4: 输出
            cardY -= cardSpacing;
            float card4 = drawCard(p, vec2(0.0, cardY), vec2(0.65, 0.1));
            color = mix(color, vec3(0.08, 0.06, 0.12), card4);
            float card4Border = drawBoxOutline(p, vec2(0.0, cardY), vec2(0.65, 0.1), 0.015);
            color = mix(color, vec3(0.5, 0.3, 0.6), card4Border);
            
            // 卡片5: 限制
            cardY -= cardSpacing;
            float card5 = drawCard(p, vec2(0.0, cardY), vec2(0.65, 0.1));
            color = mix(color, vec3(0.1, 0.05, 0.08), card5);
            float card5Border = drawBoxOutline(p, vec2(0.0, cardY), vec2(0.65, 0.1), 0.015);
            color = mix(color, vec3(0.7, 0.3, 0.3), card5Border);
        }
        
        // ════════════════════════════════════════════════════════════
        // 【右栏】WebGL 2.0 特性展示
        // ════════════════════════════════════════════════════════════
        else {
            // 背景
            color = vec3(0.03, 0.05, 0.07);
            
            // 标题卡片
            float titleCard = drawCard(p, vec2(0.0, 0.75), vec2(0.7, 0.12));
            color = mix(color, vec3(0.1, 0.15, 0.22), titleCard);
            
            // 版本号装饰
            float v2Circle = drawPoint(p, vec2(-0.5, 0.75), 0.06);
            color = mix(color, vec3(0.2, 0.6, 0.9), v2Circle);
            
            // 特性列表卡片
            float cardY = 0.4;
            float cardSpacing = 0.28;
            
            // 卡片1: GLSL版本
            float card1 = drawCard(p, vec2(0.0, cardY), vec2(0.65, 0.1));
            color = mix(color, vec3(0.06, 0.1, 0.14), card1);
            float card1Border = drawBoxOutline(p, vec2(0.0, cardY), vec2(0.65, 0.1), 0.015);
            color = mix(color, vec3(0.3, 0.6, 0.8), card1Border);
            
            // 卡片2: 关键字
            cardY -= cardSpacing;
            float card2 = drawCard(p, vec2(0.0, cardY), vec2(0.65, 0.1));
            color = mix(color, vec3(0.06, 0.1, 0.14), card2);
            float card2Border = drawBoxOutline(p, vec2(0.0, cardY), vec2(0.65, 0.1), 0.015);
            color = mix(color, vec3(0.3, 0.6, 0.8), card2Border);
            
            // 卡片3: 纹理函数
            cardY -= cardSpacing;
            float card3 = drawCard(p, vec2(0.0, cardY), vec2(0.65, 0.1));
            color = mix(color, vec3(0.06, 0.1, 0.14), card3);
            float card3Border = drawBoxOutline(p, vec2(0.0, cardY), vec2(0.65, 0.1), 0.015);
            color = mix(color, vec3(0.3, 0.6, 0.8), card3Border);
            
            // 卡片4: 输出
            cardY -= cardSpacing;
            float card4 = drawCard(p, vec2(0.0, cardY), vec2(0.65, 0.1));
            color = mix(color, vec3(0.06, 0.1, 0.14), card4);
            float card4Border = drawBoxOutline(p, vec2(0.0, cardY), vec2(0.65, 0.1), 0.015);
            color = mix(color, vec3(0.3, 0.6, 0.8), card4Border);
            
            // 卡片5: 新特性 (高亮)
            cardY -= cardSpacing;
            float card5 = drawCard(p, vec2(0.0, cardY), vec2(0.65, 0.1));
            float pulse = 0.5 + 0.5 * sin(u_time * 2.0);
            color = mix(color, vec3(0.08, 0.15, 0.12), card5);
            float card5Border = drawBoxOutline(p, vec2(0.0, cardY), vec2(0.65, 0.1), 0.015);
            color = mix(color, vec3(0.3, 0.9, 0.5) * (0.7 + pulse * 0.3), card5Border);
        }
        
        // 中间分隔线
        float divider = smoothstep(0.008, 0.0, abs(contentUV.x - 0.5));
        color = mix(color, vec3(0.4, 0.45, 0.55), divider);
        
        // 箭头动画（表示升级）
        float arrowY = 0.5 + sin(u_time * 2.0) * 0.02;
        float upgradeArrow = drawArrow(
            vec2((uv.x - 0.5) * 2.0, (contentUV.y - 0.5) * 2.0),
            vec2(-0.08, arrowY * 0.8),
            vec2(0.08, arrowY * 0.8),
            0.015
        );
        color = mix(color, vec3(0.0, 0.9, 0.7), upgradeArrow);
    }
    
    // ════════════════════════════════════════════════════════════════════════
    // 【WebGL 1.0】使用 gl_FragColor 输出颜色
    // 【WebGL 2.0】使用自定义的 out 变量，如: out vec4 fragColor;
    // ════════════════════════════════════════════════════════════════════════
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## WebGL 版本对比完整指南

### 📋 版本概述

| 特性 | WebGL 1.0 | WebGL 2.0 |
|-----|-----------|-----------|
| 基于 | OpenGL ES 2.0 | OpenGL ES 3.0 |
| GLSL版本 | GLSL ES 1.00 | GLSL ES 3.00 |
| 发布年份 | 2011 | 2017 |
| 浏览器支持 | 几乎所有 | 现代浏览器 |

---

## 🔤 GLSL语法变化

### 1. 版本声明

**WebGL 1.0** - 无需声明（默认GLSL ES 1.00）
\`\`\`glsl
// 无版本声明
precision mediump float;
\`\`\`

**WebGL 2.0** - 必须声明版本
\`\`\`glsl
#version 300 es
precision mediump float;
\`\`\`

---

### 2. 变量限定符变化

#### 顶点着色器

| WebGL 1.0 | WebGL 2.0 | 说明 |
|-----------|-----------|------|
| \`attribute\` | \`in\` | 顶点输入 |
| \`varying\` | \`out\` | 传递给片段着色器 |

**WebGL 1.0:**
\`\`\`glsl
attribute vec3 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
    v_texCoord = a_texCoord;
    gl_Position = vec4(a_position, 1.0);
}
\`\`\`

**WebGL 2.0:**
\`\`\`glsl
#version 300 es
in vec3 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;

void main() {
    v_texCoord = a_texCoord;
    gl_Position = vec4(a_position, 1.0);
}
\`\`\`

#### 片段着色器

| WebGL 1.0 | WebGL 2.0 | 说明 |
|-----------|-----------|------|
| \`varying\` | \`in\` | 从顶点着色器接收 |
| \`gl_FragColor\` | \`out vec4 fragColor\` | 颜色输出 |
| \`gl_FragData[n]\` | \`layout(location=n) out\` | MRT输出 |

**WebGL 1.0:**
\`\`\`glsl
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_texture;

void main() {
    gl_FragColor = texture2D(u_texture, v_texCoord);
}
\`\`\`

**WebGL 2.0:**
\`\`\`glsl
#version 300 es
precision mediump float;
in vec2 v_texCoord;
uniform sampler2D u_texture;
out vec4 fragColor;  // 自定义输出变量

void main() {
    fragColor = texture(u_texture, v_texCoord);
}
\`\`\`

---

### 3. 纹理采样函数

| WebGL 1.0 | WebGL 2.0 | 说明 |
|-----------|-----------|------|
| \`texture2D()\` | \`texture()\` | 2D纹理采样 |
| \`textureCube()\` | \`texture()\` | 立方体纹理采样 |
| 不支持 | \`texture()\` | 3D纹理采样 |
| \`texture2DLod()\` | \`textureLod()\` | 指定LOD级别 |
| \`texture2DProj()\` | \`textureProj()\` | 投影纹理 |

**WebGL 2.0 统一使用 \`texture()\`**，根据采样器类型自动选择：
\`\`\`glsl
uniform sampler2D tex2D;
uniform sampler3D tex3D;
uniform samplerCube texCube;

vec4 color2D = texture(tex2D, uv);      // 2D采样
vec4 color3D = texture(tex3D, uvw);     // 3D采样
vec4 colorCube = texture(texCube, dir); // 立方体采样
\`\`\`

---

## 🆕 WebGL 2.0 新增特性

### 1. 内置变量

\`\`\`glsl
// 顶点着色器
gl_VertexID    // int - 当前顶点索引
gl_InstanceID  // int - 实例化渲染的实例索引

// 片段着色器
gl_FragDepth   // float - 可写入自定义深度值
\`\`\`

### 2. 整数支持

**WebGL 2.0 完整支持整数运算：**
\`\`\`glsl
// 整数类型
int, uint, ivec2, ivec3, ivec4, uvec2, uvec3, uvec4

// 整数纹理
uniform isampler2D intTexture;
uniform usampler2D uintTexture;

// 位运算
int a = 5 & 3;   // AND
int b = 5 | 3;   // OR
int c = 5 ^ 3;   // XOR
int d = 5 << 2;  // 左移
int e = 5 >> 1;  // 右移
\`\`\`

### 3. 3D纹理

\`\`\`glsl
uniform sampler3D u_volume;

void main() {
    vec3 uvw = vec3(uv, slice);
    vec4 color = texture(u_volume, uvw);
}
\`\`\`

### 4. 多渲染目标 (MRT)

**WebGL 1.0:** 需要扩展 \`WEBGL_draw_buffers\`

**WebGL 2.0:** 原生支持
\`\`\`glsl
#version 300 es
precision mediump float;

layout(location = 0) out vec4 gPosition;
layout(location = 1) out vec4 gNormal;
layout(location = 2) out vec4 gAlbedo;

void main() {
    gPosition = vec4(worldPos, 1.0);
    gNormal = vec4(normal, 1.0);
    gAlbedo = vec4(albedo, 1.0);
}
\`\`\`

### 5. 统一缓冲对象 (UBO)

\`\`\`glsl
#version 300 es

// 定义统一块
layout(std140) uniform Matrices {
    mat4 projection;
    mat4 view;
    mat4 model;
};

// 直接使用
gl_Position = projection * view * model * vec4(position, 1.0);
\`\`\`

### 6. 实例化渲染

\`\`\`glsl
#version 300 es
in vec3 a_position;
in mat4 a_instanceMatrix;  // 每实例的变换矩阵

void main() {
    // gl_InstanceID 自动可用
    gl_Position = projection * view * a_instanceMatrix * vec4(a_position, 1.0);
}
\`\`\`

### 7. 变换反馈 (Transform Feedback)

允许将顶点着色器的输出捕获到缓冲区，用于：
- GPU粒子系统
- 物理模拟
- 几何处理

### 8. 采样器对象

独立于纹理的采样参数：
\`\`\`javascript
const sampler = gl.createSampler();
gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, gl.REPEAT);
gl.bindSampler(textureUnit, sampler);
\`\`\`

---

## 📊 纹理格式对比

### WebGL 1.0 支持的格式
| 格式 | 内部格式 |
|-----|---------|
| RGB | RGB |
| RGBA | RGBA |
| LUMINANCE | 灰度 |
| ALPHA | 透明度 |

### WebGL 2.0 新增格式
| 类型 | 格式示例 |
|-----|---------|
| 带大小的格式 | RGB8, RGBA8, RGB16F, RGBA32F |
| 整数格式 | R8I, RG16UI, RGBA32I |
| 深度格式 | DEPTH_COMPONENT24, DEPTH32F_STENCIL8 |
| 压缩格式 | 更多原生支持 |

---

## 🔧 JavaScript API 变化

### 顶点数组对象 (VAO)

**WebGL 1.0:** 需要扩展 \`OES_vertex_array_object\`

**WebGL 2.0:** 原生支持
\`\`\`javascript
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
// 设置顶点属性...
gl.bindVertexArray(null);

// 渲染时
gl.bindVertexArray(vao);
gl.drawArrays(gl.TRIANGLES, 0, count);
\`\`\`

### 获取上下文

\`\`\`javascript
// WebGL 1.0
const gl = canvas.getContext('webgl');

// WebGL 2.0
const gl = canvas.getContext('webgl2');

// 带回退的兼容写法
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
\`\`\`

---

## ⚠️ 迁移注意事项

### 必须修改的内容

1. **添加版本声明**: \`#version 300 es\`
2. **替换关键字**: 
   - \`attribute\` → \`in\`
   - \`varying\` → \`out\` (顶点) / \`in\` (片段)
3. **替换输出**: \`gl_FragColor\` → 自定义 \`out\` 变量
4. **替换纹理函数**: \`texture2D()\` → \`texture()\`

### 兼容性代码模板

\`\`\`glsl
// 顶点着色器 - WebGL 2.0
#version 300 es
in vec3 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;
uniform mat4 u_mvp;

void main() {
    v_texCoord = a_texCoord;
    gl_Position = u_mvp * vec4(a_position, 1.0);
}

// 片段着色器 - WebGL 2.0  
#version 300 es
precision highp float;
in vec2 v_texCoord;
uniform sampler2D u_texture;
out vec4 fragColor;

void main() {
    fragColor = texture(u_texture, v_texCoord);
}
\`\`\`

---

## 📈 性能建议

| 特性 | 性能影响 |
|-----|---------|
| VAO | 减少状态切换开销 |
| UBO | 批量更新uniform更高效 |
| 实例化 | 大量相似物体性能提升10-100倍 |
| MRT | 减少渲染pass数量 |
| 整数纹理 | 避免浮点精度问题 |

---

## 🌐 浏览器支持 (2024)

| 浏览器 | WebGL 1.0 | WebGL 2.0 |
|--------|-----------|-----------|
| Chrome | ✅ | ✅ |
| Firefox | ✅ | ✅ |
| Safari | ✅ | ✅ (15.0+) |
| Edge | ✅ | ✅ |
| iOS Safari | ✅ | ✅ (15.0+) |
| Android Chrome | ✅ | ✅ |

**建议**: 优先使用 WebGL 2.0，提供 WebGL 1.0 回退方案。
`,

  uniforms: ['u_time', 'u_resolution']
}

export default webglVersions
