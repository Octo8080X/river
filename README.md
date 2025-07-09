# TypeScript Pipeline 関数

design.md の要件に基づいて実装されたパイプライン関数です。

## 特徴

- **統一されたパイプライン関数**: 同期・非同期関数を混在可能
- **型安全性**: ジェネリクスによる型安全な実装
- **関数オーバーロード不使用**: 単一の関数定義でn個の引数に対応
- **エラーハンドリング**: Result型による統一されたエラー処理
- **エラー型推論**: 再帰的な型を活用したエラーユニオン型の推論

## 使用例

### 基本的な使用法

```typescript
import { pipeline, success, failure, Result } from './mod.ts';

// 同期関数のパイプライン
const syncPipeline = pipeline(
  (): Result<number, "ERR1"> => success(1),
  (n: number): Result<string, "ERR2"> => success(n.toString()),
  (s: string): Result<boolean, "ERR3"> => success(s.length > 0)
);

const result = await syncPipeline();
```

### 同期・非同期混合パイプライン

```typescript
const mixedPipeline = pipeline(
  (): Result<number, "ERR1"> => success(42),
  async (n: number): Promise<Result<string, "ERR2">> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return success(n.toString());
  },
  (s: string): Result<boolean, "ERR3"> => success(s.length > 1)
);

const result = await mixedPipeline();
```

### エラーハンドリング

```typescript
const errorHandlingPipeline = pipeline(
  (): Result<number, "DB_ERROR"> => success(42),
  (n: number): Result<string, "VALIDATION_ERROR"> => 
    n > 0 ? success(n.toString()) : failure("Invalid input", "VALIDATION_ERROR"),
  (s: string): Result<boolean, "PROCESSING_ERROR"> => success(s.length > 0)
);

// エラーハンドラを使用してエラーをキャッチし、代替結果を返す
const result = await errorHandlingPipeline((error) => {
  // 型アサーションでエラー型を特定
  const errorType = error.error as "DB_ERROR" | "VALIDATION_ERROR" | "PROCESSING_ERROR";
  
  console.log(`エラーが発生しました: ${errorType}`);
  return success(false); // 代替の結果を返す
});
```

### 型推論の改善状況（最新版）

最新版では型推論が改善され、多くの基本的なケースで明示的な型パラメータが不要になりました：

#### ✅ **自動型推論が機能するケース：**

```typescript
// 基本的な型変換チェーン
const pipeline1 = pipeline(
  (): Result<number, "ERR1"> => success(1),
  (n: number): Result<string, "ERR2"> => success(n.toString()),
  (s: string): Result<boolean, "ERR3"> => success(s.length > 0)
);

// result.valueはboolean型として推論されます
const result = await pipeline1();
if (result.isSuccess) {
  const isBoolean: boolean = result.value; // ✅ 型推論成功
}

// オブジェクト型も推論されます
interface User { id: number; name: string; }
interface UserProfile { userId: string; displayName: string; }

const pipeline2 = pipeline(
  (): Result<User, "USER_ERR"> => success({id: 1, name: "John"}),
  (user: User): Result<UserProfile, "PROFILE_ERR"> => success({
    userId: `user-${user.id}`,
    displayName: user.name.toUpperCase()
  })
);

// result.valueはUserProfile型として推論されます
const profile = await pipeline2();
if (profile.isSuccess) {
  const userProfile: UserProfile = profile.value; // ✅ 型推論成功
}
```

#### ⚠️ **制限事項：**

TypeScriptの制限により、エラー型のunion型の完全な推論には制限があります：

```typescript
const p = pipeline(
  (): Result<number, "E1"> => success(1),
  (n: number): Result<string, "E2"> => success(n.toString())
);

const result = await p();
if (!result.isSuccess) {
  // result.errorの型は完全には推論されないため、型アサーションが必要
  const errorType = result.error as "E1" | "E2";
}
```

#### 💡 **推奨される使用法：**

1. **基本的な使用**: 明示的な型パラメータなしで使用
2. **エラーハンドリング**: エラー型に対して型アサーションを使用
3. **厳密な型チェックが必要**: 明示的な型パラメータを指定

## 実装詳細

- `Result<T, F>` 型: 成功と失敗を表現する統一型
- 再帰的な型定義 (`ExtractErrorUnion<T>`, `ExtractFinalType<T>`) でパイプライン内の型を抽出
- 統一されたpipeline関数: 同期・非同期両方に対応
- 内部ではanyを使用しつつ、外部からは型安全なインターフェースを提供
- constアサーションと組み合わせた型推論の強化

```typescript
// 厳密な型チェックが必要な場合
const strictPipeline = pipeline<"E1" | "E2", string>(
  (): Result<number, "ERR1"> => success(42),
  (n: number): Result<string, "ERR2"> => success(n.toString()),
  (s: string): Result<boolean, "ERR3"> => success(s.length > 1)
);

// result.value は boolean 型として正しく推論される
const result = await typedPipeline();
```

### エラーハンドリング

```typescript
const pipeline = pipeline<"ERR1" | "ERR2", string>(
  (): Result<number, "ERR1"> => failure(999, "ERR1"),
  (n: number): Result<string, "ERR2"> => success(n.toString())
);

const result = await pipeline((error) => {
  console.log(`Error: ${error.error}`);
  return success("fallback value");
});
```

## API リファレンス

### pipeline<E, TReturn>(first, ...rest)

パイプライン関数を作成します。

**型パラメータ:**
- `E`: エラー型のユニオン
- `TReturn`: 最終戻り値の型

**引数:**
- `first`: 最初の関数（引数なし）
- `...rest`: 残りの関数（前の関数の戻り値を受け取る）

**戻り値:**
エラーハンドラを受け取り、`Promise<Result<TReturn, E>>`を返す関数

### Result<T, F>

成功または失敗を表現する型です。

```typescript
type Result<T, F> = ResultSuccess<T> | ResultFailure<T, F>;

interface ResultSuccess<T> {
  isSuccess: true;
  value: T;
}

interface ResultFailure<T, F> {
  isSuccess: false;
  value: T;
  error: F;
}
```

### ヘルパー関数

```typescript
// 成功結果を作成
function success<T>(value: T): Result<T, never>

// 失敗結果を作成  
function failure<T, F>(value: T, error: F): Result<T, F>
```

## design.md 要件との対応

- ✅ パイプライン関数は、n 個の引数を受け取る形で定義
- ✅ 関数オーバーロードは使用しない
- ✅ ジェネリクスを活用して型安全性を確保
- ✅ パイプライン関数内部はany型を使用、外部からは型安全にアクセス
- ✅ 非同期用、同期用のパイプライン関数を分けない
- ✅ 返り値は `Promise<Result<T, F>>` 型

## 制限事項

TypeScriptの型推論の制限により、自動的な戻り値型推論には限界があります。最適な型安全性を得るために、明示的な型パラメータの指定を推奨します。
