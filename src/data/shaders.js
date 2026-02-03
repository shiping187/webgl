/**
 * ============================================
 * WebGL Shader 示例数据库
 * ============================================
 * 
 * 每个shader示例包含：
 * - 基本信息（标题、描述、难度）
 * - 顶点着色器代码
 * - 片段着色器代码
 * - 详细的中文讲解
 * - 相关知识点标签
 */

export const shaders = [
  // ============================================
  // 基础级别 - Basic Level
  // ============================================
  {
    id: 'solid-color',
    title: '纯色渲染',
    description: '最简单的shader，输出单一颜色。理解shader基本结构的起点。',
    level: 'basic',
    tags: ['入门', 'gl_FragColor', 'vec4'],
    vertexShader: `
// 顶点着色器 - 处理顶点位置
attribute vec2 a_position;

void main() {
    // 直接将2D坐标转换为4D裁剪坐标
    // vec4(x, y, z, w) - w通常为1.0
    gl_Position = vec4(a_position, 0.0, 1.0);
}`,
    fragmentShader: `
// 片段着色器 - 决定每个像素的颜色
precision mediump float;

void main() {
    // gl_FragColor 是内置变量，表示当前片段的颜色
    // vec4(r, g, b, a) - 红、绿、蓝、透明度，范围0.0-1.0
    gl_FragColor = vec4(0.0, 0.96, 0.88, 1.0); // 青色
}`,
    explanation: `
## 纯色渲染 - Shader入门第一课

### 什么是Shader？

Shader（着色器）是运行在GPU上的小程序，用于控制图形的渲染过程。WebGL中有两种主要的着色器：

1. **顶点着色器（Vertex Shader）**：处理每个顶点的位置
2. **片段着色器（Fragment Shader）**：决定每个像素的颜色

### 代码解析

#### 顶点着色器
\`\`\`glsl
attribute vec2 a_position;  // 从JavaScript传入的顶点坐标
\`\`\`
- \`attribute\` 关键字表示这是从CPU传来的数据
- \`vec2\` 是二维向量类型，包含x和y两个分量

#### 片段着色器
\`\`\`glsl
gl_FragColor = vec4(0.0, 0.96, 0.88, 1.0);
\`\`\`
- \`gl_FragColor\` 是内置输出变量
- \`vec4\` 表示RGBA四个通道
- 颜色值范围是0.0到1.0（不是0-255）

### 核心知识点

- GLSL使用C语言风格的语法
- 所有shader都必须有 \`main()\` 函数
- 颜色使用归一化的浮点数（0.0-1.0）
`,
    uniforms: []
  },
  
  {
    id: 'linear-gradient',
    title: '线性渐变',
    description: '使用UV坐标创建从左到右的颜色渐变效果。',
    level: 'basic',
    tags: ['UV坐标', 'mix', '渐变'],
    vertexShader: `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
    // 将顶点坐标从 [-1,1] 映射到 [0,1] 作为UV坐标
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}`,
    fragmentShader: `
precision mediump float;
varying vec2 v_uv;

void main() {
    // 定义两个颜色
    vec3 color1 = vec3(0.0, 0.96, 0.88);  // 青色
    vec3 color2 = vec3(0.616, 0.306, 0.867); // 紫色
    
    // 使用 mix 函数根据UV的x坐标混合颜色
    // mix(a, b, t) = a * (1-t) + b * t
    vec3 color = mix(color1, color2, v_uv.x);
    
    gl_FragColor = vec4(color, 1.0);
}`,
    explanation: `
## 线性渐变 - 理解UV坐标

### 什么是UV坐标？

UV坐标是一种将2D纹理映射到3D表面的坐标系统。在2D shader中：
- **U** 对应水平方向（从左0到右1）
- **V** 对应垂直方向（从下0到上1）

### varying 变量

\`\`\`glsl
varying vec2 v_uv;
\`\`\`

\`varying\` 关键字用于在顶点着色器和片段着色器之间传递数据。GPU会自动对varying变量进行**插值**，这是实现平滑渐变的关键。

### mix 函数

\`\`\`glsl
vec3 color = mix(color1, color2, v_uv.x);
\`\`\`

\`mix\` 是GLSL的内置插值函数：
- 当 \`v_uv.x = 0\` 时，返回 \`color1\`
- 当 \`v_uv.x = 1\` 时，返回 \`color2\`
- 中间值平滑过渡

### 实验建议

试着修改代码：
1. 将 \`v_uv.x\` 改为 \`v_uv.y\` 看看效果
2. 使用 \`length(v_uv - 0.5)\` 创建径向渐变
`,
    uniforms: []
  },

  {
    id: 'radial-gradient',
    title: '径向渐变',
    description: '从中心向外扩散的圆形渐变效果。',
    level: 'basic',
    tags: ['distance', '径向', 'length'],
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
    // 计算当前像素到中心点的距离
    vec2 center = vec2(0.5, 0.5);
    float dist = length(v_uv - center);
    
    // 定义颜色
    vec3 innerColor = vec3(1.0, 0.42, 0.42); // 珊瑚红
    vec3 outerColor = vec3(0.067, 0.067, 0.12); // 深色背景
    
    // 使用距离值混合颜色
    // 乘以2是因为最大距离约为0.707（对角线/2）
    vec3 color = mix(innerColor, outerColor, dist * 1.5);
    
    gl_FragColor = vec4(color, 1.0);
}`,
    explanation: `
## 径向渐变 - 距离函数的应用

### length 函数

\`\`\`glsl
float dist = length(v_uv - center);
\`\`\`

\`length()\` 计算向量的长度（模），相当于：
\`\`\`
sqrt(x*x + y*y)
\`\`\`

这给了我们每个像素到中心的**欧几里得距离**。

### 距离的范围

- 中心点距离 = 0
- 边缘中点距离 = 0.5
- 角落距离 ≈ 0.707 (√2/2)

### 归一化距离

乘以系数调整渐变范围：
\`\`\`glsl
dist * 1.5  // 让渐变更快到达外圈颜色
\`\`\`

### 应用场景

径向渐变常用于：
- 聚光灯效果
- 体积光/光晕
- UI高亮效果
- 暗角（Vignette）
`,
    uniforms: []
  },

  {
    id: 'stripes',
    title: '条纹图案',
    description: '使用数学函数创建重复的条纹图案。',
    level: 'basic',
    tags: ['fract', 'step', '图案'],
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
uniform float u_time;

void main() {
    // 将UV坐标放大来创建多个条纹
    float stripes = 10.0; // 条纹数量
    float pattern = fract(v_uv.x * stripes);
    
    // 使用 step 创建硬边条纹
    // step(edge, x) 当 x < edge 返回0，否则返回1
    float stripe = step(0.5, pattern);
    
    // 定义两种颜色
    vec3 color1 = vec3(0.0, 0.96, 0.88);
    vec3 color2 = vec3(0.18, 0.18, 0.24);
    
    vec3 color = mix(color2, color1, stripe);
    
    gl_FragColor = vec4(color, 1.0);
}`,
    explanation: `
## 条纹图案 - fract 和 step 函数

### fract 函数 - 创建重复

\`\`\`glsl
float pattern = fract(v_uv.x * stripes);
\`\`\`

\`fract(x)\` 返回x的小数部分，范围始终是 [0, 1)。

当我们将UV乘以10：
- uv.x = 0.0 → 0.0
- uv.x = 0.1 → 0.0
- uv.x = 0.15 → 0.5
- uv.x = 0.2 → 0.0
- ...以此类推

这创造了**重复的锯齿波**！

### step 函数 - 硬边界

\`\`\`glsl
float stripe = step(0.5, pattern);
\`\`\`

\`step(edge, x)\` 是阶跃函数：
- x < edge → 返回 0.0
- x >= edge → 返回 1.0

结合 \`fract\`，我们得到了0和1交替的条纹。

### 公式总结

\`\`\`
条纹 = step(阈值, fract(坐标 * 数量))
\`\`\`

### 变体挑战

试试这些修改：
1. 斜条纹：\`fract((v_uv.x + v_uv.y) * stripes)\`
2. 软边条纹：用 \`smoothstep\` 替代 \`step\`
3. 棋盘格：结合x和y方向的条纹
`,
    uniforms: ['u_time']
  },

  {
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
  },

  // ============================================
  // 中级级别 - Intermediate Level
  // ============================================
  
  {
    id: 'animated-wave',
    title: '波浪动画',
    description: '使用正弦函数创建流动的波浪效果，理解时间变量的使用。',
    level: 'intermediate',
    tags: ['sin', '动画', 'u_time'],
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
uniform float u_time;

void main() {
    // 创建波浪效果
    // sin函数的值在-1到1之间震荡
    float wave = sin(v_uv.x * 10.0 + u_time * 2.0) * 0.5 + 0.5;
    
    // 添加第二个波浪，创建更复杂的效果
    float wave2 = sin(v_uv.x * 15.0 - u_time * 3.0) * 0.5 + 0.5;
    
    // 混合两个波浪
    float finalWave = (wave + wave2) * 0.5;
    
    // 根据y坐标和波浪值判断颜色
    float threshold = finalWave * 0.3 + 0.35;
    float inWave = step(v_uv.y, threshold);
    
    // 定义颜色
    vec3 waveColor = vec3(0.0, 0.62, 0.85);
    vec3 bgColor = vec3(0.02, 0.02, 0.05);
    
    // 添加渐变效果
    waveColor = mix(vec3(0.0, 0.96, 0.88), waveColor, v_uv.y);
    
    vec3 color = mix(bgColor, waveColor, inWave);
    
    gl_FragColor = vec4(color, 1.0);
}`,
    explanation: `
## 波浪动画 - 时间与三角函数

### uniform 变量

\`\`\`glsl
uniform float u_time;
\`\`\`

\`uniform\` 是从JavaScript传入的全局变量，对所有像素相同。
\`u_time\` 通常是从程序启动开始的秒数。

### sin 函数创造波浪

\`\`\`glsl
float wave = sin(v_uv.x * 10.0 + u_time * 2.0);
\`\`\`

分解这个公式：
- \`v_uv.x * 10.0\` - 控制波浪的**频率**（数字越大，波浪越密）
- \`u_time * 2.0\` - 控制波浪的**速度**（数字越大，移动越快）
- \`sin()\` - 返回-1到1的平滑震荡值

### 值域变换

\`\`\`glsl
sin(...) * 0.5 + 0.5
\`\`\`

将sin的范围从[-1, 1]映射到[0, 1]：

| sin值 | 变换后 |
|-------|--------|
| -1    | 0      |
| 0     | 0.5    |
| 1     | 1      |

### 波浪叠加

多个不同频率和速度的波浪叠加，创造更自然的效果。这是**傅里叶分析**的基本原理！

### 动画原理

每一帧，\`u_time\` 增加一点点，导致：
- \`sin\` 的输入改变
- 输出值改变
- 波浪位置移动
- 视觉上形成动画！
`,
    uniforms: ['u_time']
  },

  {
    id: 'circle-sdf',
    title: '圆形 SDF',
    description: '使用有符号距离场（SDF）绘制圆形，这是高级图形技术的基础。',
    level: 'intermediate',
    tags: ['SDF', '距离场', 'smoothstep'],
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
uniform float u_time;

// 圆形的SDF函数
// 返回点p到圆心的距离减去半径
// 内部为负，外部为正，边界为0
float circleSDF(vec2 p, vec2 center, float radius) {
    return length(p - center) - radius;
}

void main() {
    // 调整UV使圆形不被拉伸（假设是正方形canvas）
    vec2 uv = v_uv;
    
    // 绘制一个动画的圆
    float radius = 0.25 + sin(u_time) * 0.05;
    float d = circleSDF(uv, vec2(0.5), radius);
    
    // 使用smoothstep创建抗锯齿边缘
    // smoothstep(a, b, x) 在a到b之间平滑过渡
    float circle = 1.0 - smoothstep(0.0, 0.02, d);
    
    // 添加发光边缘
    float glow = 1.0 - smoothstep(0.0, 0.15, abs(d));
    
    // 组合颜色
    vec3 circleColor = vec3(0.0, 0.96, 0.88);
    vec3 glowColor = vec3(0.616, 0.306, 0.867);
    vec3 bgColor = vec3(0.05, 0.05, 0.08);
    
    vec3 color = bgColor;
    color += glowColor * glow * 0.5;
    color = mix(color, circleColor, circle);
    
    gl_FragColor = vec4(color, 1.0);
}`,
    explanation: `
## 有符号距离场 (SDF) - 图形程序员的秘密武器

### 什么是SDF？

**Signed Distance Field（有符号距离场）** 是一个函数，返回空间中任意点到图形边界的最短距离。

关键特性：
- 图形**内部**返回**负值**
- 图形**外部**返回**正值**
- **边界**处返回**0**

### 圆形SDF

\`\`\`glsl
float circleSDF(vec2 p, vec2 center, float radius) {
    return length(p - center) - radius;
}
\`\`\`

理解这个公式：
- \`length(p - center)\` = 点到圆心的距离
- 减去 \`radius\` = 到边界的距离

### smoothstep - 抗锯齿神器

\`\`\`glsl
float circle = 1.0 - smoothstep(0.0, 0.02, d);
\`\`\`

\`smoothstep(a, b, x)\` 的曲线：
- x < a → 0
- x > b → 1
- a到b之间 → 平滑过渡 (S曲线)

这给我们一个平滑的边缘，避免锯齿！

### 为什么SDF这么强大？

1. **布尔运算**：\`min(d1, d2)\` = 并集，\`max(d1, d2)\` = 交集
2. **圆角**：\`d - radius\` 给任何形状加圆角
3. **描边**：\`abs(d) - thickness\` 创建轮廓线
4. **动画友好**：距离值可以平滑动画

SDF是实现复杂2D/3D图形的核心技术！
`,
    uniforms: ['u_time']
  },

  {
    id: 'noise-basic',
    title: '噪声基础',
    description: '实现简单的伪随机噪声函数，创造自然的随机效果。',
    level: 'intermediate',
    tags: ['噪声', 'hash', '随机'],
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

// 简单的哈希函数 - 将2D坐标转换为伪随机数
float hash(vec2 p) {
    // 使用点积和sin创造混沌
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// 值噪声 - Value Noise
float noise(vec2 p) {
    vec2 i = floor(p);  // 整数部分（格子坐标）
    vec2 f = fract(p);  // 小数部分（格子内位置）
    
    // 平滑插值曲线: 3x² - 2x³
    f = f * f * (3.0 - 2.0 * f);
    
    // 获取四个角的随机值
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    // 双线性插值
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
    // 放大UV来看到更多噪声细节
    vec2 uv = v_uv * 8.0;
    
    // 添加时间让噪声流动
    uv += u_time * 0.5;
    
    float n = noise(uv);
    
    // 创建颜色映射
    vec3 color1 = vec3(0.02, 0.02, 0.05);
    vec3 color2 = vec3(0.0, 0.96, 0.88);
    
    vec3 color = mix(color1, color2, n);
    
    gl_FragColor = vec4(color, 1.0);
}`,
    explanation: `
## 噪声函数 - 程序化纹理的基石

### 为什么需要噪声？

自然界充满了"有序的随机性"——云朵、山脉、火焰。纯随机太混乱，规则图案太人工。**噪声函数**介于两者之间。

### Hash函数

\`\`\`glsl
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
\`\`\`

这不是真正的随机！它是**确定性的**——相同输入永远返回相同输出。但结果看起来足够随机。

数学技巧：
1. \`dot()\` 将2D坐标变成1个数
2. \`sin()\` 创造混沌（因为大数的sin难以预测）
3. 乘大数放大混沌
4. \`fract()\` 只取小数部分

### 值噪声算法

1. 把空间分成格子
2. 每个格点有一个随机值
3. 格子内部的点通过**插值**计算

### 平滑插值

\`\`\`glsl
f = f * f * (3.0 - 2.0 * f);
\`\`\`

这是 \`smoothstep\` 的公式！让过渡更平滑，避免锯齿状边界。

### 噪声的应用

- 云朵和烟雾
- 地形生成
- 水面波纹
- 做旧和磨损效果
- 动态背景
`,
    uniforms: ['u_time']
  },

  {
    id: 'fbm-noise',
    title: 'FBM分形噪声',
    description: '分形布朗运动，通过叠加多层噪声创造丰富的细节。',
    level: 'intermediate',
    tags: ['FBM', '分形', '噪声'],
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

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// FBM - 分形布朗运动
// 叠加多层不同频率和振幅的噪声
float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;  // 振幅
    float frequency = 1.0;  // 频率
    
    // 叠加5层噪声（称为"倍频程"）
    for(int i = 0; i < 5; i++) {
        value += amplitude * noise(p * frequency);
        frequency *= 2.0;   // 频率翻倍
        amplitude *= 0.5;   // 振幅减半
    }
    
    return value;
}

void main() {
    vec2 uv = v_uv * 3.0;
    
    // 让噪声缓慢流动
    float t = u_time * 0.2;
    float n = fbm(uv + vec2(t, t * 0.5));
    
    // 创建更有趣的颜色映射
    vec3 color1 = vec3(0.02, 0.02, 0.08);
    vec3 color2 = vec3(0.0, 0.4, 0.5);
    vec3 color3 = vec3(0.0, 0.96, 0.88);
    
    vec3 color = mix(color1, color2, n);
    color = mix(color, color3, pow(n, 2.0));
    
    gl_FragColor = vec4(color, 1.0);
}`,
    explanation: `
## FBM分形噪声 - 自然纹理的秘密

### 什么是FBM？

**Fractal Brownian Motion（分形布朗运动）** 是一种通过叠加多层噪声创造复杂细节的技术。

### 分形的核心思想

自然界的许多形态都是**自相似**的：
- 山脉轮廓放大后还是像山脉
- 云朵的边缘有着相似的蓬松感
- 海岸线在任何比例下都很曲折

### FBM算法

\`\`\`glsl
for(int i = 0; i < 5; i++) {
    value += amplitude * noise(p * frequency);
    frequency *= 2.0;   // 频率翻倍：细节更密
    amplitude *= 0.5;   // 振幅减半：影响更小
}
\`\`\`

每一层叫做一个**倍频程（Octave）**：

| 层 | 频率 | 振幅 | 效果 |
|----|------|------|------|
| 1 | 1x | 0.5 | 大的形状 |
| 2 | 2x | 0.25 | 中等细节 |
| 3 | 4x | 0.125 | 小细节 |
| 4 | 8x | 0.0625 | 更细节 |
| 5 | 16x | 0.03125 | 微细节 |

### 参数调节

- **层数**：更多层 = 更多细节（但更慢）
- **频率倍数**：通常2.0，称为"lacunarity"
- **振幅倍数**：通常0.5，称为"gain"或"persistence"

### 创意应用

修改FBM的输入或输出：
- 添加时间：流动效果
- 变形UV：扭曲效果
- 嵌套FBM：更复杂的图案
`,
    uniforms: ['u_time']
  },

  {
    id: 'mouse-interaction',
    title: '鼠标交互',
    description: '响应鼠标位置的交互式效果，学习uniform变量的高级应用。',
    level: 'intermediate',
    tags: ['交互', 'uniform', '鼠标'],
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
uniform float u_time;
uniform vec2 u_mouse;  // 鼠标位置 (0-1)

void main() {
    // 计算当前像素到鼠标的距离
    float dist = length(v_uv - u_mouse);
    
    // 创建波纹效果
    float ripple = sin(dist * 30.0 - u_time * 5.0);
    ripple = ripple * 0.5 + 0.5;
    
    // 波纹衰减
    float falloff = 1.0 - smoothstep(0.0, 0.5, dist);
    ripple *= falloff;
    
    // 中心光点
    float spot = 1.0 - smoothstep(0.0, 0.15, dist);
    
    // 组合颜色
    vec3 bgColor = vec3(0.02, 0.02, 0.05);
    vec3 rippleColor = vec3(0.0, 0.5, 0.6);
    vec3 spotColor = vec3(0.0, 0.96, 0.88);
    
    vec3 color = bgColor;
    color += rippleColor * ripple * 0.8;
    color += spotColor * spot;
    
    gl_FragColor = vec4(color, 1.0);
}`,
    explanation: `
## 鼠标交互 - 让Shader活起来

### u_mouse变量

\`\`\`glsl
uniform vec2 u_mouse;  // (0-1)范围的鼠标位置
\`\`\`

JavaScript端需要监听鼠标移动并更新这个uniform：
\`\`\`javascript
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;
    gl.uniform2f(mouseLocation, x, y);
});
\`\`\`

### 波纹效果

\`\`\`glsl
float ripple = sin(dist * 30.0 - u_time * 5.0);
\`\`\`

- \`dist * 30.0\`：距离越远，相位越大
- \`- u_time * 5.0\`：负号让波纹向外扩散

### 衰减函数

\`\`\`glsl
float falloff = 1.0 - smoothstep(0.0, 0.5, dist);
\`\`\`

让波纹随距离衰减，避免整个画面都是波纹。

### 交互设计原则

1. **即时反馈**：效果应该立即响应输入
2. **平滑过渡**：避免突兀的变化
3. **视觉层次**：主要效果（光点）+ 辅助效果（波纹）

### 扩展想法

- 记录鼠标轨迹
- 多点触控支持
- 点击爆发效果
- 拖拽影响参数
`,
    uniforms: ['u_time', 'u_mouse']
  },

  {
    id: 'rotating-pattern',
    title: '旋转图案',
    description: '使用矩阵变换创建旋转的几何图案。',
    level: 'intermediate',
    tags: ['矩阵', '旋转', '变换'],
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
  },

  // ============================================
  // 高级级别 - Advanced Level
  // ============================================

  {
    id: 'raymarching-sphere',
    title: '光线步进球体',
    description: 'Ray Marching基础 - 使用数学函数渲染3D球体。',
    level: 'advanced',
    tags: ['光线步进', '3D', 'SDF'],
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

// 球体的SDF
float sphereSDF(vec3 p, float r) {
    return length(p) - r;
}

// 场景的SDF - 可以添加更多物体
float sceneSDF(vec3 p) {
    // 让球体上下浮动
    vec3 spherePos = vec3(0.0, sin(u_time) * 0.3, 0.0);
    return sphereSDF(p - spherePos, 1.0);
}

// 计算法线 - 使用SDF的梯度
vec3 calcNormal(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
        sceneSDF(p + e.xyy) - sceneSDF(p - e.xyy),
        sceneSDF(p + e.yxy) - sceneSDF(p - e.yxy),
        sceneSDF(p + e.yyx) - sceneSDF(p - e.yyx)
    ));
}

