import type { ShaderExample } from '../../../types/shader'

const cube3D: ShaderExample = {
  id: 'cube-3d',
  title: '3D 立方体顶点动画',
  level: 'advanced',
  description: '通过顶点着色器实现3D立方体的变形动画，演示MVP矩阵变换和法线计算',
  tags: ['3D', '顶点动画', 'MVP矩阵', '法线'],
  
  vertexShader: /* wgsl */ `
attribute vec3 a_position;
attribute vec3 a_normal;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform float u_time;

varying vec3 v_normal;
varying vec3 v_worldPosition;
varying vec3 v_localPosition;

void main() {
    // 保存原始位置用于片段着色器
    v_localPosition = a_position;
    
    // 顶点变形动画 - 呼吸效果
    vec3 pos = a_position;
    
    // 基于位置的波动变形
    float wave1 = sin(u_time * 2.0 + pos.x * 3.0) * 0.1;
    float wave2 = sin(u_time * 2.5 + pos.y * 3.0) * 0.08;
    float wave3 = sin(u_time * 1.8 + pos.z * 3.0) * 0.06;
    
    // 沿法线方向膨胀/收缩
    pos += a_normal * (wave1 + wave2 + wave3);
    
    // 整体呼吸缩放
    float breathe = sin(u_time * 1.5) * 0.05 + 1.0;
    pos *= breathe;
    
    // 计算世界坐标
    vec4 worldPosition = u_modelMatrix * vec4(pos, 1.0);
    v_worldPosition = worldPosition.xyz;
    
    // 变换法线到世界空间 (使用逆转置矩阵的简化版本)
    v_normal = mat3(u_modelMatrix) * a_normal;
    
    // MVP 变换
    gl_Position = u_projectionMatrix * u_viewMatrix * worldPosition;
}`,

  fragmentShader: /* wgsl */ `
precision highp float;

varying vec3 v_normal;
varying vec3 v_worldPosition;
varying vec3 v_localPosition;

uniform float u_time;
uniform vec2 u_resolution;

// 光源位置
const vec3 lightPos1 = vec3(2.0, 2.0, 3.0);
const vec3 lightPos2 = vec3(-2.0, -1.0, 2.0);

void main() {
    // 标准化法线
    vec3 N = normalize(v_normal);
    
    // 视线方向 (假设相机在 z 轴正方向)
    vec3 V = normalize(vec3(0.0, 0.0, 3.0) - v_worldPosition);
    
    // 动态光源位置
    vec3 light1 = vec3(
        sin(u_time) * 3.0,
        cos(u_time * 0.7) * 2.0,
        3.0
    );
    
    // === 第一个光源 (主光) ===
    vec3 L1 = normalize(light1 - v_worldPosition);
    vec3 H1 = normalize(L1 + V);
    
    float diff1 = max(dot(N, L1), 0.0);
    float spec1 = pow(max(dot(N, H1), 0.0), 64.0);
    
    // === 第二个光源 (补光) ===
    vec3 L2 = normalize(lightPos2 - v_worldPosition);
    float diff2 = max(dot(N, L2), 0.0);
    
    // === 菲涅尔效果 ===
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    
    // === 基于位置的颜色 ===
    vec3 baseColor = vec3(
        0.5 + 0.5 * v_localPosition.x,
        0.5 + 0.5 * v_localPosition.y,
        0.5 + 0.5 * v_localPosition.z
    );
    
    // 添加时间变化
    baseColor = mix(baseColor, vec3(0.0, 0.8, 0.8), 0.3 + 0.2 * sin(u_time));
    
    // === 组合光照 ===
    vec3 ambient = baseColor * 0.15;
    vec3 diffuse = baseColor * (diff1 * 0.7 + diff2 * 0.3);
    vec3 specular = vec3(1.0) * spec1 * 0.8;
    vec3 fresnelColor = vec3(0.3, 0.6, 1.0) * fresnel * 0.6;
    
    vec3 finalColor = ambient + diffuse + specular + fresnelColor;
    
    // 色调映射
    finalColor = finalColor / (finalColor + vec3(1.0));
    
    // Gamma 校正
    finalColor = pow(finalColor, vec3(1.0 / 2.2));
    
    gl_FragColor = vec4(finalColor, 1.0);
}`,
  
  // 标记为需要 3D 渲染模式
  is3D: true,
  
  explanation: `## 3D 立方体顶点动画

### 核心概念

这个示例展示了如何使用 **顶点着色器** 实现 3D 几何体的变形动画。

### 1. MVP 矩阵变换

在 3D 渲染中，顶点需要经过三次矩阵变换：

\`\`\`glsl
// Model 矩阵: 局部空间 → 世界空间
vec4 worldPosition = u_modelMatrix * vec4(pos, 1.0);

// View 矩阵: 世界空间 → 观察空间
// Projection 矩阵: 观察空间 → 裁剪空间
gl_Position = u_projectionMatrix * u_viewMatrix * worldPosition;
\`\`\`

### 2. 顶点变形技术

通过在顶点着色器中修改顶点位置，实现动态变形：

\`\`\`glsl
// 基于位置的波动变形
float wave = sin(u_time * 2.0 + pos.x * 3.0) * 0.1;

// 沿法线方向膨胀
pos += a_normal * wave;
\`\`\`

### 3. Blinn-Phong 光照模型

片段着色器中实现完整的光照计算：

- **环境光 (Ambient)**: 模拟间接光照
- **漫反射 (Diffuse)**: 基于表面与光线的角度
- **镜面反射 (Specular)**: 高光效果
- **菲涅尔 (Fresnel)**: 边缘发光效果

\`\`\`glsl
// 半角向量 (Blinn-Phong)
vec3 H = normalize(L + V);
float spec = pow(max(dot(N, H), 0.0), 64.0);

// 菲涅尔效果
float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);
\`\`\`

### 4. 色调映射与 Gamma 校正

\`\`\`glsl
// Reinhard 色调映射
color = color / (color + vec3(1.0));

// Gamma 校正 (线性空间 → sRGB)
color = pow(color, vec3(1.0 / 2.2));
\`\`\`

### 学习要点

1. **矩阵变换顺序**: 必须是 Projection × View × Model × Position
2. **法线变换**: 需要使用模型矩阵的逆转置
3. **光照计算在世界空间进行**: 确保光源和表面在同一坐标系
4. **顶点着色器的威力**: 可以实现几何体的任意变形`
}

export default cube3D
