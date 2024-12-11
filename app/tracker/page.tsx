// pages/time-tracker.tsx
"use client";

import { Layout } from "@/components/common/layout";
import { TimeTracker } from "@/components/common/time-tracker";
import withAuth from "@/components/auth/withAuth";

function TimeTrackerPage() {
  return (
    <Layout>
      <TimeTracker />
    </Layout>
  );
}

export default withAuth(TimeTrackerPage);