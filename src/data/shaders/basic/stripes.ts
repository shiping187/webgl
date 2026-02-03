/**
 * 条纹图案 - 周期函数应用
 * 使用取模运算创建重复条纹
 */
import type { ShaderExample } from '../../../types'

const stripes: ShaderExample = {
  id: 'stripes',
  title: '条纹图案',
  description: '使用周期函数创建重复条纹效果。',
  level: 'basic',
  tags: ['mod', 'step', '周期'],

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
    // 将UV放大创建更多条纹
    float frequency = 10.0;
    float scaled = v_uv.x * frequency;
    
    // mod取余操作创建0-1的重复周期
    float pattern = mod(scaled, 1.0);
    
    // step函数创建硬边界
    // step(edge, x): 如果x < edge返回0，否则返回1
    float stripe = step(0.5, pattern);
    
    // 定义条纹颜色
    vec3 color1 = vec3(0.0, 0.96, 0.88);  // 青色
    vec3 color2 = vec3(0.12, 0.12, 0.18); // 深色
    
    vec3 color = mix(color1, color2, stripe);
    
    gl_FragColor = vec4(color, 1.0);
}`,

  explanation: `
## 条纹图案 - 周期函数应用

### mod 取模函数

\`\`\`glsl
float pattern = mod(scaled, 1.0);
\`\`\`

\`mod(x, y)\` 返回 x 除以 y 的余数，结果总是在 [0, y) 范围内。

这创建了一个**锯齿波**：
\`\`\`
输入: 0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0...
输出: 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0...
\`\`\`

### step 阶跃函数

\`\`\`glsl
float stripe = step(0.5, pattern);
\`\`\`

\`step(edge, x)\` 是一个**阶跃函数**：
- 如果 x < edge，返回 0.0
- 如果 x >= edge，返回 1.0

这将平滑的锯齿波转换为方波，创建硬边界。

### 频率控制

\`\`\`glsl
float frequency = 10.0;
float scaled = v_uv.x * frequency;
\`\`\`

乘以频率会增加条纹的数量。频率为10意味着在[0,1]范围内有10个完整周期。

### 思考题

- 如何创建垂直条纹？（提示：使用 v_uv.y）
- 如何创建斜条纹？（提示：使用 v_uv.x + v_uv.y）
`,

  uniforms: []
}

export default stripes
