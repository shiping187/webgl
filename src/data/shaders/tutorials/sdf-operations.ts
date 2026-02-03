/**
 * SDF组合与形变 - 距离场的代数运算
 * 展示SDF的布尔运算、平滑混合、域变形等高级技术
 */
import type { ShaderExample } from '../../../types'

const sdfOperations: ShaderExample = {
  id: 'sdf-operations',
  title: 'SDF组合与形变',
  description: '深入学习SDF的布尔运算（并集、交集、差集）、平滑混合、域变形等高级技术。',
  level: 'advanced',
  tags: ['SDF', '布尔运算', '形变', '教学'],

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
// 基础SDF图元
// ============================================

// 圆形SDF
float sdCircle(vec2 p, float r) {
    return length(p) - r;
}

// 矩形SDF
float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// 圆角矩形
float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 d = abs(p) - b + r;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}

// 线段SDF
float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

// ============================================
// SDF布尔运算
// ============================================

// 并集（Union）- 两个形状的合并
float opUnion(float d1, float d2) {
    return min(d1, d2);
}

// 交集（Intersection）- 两个形状的重叠部分
float opIntersection(float d1, float d2) {
    return max(d1, d2);
}

// 差集（Subtraction）- 从d1中减去d2
float opSubtraction(float d1, float d2) {
    return max(d1, -d2);
}

// ============================================
// 平滑布尔运算（最重要的技术！）
// ============================================

// 平滑并集 - 创造有机的融合效果
float opSmoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}

// 平滑交集
float opSmoothIntersection(float d1, float d2, float k) {
    float h = clamp(0.5 - 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) + k * h * (1.0 - h);
}

// 平滑差集
float opSmoothSubtraction(float d1, float d2, float k) {
    float h = clamp(0.5 - 0.5 * (d2 + d1) / k, 0.0, 1.0);
    return mix(d1, -d2, h) + k * h * (1.0 - h);
}

// ============================================
// 域变形（Domain Operations）
// ============================================

// 重复（Repeat）- 无限平铺
vec2 opRepeat(vec2 p, vec2 spacing) {
    return mod(p + spacing * 0.5, spacing) - spacing * 0.5;
}

// 极坐标重复
vec2 opRepeatPolar(vec2 p, float count) {
    float angle = 6.28318 / count;
    float a = atan(p.y, p.x) + angle * 0.5;
    a = mod(a, angle) - angle * 0.5;
    return vec2(cos(a), sin(a)) * length(p);
}

// ============================================
// 辅助函数
// ============================================

vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.0, 0.33, 0.67);
    return a + b * cos(6.28318 * (c * t + d));
}

