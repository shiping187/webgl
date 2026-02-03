import type { ShaderExample } from '../../../types/shader'

const particles3D: ShaderExample = {
  id: 'particles-3d',
  title: '3D 粒子系统',
  level: 'advanced',
  description: '使用顶点着色器实现的GPU粒子系统，包含粒子生命周期、力场和交互效果',
  tags: ['3D', '粒子系统', 'GPU计算', '力场'],
  
  vertexShader: /* wgsl */ `
attribute vec3 a_position;      // 初始位置
attribute vec3 a_velocity;      // 初始速度
attribute vec2 a_params;        // x: 生命值偏移, y: 大小

uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform float u_time;
uniform vec2 u_mouse;

varying vec3 v_color;
varying float v_alpha;

// 简单的伪随机函数
float hash(float n) {
    return fract(sin(n) * 43758.5453);
}

// 涡旋力场
vec3 vortexForce(vec3 pos, vec3 center, float strength) {
    vec3 diff = pos - center;
    float dist = length(diff);
    vec3 tangent = normalize(cross(diff, vec3(0.0, 1.0, 0.0)));
    return tangent * strength / (dist + 0.5);
}

void main() {
    // 粒子生命周期 (0-1 循环)
    float lifetime = 4.0;  // 秒
    float age = mod(u_time + a_params.x * lifetime, lifetime);
    float normalizedAge = age / lifetime;
    
    // 基础物理模拟
    vec3 pos = a_position;
    vec3 vel = a_velocity;
    
    // 重力
    vec3 gravity = vec3(0.0, -0.5, 0.0);
    
    // 涡旋力场 (鼠标位置影响)
    vec3 mousePos3D = vec3((u_mouse.x - 0.5) * 4.0, (u_mouse.y - 0.5) * 4.0, 0.0);
    vec3 vortex = vortexForce(pos, mousePos3D, 2.0);
    
    // 向心力 (保持粒子在视野内)
    vec3 centerForce = -pos * 0.1;
    
    // 位置更新 (简化的欧拉积分)
    vec3 acceleration = gravity + vortex + centerForce;
    vel += acceleration * age;
    pos += vel * age + a_velocity * normalizedAge * 2.0;
    
    // 循环边界
    pos = mod(pos + 3.0, 6.0) - 3.0;
    
    // 颜色基于速度和年龄
    float speed = length(vel);
    vec3 color1 = vec3(1.0, 0.3, 0.1);    // 年轻/快速 - 橙红色
    vec3 color2 = vec3(0.1, 0.5, 1.0);    // 中年 - 蓝色
    vec3 color3 = vec3(0.8, 0.2, 0.8);    // 年老/慢速 - 紫色
    
    float speedFactor = smoothstep(0.0, 2.0, speed);
    v_color = mix(color3, mix(color2, color1, speedFactor), 1.0 - normalizedAge);
    
    // 透明度: 淡入淡出
    float fadeIn = smoothstep(0.0, 0.1, normalizedAge);
    float fadeOut = 1.0 - smoothstep(0.8, 1.0, normalizedAge);
    v_alpha = fadeIn * fadeOut * 0.8;
    
    // 粒子大小
    float baseSize = a_params.y * 15.0;
    float ageScale = 1.0 - normalizedAge * 0.5;  // 随年龄变小
    float speedScale = 1.0 + speedFactor * 0.3;  // 速度快时变大
    
    // 应用变换
    vec4 viewPos = u_viewMatrix * vec4(pos, 1.0);
    gl_Position = u_projectionMatrix * viewPos;
    
    // 根据深度调整大小 (近大远小)
    float depth = -viewPos.z;
    gl_PointSize = baseSize * ageScale * speedScale / (depth * 0.5 + 1.0);
}`,

  fragmentShader: /* wgsl */ `
precision highp float;

varying vec3 v_color;
varying float v_alpha;

uniform float u_time;

void main() {
    // 从中心到边缘的距离
    vec2 coord = gl_PointCoord * 2.0 - 1.0;
    float r = length(coord);
    
    // 丢弃圆外的像素
    if(r > 1.0) discard;
    
    // 软边缘
    float softEdge = 1.0 - smoothstep(0.5, 1.0, r);
    
    // 中心发光效果
    float glow = exp(-r * 3.0);
    
    // 闪烁效果
    float flicker = 0.9 + 0.1 * sin(u_time * 10.0 + gl_FragCoord.x * 0.1);
    
    // 颜色增强
    vec3 color = v_color * (1.0 + glow * 0.5);
    
    // 添加白色核心
    color = mix(color, vec3(1.0), glow * 0.3);
    
    float alpha = softEdge * v_alpha * flicker;
    
    gl_FragColor = vec4(color, alpha);
}`,
  
  is3D: true,
  particleCount: 2000,
  
  explanation: `## 3D GPU 粒子系统

### 核心概念

GPU 粒子系统将粒子的运动计算完全放在着色器中，可以同时处理数万个粒子。

### 1. 粒子属性设计

每个粒子携带这些属性：

\`\`\`glsl
attribute vec3 a_position;   // 初始位置
attribute vec3 a_velocity;   // 初始速度
attribute vec2 a_params;     // 额外参数 (生命偏移, 大小)
\`\`\`

### 2. 生命周期管理

使用时间取模实现粒子循环：

\`\`\`glsl
float lifetime = 4.0;  // 总生命周期
float age = mod(u_time + a_params.x * lifetime, lifetime);
float normalizedAge = age / lifetime;  // 0-1 归一化年龄
\`\`\`

### 3. 力场系统

多种力的叠加创造复杂运动：

\`\`\`glsl
// 重力
vec3 gravity = vec3(0.0, -0.5, 0.0);

// 涡旋力场 (围绕中心旋转)
vec3 vortexForce(vec3 pos, vec3 center, float strength) {
    vec3 diff = pos - center;
    float dist = length(diff);
    vec3 tangent = normalize(cross(diff, vec3(0.0, 1.0, 0.0)));
    return tangent * strength / (dist + 0.5);
}

// 向心力 (防止粒子飞散)
vec3 centerForce = -pos * 0.1;
\`\`\`

### 4. 淡入淡出效果

\`\`\`glsl
// 出生时淡入
float fadeIn = smoothstep(0.0, 0.1, normalizedAge);

// 死亡前淡出
float fadeOut = 1.0 - smoothstep(0.8, 1.0, normalizedAge);

v_alpha = fadeIn * fadeOut;
\`\`\`

### 5. 点精灵渲染

使用 \`gl_PointSize\` 和 \`gl_PointCoord\`：

\`\`\`glsl
// 顶点着色器: 设置粒子大小
gl_PointSize = baseSize / depth;

// 片段着色器: 获取粒子内坐标
vec2 coord = gl_PointCoord * 2.0 - 1.0;
float r = length(coord);  // 到中心的距离
\`\`\`

### 6. 颜色映射

基于速度和年龄的动态颜色：

\`\`\`glsl
float speed = length(vel);
float speedFactor = smoothstep(0.0, 2.0, speed);

// 年轻快速 → 橙色
// 年老缓慢 → 紫色
v_color = mix(colorOld, colorYoung, 1.0 - normalizedAge);
\`\`\`

### 性能优点

1. **并行计算**: GPU 同时处理所有粒子
2. **无 CPU 瓶颈**: 不需要每帧更新 CPU 端数据
3. **带宽节省**: 初始数据只上传一次
4. **扩展性好**: 轻松支持数万粒子`
}

export default particles3D
