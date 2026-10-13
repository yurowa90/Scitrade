/** 같은 불러오기를 공유하고, 실패한 약속은 버려 다음 진입에서 재시도한다. */
export function lazyScreen<T>(loader: () => Promise<T>) {
  let screen: T | null = null;
  let pending: Promise<void> | null = null;
  return {
    get: () => screen,
    ensure(): Promise<void> {
      if (pending) return pending;
      pending = Promise.resolve().then(loader).then((loaded) => { screen = loaded; }).catch((error: unknown) => {
        pending = null;
        throw error;
      });
      return pending;
    },
  };
}
