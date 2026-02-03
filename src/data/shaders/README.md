# WebGL Shader 示例库

本目录包含所有WebGL Shader示例的源代码和讲解文档。

## 目录结构

```
shaders/
├── index.js              # 主入口文件
├── README.md             # 本说明文档
├── basic/                # 基础级别 (5个示例)
│   ├── index.js
│   ├── solid-color.js      # 纯色渲染
│   ├── linear-gradient.js  # 线性渐变
│   ├── radial-gradient.js  # 径向渐变
│   ├── stripes.js          # 条纹图案
│   └── checkerboard.js     # 棋盘格
├── intermediate/         # 中级级别 (6个示例)
│   ├── index.js
│   ├── animated-wave.js    # 波浪动画
│   ├── circle-sdf.js       # 圆形SDF
│   ├── noise-basic.js      # 噪声基础
│   ├── fbm-noise.js        # FBM分形噪声
│   ├── mouse-interaction.js # 鼠标交互
│   └── rotating-pattern.js # 旋转图案
└── advanced/             # 高级级别 (7个示例)
    ├── index.js
    ├── raymarching-sphere.js # 光线步进球体
    ├── plasma-effect.js      # 等离子效果
    ├── fire-effect.js        # 火焰效果
    ├── water-ripple.js       # 水波纹效果
    ├── voronoi-pattern.js    # Voronoi图案
    ├── glitch-effect.js      # 故障艺术
    └── metaball.js           # Metaball融球
```

## 示例数据结构

每个示例文件导出一个对象，包含以下字段：

```javascript
export default {
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
  
  // 使用的uniform变量列表
  uniforms: ['u_time', 'u_resolution', 'u_mouse']
}
```

## 添加新示例

### 步骤

1. **选择难度级别**
   - `basic/` - 入门级，基础概念
   - `intermediate/` - 中级，动画和交互
   - `advanced/` - 高级，复杂特效

2. **创建示例文件**
   ```bash
   # 示例：添加一个新的基础示例
   touch src/data/shaders/basic/my-new-shader.js
   ```

3. **编写示例内容**
   ```javascript
   // my-new-shader.js
   export default {
     id: 'my-new-shader',
     title: '我的新Shader',
     description: '这是一个新的shader示例。',
     level: 'basic',
     tags: ['新功能', '示例'],
     vertexShader: `...`,
     fragmentShader: `...`,
     explanation: `...`,
     uniforms: []
   }
   ```

4. **注册示例**
   ```javascript
   // basic/index.js
   import myNewShader from './my-new-shader.js'
   
   export const basicShaders = [
     // ... 其他示例
     myNewShader
   ]
   ```

### 编写规范

- **id**: 使用小写字母和连字符，如 `my-shader-name`
- **vertexShader/fragmentShader**: 包含注释，解释关键代码
- **explanation**: 使用Markdown格式，包含代码块和表格
- **uniforms**: 列出所有使用的uniform变量

### 可用的Uniform变量

| 变量名 | 类型 | 说明 |
|--------|------|------|
| `u_time` | `float` | 运行时间（秒） |
| `u_resolution` | `vec2` | Canvas分辨率 |
| `u_mouse` | `vec2` | 鼠标位置 (0-1) |

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/new-shader`)
3. 提交更改 (`git commit -am 'Add new shader example'`)
4. 推送到分支 (`git push origin feature/new-shader`)
5. 创建 Pull Request

## 许可证

MIT License
