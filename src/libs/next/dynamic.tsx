/**
 * Dynamic import - React.lazy + Suspense replacement for next/dynamic.
 *
 * @see Phase 4.4
 */

import { type ComponentType, type FC, Suspense, lazy } from 'react';

export type Loader<P = object> = () => Promise<ComponentType<P> | { default: ComponentType<P> }>;

export type LoaderComponent<P = object> = ComponentType<P> | { default: ComponentType<P> };

export interface DynamicOptions {
  loading?: ComponentType;
  ssr?: boolean;
}

function dynamic<P extends object = object>(
  importFn: Loader<P>,
  options?: DynamicOptions,
): ComponentType<P> {
  const LazyComponent = lazy(async () => {
    const mod = await importFn();
    if (typeof mod === 'function') {
      return { default: mod } as { default: ComponentType<P> };
    }
    if ('default' in mod) {
      return mod as { default: ComponentType<P> };
    }
    return { default: mod as unknown as ComponentType<P> };
  });

  const Loading = options?.loading;

  const DynamicComponent: FC<P> = (props: P) => (
    <Suspense fallback={Loading ? <Loading /> : null}>
      <LazyComponent {...props} />
    </Suspense>
  );

  DynamicComponent.displayName = 'Dynamic';

  return DynamicComponent as ComponentType<P>;
}

export default dynamic;
