'use client';

import { type TypographyProps } from '@lobehub/ui';
import { Typography as Typo } from '@lobehub/ui';
import { mdxComponents } from '@lobehub/ui/mdx';
import { type FC } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import CodeBlock from './CodeBlock';
import Link from './Link';

export const Typography = ({
  children,
  mobile,
  style,
  ...rest
}: { mobile?: boolean } & TypographyProps) => {
  const headerMultiple = mobile ? 0.2 : 0.4;
  return (
    <Typo
      fontSize={14}
      headerMultiple={headerMultiple}
      style={{ width: '100%', ...style }}
      {...rest}
    >
      {children}
    </Typo>
  );
};

interface SPAMdxProps {
  mobile?: boolean;
  source: string;
}

export const SPAMdx: FC<SPAMdxProps> = ({ mobile, source }) => {
  const components: Record<string, FC<any>> = {};
  for (const [key, Render] of Object.entries({
    ...mdxComponents,
    a: Link,
    pre: CodeBlock,
  })) {
    components[key] = (props: any) => <Render {...props} />;
  }

  return (
    <Typography mobile={mobile}>
      <Markdown components={components} remarkPlugins={[remarkGfm]}>
        {source}
      </Markdown>
    </Typography>
  );
};
