"use client"

import * as React from "react";
import { AnglesApp } from "../../../components/apps/AnglesApp";
import { TransitionsApp } from "../../../components/apps/TransitionsApp";

const appsMap = {
    "angles": AnglesApp,
    "transitions": TransitionsApp
};

export default function AppPage({ params }) {
    const resolvedParams = React.use(params);
    const slug = resolvedParams.slug;
    const AppComponent = appsMap[slug];

    if (!AppComponent) {
        return <div>App not found</div>;
    }

    return <AppComponent />;
}
