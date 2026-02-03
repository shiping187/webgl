/**
 * 棋盘格 - 2D图案组合
 * 组合水平和垂直条纹创建棋盘效果
 */
import type { ShaderExample } from '../../../types'

const checkerboard: ShaderExample = {
  id: 'checkerboard',
  title: '棋盘格',
  description: '组合两个方向的条纹创建棋盘效果。',
  level: 'basic',
  tags: ['floor', 'mod', '图案'],

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

void main() {
    // 设置网格大小
    float gridSize = 8.0;
    
    // 计算在网格中的位置（取整）
    vec2 grid = floor(v_uv * gridSize);
    
    // 棋盘格公式：(x + y) mod 2
    // 如果x和y的整数部分之和是偶数，得到0
    // 如果是奇数，得到1
    float checker = mod(grid.x + grid.y, 2.0);
    
    // 定义颜色
    vec3 color1 = vec3(0.15, 0.15, 0.2);  // 深色格子
    vec3 color2 = vec3(0.0, 0.8, 0.75);   // 青色格子
    
    vec3 color = mix(color1, color2, checker);
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## 棋盘格 - 2D图案组合

### floor 函数

\`\`\`glsl
vec2 grid = floor(v_uv * gridSize);
\`\`\`

\`floor(x)\` 返回小于或等于 x 的最大整数。

| v_uv | v_uv * 8 | floor() |
|------|----------|---------|
| 0.05 | 0.4      | 0       |
| 0.15 | 1.2      | 1       |
| 0.25 | 2.0      | 2       |

这将连续的UV坐标**量化**成离散的网格单元。

### 棋盘格公式

\`\`\`glsl
float checker = mod(grid.x + grid.y, 2.0);
\`\`\`

这是经典的棋盘格算法：

| grid.x | grid.y | x + y | mod 2 | 颜色 |
|--------|--------|-------|-------|------|
| 0      | 0      | 0     | 0     | 深色 |
| 1      | 0      | 1     | 1     | 亮色 |
| 0      | 1      | 1     | 1     | 亮色 |
| 1      | 1      | 2     | 0     | 深色 |

相邻格子的坐标和奇偶性总是相反的！

### 数学原理

棋盘格实际上是**异或（XOR）运算**的可视化：
\`\`\`
checker = (int(grid.x) ^ int(grid.y)) & 1
\`\`\`

这在很多算法中都很有用，比如光线追踪中的无限平面纹理。
`,

  uniforms: []
}

export default checkerboard