void main() {
    // 宽高比校正
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    
    // 分成2x3的网格
    vec2 grid = floor(v_uv * vec2(2.0, 3.0));
    vec2 localUV = fract(v_uv * vec2(2.0, 3.0));
    vec2 p = (localUV * 2.0 - 1.0) * vec2(1.0, aspect.x / aspect.y * 0.666);
    
    float t = u_time;
    float d = 1.0;
    vec3 color = vec3(0.02, 0.02, 0.05);
    
    // 动画参数
    float anim = sin(t) * 0.3;
    
    if (grid.x == 0.0 && grid.y == 2.0) {
        // 【左上】基础并集
        float c1 = sdCircle(p - vec2(-0.2 + anim, 0.0), 0.3);
        float c2 = sdCircle(p - vec2(0.2 - anim, 0.0), 0.3);
        d = opUnion(c1, c2);
    }
    else if (grid.x == 1.0 && grid.y == 2.0) {
        // 【右上】平滑并集（对比）
        float c1 = sdCircle(p - vec2(-0.2 + anim, 0.0), 0.3);
        float c2 = sdCircle(p - vec2(0.2 - anim, 0.0), 0.3);
        d = opSmoothUnion(c1, c2, 0.2);
    }
    else if (grid.x == 0.0 && grid.y == 1.0) {
        // 【左中】交集
        float c1 = sdCircle(p - vec2(-0.15, 0.0), 0.35);
        float c2 = sdCircle(p - vec2(0.15, 0.0), 0.35);
        d = opIntersection(c1, c2);
    }
    else if (grid.x == 1.0 && grid.y == 1.0) {
        // 【右中】差集（挖洞）
        float box = sdBox(p, vec2(0.35));
        float hole = sdCircle(p - vec2(anim * 0.5, 0.0), 0.25);
        d = opSubtraction(box, hole);
    }
    else if (grid.x == 0.0 && grid.y == 0.0) {
        // 【左下】域重复
        vec2 rep = opRepeat(p, vec2(0.4));
        d = sdCircle(rep, 0.1);
    }
    else if (grid.x == 1.0 && grid.y == 0.0) {
        // 【右下】极坐标重复
        vec2 polar = opRepeatPolar(p, 6.0);
        float segment = sdSegment(polar, vec2(0.15, 0.0), vec2(0.45, 0.0)) - 0.03;
        float center = sdCircle(p, 0.12);
        d = opSmoothUnion(segment, center, 0.05);
    }
    
    // 渲染SDF
    float fill = 1.0 - smoothstep(0.0, 0.02, d);
    float edge = 1.0 - smoothstep(0.0, 0.015, abs(d));
    float glow = 1.0 - smoothstep(0.0, 0.2, d);
    
    // 颜色
    vec3 fillColor = palette(grid.x * 0.3 + grid.y * 0.2);
    vec3 edgeColor = vec3(1.0);
    vec3 glowColor = fillColor * 0.5;
    
    color += glowColor * glow * 0.3;
    color = mix(color, fillColor, fill);
    color = mix(color, edgeColor, edge * 0.8);
    
    // 网格分割线
    float gridLine = smoothstep(0.01, 0.0, min(
        min(localUV.x, 1.0 - localUV.x),
        min(localUV.y, 1.0 - localUV.y)
    ));
    color = mix(color, vec3(0.3), gridLine);
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## SDF组合与形变 - 距离场的代数运算

### 为什么SDF如此强大？

SDF不只是用来画圆！它的真正威力在于**可组合性**——简单形状可以通过代数运算组合成复杂形状。

### 基础布尔运算

#### 并集（Union）
\`\`\`glsl
float opUnion(float d1, float d2) {
    return min(d1, d2);
}
\`\`\`
取两个距离的最小值 = 最近的边界 = 两个形状的合并

#### 交集（Intersection）
\`\`\`glsl
float opIntersection(float d1, float d2) {
    return max(d1, d2);
}
\`\`\`
取最大值 = 只有同时在两个形状内部的区域

#### 差集（Subtraction）
\`\`\`glsl
float opSubtraction(float d1, float d2) {
    return max(d1, -d2);  // 注意负号！
}
\`\`\`
从d1中"挖掉"d2

### 平滑布尔运算（核心技术！）

普通布尔运算会产生尖锐的边缘。**平滑版本**创造有机的过渡。

\`\`\`glsl
float opSmoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}
\`\`\`

参数 \`k\` 控制融合的"柔软度"：
- k = 0：等同于普通min
- k 越大：融合区域越平滑

这就是实现**Metaball融合效果**的数学基础！

### 域变形（Domain Operations）

不是修改距离值，而是修改**输入坐标**。

#### 无限重复
\`\`\`glsl
vec2 opRepeat(vec2 p, vec2 spacing) {
    return mod(p + spacing * 0.5, spacing) - spacing * 0.5;
}
\`\`\`

只需要一个圆的SDF，就能画出无限个！

#### 极坐标重复
\`\`\`glsl
vec2 opRepeatPolar(vec2 p, float count) {
    float angle = 6.28318 / count;
    float a = atan(p.y, p.x) + angle * 0.5;
    a = mod(a, angle) - angle * 0.5;
    return vec2(cos(a), sin(a)) * length(p);
}
\`\`\`

围绕中心旋转复制。

### 六个演示区域

| 位置 | 演示内容 |
|------|----------|
| 左上 | 基础并集 - min(d1, d2) |
| 右上 | 平滑并集 - 有机融合 |
| 左中 | 交集 - max(d1, d2) |
| 右中 | 差集 - 挖洞效果 |
| 左下 | 域重复 - 无限平铺 |
| 右下 | 极坐标重复 - 旋转对称 |

### 进阶技巧

**圆角化任何形状**
\`\`\`glsl
float rounded = originalSDF - radius;
\`\`\`

**轮廓线**
\`\`\`glsl
float outline = abs(sdf) - thickness;
\`\`\`

**膨胀/收缩**
\`\`\`glsl
float dilated = sdf - amount;
float eroded = sdf + amount;
\`\`\`

### 组合的艺术

复杂形状 = 基础形状 + 布尔运算 + 域变形

例如创建一个齿轮：
1. 大圆（主体）
2. 小圆（中心孔）→ 差集
3. 矩形（齿）→ 极坐标重复 + 并集
`,

  uniforms: ['u_time', 'u_resolution']
}

export default sdfOperations
