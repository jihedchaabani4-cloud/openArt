"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export default function CollectionsRedirectPage({ params }) {
  const { projectId, collectionId } = React.use(params);
  const router = useRouter();

  React.useEffect(() => {
    if (projectId && collectionId) {
      router.replace(`/cinema-studio/${projectId}/collection/${collectionId}`);
    }
  }, [projectId, collectionId, router]);

  return null;
}
