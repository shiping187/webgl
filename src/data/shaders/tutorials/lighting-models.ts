/**
 * 光照模型详解 - 从Lambert到PBR
 * 深入理解Shader中的光照计算原理
 */
import type { ShaderExample } from '../../../types'

const lightingModels: ShaderExample = {
  id: 'lighting-models',
  title: '光照模型详解',
  description: '从基础的Lambert漫反射到高级的Phong/Blinn-Phong模型，理解光照计算的数学原理。',
  level: 'advanced',
  tags: ['光照', 'Lambert', 'Phong', '法线', '教学'],

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
uniform vec2 u_mouse;

// ============================================
// 辅助函数
// ============================================

// 从高度图计算法线
vec3 calcNormal(vec2 uv, float height) {
    float eps = 0.01;
    float h = height;
    float hx = sin(uv.x * 20.0 + u_time) * 0.5;  // 简化的高度采样
    float hy = sin(uv.y * 20.0 + u_time) * 0.5;
    return normalize(vec3(h - hx, h - hy, 0.3));
}

// 球面法线（用于球体演示）
vec3 sphereNormal(vec2 uv) {
    vec2 p = uv * 2.0 - 1.0;
    float r2 = dot(p, p);
    if (r2 > 1.0) return vec3(0.0, 0.0, -1.0);
    return vec3(p, sqrt(1.0 - r2));
}

void main() {
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    
    // 分成2x2网格
    vec2 grid = floor(v_uv * 2.0);
    vec2 localUV = fract(v_uv * 2.0);
    
    // 校正宽高比
    vec2 p = localUV * 2.0 - 1.0;
    p.x *= aspect.x / aspect.y * 0.5;
    
    vec3 color = vec3(0.02, 0.02, 0.05);
    
    // 动态光源位置
    float lt = u_time * 0.5;
    vec3 lightPos = vec3(sin(lt), cos(lt * 0.7), 1.0);
    
    // 使用鼠标控制光源（如果有交互）
    if (u_mouse.x > 0.0) {
        lightPos = vec3((u_mouse - 0.5) * 2.0, 1.0);
    }
    
    vec3 lightDir = normalize(lightPos);
    vec3 lightColor = vec3(1.0, 0.95, 0.9);
    
    // 视线方向（假设正对屏幕）
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    
    // 材质属性
    vec3 baseColor = vec3(0.0, 0.7, 0.65);
    float shininess = 32.0;
    
    // 创建球体区域
    float sphereDist = length(p);
    bool inSphere = sphereDist < 0.8;
    
    if (grid.x == 0.0 && grid.y == 1.0 && inSphere) {
        // ============================================
        // 【左上】Lambert漫反射
        // ============================================
        // 最基础的光照模型：亮度 = 法线·光线方向
        
        vec3 normal = sphereNormal(localUV);
        
        // Lambert漫反射公式
        float NdotL = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = baseColor * NdotL;
        
        // 环境光（防止完全黑暗）
        vec3 ambient = baseColor * 0.15;
        
        color = ambient + diffuse;
    }
    else if (grid.x == 1.0 && grid.y == 1.0 && inSphere) {
        // ============================================
        // 【右上】Phong镜面反射
        // ============================================
        // 添加高光：反射方向与视线方向的关系
        
        vec3 normal = sphereNormal(localUV);
        
        // 漫反射
        float NdotL = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = baseColor * NdotL;
        
        // Phong镜面反射
        // 反射向量 = 2 * (N·L) * N - L
        vec3 reflectDir = reflect(-lightDir, normal);
        float RdotV = max(dot(reflectDir, viewDir), 0.0);
        float spec = pow(RdotV, shininess);
        vec3 specular = lightColor * spec;
        
        vec3 ambient = baseColor * 0.15;
        color = ambient + diffuse + specular;
    }
    else if (grid.x == 0.0 && grid.y == 0.0 && inSphere) {
        // ============================================
        // 【左下】Blinn-Phong模型
        // ============================================
        // 更高效的镜面反射计算
        
        vec3 normal = sphereNormal(localUV);
        
        // 漫反射
        float NdotL = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = baseColor * NdotL;
        
        // Blinn-Phong：使用半程向量
        // H = normalize(L + V)
        vec3 halfDir = normalize(lightDir + viewDir);
        float NdotH = max(dot(normal, halfDir), 0.0);
        float spec = pow(NdotH, shininess * 2.0);  // 需要更高的指数
        vec3 specular = lightColor * spec;
        
        vec3 ambient = baseColor * 0.15;
        color = ambient + diffuse + specular;
    }
    else if (grid.x == 1.0 && grid.y == 0.0 && inSphere) {
        // ============================================
        // 【右下】菲涅尔效应 + 边缘光
        // ============================================
        // 真实的物理现象：边缘比正面更亮
        
        vec3 normal = sphereNormal(localUV);
        
        // 基础光照
        float NdotL = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = baseColor * NdotL;
        
        // Blinn-Phong镜面
        vec3 halfDir = normalize(lightDir + viewDir);
        float NdotH = max(dot(normal, halfDir), 0.0);
        float spec = pow(NdotH, shininess * 2.0);
        vec3 specular = lightColor * spec;
        
        // 菲涅尔效应
        // 当视线与表面接近平行时，反射增强
        float NdotV = max(dot(normal, viewDir), 0.0);
        float fresnel = pow(1.0 - NdotV, 3.0);
        vec3 fresnelColor = vec3(0.6, 0.3, 0.9);  // 边缘发光颜色
        
        vec3 ambient = baseColor * 0.15;
        color = ambient + diffuse + specular;
        color += fresnelColor * fresnel * 0.6;
    }
    
    // 非球体区域（背景）
    if (!inSphere) {
        // 显示光源位置指示器
        vec2 lightUV = lightPos.xy * 0.4;
        float lightDot = smoothstep(0.08, 0.05, length(p - lightUV));
        color = mix(color, lightColor, lightDot);
        
        // 背景网格
        float bgGrid = step(0.95, max(
            fract(localUV.x * 10.0),
            fract(localUV.y * 10.0)
        ));
        color += vec3(0.05) * bgGrid;
    }
    
    // 球体边缘抗锯齿
    if (inSphere) {
        float edge = smoothstep(0.8, 0.78, sphereDist);
        color *= edge;
    }
    
    // 网格分割线
    float divider = smoothstep(0.01, 0.0, min(
        abs(v_uv.x - 0.5),
        abs(v_uv.y - 0.5)
    ));
    color = mix(color, vec3(0.3), divider);
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## 光照模型详解 - 理解光与表面的交互

### 光照的基本组成

大多数光照模型将光分解为三个组成部分：
1. **环境光（Ambient）** - 间接光照，防止阴影全黑
2. **漫反射（Diffuse）** - 表面散射的光
3. **镜面反射（Specular）** - 光滑表面的高光

### 核心概念：法线向量

**法线（Normal）** 是垂直于表面的单位向量。所有光照计算都依赖于法线。

\`\`\`glsl
vec3 normal = normalize(surfaceNormal);
\`\`\`

### Lambert漫反射模型

最简单的物理光照模型，由Johann Lambert在18世纪提出。

\`\`\`glsl
float diffuse = max(dot(normal, lightDir), 0.0);
\`\`\`

**物理含义**：
- 光线垂直照射（N·L = 1）→ 最亮
- 光线平行表面（N·L = 0）→ 完全不亮
- 光线从背面照（N·L < 0）→ 截断为0

### Phong镜面反射

添加了高光效果，模拟光滑表面。

\`\`\`glsl
vec3 reflectDir = reflect(-lightDir, normal);
float spec = pow(max(dot(reflectDir, viewDir), 0.0), shininess);
\`\`\`

**关键参数**：
- \`shininess\`（光泽度）：值越大，高光越小越锐利
- 通常范围：8（粗糙）到 256（镜面）

### Blinn-Phong模型（更常用）

使用**半程向量**代替反射向量，计算更高效。

\`\`\`glsl
vec3 halfDir = normalize(lightDir + viewDir);
float spec = pow(max(dot(normal, halfDir), 0.0), shininess * 4.0);
\`\`\`

**半程向量**是光线方向和视线方向的中间向量。当它与法线对齐时，说明高光应该出现。

### 菲涅尔效应

真实世界的物理现象：从掠射角度看，表面反射更强。

\`\`\`glsl
float NdotV = max(dot(normal, viewDir), 0.0);
float fresnel = pow(1.0 - NdotV, 3.0);
\`\`\`

**应用**：
- 边缘光（Rim Lighting）
- 玻璃/水面的反射
- 次表面散射近似

### 四个演示区域

| 位置 | 模型 | 特点 |
|------|------|------|
| 左上 | Lambert | 仅漫反射，哑光表面 |
| 右上 | Phong | 添加高光，有光泽 |
| 左下 | Blinn-Phong | 更高效的高光计算 |
| 右下 | Fresnel | 边缘发光效果 |

### 完整光照公式

\`\`\`glsl
vec3 finalColor = ambient + diffuse + specular + fresnel;
\`\`\`

每个组件都可以独立调整颜色和强度，创造不同的材质效果。

### 进阶：PBR（基于物理的渲染）

现代游戏使用的光照模型，参数更直观：
- **金属度（Metallic）**：0 = 非金属，1 = 金属
- **粗糙度（Roughness）**：0 = 镜面，1 = 粗糙
- **基础色（Albedo）**：材质本身的颜色

PBR遵循能量守恒，漫反射 + 镜面反射 ≤ 入射光。
`,

  uniforms: ['u_time', 'u_resolution', 'u_mouse']
}

export default lightingModels
