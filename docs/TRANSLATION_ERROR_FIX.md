# Translation Error Display Fix

## 问题描述 (Problem Description)

用户报告：翻译内容返回了，但界面显示 "Translation failed"。

**原因分析：**
在 `translate/page.tsx` 中，错误处理逻辑有问题：

```typescript
// 旧代码 (Old code)
if (!response.ok) throw new Error('Translation failed')
```

这段代码只是简单地抛出一个通用的 "Translation failed" 错误，而没有获取服务器返回的实际错误信息。

## 修复方案 (Solution)

修改错误处理逻辑，先解析响应 JSON，然后再检查状态码：

```typescript
// 新代码 (New code)
const data = await response.json()

if (!response.ok) {
  throw new Error(data.error || 'Translation failed')
}

const results = data.results as unknown[]
```

## 修改的文件 (Modified Files)

- `apps/web/src/app/repos/[owner]/[repo]/translate/page.tsx`

## 改进效果 (Improvements)

### 之前 (Before)
- ❌ 所有错误都显示为 "Translation failed"
- ❌ 无法知道具体的错误原因
- ❌ 难以调试问题

### 之后 (After)
- ✅ 显示服务器返回的具体错误信息
- ✅ 可以看到详细的错误原因（如 API key 无效、超时等）
- ✅ 更容易定位和解决问题

## 可能的错误信息示例 (Example Error Messages)

现在用户可以看到更详细的错误信息：

1. **API Key 问题**
   ```
   Invalid API key provided
   ```

2. **超时问题**
   ```
   Request timed out after 30000ms
   ```

3. **Provider 配置问题**
   ```
   Missing required field: apiKey
   ```

4. **GitHub 访问问题**
   ```
   Failed to fetch file content: Not Found
   ```

5. **翻译服务问题**
   ```
   Translation service error: Rate limit exceeded
   ```

## 测试建议 (Testing Recommendations)

### 手动测试步骤

1. **测试正常翻译**
   - 选择文件
   - 选择目标语言
   - 配置正确的 AI provider
   - 点击 "Translate"
   - ✅ 应该成功跳转到 review 页面

2. **测试 API Key 错误**
   - 使用无效的 API key
   - 点击 "Translate"
   - ✅ 应该显示具体的 API key 错误信息

3. **测试网络错误**
   - 断开网络连接
   - 点击 "Translate"
   - ✅ 应该显示网络相关的错误信息

4. **测试超时错误**
   - 选择大文件
   - 点击 "Translate"
   - ✅ 如果超时，应该显示超时错误信息

## 相关代码 (Related Code)

### API 端点错误处理

`apps/web/src/app/api/translate/route.ts` 中的错误处理：

```typescript
// Provider 创建失败
return NextResponse.json(
  { error: err instanceof Error ? err.message : 'Invalid provider configuration' },
  { status: 400 },
)

// 翻译超时
if (/timed out/i.test(message)) {
  return NextResponse.json({ error: message }, { status: 504 })
}

// 其他翻译错误
return NextResponse.json({ error: message }, { status: 500 })
```

### 前端错误显示

`translate/page.tsx` 中的错误显示：

```typescript
{error && <p className="text-destructive text-sm">{error}</p>}
```

## 验证 (Verification)

- ✅ TypeScript 编译通过
- ✅ ESLint 检查通过
- ✅ 代码逻辑正确
- ✅ 向后兼容

## 后续改进建议 (Future Improvements)

1. **添加错误分类**
   - 区分客户端错误和服务器错误
   - 为不同类型的错误提供不同的 UI 提示

2. **添加重试机制**
   - 对于临时性错误（如网络超时），提供重试按钮
   - 自动重试机制

3. **改进错误提示 UI**
   - 使用 Toast 通知
   - 添加错误详情展开/折叠
   - 提供解决方案建议

4. **添加日志记录**
   - 记录错误到浏览器控制台
   - 便于用户报告问题时提供详细信息

## 总结 (Summary)

这个修复确保用户能够看到翻译失败的具体原因，而不是一个通用的 "Translation failed" 错误消息。这将大大改善用户体验和问题诊断能力。
