'use client';

import React, { useState, useEffect } from 'react';
import GridLayout, { type Layout } from 'react-grid-layout';

const getFromLS = (key: string) => {
  let ls = {};
  if (global.localStorage) {
    try {
      ls = JSON.parse(global.localStorage.getItem('rgl-8') || '{}');
    } catch (e) {
      /*Ignore*/
    }
  }
  return ls[key];
};

const saveToLS = (key: string, value: any) => {
  if (global.localStorage) {
    global.localStorage.setItem(
      'rgl-8',
      JSON.stringify({
        [key]: value,
      })
    );
  }
};

const DashboardGrid: React.FC<{ children: React.ReactNode[] }> = ({ children }) => {
  const originalLayout = getFromLS('layouts') || {};
  const [layout, setLayout] = useState<Layout[]>(
    originalLayout.lg || [
        { i: 'market-summary', x: 0, y: 0, w: 12, h: 2, minW: 4, minH: 2 },
        { i: 'realtime-news-feed', x: 0, y: 2, w: 8, h: 4, minW: 4, minH: 3 },
        { i: 'news-analysis', x: 8, y: 2, w: 4, h: 2, minW: 3, minH: 2 },
        { i: 'watchlist', x: 8, y: 4, w: 4, h: 2, minW: 3, minH: 2 },
    ]
  );
  
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onLayoutChange = (newLayout: Layout[]) => {
    saveToLS('layouts', { lg: newLayout });
    setLayout(newLayout);
  };
  
  if (!isMounted) {
    return null;
  }

  return (
    <GridLayout
      className="layout"
      layout={layout}
      cols={12}
      rowHeight={100}
      width={1200}
      onLayoutChange={onLayoutChange}
    >
      {children}
    </GridLayout>
  );
};

export default DashboardGrid;
