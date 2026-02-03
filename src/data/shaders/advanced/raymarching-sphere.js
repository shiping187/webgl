/**
 * 光线步进球体 - 程序化3D渲染
 * Ray Marching基础 - 使用数学函数渲染3D球体
 */
export default {
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
}
