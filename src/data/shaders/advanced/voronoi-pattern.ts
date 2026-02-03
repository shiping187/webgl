/**
 * Voronoi图案 - 空间分割的数学
 * 一种基于最近点距离的数学分割图案
 */
import type { ShaderExample } from '../../../types'

const voronoiPattern: ShaderExample = {
  id: 'voronoi-pattern',
  title: 'Voronoi图案',
  description: 'Voronoi/沃罗诺伊图，一种基于最近点距离的数学分割图案。',
  level: 'advanced',
  tags: ['Voronoi', '数学', '图案'],

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

// 随机函数
vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)),
             dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
}

// Voronoi函数
// 返回: x = 到最近点的距离, y = 到第二近点的距离, z/w = 最近点ID
vec4 voronoi(vec2 p, float t) {
    vec2 n = floor(p);
    vec2 f = fract(p);
    
    float md = 8.0;   // 最近距离
    float md2 = 8.0;  // 第二近距离
    vec2 id = vec2(0.0);
    
    // 搜索3x3邻域
    for(int j = -1; j <= 1; j++) {
        for(int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            
            // 该格子中心点的随机偏移（动画化）
            vec2 o = hash2(n + g);
            o = 0.5 + 0.4 * sin(t + 6.2831 * o);
            
            // 到该点的距离
            vec2 r = g + o - f;
            float d = dot(r, r);  // 距离的平方（省去sqrt）
            
            if(d < md) {
                md2 = md;
                md = d;
                id = n + g;
            } else if(d < md2) {
                md2 = d;
            }
        }
    }
    
    return vec4(sqrt(md), sqrt(md2), id);
}

void main() {
    vec2 uv = v_uv * 6.0;  // 放大看到更多单元格
    float t = u_time * 0.8;
    
    vec4 v = voronoi(uv, t);
    
    float d1 = v.x;  // 到最近点距离
    float d2 = v.y;  // 到第二近点距离
    vec2 id = v.zw;  // 最近点ID
    
    // 为每个单元格生成随机颜色
    vec3 cellColor = vec3(hash2(id), hash2(id + 100.0).x);
    cellColor = mix(vec3(0.0, 0.8, 0.75), vec3(0.616, 0.306, 0.867), cellColor.x);
    
    // 单元格边界（使用d2-d1，在边界处接近0）
    float edge = d2 - d1;
    float edgeLine = 1.0 - smoothstep(0.0, 0.1, edge);
    
    // 到中心点的距离效果
    float centerGlow = 1.0 - smoothstep(0.0, 0.15, d1);
    
    // 组合颜色
    vec3 color = cellColor * 0.5;
    color *= 1.0 - d1 * 0.5;  // 基于距离的渐变
    color += vec3(1.0) * centerGlow * 0.5;  // 中心高光
    color = mix(color, vec3(0.0, 0.96, 0.88), edgeLine);  // 边界线
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## Voronoi图案 - 空间分割的数学

### 什么是Voronoi图？

给定一组点（种子点），Voronoi图将空间分割成多个区域。每个区域内的点都离某个种子点最近。

### 应用领域

- 生物学：细胞结构、骨骼微观结构
- 地理学：邮局服务范围、行政区划
- 游戏：程序化地图生成、破碎效果
- 艺术：装饰图案、纹理

### 算法步骤

\`\`\`glsl
for(int j = -1; j <= 1; j++) {
    for(int i = -1; i <= 1; i++) {
        // 检查3x3邻域的9个格子
    }
}
\`\`\`

1. 将空间分成格子
2. 每个格子内有一个随机种子点
3. 对于当前像素，检查周围9个格子的种子点
4. 找到最近的和第二近的

### 动画化

\`\`\`glsl
o = 0.5 + 0.4 * sin(t + 6.2831 * o);
\`\`\`

让种子点随时间摆动，创造有机的动画效果。

### 边界检测

\`\`\`glsl
float edge = d2 - d1;
\`\`\`

当d1≈d2时，说明当前点位于两个种子的等距线上——即边界！

### Voronoi变体

- **细胞噪声**：只返回最近距离
- **边缘检测**：只显示边界
- **Worley噪声**：常用于云朵、大理石纹理
- **带权重的Voronoi**：种子点有不同影响范围
`,

  uniforms: ['u_time']
}

export default voronoiPattern
