/**
 * 旋转图案 - 矩阵与极坐标
 * 使用矩阵变换创建旋转的几何图案
 */
import type { ShaderExample } from '../../../types'

const rotatingPattern: ShaderExample = {
  id: 'rotating-pattern',
  title: '旋转图案',
  description: '使用矩阵变换创建旋转的几何图案。',
  level: 'intermediate',
  tags: ['矩阵', '旋转', '变换'],

  vertexShader: /* wgsl */ `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}`,

  fragmentShader: /* wgsl */ `
precision mediump float;
varying vec2 v_uv;
uniform float u_time;

// 2D旋转矩阵
mat2 rotate2D(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c);
}

void main() {
    // 将UV中心移到原点
    vec2 uv = v_uv - 0.5;
    
    // 应用旋转
    uv = rotate2D(u_time * 0.5) * uv;
    
    // 转换为极坐标
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);
    
    // 创建花瓣图案
    float petals = 6.0;
    float pattern = sin(angle * petals + u_time * 2.0);
    pattern = pattern * 0.5 + 0.5;
    
    // 基于半径调制
    float shape = smoothstep(0.4, 0.2, radius);
    shape *= smoothstep(0.0, 0.1, radius);
    
    // 组合
    float final = pattern * shape;
    
    // 颜色
    vec3 color1 = vec3(1.0, 0.42, 0.42);
    vec3 color2 = vec3(0.616, 0.306, 0.867);
    vec3 bgColor = vec3(0.02, 0.02, 0.05);
    
    vec3 color = mix(bgColor, color1, final);
    color = mix(color, color2, final * pattern);
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## 旋转图案 - 矩阵与极坐标

### 2D旋转矩阵

\`\`\`glsl
mat2 rotate2D(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c);
}
\`\`\`

这是标准的2D旋转矩阵：
\`\`\`
| cos(θ)  -sin(θ) |
| sin(θ)   cos(θ) |
\`\`\`

应用到坐标：
\`\`\`glsl
uv = rotate2D(angle) * uv;
\`\`\`

### 极坐标系统

\`\`\`glsl
float angle = atan(uv.y, uv.x);  // 角度 (-π 到 π)
float radius = length(uv);        // 半径
\`\`\`

极坐标非常适合创建：
- 放射状图案
- 螺旋
- 花朵形状
- 圆环

### 花瓣图案

\`\`\`glsl
float pattern = sin(angle * petals + u_time * 2.0);
\`\`\`

- \`angle * petals\`：围绕中心重复6次
- \`+ u_time\`：让图案旋转

### 变换顺序很重要！

在shader中，我们通常需要：
1. 先将坐标中心移到原点 (\`- 0.5\`)
2. 应用变换（旋转、缩放）
3. 创建图案

### 创意挑战

- 改变花瓣数量
- 添加缩放动画
- 创建螺旋：\`angle + radius * 10.0\`
- 多层叠加不同速度的旋转
`,

  uniforms: ['u_time']
}

export default rotatingPattern
