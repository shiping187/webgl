# WebGL Shader 示例库

本目录包含所有WebGL Shader示例的源代码和讲解文档。

## 目录结构

```
shaders/
├── index.ts              # 主入口文件
├── README.md             # 本说明文档
├── basic/                # 基础级别 (5个示例)
│   ├── index.ts
│   ├── solid-color.ts      # 纯色渲染
│   ├── linear-gradient.ts  # 线性渐变
│   ├── radial-gradient.ts  # 径向渐变
│   ├── stripes.ts          # 条纹图案
│   └── checkerboard.ts     # 棋盘格
├── intermediate/         # 中级级别 (6个示例)
│   ├── index.ts
│   ├── animated-wave.ts    # 波浪动画
│   ├── circle-sdf.ts       # 圆形SDF
│   ├── noise-basic.ts      # 噪声基础
│   ├── fbm-noise.ts        # FBM分形噪声
│   ├── mouse-interaction.ts # 鼠标交互
│   └── rotating-pattern.ts # 旋转图案
├── advanced/             # 高级级别 (10个示例)
│   ├── index.ts
│   ├── raymarching-sphere.ts # 光线步进球体
│   ├── plasma-effect.ts      # 等离子效果
│   ├── fire-effect.ts        # 火焰效果
│   ├── water-ripple.ts       # 水波纹效果
│   ├── voronoi-pattern.ts    # Voronoi图案
│   ├── glitch-effect.ts      # 故障艺术
│   ├── metaball.ts           # Metaball融球
│   ├── cube-3d.ts            # 3D立方体
│   ├── sphere-deform.ts      # 球体变形
│   └── particles-3d.ts       # 3D粒子系统
└── tutorials/            # 深度教学 (5个示例)
    ├── index.ts
    ├── gpu-pipeline.ts       # GPU渲染管线
    ├── coordinate-spaces.ts  # 坐标空间变换
    ├── sdf-operations.ts     # SDF运算
    ├── lighting-models.ts    # 光照模型
    └── post-processing.ts    # 后处理效果
```

## 示例数据结构

每个示例文件导出一个符合 `ShaderExample` 接口的对象：

```typescript
import type { ShaderExample } from '../../../types'

const myShader: ShaderExample = {
  // 唯一标识符，用于URL路由
  id: 'example-id',
  
  // 示例标题
  title: '示例标题',
  
  // 简短描述
  description: '示例的简短描述。',
  
  // 难度级别: 'basic' | 'intermediate' | 'advanced'
  level: 'basic',
  
  // 相关技术标签
  tags: ['标签1', '标签2'],
  
  // 顶点着色器代码 (GLSL)
  vertexShader: `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `,
  
  // 片段着色器代码 (GLSL)
  fragmentShader: `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
  `,
  
  // 详细讲解 (Markdown格式)
  explanation: `
    ## 标题
    详细的讲解内容...
  `,
  
  // 可选：使用的uniform变量列表（已弃用，系统自动处理）
  uniforms: ['u_time', 'u_resolution', 'u_mouse'],
  
  // 可选：是否为3D场景
  is3D: false,
  
  // 可选：粒子数量（仅粒子系统使用）
  particleCount: 1000
}

export default myShader
```

## 添加新示例

### 步骤

1. **选择难度级别**
   - `basic/` - 入门级，基础概念
   - `intermediate/` - 中级，动画和交互
   - `advanced/` - 高级，复杂特效和3D
   - `tutorials/` - 深度教学，原理讲解

2. **创建示例文件**
   ```bash
   # 示例：添加一个新的基础示例
   touch src/data/shaders/basic/my-new-shader.ts
   ```

3. **编写示例内容**
   ```typescript
   // my-new-shader.ts
   import type { ShaderExample } from '../../../types'
   
   const myNewShader: ShaderExample = {
     id: 'my-new-shader',
     title: '我的新Shader',
     description: '这是一个新的shader示例。',
     level: 'basic',
     tags: ['新功能', '示例'],
     vertexShader: `...`,
     fragmentShader: `...`,
     explanation: `...`
   }
   
   export default myNewShader
   ```

4. **注册示例**
   ```typescript
   // basic/index.ts
   import type { ShaderExample } from '../../../types'
   import myNewShader from './my-new-shader'
   
   export const basicShaders: ShaderExample[] = [
     // ... 其他示例
     myNewShader
   ]
   ```

### 编写规范

- **id**: 使用小写字母和连字符，如 `my-shader-name`
- **vertexShader/fragmentShader**: 包含注释，解释关键代码
- **explanation**: 使用Markdown格式，包含代码块和表格
- **is3D**: 3D场景需设为 `true`，系统会使用专用的3D渲染器

### 可用的Uniform变量

| 变量名 | 类型 | 说明 |
|--------|------|------|
| `u_time` | `float` | 运行时间（秒） |
| `u_resolution` | `vec2` | Canvas分辨率 |
| `u_mouse` | `vec2` | 鼠标位置 (0-1) |

### TypeScript 类型定义

```typescript
// 难度级别
type ShaderLevel = 'basic' | 'intermediate' | 'advanced'

// Shader示例接口
interface ShaderExample {
  id: string
  title: string
  description: string
  level: ShaderLevel
  tags: string[]
  vertexShader: string
  fragmentShader: string
  explanation: string
  uniforms?: string[]    // 可选，已弃用
  is3D?: boolean         // 可选，3D场景标记
  particleCount?: number // 可选，粒子数量
}
```

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/new-shader`)
3. 提交更改 (`git commit -am 'Add new shader example'`)
4. 推送到分支 (`git push origin feature/new-shader`)
5. 创建 Pull Request

## 许可证

MIT License
