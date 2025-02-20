"use client";
import * as React from 'react';
import { NotebookDetailClient } from "./NotebookDetail";
import { use } from 'react';

type Params = Promise<{ id: string }>

function NotebookDetailPage({ params }: { params: Params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  return <NotebookDetailClient id={id} />;
}

export default NotebookDetailPage;