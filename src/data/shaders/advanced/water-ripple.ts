/**
 * 水波纹效果 - 光学模拟
 * 模拟水面波纹的折射与反射效果
 */
import type { ShaderExample } from '../../../types'

const waterRipple: ShaderExample = {
  id: 'water-ripple',
  title: '水波纹效果',
  description: '模拟水面波纹的折射与反射效果。',
  level: 'advanced',
  tags: ['水面', '波纹', '折射'],

  vertexShader: /* wgsl */ `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}`,

  fragmentShader: /* wgsl */ `
precision highp float;
varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;

// 简化的水波函数
float waterHeight(vec2 p, float t) {
    float h = 0.0;
    
    // 多层波浪叠加
    h += sin(p.x * 6.0 + t * 2.0) * 0.15;
    h += sin(p.y * 5.0 + t * 1.5) * 0.15;
    h += sin((p.x + p.y) * 4.0 + t * 1.8) * 0.1;
    h += sin(length(p - vec2(0.5)) * 12.0 - t * 3.0) * 0.08;
    
    // 更细的波纹
    h += sin(p.x * 15.0 + p.y * 10.0 + t * 4.0) * 0.03;
    h += sin(p.x * 10.0 - p.y * 15.0 - t * 3.5) * 0.03;
    
    return h;
}

// 计算水面法线
vec3 waterNormal(vec2 p, float t) {
    float eps = 0.01;
    float h = waterHeight(p, t);
    float hx = waterHeight(p + vec2(eps, 0.0), t);
    float hy = waterHeight(p + vec2(0.0, eps), t);
    
    return normalize(vec3(h - hx, eps, h - hy));
}

void main() {
    vec2 uv = v_uv;
    float t = u_time;
    
    // 计算水面法线
    vec3 normal = waterNormal(uv, t);
    
    // 视线方向（简化为垂直向下看）
    vec3 viewDir = vec3(0.0, 1.0, 0.0);
    
    // 折射偏移
    vec2 refractOffset = normal.xz * 0.1;
    
    // 创建"水下"的颜色（模拟光线折射后看到的颜色）
    vec2 refractUV = uv + refractOffset;
    
    // 水下的棋盘格图案
    vec2 checker = floor(refractUV * 8.0);
    float pattern = mod(checker.x + checker.y, 2.0);
    vec3 underwaterColor = mix(
        vec3(0.1, 0.3, 0.4),
        vec3(0.15, 0.4, 0.5),
        pattern
    );
    
    // 水面颜色
    vec3 waterColor = vec3(0.0, 0.5, 0.65);
    
    // 反射（简化的天空反射）
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
    vec3 skyColor = vec3(0.4, 0.6, 0.9);
    
    // 高光
    vec3 lightDir = normalize(vec3(1.0, 1.0, 0.5));
    float spec = pow(max(dot(reflect(-lightDir, normal), viewDir), 0.0), 64.0);
    
    // 混合
    vec3 color = underwaterColor;
    color = mix(color, waterColor, 0.3);
    color = mix(color, skyColor, fresnel * 0.5);
    color += vec3(1.0) * spec * 0.8;
    
    // 焦散效果（简化）
    float caustic = waterHeight(uv * 3.0, t * 2.0);
    caustic = pow(caustic * 0.5 + 0.5, 4.0);
    color += vec3(0.2, 0.4, 0.5) * caustic * 0.3;
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## 水波纹效果 - 光学模拟

### 水面的视觉特征

水面涉及复杂的光学现象：
1. **折射** - 水下物体看起来偏移
2. **反射** - 天空和周围环境的倒影
3. **菲涅尔效应** - 角度越小反射越强
4. **焦散** - 光线聚焦产生的亮斑

### 水面高度函数

\`\`\`glsl
float waterHeight(vec2 p, float t) {
    float h = 0.0;
    h += sin(p.x * 6.0 + t * 2.0) * 0.15;
    // ... 更多波浪
    return h;
}
\`\`\`

叠加多个不同频率、方向、速度的正弦波。

### 法线计算

\`\`\`glsl
vec3 waterNormal(vec2 p, float t) {
    float eps = 0.01;
    float h = waterHeight(p, t);
    float hx = waterHeight(p + vec2(eps, 0.0), t);
    float hy = waterHeight(p + vec2(0.0, eps), t);
    
    return normalize(vec3(h - hx, eps, h - hy));
}
\`\`\`

通过**有限差分**计算高度场的梯度（斜率），梯度方向垂直于表面。

### 折射偏移

\`\`\`glsl
vec2 refractOffset = normal.xz * 0.1;
vec2 refractUV = uv + refractOffset;
\`\`\`

简化的折射：根据法线偏移UV坐标，模拟光线弯曲。

### 菲涅尔效应

\`\`\`glsl
float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
\`\`\`

当视线与表面夹角小时，反射更强。这就是为什么远处的水面更像镜子。

### 焦散（Caustics）

光线通过波浪水面后会聚焦，产生移动的亮斑。这里用简化的方法模拟。
`,

  uniforms: ['u_time', 'u_resolution']
}

export default waterRipple
