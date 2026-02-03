/**
 * 棋盘格 - 数学创造图案
 * 经典的棋盘图案，展示条件逻辑在shader中的应用
 */
export default {
  id: 'checkerboard',
  title: '棋盘格',
  description: '经典的棋盘图案，展示条件逻辑在shader中的应用。',
  level: 'basic',
  tags: ['mod', '图案', '逻辑'],

  vertexShader: `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}`,

  fragmentShader: `
precision mediump float;
varying vec2 v_uv;

void main() {
    // 棋盘格的尺寸
    float size = 8.0;
    
    // 计算当前像素在哪个格子
    vec2 cell = floor(v_uv * size);
    
    // 使用mod运算判断奇偶
    // mod(a + b, 2) 可以判断两个数之和的奇偶性
    float checker = mod(cell.x + cell.y, 2.0);
    
    // 定义两种颜色
    vec3 color1 = vec3(0.95, 0.95, 0.95);
    vec3 color2 = vec3(0.1, 0.1, 0.15);
    
    vec3 color = mix(color1, color2, checker);
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## 棋盘格 - 数学创造图案

### 核心算法

棋盘格的规则很简单：如果行号+列号是偶数，涂一种颜色；否则涂另一种颜色。

### floor 函数

\`\`\`glsl
vec2 cell = floor(v_uv * size);
\`\`\`

\`floor(x)\` 向下取整，把连续的UV坐标变成离散的格子索引。

示例（size=8）：
- uv.x = 0.0~0.125 → cell.x = 0
- uv.x = 0.125~0.25 → cell.x = 1
- ...

### mod 函数

\`\`\`glsl
float checker = mod(cell.x + cell.y, 2.0);
\`\`\`

\`mod(x, y)\` 返回x除以y的余数。

cell.x + cell.y 的奇偶性：
- 偶数 mod 2 = 0
- 奇数 mod 2 = 1

### 为什么不用 if 语句？

虽然GLSL支持 \`if\`，但：
1. GPU是并行处理器，条件分支会降低效率
2. 使用数学函数更符合GPU的工作方式
3. 代码更简洁优雅

### 数学之美

整个棋盘格只用了三个数学函数：\`floor\`, \`mod\`, \`mix\`。
这就是Shader编程的魅力 - 用数学描绘图形！
`,

  uniforms: []
}
