import MainLayout from "../../MainLayout";
import React, { useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Autocomplete, Box, TextField, Typography } from "@mui/material";
import SchedulerWidget from "../../Components/SchedulerWidget";
import moment from "moment";

const Index = () => {
    const { auth } = usePage().props;
    const { token } = auth;

    return <SchedulerWidget token={token} />;
};

Index.layout = page => <MainLayout children={page} title="Dashboard" />;

export default Index;