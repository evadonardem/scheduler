import MainLayout from "../../MainLayout";
import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Typography } from "@mui/material";

const Index = () => {
    const { auth } = usePage().props;
    const { roles } = auth;

    return <>
        <Typography>Under construction...</Typography>
    </>;
};

Index.layout = page => <MainLayout children={page} title="Dashboard" />;

export default Index;