// Ray Marching主函数
float rayMarch(vec3 ro, vec3 rd) {
    float t = 0.0;  // 光线已行进距离
    
    for(int i = 0; i < 100; i++) {
        vec3 p = ro + rd * t;  // 当前位置
        float d = sceneSDF(p);  // 到最近表面的距离
        
        if(d < 0.001) break;  // 足够接近，命中！
        if(t > 100.0) break;  // 太远了，放弃
        
        t += d;  // 安全地前进d距离
    }
    
    return t;
}

void main() {
    // 将UV转换为屏幕坐标 (-1 to 1, 考虑宽高比)
    vec2 uv = v_uv * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;
    
    // 相机设置
    vec3 ro = vec3(0.0, 0.0, 3.0);  // 相机位置
    vec3 rd = normalize(vec3(uv, -1.0));  // 光线方向
    
    // Ray Marching
    float t = rayMarch(ro, rd);
    
    // 着色
    vec3 color = vec3(0.02, 0.02, 0.05);  // 背景色
    
    if(t < 100.0) {
        vec3 p = ro + rd * t;  // 命中点
        vec3 normal = calcNormal(p);  // 法线
        
        // 简单的光照
        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
        float diff = max(dot(normal, lightDir), 0.0);
        float spec = pow(max(dot(reflect(-lightDir, normal), -rd), 0.0), 32.0);
        
        vec3 ambient = vec3(0.1, 0.1, 0.15);
        vec3 diffColor = vec3(0.0, 0.8, 0.75) * diff;
        vec3 specColor = vec3(1.0) * spec;
        
        color = ambient + diffColor + specColor;
        
        // 菲涅尔边缘光
        float fresnel = pow(1.0 - max(dot(normal, -rd), 0.0), 3.0);
        color += vec3(0.616, 0.306, 0.867) * fresnel * 0.5;
    }
    
    gl_FragColor = vec4(color, 1.0);
}`,
    explanation: `
