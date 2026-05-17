'use client';

import React from 'react';

interface HtmlReportProps {
  htmlContent: string;
}

export function HtmlReport({ htmlContent }: HtmlReportProps) {
  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
}
