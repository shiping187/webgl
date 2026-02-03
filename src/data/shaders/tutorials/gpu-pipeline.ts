/**
 * GPU渲染管线原理 - 深度理解Shader执行流程
 * 可视化展示顶点着色器到片段着色器的数据流动
 */
import type { ShaderExample } from '../../../types'

const gpuPipeline: ShaderExample = {
  id: 'gpu-pipeline',
  title: 'GPU渲染管线原理',
  description: '深度理解顶点着色器到片段着色器的执行流程，可视化渲染管线的每个阶段。',
  level: 'intermediate',
  tags: ['管线', '顶点', '片段', '教学'],

  vertexShader: /* wgsl */ `
// ============================================
// 顶点着色器 - GPU管线的第一个可编程阶段
// ============================================
// 
// 执行时机：每个顶点执行一次
// 输入：attribute（顶点属性）
// 输出：gl_Position（裁剪空间坐标）、varying（传递给片段着色器）

attribute vec2 a_position;  // 从CPU传入的顶点位置
varying vec2 v_uv;          // 将传递给片段着色器的UV坐标
varying vec3 v_color;       // 每个顶点的颜色（演示varying插值）

void main() {
    // 【阶段1】坐标变换
    // 将顶点从模型空间 -> 世界空间 -> 视图空间 -> 裁剪空间
    // 这里简化为：直接使用2D坐标
    gl_Position = vec4(a_position, 0.0, 1.0);
    
    // 【阶段2】计算UV坐标
    // 从 [-1,1] 映射到 [0,1]
    v_uv = a_position * 0.5 + 0.5;
    
    // 【阶段3】计算顶点颜色（演示varying插值）
    // 四个角分别为：红、绿、蓝、黄
    v_color = vec3(v_uv.x, v_uv.y, 1.0 - v_uv.x);
}`,

  fragmentShader: /* wgsl */ `
// ============================================
// 片段着色器 - GPU管线的最后可编程阶段
// ============================================
// 
// 执行时机：每个像素（片段）执行一次
// 输入：varying（经过插值的数据）、uniform（全局常量）
// 输出：gl_FragColor（像素颜色）

precision mediump float;

varying vec2 v_uv;      // 从顶点着色器插值而来
varying vec3 v_color;   // 演示：颜色已经被GPU自动插值！
uniform float u_time;
uniform vec2 u_resolution;

void main() {
    // 【可视化渲染管线】
    
    // 区域1：显示varying插值效果（左上）
    // 区域2：显示UV坐标可视化（右上）
    // 区域3：显示时间驱动动画（左下）
    // 区域4：显示片段坐标（右下）
    
    vec2 uv = v_uv;
    vec3 color = vec3(0.0);
    
    // 分成四个象限
    bool isLeft = uv.x < 0.5;
    bool isBottom = uv.y < 0.5;
    
    // 调整每个象限的局部UV
    vec2 localUV = fract(uv * 2.0);
    
    if (isLeft && !isBottom) {
        // 左上：varying插值可视化
        // 显示从顶点着色器传来的颜色（已被GPU自动插值）
        color = v_color;
        
        // 添加网格线辅助理解
        float grid = step(0.98, max(fract(localUV.x * 10.0), fract(localUV.y * 10.0)));
        color = mix(color, vec3(1.0), grid * 0.3);
    } 
    else if (!isLeft && !isBottom) {
        // 右上：UV坐标可视化
        // R通道 = U坐标，G通道 = V坐标
        color = vec3(localUV, 0.5);
    }
    else if (isLeft && isBottom) {
        // 左下：时间动画
        float wave = sin(localUV.x * 20.0 + u_time * 3.0) * 0.5 + 0.5;
        wave *= sin(localUV.y * 15.0 + u_time * 2.0) * 0.5 + 0.5;
        color = vec3(0.0, wave * 0.8, wave);
    }
    else {
        // 右下：片段坐标可视化（gl_FragCoord）
        // gl_FragCoord 是像素的绝对坐标
        vec2 fragUV = gl_FragCoord.xy / u_resolution;
        float pattern = mod(floor(gl_FragCoord.x / 20.0) + floor(gl_FragCoord.y / 20.0), 2.0);
        color = vec3(pattern * 0.5 + 0.3, 0.2, 0.4);
    }
    
    // 象限分割线
    float divider = step(0.49, uv.x) * step(uv.x, 0.51) + 
                    step(0.49, uv.y) * step(uv.y, 0.51);
    color = mix(color, vec3(1.0), divider);
    
    // 【最终输出】
    // gl_FragColor 是片段着色器的唯一输出
    // GPU会将其写入帧缓冲（framebuffer）
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## GPU渲染管线原理 - 深入理解

### 什么是渲染管线？

渲染管线（Graphics Pipeline）是GPU将3D数据转换为2D图像的处理流程。它由多个**阶段**组成，数据像流水线一样依次经过每个阶段。

### 完整的渲染管线

\`\`\`
CPU数据 → 顶点着色器 → 图元装配 → 光栅化 → 片段着色器 → 帧缓冲
\`\`\`

#### 1. 顶点着色器（Vertex Shader）
- **输入**：顶点属性（位置、颜色、UV等）
- **输出**：裁剪空间坐标、varying变量
- **执行次数**：每个顶点执行一次

\`\`\`glsl
// 一个三角形有3个顶点，顶点着色器执行3次
gl_Position = vec4(a_position, 0.0, 1.0);
\`\`\`

#### 2. 图元装配（Primitive Assembly）
将顶点连接成图元（三角形、线、点）。

#### 3. 光栅化（Rasterization）
**最神奇的阶段！** GPU自动完成：
- 确定三角形覆盖哪些像素
- 对varying变量进行**线性插值**

这就是为什么我们在顶点着色器设置的 \`v_color\` 会在三角形内部自动产生渐变！

#### 4. 片段着色器（Fragment Shader）
- **输入**：插值后的varying、uniform
- **输出**：像素颜色
- **执行次数**：每个覆盖的像素执行一次（可能数百万次！）

### Varying插值的数学

假设三角形三个顶点的颜色是红、绿、蓝，某个像素位于三角形中心：

\`\`\`
像素颜色 = 红 × w1 + 绿 × w2 + 蓝 × w3
\`\`\`

其中 w1, w2, w3 是重心坐标（Barycentric Coordinates），满足 w1+w2+w3=1。

### 四个象限演示内容

| 位置 | 演示内容 |
|------|----------|
| 左上 | varying插值效果 - 颜色如何从顶点平滑过渡 |
| 右上 | UV坐标可视化 - 纹理坐标的含义 |
| 左下 | 时间动画 - uniform如何驱动动态效果 |
| 右下 | gl_FragCoord - 片段的屏幕空间坐标 |

### 性能考虑

- 顶点着色器执行次数少（顶点数）
- 片段着色器执行次数多（像素数）
- **优化原则**：尽量把计算放在顶点着色器中！

### 关键理解

1. **数据流动**：attribute → varying → gl_FragColor
2. **执行次数**：顶点级 vs 像素级
3. **自动插值**：GPU硬件魔法
4. **并行计算**：每个像素独立计算，互不干扰
`,

  uniforms: ['u_time', 'u_resolution']
}

export default gpuPipeline