## Ray Marching - 程序化3D渲染

### 什么是Ray Marching？

Ray Marching是一种渲染技术，通过从相机发射光线，逐步前进直到碰到物体。

### 核心算法

\`\`\`glsl
for(int i = 0; i < 100; i++) {
    vec3 p = ro + rd * t;     // 当前位置
    float d = sceneSDF(p);     // 到最近表面的距离
    
    if(d < 0.001) break;       // 命中
    t += d;                    // 前进
}
\`\`\`

关键洞察：**SDF告诉我们可以安全前进多远而不会穿过物体**

### 法线计算

\`\`\`glsl
vec3 calcNormal(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
        sceneSDF(p + e.xyy) - sceneSDF(p - e.xyy),
        sceneSDF(p + e.yxy) - sceneSDF(p - e.yxy),
        sceneSDF(p + e.yyx) - sceneSDF(p - e.yyx)
    ));
}
\`\`\`

这是在计算SDF的**梯度**——梯度方向就是表面的法线方向。

### 光照模型

我们使用了经典的**Blinn-Phong**光照：
- **Ambient**：环境光，基础亮度
- **Diffuse**：漫反射，取决于法线和光线夹角
- **Specular**：镜面反射，产生高光

### 菲涅尔效应

\`\`\`glsl
float fresnel = pow(1.0 - max(dot(normal, -rd), 0.0), 3.0);
\`\`\`

边缘比正面更亮——这是物理现实！

### Ray Marching的优势

- 可以渲染任何SDF定义的形状
- 天然支持软阴影、环境遮蔽
- 易于实现CSG（构造实体几何）
`,
    uniforms: ['u_time', 'u_resolution']
  },

  {
    id: 'plasma-effect',
    title: '等离子效果',
    description: '经典的演示场景特效，通过叠加正弦函数创造迷幻的色彩。',
    level: 'advanced',
    tags: ['等离子', '演示场景', '色彩'],
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

void main() {
    vec2 uv = v_uv * 4.0 - 2.0;
    float t = u_time * 0.5;
    
    // 叠加多个正弦波
    float v1 = sin(uv.x * 3.0 + t);
    float v2 = sin(uv.y * 3.0 + t);
    float v3 = sin((uv.x + uv.y) * 2.0 + t);
    float v4 = sin(length(uv) * 3.0 - t);
    
    // 添加更复杂的变化
    float v5 = sin(uv.x * sin(t * 0.3) * 5.0 + uv.y * cos(t * 0.4) * 5.0);
    
    // 组合所有值
    float v = (v1 + v2 + v3 + v4 + v5) * 0.2;
    
    // 创建多彩的颜色
    vec3 color;
    color.r = sin(v * 3.14159 + 0.0) * 0.5 + 0.5;
    color.g = sin(v * 3.14159 + 2.094) * 0.5 + 0.5;
    color.b = sin(v * 3.14159 + 4.188) * 0.5 + 0.5;
    
    // 增强对比度
    color = pow(color, vec3(0.8));
    
    gl_FragColor = vec4(color, 1.0);
}`,
    explanation: `
## 等离子效果 - 演示场景的经典

### 历史背景

等离子效果起源于1990年代的**Demoscene**（演示场景）文化。程序员们竞相用最少的代码创造最惊艳的视觉效果。

### 核心技术：正弦叠加

\`\`\`glsl
float v1 = sin(uv.x * 3.0 + t);
float v2 = sin(uv.y * 3.0 + t);
float v3 = sin((uv.x + uv.y) * 2.0 + t);
float v4 = sin(length(uv) * 3.0 - t);
\`\`\`

每个正弦波贡献不同的"波纹"：
- v1：垂直条纹
- v2：水平条纹
- v3：对角条纹
- v4：圆形波纹

### 彩虹色映射

\`\`\`glsl
color.r = sin(v * PI + 0.0) * 0.5 + 0.5;
color.g = sin(v * PI + 2.094) * 0.5 + 0.5;  // +120°
color.b = sin(v * PI + 4.188) * 0.5 + 0.5;  // +240°
\`\`\`

2.094 ≈ 2π/3，4.188 ≈ 4π/3

三个通道相位差120°，形成色环！

### 数学之美

整个效果只用了最基本的函数：
- \`sin\` - 正弦
- \`length\` - 距离
- \`+\` - 加法

却创造了无穷无尽的变化。

### 实验方向

- 调整频率参数
- 添加更多正弦层
- 使用不同的组合方式（乘法、取模等）
- 尝试方波(\`sign(sin(...))\`)
`,
    uniforms: ['u_time']
  },

  {
    id: 'fire-effect',
    title: '火焰效果',
    description: '使用噪声函数模拟火焰的流动与色彩变化。',
    level: 'advanced',
    tags: ['火焰', '噪声', '模拟'],
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

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for(int i = 0; i < 6; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 uv = v_uv;
    
    // 调整坐标，让火焰从底部升起
    uv.y = 1.0 - uv.y;  // 翻转Y
    
    // 创建火焰的流动
    vec2 noiseCoord = uv * vec2(3.0, 4.0);
    noiseCoord.y -= u_time * 2.0;  // 向上流动
    
    // 添加水平扰动
    float distortion = fbm(noiseCoord * 0.5 + u_time * 0.5) * 0.3;
    noiseCoord.x += distortion;
    
    // 火焰强度
    float fire = fbm(noiseCoord);
    
    // 基于高度衰减
    fire *= smoothstep(1.0, 0.0, uv.y);
    
    // 底部更强
    fire *= 1.0 + (1.0 - uv.y) * 0.5;
    
    // 收窄火焰形状
    float centerFalloff = 1.0 - pow(abs(uv.x - 0.5) * 2.0, 2.0);
    fire *= centerFalloff;
    
    // 火焰颜色渐变
    vec3 color = vec3(0.0);
    
    // 核心：白-黄
    color += vec3(1.0, 0.9, 0.7) * smoothstep(0.6, 1.0, fire);
    // 中层：橙
    color += vec3(1.0, 0.5, 0.0) * smoothstep(0.3, 0.7, fire);
    // 外层：红
    color += vec3(0.8, 0.2, 0.0) * smoothstep(0.1, 0.4, fire);
    // 边缘：暗红
    color += vec3(0.3, 0.05, 0.0) * smoothstep(0.0, 0.2, fire);
    
    // 背景
    vec3 bgColor = vec3(0.02, 0.02, 0.03);
    color = max(color, bgColor);
    
    // 添加一点辉光
    float glow = fire * 0.3;
    color += vec3(1.0, 0.3, 0.0) * glow * centerFalloff;
    
    gl_FragColor = vec4(color, 1.0);
}`,
    explanation: `
## 火焰效果 - 噪声的艺术应用

### 火焰的特征

真实火焰的视觉特征：
1. **向上流动** - 热空气上升
2. **不规则边缘** - 湍流造成
3. **颜色渐变** - 温度决定颜色
4. **底部收敛** - 火源位置

### 流动效果

\`\`\`glsl
noiseCoord.y -= u_time * 2.0;
\`\`\`

让噪声坐标随时间向下移动，在视觉上火焰就向上流动了。

### 颜色温度映射

火焰颜色对应温度：
- **白色/黄色**（~1400°C）→ 最热，核心
- **橙色**（~1100°C）→ 中等热度
- **红色**（~800°C）→ 较冷边缘
- **暗红/黑**（<600°C）→ 几乎熄灭

\`\`\`glsl
color += vec3(1.0, 0.9, 0.7) * smoothstep(0.6, 1.0, fire);
\`\`\`

使用 \`smoothstep\` 创建柔和的颜色过渡。

### 形状控制

\`\`\`glsl
float centerFalloff = 1.0 - pow(abs(uv.x - 0.5) * 2.0, 2.0);
fire *= centerFalloff;
\`\`\`

创建一个中间高、两边低的曲线，让火焰呈现倒锥形。

### 高度衰减

\`\`\`glsl
fire *= smoothstep(1.0, 0.0, uv.y);
\`\`\`

火焰向上逐渐消散。

### 优化思路

- 使用更快的噪声函数
- 减少FBM层数
- 预计算噪声纹理
`,
    uniforms: ['u_time']
  },

  {
    id: 'water-ripple',
    title: '水波纹效果',
    description: '模拟水面波纹的折射与反射效果。',
    level: 'advanced',
    tags: ['水面', '波纹', '折射'],
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
  },

  {
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
  },

  {
    id: 'glitch-effect',
    title: '故障艺术',
    description: '数字故障/毛刺效果，模拟视频信号干扰的视觉风格。',
    level: 'advanced',
    tags: ['故障', '艺术', 'RGB分离'],
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

float hash(float n) {
    return fract(sin(n) * 43758.5453);
}

float hash2(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// 阶跃随机
float stepRandom(float x, float freq) {
    return hash(floor(x * freq));
}

void main() {
    vec2 uv = v_uv;
    float t = u_time;
    
    // 故障强度随时间变化
    float glitchStrength = stepRandom(t, 3.0);
    glitchStrength = pow(glitchStrength, 3.0);  // 让故障更稀疏
    
    // 水平条纹位移
    float lineOffset = 0.0;
    if(glitchStrength > 0.5) {
        float lineY = floor(uv.y * 30.0);
        lineOffset = (stepRandom(lineY + t * 10.0, 1.0) - 0.5) * 0.1;
        lineOffset *= step(0.8, stepRandom(lineY * 0.3 + t, 1.0));
    }
    
    // 整体位移
    float blockOffset = 0.0;
    if(glitchStrength > 0.7) {
        blockOffset = (stepRandom(t * 20.0, 1.0) - 0.5) * 0.05;
    }
    
    // RGB分离
    float rgbSplit = 0.0;
    if(glitchStrength > 0.3) {
        rgbSplit = stepRandom(t * 15.0, 1.0) * 0.02;
    }
    
    // 应用位移
    vec2 uvR = uv + vec2(lineOffset + blockOffset + rgbSplit, 0.0);
    vec2 uvG = uv + vec2(lineOffset + blockOffset, 0.0);
    vec2 uvB = uv + vec2(lineOffset + blockOffset - rgbSplit, 0.0);
    
    // 基础图案（可以替换为任何图像）
    // 这里创建一个简单的几何图案
    vec3 colorR = vec3(0.0);
    vec3 colorG = vec3(0.0);
    vec3 colorB = vec3(0.0);
    
    // 圆形图案
    float circle = length(uvR - 0.5);
    colorR.r = smoothstep(0.3, 0.28, circle);
    
    circle = length(uvG - 0.5);
    colorG.g = smoothstep(0.3, 0.28, circle);
    
    circle = length(uvB - 0.5);
    colorB.b = smoothstep(0.3, 0.28, circle);
    
    // 条纹背景
    float stripes = step(0.5, fract(uv.y * 50.0 + t));
    vec3 bgColor = vec3(0.1, 0.1, 0.12) + stripes * 0.02;
    
    // 组合
    vec3 color = colorR + colorG + colorB;
    color = mix(bgColor, color, max(max(colorR.r, colorG.g), colorB.b));
    
    // 扫描线
    float scanline = sin(uv.y * 400.0 + t * 10.0) * 0.04;
    color -= scanline;
    
    // 随机噪点
    float noise = hash2(uv * 500.0 + t) * 0.1;
    color += noise * glitchStrength;
    
    // 色差/颜色偏移
    if(glitchStrength > 0.6) {
        float colorShift = stepRandom(t * 8.0, 1.0);
        if(colorShift > 0.5) {
            color = color.gbr;  // 随机颜色通道交换
        }
    }
    
    gl_FragColor = vec4(color, 1.0);
}`,
    explanation: `
## 故障艺术 - 数字美学的另一面

### 什么是故障艺术？

故障艺术（Glitch Art）将技术故障、信号干扰、数据损坏转化为艺术表达。它代表了对完美数字世界的反叛。

### 典型故障特征

1. **RGB分离** - 三个颜色通道错位
2. **水平撕裂** - 某些行被平移
3. **块状位移** - 大块区域跳动
4. **噪点** - 随机的彩色点
5. **扫描线** - 模拟CRT电视效果

### 时间控制的随机

\`\`\`glsl
float stepRandom(float x, float freq) {
    return hash(floor(x * freq));
}
\`\`\`

\`floor(x * freq)\` 创造"阶梯状"的时间——在特定时刻跳变而非平滑过渡。这让故障感觉更真实。

### 稀疏化故障

\`\`\`glsl
glitchStrength = pow(glitchStrength, 3.0);
\`\`\`

立方会让小值变得更小，只有接近1的值才明显。这让故障只在某些时刻发生。

### RGB分离

\`\`\`glsl
vec2 uvR = uv + vec2(rgbSplit, 0.0);
vec2 uvG = uv;
vec2 uvB = uv - vec2(rgbSplit, 0.0);
\`\`\`

对三个颜色通道使用不同的UV采样位置，造成色散效果。

### 颜色通道交换

\`\`\`glsl
color = color.gbr;  // R→G, G→B, B→R
\`\`\`

GLSL的**swizzle**语法允许任意重排向量分量。

### 创意方向

- 结合图片/视频
- 音频响应的故障
- 鼠标触发的故障
- 与其他效果叠加
`,
    uniforms: ['u_time']
  },

  {
    id: 'metaball',
    title: 'Metaball融球',
    description: '有机形态的融合效果，两个或多个形状相互融合的经典技术。',
    level: 'advanced',
    tags: ['Metaball', '有机', '融合'],
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

// Metaball函数
// 返回该点受到的"能量"值
float metaball(vec2 p, vec2 center, float radius) {
    float d = length(p - center);
    // 能量与距离平方成反比
    return radius * radius / (d * d + 0.0001);
}

void main() {
    // 调整UV范围
    vec2 uv = v_uv * 2.0 - 1.0;
    float t = u_time;
    
    // 定义多个metaball的位置（动画化）
    vec2 ball1 = vec2(sin(t * 1.2) * 0.4, cos(t * 0.8) * 0.4);
    vec2 ball2 = vec2(sin(t * 0.9 + 2.0) * 0.5, cos(t * 1.1 + 1.0) * 0.3);
    vec2 ball3 = vec2(sin(t * 0.7 + 4.0) * 0.3, cos(t * 1.3 + 3.0) * 0.5);
    vec2 ball4 = vec2(cos(t * 1.0) * 0.35, sin(t * 0.6) * 0.45);
    
    // 计算总能量
    float energy = 0.0;
    energy += metaball(uv, ball1, 0.3);
    energy += metaball(uv, ball2, 0.25);
    energy += metaball(uv, ball3, 0.2);
    energy += metaball(uv, ball4, 0.22);
    
    // 阈值化 - 能量超过阈值的区域为"内部"
    float threshold = 1.0;
    float inside = smoothstep(threshold - 0.1, threshold + 0.1, energy);
    
    // 边缘检测
    float edge = smoothstep(threshold - 0.05, threshold, energy) 
               - smoothstep(threshold, threshold + 0.05, energy);
    
    // 颜色
    vec3 bgColor = vec3(0.02, 0.02, 0.05);
    vec3 blobColor = vec3(0.0, 0.7, 0.65);
    vec3 edgeColor = vec3(0.0, 0.96, 0.88);
    vec3 glowColor = vec3(0.616, 0.306, 0.867);
    
    // 内部渐变（基于能量）
    vec3 innerColor = mix(blobColor, vec3(1.0, 0.9, 0.9), (energy - threshold) * 0.3);
    
    // 外部辉光
    float glow = smoothstep(1.0, 0.0, energy / threshold) * 0.5;
    
    // 组合
    vec3 color = bgColor;
    color += glowColor * glow * (1.0 - inside);  // 辉光
    color = mix(color, innerColor, inside);       // 内部
    color = mix(color, edgeColor, edge * 2.0);   // 边缘高亮
    
    gl_FragColor = vec4(color, 1.0);
}`,
    explanation: `
## Metaball - 有机形态的秘密

### 什么是Metaball？

Metaball是一种建模技术，通过在空间中定义"能量场"，然后显示能量超过阈值的区域。

最神奇的是：当两个metaball靠近时，它们会**自然融合**！

### 能量函数

\`\`\`glsl
float metaball(vec2 p, vec2 center, float radius) {
    float d = length(p - center);
    return radius * radius / (d * d + 0.0001);
}
\`\`\`

能量与距离平方成反比：
- 中心能量无穷大（理论上）
- 距离越远能量衰减越快
- \`+ 0.0001\` 防止除以零

### 能量叠加

\`\`\`glsl
energy += metaball(uv, ball1, 0.3);
energy += metaball(uv, ball2, 0.25);
\`\`\`

关键洞察：能量是**可叠加**的！

当两个球靠近时，它们之间的能量相加，可能超过阈值，形成连接的"桥"。

### 等值面提取

\`\`\`glsl
float inside = smoothstep(threshold - 0.1, threshold + 0.1, energy);
\`\`\`

显示所有 \`energy > threshold\` 的区域。\`smoothstep\` 提供抗锯齿边缘。

### 边缘检测

\`\`\`glsl
float edge = smoothstep(a, b, energy) - smoothstep(b, c, energy);
\`\`\`

这创造了一个只在阈值附近为正的"带"——即边缘！

### 应用场景

- 液体模拟
- 有机UI元素
- 游戏中的blob怪物
- Logo动画
- 数据可视化

### 3D Metaball

同样的概念可以扩展到3D，结合Ray Marching可以创造惊艳的有机形态动画。
`,
    uniforms: ['u_time']
  }
]

export default shaders
