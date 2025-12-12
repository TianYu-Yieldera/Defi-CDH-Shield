'use client';

import { JudgeMode } from '@/components/demo';
import { DemoControlPanel } from '@/components/demo';

export default function DemoPage() {
  return (
    <>
      <JudgeMode language="en" />
      <DemoControlPanel />
    </>
  );
}
