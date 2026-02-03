import type { ShaderExample } from '../../../types/shader'

const sphereDeform: ShaderExample = {
  id: 'sphere-deform',
  title: '3D 球体噪声变形',
  level: 'advanced',
  description: '使用噪声函数对球体进行实时变形，创造有机的生物般的形态',
  tags: ['3D', '噪声变形', '球体', '有机形态'],
  
  vertexShader: /* wgsl */ `
attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_uv;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform float u_time;

varying vec3 v_normal;
varying vec3 v_worldPosition;
varying vec2 v_uv;
varying float v_displacement;

// 简单的 3D 噪声函数
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// 分形布朗运动
float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for(int i = 0; i < 4; i++) {
        value += amplitude * snoise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    
    return value;
}

void main() {
    v_uv = a_uv;
    
    // 动态噪声采样点
    vec3 noisePos = a_position * 2.0 + vec3(u_time * 0.3, u_time * 0.2, u_time * 0.4);
    
    // 多层噪声叠加
    float noise1 = fbm(noisePos);
    float noise2 = fbm(noisePos * 2.0 + 10.0);
    
    // 组合噪声
    float displacement = noise1 * 0.3 + noise2 * 0.1;
    
    // 添加脉动效果
    displacement += sin(u_time * 2.0) * 0.05;
    
    // 变形后的位置
    vec3 pos = a_position + a_normal * displacement;
    
    v_displacement = displacement;
    
    // 近似重新计算法线
    float eps = 0.01;
    vec3 tangent = normalize(cross(a_normal, vec3(0.0, 1.0, 0.0)));
    if(length(tangent) < 0.01) tangent = normalize(cross(a_normal, vec3(1.0, 0.0, 0.0)));
    vec3 bitangent = normalize(cross(a_normal, tangent));
    
    vec3 p1 = a_position + tangent * eps;
    vec3 p2 = a_position + bitangent * eps;
    
    float d1 = fbm(p1 * 2.0 + vec3(u_time * 0.3)) * 0.3;
    float d2 = fbm(p2 * 2.0 + vec3(u_time * 0.3)) * 0.3;
    
    vec3 v1 = (a_position + a_normal * displacement) - (p1 + normalize(p1) * d1);
    vec3 v2 = (a_position + a_normal * displacement) - (p2 + normalize(p2) * d2);
    
    v_normal = normalize(cross(v2, v1));
    
    // MVP 变换
    vec4 worldPosition = u_modelMatrix * vec4(pos, 1.0);
    v_worldPosition = worldPosition.xyz;
    
    gl_Position = u_projectionMatrix * u_viewMatrix * worldPosition;
}`,

  fragmentShader: /* wgsl */ `
precision highp float;

varying vec3 v_normal;
varying vec3 v_worldPosition;
varying vec2 v_uv;
varying float v_displacement;

uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec3 N = normalize(v_normal);
    vec3 V = normalize(vec3(0.0, 0.0, 4.0) - v_worldPosition);
    
    // 动态光源
    vec3 lightPos = vec3(
        sin(u_time * 0.7) * 3.0,
        cos(u_time * 0.5) * 3.0,
        3.0
    );
    vec3 L = normalize(lightPos - v_worldPosition);
    vec3 H = normalize(L + V);
    
    // 光照计算
    float diff = max(dot(N, L), 0.0);
    float spec = pow(max(dot(N, H), 0.0), 32.0);
    
    // 次表面散射模拟
    float sss = pow(max(dot(V, -L), 0.0), 2.0) * 0.3;
    
    // 菲涅尔
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 4.0);
    
    // 基于变形量的颜色
    vec3 color1 = vec3(0.1, 0.4, 0.8);   // 凹陷区域
    vec3 color2 = vec3(0.0, 0.9, 0.7);   // 凸起区域
    vec3 color3 = vec3(1.0, 0.3, 0.5);   // 高光区域
    
    float t = v_displacement * 2.0 + 0.5;
    vec3 baseColor = mix(color1, color2, smoothstep(-0.2, 0.2, t));
    
    // 组合
    vec3 ambient = baseColor * 0.2;
    vec3 diffuse = baseColor * diff * 0.7;
    vec3 specular = color3 * spec * 0.5;
    vec3 fresnelColor = vec3(0.5, 0.8, 1.0) * fresnel * 0.4;
    vec3 sssColor = color2 * sss;
    
    vec3 finalColor = ambient + diffuse + specular + fresnelColor + sssColor;
    
    // 添加脉动光晕
    float pulse = sin(u_time * 3.0) * 0.5 + 0.5;
    finalColor += baseColor * pulse * 0.1 * fresnel;
    
    // 色调映射
    finalColor = finalColor / (finalColor + vec3(1.0));
    finalColor = pow(finalColor, vec3(1.0 / 2.2));
    
    gl_FragColor = vec4(finalColor, 1.0);
}`,
  
  is3D: true,
  
  explanation: `## 3D 球体噪声变形

### 核心技术

这个示例展示了如何使用 **噪声函数** 对 3D 几何体进行有机变形。

### 1. Simplex Noise (单形噪声)

比 Perlin 噪声更高效的 3D 噪声算法：

\`\`\`glsl
float snoise(vec3 v) {
    // 使用单形网格（四面体）而非立方体网格
    // 更少的采样点，更好的视觉效果
}
\`\`\`

### 2. 分形布朗运动 (FBM)

通过叠加多个频率的噪声，创造更自然的变形：

\`\`\`glsl
float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for(int i = 0; i < 4; i++) {
        value += amplitude * snoise(p * frequency);
        frequency *= 2.0;    // 每层频率加倍
        amplitude *= 0.5;    // 每层振幅减半
    }
    return value;
}
\`\`\`

### 3. 动态法线计算

变形后需要重新计算法线以获得正确的光照：

\`\`\`glsl
// 使用有限差分法近似计算法线
vec3 tangent = normalize(cross(a_normal, vec3(0.0, 1.0, 0.0)));
vec3 bitangent = normalize(cross(a_normal, tangent));

// 采样相邻点的变形量
float d1 = fbm(p1 * 2.0 + vec3(u_time * 0.3)) * 0.3;
float d2 = fbm(p2 * 2.0 + vec3(u_time * 0.3)) * 0.3;

// 计算新的法线
v_normal = normalize(cross(v2, v1));
\`\`\`

### 4. 次表面散射 (SSS) 模拟

让材质看起来更有"肉感"：

\`\`\`glsl
// 光线穿透表面的效果
float sss = pow(max(dot(V, -L), 0.0), 2.0) * 0.3;
\`\`\`

### 5. 基于变形的颜色

凹陷和凸起区域使用不同颜色：

\`\`\`glsl
float t = v_displacement * 2.0 + 0.5;
vec3 baseColor = mix(color1, color2, smoothstep(-0.2, 0.2, t));
\`\`\`

### 学习要点

1. **噪声的连续性**: Simplex noise 保证了时间和空间上的平滑过渡
2. **FBM 的自相似性**: 模拟自然界中的分形结构
3. **法线重计算的重要性**: 变形后的光照需要正确的法线
4. **有机感的来源**: 多层噪声 + 次表面散射 + 脉动效果`
}

export default sphereDeform
